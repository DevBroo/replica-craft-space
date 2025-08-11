import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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

  // Mock data for venteskraft@gmail.com owner
  const mockProperties = [
    {
      id: '1',
      name: 'Luxury Beach Villa - Goa',
      type: 'villa',
      location: 'Calangute Beach Road',
      city: 'Goa',
      state: 'Goa',
      price: 18000,
      capacity: 10,
      bedrooms: 5,
      bathrooms: 4,
      status: 'active',
      rating: 4.9,
      totalBookings: 67,
      totalEarnings: 1206000,
      images: ['/placeholder.svg'],
      amenities: ['wifi', 'ac', 'parking', 'kitchen', 'pool', 'gym', 'tv', 'spa'],
      description: 'Exclusive beachfront villa with private pool, stunning ocean views, and luxury amenities. Perfect for family vacations and corporate retreats.',
      createdAt: '2024-01-10',
      lastUpdated: '2024-08-15',
      ownerEmail: 'venteskraft@gmail.com'
    },
    {
      id: '2',
      name: 'Mountain View Resort - Manali',
      type: 'resort',
      location: 'Kullu Valley',
      city: 'Manali',
      state: 'Himachal Pradesh',
      price: 12000,
      capacity: 15,
      bedrooms: 8,
      bathrooms: 6,
      status: 'active',
      rating: 4.7,
      totalBookings: 89,
      totalEarnings: 1068000,
      images: ['/placeholder.svg'],
      amenities: ['wifi', 'heating', 'kitchen', 'fireplace', 'parking', 'gym', 'spa'],
      description: 'Premium mountain resort with panoramic views of snow-capped peaks. Features luxury accommodations, spa facilities, and adventure activities.',
      createdAt: '2024-02-15',
      lastUpdated: '2024-08-12',
      ownerEmail: 'venteskraft@gmail.com'
    },
    {
      id: '3',
      name: 'Heritage Palace - Jaipur',
      type: 'heritage',
      location: 'Old City Palace District',
      city: 'Jaipur',
      state: 'Rajasthan',
      price: 35000,
      capacity: 20,
      bedrooms: 12,
      bathrooms: 8,
      status: 'pending',
      rating: 0,
      totalBookings: 0,
      totalEarnings: 0,
      images: ['/placeholder.svg'],
      amenities: ['wifi', 'ac', 'parking', 'kitchen', 'pool', 'spa', 'tv', 'fireplace'],
      description: 'Magnificent heritage palace with royal architecture, traditional Rajasthani design, and modern luxury amenities. Perfect for royal weddings and events.',
      createdAt: '2024-08-01',
      lastUpdated: '2024-08-01',
      ownerEmail: 'venteskraft@gmail.com'
    }
  ];

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      navigate('/owner/login');
      return;
    }
    
    // Load properties from localStorage or mock data
    if (user && user.email) {
      const storageKey = `properties_${user.email}`;
      const savedProperties = localStorage.getItem(storageKey);
      
      if (savedProperties) {
        // Load from localStorage
        const parsedProperties = JSON.parse(savedProperties);
        setProperties(parsedProperties);
        console.log(`🏠 Loading saved properties for ${user.email}:`, parsedProperties.length, 'properties');
      } else {
        // Load from mock data for first time
        const userProperties = mockProperties.filter(property => 
          property.ownerEmail === user.email
        );
        setProperties(userProperties);
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(userProperties));
        console.log(`🏠 Loading initial properties for ${user.email}:`, userProperties.length, 'properties');
      }
    } else {
      setProperties([]);
    }
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
      name: property.name,
      type: property.type,
      location: property.location,
      city: property.city,
      state: property.state,
      price: property.price.toString(),
      capacity: property.capacity.toString(),
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      description: property.description,
      amenities: property.amenities
    });
    setShowEditModal(true);
  };

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setShowViewModal(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      setProperties(updatedProperties);
      
      // Save to localStorage
      if (user && user.email) {
        const storageKey = `properties_${user.email}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedProperties));
        console.log('💾 Property deleted and saved to localStorage');
      }
    }
  };

  const handleStatusChange = (propertyId: string, newStatus: string) => {
    const updatedProperties = properties.map(p => 
      p.id === propertyId ? { ...p, status: newStatus } : p
    );
    setProperties(updatedProperties);
    
    // Save to localStorage
    if (user && user.email) {
      const storageKey = `properties_${user.email}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedProperties));
      console.log(`💾 Property status changed to ${newStatus} and saved to localStorage`);
    }
  };

  const resetToInitialProperties = () => {
    if (confirm('Are you sure you want to reset to initial properties? This will remove all your changes.')) {
      if (user && user.email) {
        const userProperties = mockProperties.filter(property => 
          property.ownerEmail === user.email
        );
        setProperties(userProperties);
        
        // Save to localStorage
        const storageKey = `properties_${user.email}`;
        localStorage.setItem(storageKey, JSON.stringify(userProperties));
        console.log('🔄 Reset to initial properties');
      }
    }
  };

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleAmenityChange = useCallback((amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProperty = {
      id: editingProperty ? editingProperty.id : Date.now().toString(),
      name: formData.name,
      type: formData.type,
      location: formData.location,
      city: formData.city,
      state: formData.state,
      price: parseInt(formData.price),
      capacity: parseInt(formData.capacity),
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
      status: editingProperty ? editingProperty.status : 'pending',
      rating: editingProperty ? editingProperty.rating : 0,
      totalBookings: editingProperty ? editingProperty.totalBookings : 0,
      totalEarnings: editingProperty ? editingProperty.totalEarnings : 0,
      images: ['/placeholder.svg'],
      amenities: formData.amenities,
      description: formData.description,
      createdAt: editingProperty ? editingProperty.createdAt : new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      ownerEmail: user?.email || 'venteskraft@gmail.com'
    };

    if (editingProperty) {
      // Update existing property
      const updatedProperties = properties.map(p => p.id === editingProperty.id ? newProperty : p);
      setProperties(updatedProperties);
      
      // Save to localStorage
      if (user && user.email) {
        const storageKey = `properties_${user.email}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedProperties));
        console.log('💾 Updated property saved to localStorage');
      }
      
      setShowEditModal(false);
    } else {
      // Add new property
      const updatedProperties = [...properties, newProperty];
      setProperties(updatedProperties);
      
      // Save to localStorage
      if (user && user.email) {
        const storageKey = `properties_${user.email}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedProperties));
        console.log('💾 New property saved to localStorage');
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
  };

  const PropertyForm = () => (
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
          {['wifi', 'ac', 'parking', 'kitchen', 'pool', 'gym', 'tv', 'spa', 'heating', 'fireplace'].map(amenity => (
            <div key={amenity} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={amenity}
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={amenity} className="text-sm capitalize text-gray-700">{amenity}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <i className="fas fa-upload text-gray-400 text-2xl mb-2"></i>
          <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
        </div>
      </div>
    </form>
  );

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
              <button 
                onClick={resetToInitialProperties}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
                title="Reset to initial properties"
              >
                <i className="fas fa-undo mr-2"></i>
                Reset
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
                      ₹{property.price.toLocaleString()}
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
                        ₹{property.totalEarnings.toLocaleString()}
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
            <PropertyForm key="add-form" />
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
            <PropertyForm key="edit-form" />
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
                      <span className="font-medium">Price:</span> ₹{selectedProperty.price.toLocaleString()}/day
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
                  <span className="font-medium">Total Earnings:</span> ₹{selectedProperty.totalEarnings.toLocaleString()}
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
