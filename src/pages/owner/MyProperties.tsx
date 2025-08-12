import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';

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
    
    // Load properties from database
    const loadProperties = async () => {
      if (!user || !user.email) {
        setProperties([]);
        return;
      }

      try {
        console.log('🔍 Loading properties for user:', user.email);
        
        // Get user ID from auth context or use email as fallback
        const ownerId = user.id || user.email;
        
        const dbProperties = await PropertyService.getOwnerProperties(ownerId);
        
        // Convert database properties to frontend format
        const frontendProperties = dbProperties.map(PropertyService.convertToFrontendFormat);
        setProperties(frontendProperties);
        console.log('✅ Properties loaded from database:', frontendProperties.length);
      } catch (error) {
        console.error('❌ Error loading properties from database:', error);
        
        // No fallback - only show database properties
        setProperties([]);
        console.log('📋 No properties found in database, showing empty state');
      }
    };

    loadProperties();
  }, [isAuthenticated, user, loading, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    setShowEditModal(true);
  };

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setShowViewModal(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        await PropertyService.deleteProperty(propertyId);
        
        const updatedProperties = properties.filter(p => p.id !== propertyId);
        setProperties(updatedProperties);
        console.log('✅ Property deleted from database successfully');
      } catch (error) {
        console.error('❌ Error deleting property from database:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      await PropertyService.updatePropertyStatus(propertyId, newStatus as any);
      
      const updatedProperties = properties.map(p => 
        p.id === propertyId ? { ...p, status: newStatus } : p
      );
      setProperties(updatedProperties);
      console.log(`✅ Property status changed to ${newStatus} in database`);
    } catch (error) {
      console.error('❌ Error updating property status in database:', error);
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
        console.log('📋 Property saved to localStorage:', newProperty);
        
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={property.images[0] || '/placeholder.svg'}
                    alt={property.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {getTypeLabel(property.type)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{property.name}</h3>
                    <div className="flex items-center space-x-1">
                      <i className="fas fa-star text-yellow-400"></i>
                      <span className="text-sm font-medium">{property.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    <span className="text-sm">{property.location}, {property.city}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <i className="fas fa-users mr-1"></i>
                        {property.capacity}
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-bed mr-1"></i>
                        {property.bedrooms}
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-bath mr-1"></i>
                        {property.bathrooms}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      ₹{(property.price || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <i className="fas fa-calendar mr-1"></i>
                        {property.totalBookings} bookings
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <i className="fas fa-dollar-sign mr-1"></i>
                        ₹{(property.totalEarnings || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <select
                      value={property.status}
                      onChange={(e) => handleStatusChange(property.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewProperty(property)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm"
                    >
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </button>
                    <button 
                      onClick={() => handleEditProperty(property)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteProperty(property.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-red-600 px-3 py-2 rounded text-sm"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
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

      {/* View Property Modal */}
      {showViewModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">{selectedProperty.name}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedProperty.images[0] || '/placeholder.svg'}
                    alt={selectedProperty.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedProperty.name}</h3>
                    <p className="text-gray-600">{selectedProperty.location}, {selectedProperty.city}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProperty.status)}`}>
                      {selectedProperty.status.charAt(0).toUpperCase() + selectedProperty.status.slice(1)}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {getTypeLabel(selectedProperty.type)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Price:</span> ₹{(selectedProperty.price || 0).toLocaleString()}/day
                    </div>
                    <div>
                      <span className="font-medium">Capacity:</span> {selectedProperty.capacity} guests
                    </div>
                    <div>
                      <span className="font-medium">Bedrooms:</span> {selectedProperty.bedrooms}
                    </div>
                    <div>
                      <span className="font-medium">Bathrooms:</span> {selectedProperty.bathrooms}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Rating:</span> {selectedProperty.rating}/5
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedProperty.description}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Amenities</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {selectedProperty.amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center space-x-2 text-sm">
                      <i className="fas fa-check text-green-500"></i>
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Bookings:</span> {selectedProperty.totalBookings}
                </div>
                <div>
                  <span className="font-medium">Total Earnings:</span> ₹{(selectedProperty.totalEarnings || 0).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedProperty.createdAt).toLocaleDateString()}
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
