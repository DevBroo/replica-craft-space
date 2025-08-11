import React, { useState, useEffect } from 'react';
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

  // Mock data for demonstration
  const mockProperties = [
    {
      id: '1',
      name: 'Sunset Villa Paradise',
      type: 'villa',
      location: 'Goa Beach Road',
      city: 'Goa',
      state: 'Goa',
      price: 15000,
      capacity: 8,
      bedrooms: 4,
      bathrooms: 3,
      status: 'active',
      rating: 4.8,
      totalBookings: 45,
      totalEarnings: 675000,
      images: ['/placeholder.svg'],
      amenities: ['wifi', 'ac', 'parking', 'kitchen', 'pool', 'gym'],
      description: 'Luxurious beachfront villa with stunning ocean views and modern amenities.',
      createdAt: '2024-01-15',
      lastUpdated: '2024-08-10'
    },
    {
      id: '2',
      name: 'Mountain Retreat Cottage',
      type: 'homestay',
      location: 'Himalayan Valley',
      city: 'Manali',
      state: 'Himachal Pradesh',
      price: 8000,
      capacity: 4,
      bedrooms: 2,
      bathrooms: 2,
      status: 'active',
      rating: 4.6,
      totalBookings: 32,
      totalEarnings: 256000,
      images: ['/placeholder.svg'],
      amenities: ['wifi', 'heating', 'kitchen', 'fireplace'],
      description: 'Cozy mountain cottage with panoramic views of snow-capped peaks.',
      createdAt: '2024-02-20',
      lastUpdated: '2024-08-08'
    },
    {
      id: '3',
      name: 'Royal Heritage Palace',
      type: 'heritage',
      location: 'Old City',
      city: 'Jaipur',
      state: 'Rajasthan',
      price: 25000,
      capacity: 12,
      bedrooms: 6,
      bathrooms: 4,
      status: 'pending',
      rating: 0,
      totalBookings: 0,
      totalEarnings: 0,
      images: ['/placeholder.svg'],
      amenities: ['wifi', 'ac', 'parking', 'kitchen', 'pool', 'spa'],
      description: 'Magnificent heritage palace with royal architecture and luxury amenities.',
      createdAt: '2024-08-01',
      lastUpdated: '2024-08-01'
    }
  ];

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      navigate('/owner/login');
      return;
    }
    
    // Load mock data
    setProperties(mockProperties);
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
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

                  <div className="flex items-center space-x-2">
                    <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm">
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </button>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="bg-gray-100 hover:bg-gray-200 text-red-600 px-3 py-2 rounded text-sm">
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                <i className="fas fa-plus mr-2"></i>
                Add Your First Property
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyProperties;
