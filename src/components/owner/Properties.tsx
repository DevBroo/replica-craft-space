import React, { useState } from 'react';
import AddProperty from './AddProperty';

interface PropertiesProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Properties: React.FC<PropertiesProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const propertiesPerPage = 9;

  if (showAddProperty) {
    return <AddProperty onBack={() => setShowAddProperty(false)} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'properties', label: 'My Properties', icon: 'fas fa-home' },
    { id: 'bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
    { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
    { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  const properties = [
    {
      id: 1,
      name: 'Oceanview Villa',
      location: 'Mumbai, Maharashtra',
      status: 'active',
      bookings: 24,
      revenue: '₹4,85,000',
      monthlyRevenue: '₹1,85,000',
      image: 'https://readdy.ai/api/search-image?query=luxury%20oceanview%20villa%20in%20Mumbai%20with%20modern%20architecture%20and%20beautiful%20sea%20view%20contemporary%20Indian%20design%20elements%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-001&orientation=landscape',
      rating: 4.8,
      dateAdded: '2024-01-15'
    },
    {
      id: 2,
      name: 'Ahmedabad Heights',
      location: 'Ahmedabad, Gujarat',
      status: 'active',
      bookings: 18,
      revenue: '₹3,25,000',
      monthlyRevenue: '₹1,25,000',
      image: 'https://readdy.ai/api/search-image?query=modern%20luxury%20apartment%20complex%20in%20Ahmedabad%20with%20contemporary%20architecture%20and%20landscaping%20Indian%20style%20bright%20lighting%20clean%20background&width=400&height=250&seq=property-002&orientation=landscape',
      rating: 4.6,
      dateAdded: '2024-02-20'
    },
    {
      id: 3,
      name: 'Gandhinagar Villa',
      location: 'Gandhinagar, Gujarat',
      status: 'inactive',
      bookings: 12,
      revenue: '₹2,15,000',
      monthlyRevenue: '₹0',
      image: 'https://readdy.ai/api/search-image?query=beautiful%20villa%20in%20Gandhinagar%20with%20modern%20Indian%20architecture%20and%20garden%20traditional%20elements%20fusion%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-003&orientation=landscape',
      rating: 4.5,
      dateAdded: '2024-01-10'
    },
    {
      id: 4,
      name: 'Pune Penthouse',
      location: 'Pune, Maharashtra',
      status: 'active',
      bookings: 31,
      revenue: '₹6,75,000',
      monthlyRevenue: '₹2,25,000',
      image: 'https://readdy.ai/api/search-image?query=luxury%20penthouse%20in%20Pune%20with%20modern%20interior%20design%20and%20city%20view%20contemporary%20Indian%20architecture%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-004&orientation=landscape',
      rating: 4.9,
      dateAdded: '2023-12-05'
    },
    {
      id: 5,
      name: 'Goa Beach House',
      location: 'Goa',
      status: 'active',
      bookings: 42,
      revenue: '₹8,95,000',
      monthlyRevenue: '₹3,15,000',
      image: 'https://readdy.ai/api/search-image?query=beautiful%20beach%20house%20in%20Goa%20with%20tropical%20architecture%20and%20ocean%20view%20modern%20Indian%20coastal%20design%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-005&orientation=landscape',
      rating: 4.7,
      dateAdded: '2023-11-20'
    },
    {
      id: 6,
      name: 'Delhi Apartment',
      location: 'New Delhi',
      status: 'active',
      bookings: 28,
      revenue: '₹5,45,000',
      monthlyRevenue: '₹1,95,000',
      image: 'https://readdy.ai/api/search-image?query=modern%20apartment%20in%20New%20Delhi%20with%20contemporary%20interior%20design%20and%20city%20view%20Indian%20architecture%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-006&orientation=landscape',
      rating: 4.4,
      dateAdded: '2024-03-01'
    },
    {
      id: 7,
      name: 'Bangalore Studio',
      location: 'Bangalore, Karnataka',
      status: 'inactive',
      bookings: 8,
      revenue: '₹1,25,000',
      monthlyRevenue: '₹0',
      image: 'https://readdy.ai/api/search-image?query=modern%20studio%20apartment%20in%20Bangalore%20with%20minimalist%20design%20and%20tech%20city%20view%20contemporary%20Indian%20architecture%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-007&orientation=landscape',
      rating: 4.2,
      dateAdded: '2024-02-15'
    },
    {
      id: 8,
      name: 'Jaipur Heritage',
      location: 'Jaipur, Rajasthan',
      status: 'active',
      bookings: 35,
      revenue: '₹7,25,000',
      monthlyRevenue: '₹2,85,000',
      image: 'https://readdy.ai/api/search-image?query=heritage%20property%20in%20Jaipur%20with%20traditional%20Rajasthani%20architecture%20and%20modern%20amenities%20royal%20Indian%20design%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-008&orientation=landscape',
      rating: 4.8,
      dateAdded: '2023-10-12'
    },
    {
      id: 9,
      name: 'Chennai Marina',
      location: 'Chennai, Tamil Nadu',
      status: 'active',
      bookings: 22,
      revenue: '₹4,15,000',
      monthlyRevenue: '₹1,65,000',
      image: 'https://readdy.ai/api/search-image?query=modern%20apartment%20near%20Marina%20Beach%20in%20Chennai%20with%20contemporary%20South%20Indian%20architecture%20and%20sea%20view%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-009&orientation=landscape',
      rating: 4.6,
      dateAdded: '2024-01-25'
    },
    {
      id: 10,
      name: 'Hyderabad Towers',
      location: 'Hyderabad, Telangana',
      status: 'active',
      bookings: 19,
      revenue: '₹3,85,000',
      monthlyRevenue: '₹1,45,000',
      image: 'https://readdy.ai/api/search-image?query=luxury%20high%20rise%20apartment%20in%20Hyderabad%20with%20modern%20architecture%20and%20city%20skyline%20view%20contemporary%20Indian%20design%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-010&orientation=landscape',
      rating: 4.5,
      dateAdded: '2024-02-28'
    },
    {
      id: 11,
      name: 'Kochi Waterfront',
      location: 'Kochi, Kerala',
      status: 'inactive',
      bookings: 15,
      revenue: '₹2,95,000',
      monthlyRevenue: '₹0',
      image: 'https://readdy.ai/api/search-image?query=waterfront%20property%20in%20Kochi%20with%20traditional%20Kerala%20architecture%20and%20backwater%20view%20modern%20amenities%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-011&orientation=landscape',
      rating: 4.3,
      dateAdded: '2024-01-08'
    },
    {
      id: 12,
      name: 'Kolkata Heritage',
      location: 'Kolkata, West Bengal',
      status: 'active',
      bookings: 26,
      revenue: '₹5,15,000',
      monthlyRevenue: '₹1,75,000',
      image: 'https://readdy.ai/api/search-image?query=heritage%20property%20in%20Kolkata%20with%20colonial%20architecture%20and%20modern%20renovations%20traditional%20Bengali%20design%20elements%20bright%20natural%20lighting%20clean%20background&width=400&height=250&seq=property-012&orientation=landscape',
      rating: 4.7,
      dateAdded: '2023-12-18'
    }
  ];

  const filteredProperties = properties.filter(property => {
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      case 'revenue':
        return parseInt(b.revenue.replace(/[₹,]/g, '')) - parseInt(a.revenue.replace(/[₹,]/g, ''));
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const currentProperties = sortedProperties.slice(startIndex, startIndex + propertiesPerPage);

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
          {menuItems.map((item) => (
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
              <div className="text-sm text-gray-500">
                <span>{filteredProperties.length} properties found</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              </div>
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-bell text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">5</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20Indian%20property%20owner%20businessman%20avatar%20headshot%20with%20traditional%20modern%20fusion%20style%20confident%20expression&width=40&height=40&seq=owner-avatar-001&orientation=squarish"
                  alt="Owner Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">Rajesh Patel</span>
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('status-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span>{statusFilter === 'all' ? 'All Properties' : statusFilter === 'active' ? 'Active' : 'Inactive'}</span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="status-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        document.getElementById('status-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      All Properties
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('active');
                        document.getElementById('status-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('inactive');
                        document.getElementById('status-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('sort-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span>{sortBy === 'name' ? 'Name' : sortBy === 'date' ? 'Date Added' : 'Revenue'}</span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="sort-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    <button
                      onClick={() => {
                        setSortBy('name');
                        document.getElementById('sort-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      Name
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('date');
                        document.getElementById('sort-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      Date Added
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('revenue');
                        document.getElementById('sort-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      Revenue
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddProperty(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap inline-flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Add New Property
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-48 object-cover object-top"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      property.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {property.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                    <div className="flex items-center text-white text-sm">
                      <i className="fas fa-star text-yellow-400 mr-1"></i>
                      <span>{property.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{property.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 flex items-center">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {property.location}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Bookings</p>
                      <p className="text-lg font-semibold text-gray-800">{property.bookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Revenue</p>
                      <p className="text-lg font-semibold text-green-600">{property.revenue}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">Monthly Revenue</p>
                    <p className="text-sm font-medium text-gray-800">{property.monthlyRevenue}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap text-sm">
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer !rounded-button whitespace-nowrap text-sm">
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </button>
                    <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer !rounded-button whitespace-nowrap text-sm">
                      <i className="fas fa-cog"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg cursor-pointer !rounded-button whitespace-nowrap ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Properties;