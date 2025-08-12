import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';
import ImageCarousel from '@/components/owner/ImageCarousel';

const MyProperties: React.FC<{
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [properties, setProperties] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'villa',
    location: '',
    city: '',
    state: '',
    price: '',
    capacity: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    amenities: [] as string[]
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newImageLink, setNewImageLink] = useState('');



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
    switch (type) {
      case 'villa': return 'Villa';
      case 'resort': return 'Resort';
      case 'farmhouse': return 'Farmhouse';
      case 'homestay': return 'Homestay';
      case 'heritage': return 'Heritage Palace';
      case 'day-picnic': return 'Day Picnic';
      default: return type;
    }
  };

  const handleAddProperty = () => {
    setFormData({
      name: '',
      type: 'villa',
      location: '',
      city: '',
      state: '',
      price: '',
      capacity: '',
      bedrooms: '',
      bathrooms: '',
      description: '',
      amenities: []
    });
    setShowAddModal(true);
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property);
    setFormData({
      name: property.name || '',
      type: property.type || 'villa',
      location: property.location || '',
      city: property.city || '',
      state: property.state || '',
      price: (property.price || 0).toString(),
      capacity: (property.capacity || 0).toString(),
      bedrooms: (property.bedrooms || 0).toString(),
      bathrooms: (property.bathrooms || 0).toString(),
      description: property.description || '',
      amenities: property.amenities || []
    });
    
    // Initialize image state with existing property images
    const existingImages = property.images || [];
    setImageLinks(existingImages);
    setImagePreviewUrls([]);
    setSelectedImages([]);
    
    setShowEditModal(true);
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



  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📁 Files selected:', files.length);
    
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );
    
    console.log('✅ Valid files:', validFiles.length);
    console.log('❌ Invalid files:', files.length - validFiles.length);

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      
      // Create preview URLs
      validFiles.forEach((file, index) => {
        console.log(`🖼️ Processing file ${index + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          console.log(`✅ File ${index + 1} converted to base64 (${dataUrl.length} chars)`);
          setImagePreviewUrls(prev => [...prev, dataUrl]);
        };
        reader.onerror = (error) => {
          console.error(`❌ Error reading file ${index + 1}:`, error);
        };
        reader.readAsDataURL(file);
      });
    } else {
      console.log('❌ No valid files to process');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addImageLink = () => {
    try {
      if (!newImageLink.trim()) {
        alert('Please enter an image URL');
        return;
      }
      
      if (!isValidImageUrl(newImageLink.trim())) {
        alert('Please enter a valid image URL (must end with .jpg, .jpeg, .png, .gif, .webp)');
        return;
      }
      
      setImageLinks(prev => [...prev, newImageLink.trim()]);
      setNewImageLink('');
      setShowLinkInput(false);
      console.log('✅ Image link added:', newImageLink.trim());
    } catch (error) {
      console.error('❌ Error adding image link:', error);
      alert('Error adding image link. Please try again.');
    }
  };

  const removeImageLink = (index: number) => {
    setImageLinks(prev => prev.filter((_, i) => i !== index));
  };

  const isValidImageUrl = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.error('❌ No user found');
      return;
    }
    
    console.log('💾 Saving property with images:', imagePreviewUrls.length);
    console.log('🖼️ Image preview URLs:', imagePreviewUrls);
    
    // Combine uploaded images and image links
    const allImages = [...imagePreviewUrls, ...imageLinks];
    
    const propertyData = {
      name: formData.name,
      type: formData.type,
      location: formData.location,
      city: formData.city,
      state: formData.state,
      price: parseInt(formData.price),
      capacity: parseInt(formData.capacity),
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
      description: formData.description,
      amenities: formData.amenities,
      images: allImages.length > 0 ? allImages : ['/placeholder.svg']
    };

    try {
      if (editingProperty) {
        // Update existing property in database
        const updatedDbProperty = await PropertyService.updateProperty(editingProperty.id, propertyData);
        
        if (updatedDbProperty) {
          const frontendProperty = PropertyService.convertToFrontendFormat(updatedDbProperty);
          const updatedProperties = properties.map(p => p.id === editingProperty.id ? frontendProperty : p);
          setProperties(updatedProperties);
          console.log('✅ Property updated in database successfully');
        }
        
        setShowEditModal(false);
      } else {
        // Add new property to database
        const ownerId = user.id || user.email;
        const newDbProperty = await PropertyService.addProperty(propertyData, ownerId);
        
        if (newDbProperty) {
          const frontendProperty = PropertyService.convertToFrontendFormat(newDbProperty);
          const updatedProperties = [...properties, frontendProperty];
          setProperties(updatedProperties);
          console.log('✅ Property added to database successfully');
        }
        
        setShowAddModal(false);
      }

      // Reset form
      setFormData({
        name: '',
        type: 'villa',
        location: '',
        city: '',
        state: '',
        price: '',
        capacity: '',
        bedrooms: '',
        bathrooms: '',
        description: '',
        amenities: []
      });
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setImageLinks([]);
      setNewImageLink('');
      setShowLinkInput(false);
      
    } catch (error) {
      console.error('❌ Error saving property to database:', error);
      
      // Fallback: Save to localStorage if database is not available
      try {
        const storageKey = `properties_${user.email}`;
        const existingProperties = localStorage.getItem(storageKey);
        const propertiesArray = existingProperties ? JSON.parse(existingProperties) : [];
        
        // Check if property already exists in localStorage
        const existingProperty = propertiesArray.find((p: any) => 
          p.name === propertyData.name && 
          p.location === propertyData.location && 
          p.city === propertyData.city
        );
        
        if (existingProperty) {
          console.log('📋 Property already exists in localStorage, updating instead of adding');
          // Update existing property
          const updatedProperties = propertiesArray.map((p: any) => 
            p.name === propertyData.name && 
            p.location === propertyData.location && 
            p.city === propertyData.city
              ? { ...p, ...propertyData, updatedAt: new Date().toISOString() }
              : p
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedProperties));
          
          // Update UI
          const updatedPropertiesList = properties.map(p => 
            p.name === propertyData.name && 
            p.location === propertyData.location && 
            p.city === propertyData.city
              ? { ...p, ...propertyData, updatedAt: new Date().toISOString() }
              : p
          );
          setProperties(updatedPropertiesList);
        } else {
          // Add new property
          const newProperty = {
            id: Date.now().toString(), // Generate temporary ID
            ...propertyData,
            ownerEmail: user.email,
            status: 'active',
            createdAt: new Date().toISOString(),
            isLocalStorage: true // Flag to identify localStorage properties
          };
          
          propertiesArray.push(newProperty);
          localStorage.setItem(storageKey, JSON.stringify(propertiesArray));
          
          // Update UI
          const updatedProperties = [...properties, newProperty];
          setProperties(updatedProperties);
        }
        
        if (editingProperty) {
          setShowEditModal(false);
        } else {
          setShowAddModal(false);
        }
        
        // Reset form
        setFormData({
          name: '',
          type: 'villa',
          location: '',
          city: '',
          state: '',
          price: '',
          capacity: '',
          bedrooms: '',
          bathrooms: '',
          description: '',
          amenities: []
        });
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setImageLinks([]);
        setNewImageLink('');
        setShowLinkInput(false);
        
        alert('✅ Property saved locally! (Database not available - using localStorage fallback)');
        console.log('📋 Property saved to localStorage successfully');
        
      } catch (localStorageError) {
        console.error('❌ Error saving to localStorage:', localStorageError);
        alert('Failed to save property. Please check database setup or try again.');
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png"
                alt="Picnify Logo"
                className="h-8 w-auto"
              />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="fas fa-bars text-gray-600"></i>
          </button>
        </div>
        <nav className="mt-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
            { id: 'properties', label: 'My Properties', icon: 'fas fa-home' },
            { id: 'bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
            { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
            { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
            { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
            { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
            { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              <i className={`${item.icon} w-5 text-center`}></i>
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-800">My Properties</h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {properties.length} Properties
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleAddProperty}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Property
              </button>

            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <div key={property.id} className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-border">
                <div className="relative">
                  <ImageCarousel
                    images={property.images || ['/placeholder.svg']}
                    alt={property.name}
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-card/95 text-card-foreground px-3 py-1 rounded-full text-xs font-medium border border-border backdrop-blur-sm">
                      {getTypeLabel(property.type)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-card-foreground mb-1 line-clamp-1">{property.name}</h3>
                      <div className="flex items-center text-muted-foreground mb-2">
                        <i className="fas fa-map-marker-alt mr-1 text-sm"></i>
                        <span className="text-sm">{property.location}, {property.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <i className="fas fa-star text-yellow-400"></i>
                      <span className="text-sm font-semibold text-card-foreground">{property.rating}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-muted-foreground mb-1">
                        <i className="fas fa-users text-sm"></i>
                      </div>
                      <span className="text-sm font-medium text-card-foreground">{property.capacity}</span>
                      <p className="text-xs text-muted-foreground">Guests</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-muted-foreground mb-1">
                        <i className="fas fa-bed text-sm"></i>
                      </div>
                      <span className="text-sm font-medium text-card-foreground">{property.bedrooms}</span>
                      <p className="text-xs text-muted-foreground">Bedrooms</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-muted-foreground mb-1">
                        <i className="fas fa-bath text-sm"></i>
                      </div>
                      <span className="text-sm font-medium text-card-foreground">{property.bathrooms}</span>
                      <p className="text-xs text-muted-foreground">Bathrooms</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-muted-foreground">
                        <i className="fas fa-calendar mr-2 text-sm"></i>
                        <span className="text-sm">{property.totalBookings} bookings</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <i className="fas fa-rupee-sign mr-2 text-sm"></i>
                        <span className="text-sm">₹{(property.totalEarnings || 0).toLocaleString()} earned</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-card-foreground">
                        ₹{(property.price || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Status</label>
                    <select
                      value={property.status}
                      onChange={(e) => handleStatusChange(property.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="approved">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="rejected">Maintenance</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Primary Action - View Details */}
                    <button 
                      onClick={() => handleViewProperty(property)}
                      className="w-full bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <i className="fas fa-eye mr-2"></i>
                      View Property Details
                    </button>
                    
                    {/* Secondary Actions */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditProperty(property)}
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 border border-border"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProperty(property.id)}
                        className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg font-medium transition-colors duration-200 border border-destructive/20"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {properties.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-home text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
              <button 
                onClick={handleAddProperty}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Your First Property
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Add New Property</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
                          <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter property name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="villa">Villa</option>
                      <option value="resort">Resort</option>
                      <option value="farmhouse">Farmhouse</option>
                      <option value="homestay">Homestay</option>
                      <option value="heritage">Heritage Palace</option>
                      <option value="day-picnic">Day Picnic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter state"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price per Day (₹)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter capacity"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter number of bedrooms"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter number of bathrooms"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter property description"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['wifi', 'ac', 'parking', 'kitchen', 'pool', 'gym', 'tv', 'spa', 'heating', 'fireplace'].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => handleAmenityChange(amenity)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                  
                  {/* Upload Option */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-add"
                    />
                    <label htmlFor="image-upload-add" className="cursor-pointer">
                      <i className="fas fa-upload text-gray-400 text-2xl mb-2"></i>
                      <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </label>
                  </div>

                  {/* Link Upload Option */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Or add image links:</span>
                      <button
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {showLinkInput ? 'Cancel' : 'Add Link'}
                      </button>
                    </div>
                    
                    {showLinkInput && (
                      <div className="flex gap-2 mb-2">
                        <input
                          type="url"
                          value={newImageLink}
                          onChange={(e) => setNewImageLink(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addImageLink}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Uploaded Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Link Previews */}
                  {imageLinks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Image Links:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imageLinks.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Link ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImageLink(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Edit Property</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
                          <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter property name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="villa">Villa</option>
                      <option value="resort">Resort</option>
                      <option value="farmhouse">Farmhouse</option>
                      <option value="homestay">Homestay</option>
                      <option value="heritage">Heritage Palace</option>
                      <option value="day-picnic">Day Picnic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter state"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price per Day (₹)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter capacity"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter number of bedrooms"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter number of bathrooms"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter property description"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['wifi', 'ac', 'parking', 'kitchen', 'pool', 'gym', 'tv', 'spa', 'heating', 'fireplace'].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => handleAmenityChange(amenity)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                  
                  {/* Upload Option */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <label htmlFor="image-upload-edit" className="cursor-pointer">
                      <i className="fas fa-upload text-gray-400 text-2xl mb-2"></i>
                      <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </label>
                  </div>

                  {/* Link Upload Option */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Or add image links:</span>
                      <button
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {showLinkInput ? 'Cancel' : 'Add Link'}
                      </button>
                    </div>
                    
                    {showLinkInput && (
                      <div className="flex gap-2 mb-2">
                        <input
                          type="url"
                          value={newImageLink}
                          onChange={(e) => setNewImageLink(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addImageLink}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Uploaded Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Link Previews */}
                  {imageLinks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Image Links:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imageLinks.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Link ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImageLink(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced View Property Modal */}
      {showViewModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-brand-red/5 to-brand-orange/5">
              <div>
                <h2 className="text-3xl font-bold text-card-foreground">{selectedProperty.name}</h2>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center text-muted-foreground">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    <span>{selectedProperty.location}, {selectedProperty.city}, {selectedProperty.state}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-star text-yellow-400 mr-1"></i>
                    <span className="font-semibold text-card-foreground">{selectedProperty.rating}/5</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-card-foreground transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-100px)]">
              <div className="p-6 space-y-8">
                {/* Image Gallery and Key Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="h-96 rounded-xl overflow-hidden">
                      <ImageCarousel
                        images={selectedProperty.images || ['/placeholder.svg']}
                        alt={selectedProperty.name}
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Status and Type */}
                    <div className="flex flex-wrap gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedProperty.status)}`}>
                        {selectedProperty.status.charAt(0).toUpperCase() + selectedProperty.status.slice(1)}
                      </span>
                      <span className="bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm font-medium border border-border">
                        {getTypeLabel(selectedProperty.type)}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-brand-red/10 to-brand-orange/10 p-6 rounded-xl border border-brand-red/20">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-card-foreground mb-2">
                          ₹{(selectedProperty.price || 0).toLocaleString()}
                        </div>
                        <p className="text-muted-foreground">per night</p>
                      </div>
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-card-foreground">{selectedProperty.capacity}</div>
                        <p className="text-sm text-muted-foreground">Guests</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-card-foreground">{selectedProperty.bedrooms}</div>
                        <p className="text-sm text-muted-foreground">Bedrooms</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-card-foreground">{selectedProperty.bathrooms}</div>
                        <p className="text-sm text-muted-foreground">Bathrooms</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-card-foreground">{selectedProperty.totalBookings}</div>
                        <p className="text-sm text-muted-foreground">Bookings</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h4 className="text-xl font-bold text-card-foreground mb-4">
                    <i className="fas fa-align-left mr-2 text-brand-red"></i>
                    Description
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">{selectedProperty.description}</p>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-xl font-bold text-card-foreground mb-6">
                    <i className="fas fa-star mr-2 text-brand-orange"></i>
                    Amenities & Features
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProperty.amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-green-600 text-sm"></i>
                        </div>
                        <span className="capitalize font-medium text-card-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-chart-line text-green-600"></i>
                    </div>
                    <div className="text-2xl font-bold text-green-800 mb-1">
                      ₹{(selectedProperty.totalEarnings || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-green-600 font-medium">Total Earnings</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-calendar-check text-blue-600"></i>
                    </div>
                    <div className="text-2xl font-bold text-blue-800 mb-1">{selectedProperty.totalBookings}</div>
                    <p className="text-sm text-blue-600 font-medium">Total Bookings</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-calendar text-purple-600"></i>
                    </div>
                    <div className="text-2xl font-bold text-purple-800 mb-1">
                      {new Date(selectedProperty.createdAt).toLocaleDateString()}
                    </div>
                    <p className="text-sm text-purple-600 font-medium">Date Added</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                  <button 
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditProperty(selectedProperty);
                    }}
                    className="flex-1 bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Property
                  </button>
                  <button 
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-colors duration-200 border border-border"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProperties;
