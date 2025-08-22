import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';
import { formatPropertyType } from '@/lib/utils';
import ImageCarousel from '@/components/owner/ImageCarousel';
import BookingComPropertyForm from '@/components/owner/BookingComPropertyForm';

const MyProperties: React.FC<{
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [properties, setProperties] = useState<any[]>([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      navigate('/owner/login');
      return;
    }
    
    // Load properties immediately from localStorage first, then update with database
    const loadProperties = async () => {
      if (!user || !user.email) {
        setProperties([]);
        return;
      }

      // Load localStorage properties immediately for fast display
      const storageKey = `properties_${user.email}`;
      const localStorageProperties = localStorage.getItem(storageKey);
      let localStoragePropertiesArray = [];
      
      if (localStorageProperties) {
        try {
          localStoragePropertiesArray = JSON.parse(localStorageProperties);
          console.log('📋 Loading localStorage properties immediately:', localStoragePropertiesArray.length);
          setProperties(localStoragePropertiesArray); // Show immediately
        } catch (parseError) {
          console.error('❌ Error parsing localStorage properties:', parseError);
        }
      }

      // Then try to load from database and update
      try {
        console.log('🔍 Loading properties from database for user:', user.email);
        
        // Get user ID from auth context or use email as fallback
        const ownerId = user.id || user.email;
        
        const dbProperties = await PropertyService.getOwnerProperties(ownerId);
        
        // Convert database properties to frontend format
        const frontendProperties = dbProperties.map(PropertyService.convertToFrontendFormat);
        
        // Combine database and localStorage properties, avoiding duplicates
        const allProperties = [...frontendProperties];
        const addedLocalProperties = [];
        
        // Add localStorage properties that aren't already in database
        localStoragePropertiesArray.forEach(localProperty => {
          // Check for exact ID match first
          const existsById = frontendProperties.some(dbProperty => 
            dbProperty.id === localProperty.id
          );
          
          // Check for name + location match (for properties that might have different IDs)
          const existsByNameLocation = frontendProperties.some(dbProperty => 
            dbProperty.name === localProperty.name && 
            dbProperty.location === localProperty.location &&
            dbProperty.city === localProperty.city
          );
          
          if (!existsById && !existsByNameLocation) {
            allProperties.push(localProperty);
            addedLocalProperties.push(localProperty.name);
            console.log('📋 Added localStorage property:', localProperty.name);
          } else {
            console.log('📋 Skipped duplicate localStorage property:', localProperty.name);
          }
        });
        
        console.log('📋 localStorage properties added:', addedLocalProperties.length);
        
        setProperties(allProperties);
        console.log('✅ All properties loaded:', allProperties.length, '(DB:', frontendProperties.length, 'Local:', localStoragePropertiesArray.length, ')');
      } catch (error) {
        console.error('❌ Error loading properties from database:', error);
        
        // If no localStorage properties were loaded initially, try again
        if (localStoragePropertiesArray.length === 0) {
          try {
            const localStorageProperties = localStorage.getItem(storageKey);
            
            if (localStorageProperties) {
              const parsedProperties = JSON.parse(localStorageProperties);
              setProperties(parsedProperties);
              console.log('📋 Loaded properties from localStorage fallback:', parsedProperties.length);
            } else {
              setProperties([]);
              console.log('📋 No properties found in database or localStorage');
            }
          } catch (localStorageError) {
            console.error('❌ Error loading from localStorage:', localStorageError);
            setProperties([]);
          }
        }
      }
    };

    loadProperties();
  }, [isAuthenticated, user, loading, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
      case 'inactive': return 'bg-muted text-muted-foreground border border-border';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'maintenance': 
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getTypeLabel = (type: string) => {
    return formatPropertyType(type);
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setShowAddProperty(true);
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property);
    setShowAddProperty(true);
  };

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setShowViewModal(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        // Try to delete from database first
        await PropertyService.deleteProperty(propertyId);
        console.log('✅ Property deleted from database successfully');
      } catch (error) {
        console.error('❌ Error deleting property from database:', error);
        // Continue to localStorage deletion even if database fails
      }
      
      // Also delete from localStorage if it's a localStorage property
      try {
        const property = properties.find(p => p.id === propertyId);
        if (property && property.isLocalStorage && user?.email) {
          const storageKey = `properties_${user.email}`;
          const localStorageProperties = localStorage.getItem(storageKey);
          
          if (localStorageProperties) {
            const propertiesArray = JSON.parse(localStorageProperties);
            const updatedArray = propertiesArray.filter((p: any) => p.id !== propertyId);
            localStorage.setItem(storageKey, JSON.stringify(updatedArray));
            console.log('✅ Property deleted from localStorage');
          }
        }
      } catch (localStorageError) {
        console.error('❌ Error deleting from localStorage:', localStorageError);
      }
      
      // Update UI
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      setProperties(updatedProperties);
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) {
      console.error('❌ Property not found for status change:', propertyId);
      return;
    }

    console.log(`🔄 Changing status for property "${property.name}" from "${property.status}" to "${newStatus}"`);
    console.log(`🔍 Property details:`, { id: property.id, name: property.name, currentStatus: property.status, newStatus });

    let databaseUpdated = false;
    let localStorageUpdated = false;

    // Try to update in database first
    try {
      await PropertyService.updatePropertyStatus(propertyId, newStatus as any);
      console.log(`✅ Property status changed to ${newStatus} in database`);
      databaseUpdated = true;
    } catch (error) {
      console.error('❌ Error updating property status in database:', error);
      console.log('📋 Will try localStorage fallback...');
    }
    
    // Always update localStorage as backup (for both database and localStorage properties)
    try {
      if (user?.email) {
        const storageKey = `properties_${user.email}`;
        const localStorageProperties = localStorage.getItem(storageKey);
        
        if (localStorageProperties) {
          const propertiesArray = JSON.parse(localStorageProperties);
          
          // Check if property exists in localStorage
          const existingPropertyIndex = propertiesArray.findIndex((p: any) => 
            p.id === propertyId || 
            (p.name === property.name && p.location === property.location && p.city === property.city)
          );
          
          if (existingPropertyIndex !== -1) {
            // Update existing property
            propertiesArray[existingPropertyIndex] = {
              ...propertiesArray[existingPropertyIndex],
              status: newStatus,
              updatedAt: new Date().toISOString()
            };
          } else {
            // Add property to localStorage if it doesn't exist
            const propertyToAdd = {
              ...property,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              isLocalStorage: true
            };
            propertiesArray.push(propertyToAdd);
          }
          
          localStorage.setItem(storageKey, JSON.stringify(propertiesArray));
          console.log(`✅ Property status changed to ${newStatus} in localStorage`);
          localStorageUpdated = true;
        } else {
          // Create new localStorage entry if none exists
          const propertyToAdd = {
            ...property,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            isLocalStorage: true
          };
          localStorage.setItem(storageKey, JSON.stringify([propertyToAdd]));
          console.log(`✅ Property added to localStorage with status ${newStatus}`);
          localStorageUpdated = true;
        }
      }
    } catch (localStorageError) {
      console.error('❌ Error updating localStorage:', localStorageError);
    }
    
    // Update UI immediately
    const updatedProperties = properties.map(p => 
      p.id === propertyId ? { ...p, status: newStatus } : p
    );
    setProperties(updatedProperties);
    
    // Show success message
    if (databaseUpdated || localStorageUpdated) {
      console.log(`🎉 Status change successful: ${newStatus}`);
    } else {
      console.error('❌ Status change failed in both database and localStorage');
      alert('Failed to update property status. Please try again.');
    }
  };

  const handlePropertySubmit = async () => {
    // Reload properties after successful add/edit
    if (!user || !user.email) return;
    
    try {
      const ownerId = user.id || user.email;
      const dbProperties = await PropertyService.getOwnerProperties(ownerId);
      const frontendProperties = dbProperties.map(PropertyService.convertToFrontendFormat);
      setProperties(frontendProperties);
      console.log('✅ Properties reloaded after submit');
    } catch (error) {
      console.error('❌ Error reloading properties:', error);
    }
    
    setShowAddProperty(false);
    setEditingProperty(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show the comprehensive property form when adding/editing
  if (showAddProperty) {
    return (
      <BookingComPropertyForm
        onBack={() => setShowAddProperty(false)}
        editingProperty={editingProperty}
        isEdit={!!editingProperty}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="/lovable-uploads/4a6c26a9-df9d-4bbe-a6d2-acb1b3d99100.png"
                alt="Picnify Logo"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-blue-600">Picnify</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        <nav className="mt-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'properties', label: 'Properties', icon: '🏠' },
            { id: 'bookings', label: 'Bookings', icon: '📅' },
            { id: 'earnings', label: 'Earnings', icon: '💰' },
            { id: 'reviews', label: 'Reviews', icon: '⭐' },
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600 mt-1">Manage your property listings ({properties.length} properties)</p>
            </div>
            <button
              onClick={handleAddProperty}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Property
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="p-6">
          {properties.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first property to begin earning.</p>
              <button
                onClick={handleAddProperty}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Property Image */}
                  <div className="relative h-48">
                    <ImageCarousel images={property.images || []} alt={property.title || property.name} />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                        {property.status || 'active'}
                      </span>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{property.title || property.name}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {getTypeLabel(property.type)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      📍 {property.location}, {property.city}
                    </p>

                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-3">
                        <span>👥 {property.capacity}</span>
                        <span>🛏️ {property.bedrooms}</span>
                        <span>🚿 {property.bathrooms}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-blue-600">
                        ₹{property.price?.toLocaleString()}/night
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleViewProperty(property)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditProperty(property)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = property.status === 'active' ? 'inactive' : 'active';
                          handleStatusChange(property.id, newStatus);
                        }}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          property.status === 'active'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {property.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="bg-red-100 text-red-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Property Modal */}
      {showViewModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProperty.name}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Property Images */}
              <div className="mb-6">
                <ImageCarousel images={selectedProperty.images || []} alt={selectedProperty.name} />
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{getTypeLabel(selectedProperty.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedProperty.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium">{selectedProperty.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">State:</span>
                      <span className="font-medium">{selectedProperty.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per night:</span>
                      <span className="font-medium text-blue-600">₹{selectedProperty.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProperty.status)}`}>
                        {selectedProperty.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Capacity & Rooms</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Guests:</span>
                      <span className="font-medium">{selectedProperty.capacity} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-medium">{selectedProperty.bedrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bathrooms:</span>
                      <span className="font-medium">{selectedProperty.bathrooms}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProperty.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedProperty.description}</p>
                </div>
              )}

              {/* Amenities */}
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.amenities.map((amenity: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProperties;