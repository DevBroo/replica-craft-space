import React, { useState } from 'react';

interface BookingsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Bookings: React.FC<BookingsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('checkin');
  const [dateRange, setDateRange] = useState('all');

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

  const bookings = [
    {
      id: 'BK001',
      guestName: 'Priya Sharma',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20woman%20guest%20avatar%20headshot%20with%20friendly%20smile%20modern%20style%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-001&orientation=squarish',
      propertyName: 'Oceanview Villa',
      checkIn: '2024-01-15',
      checkOut: '2024-01-20',
      status: 'upcoming',
      paymentStatus: 'paid',
      totalAmount: '₹25,000',
      guests: 4,
      nights: 5
    },
    {
      id: 'BK002',
      guestName: 'Amit Patel',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20man%20guest%20avatar%20headshot%20with%20confident%20expression%20modern%20style%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-002&orientation=squarish',
      propertyName: 'Goa Beach House',
      checkIn: '2024-01-10',
      checkOut: '2024-01-18',
      status: 'ongoing',
      paymentStatus: 'paid',
      totalAmount: '₹42,000',
      guests: 6,
      nights: 8
    },
    {
      id: 'BK003',
      guestName: 'Sneha Reddy',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20woman%20guest%20avatar%20headshot%20with%20warm%20smile%20traditional%20modern%20fusion%20style%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-003&orientation=squarish',
      propertyName: 'Jaipur Heritage',
      checkIn: '2023-12-20',
      checkOut: '2023-12-25',
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: '₹35,000',
      guests: 2,
      nights: 5
    },
    {
      id: 'BK004',
      guestName: 'Rahul Kumar',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20man%20guest%20avatar%20headshot%20with%20friendly%20expression%20contemporary%20style%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-004&orientation=squarish',
      propertyName: 'Pune Penthouse',
      checkIn: '2024-01-25',
      checkOut: '2024-01-28',
      status: 'cancelled',
      paymentStatus: 'refunded',
      totalAmount: '₹18,000',
      guests: 3,
      nights: 3
    },
    {
      id: 'BK005',
      guestName: 'Meera Gupta',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20woman%20guest%20avatar%20headshot%20with%20elegant%20style%20modern%20Indian%20fashion%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-005&orientation=squarish',
      propertyName: 'Chennai Marina',
      checkIn: '2024-01-12',
      checkOut: '2024-01-16',
      status: 'ongoing',
      paymentStatus: 'paid',
      totalAmount: '₹28,000',
      guests: 2,
      nights: 4
    },
    {
      id: 'BK006',
      guestName: 'Vikram Singh',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20man%20guest%20avatar%20headshot%20with%20business%20style%20confident%20expression%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-006&orientation=squarish',
      propertyName: 'Delhi Apartment',
      checkIn: '2024-01-22',
      checkOut: '2024-01-26',
      status: 'upcoming',
      paymentStatus: 'pending',
      totalAmount: '₹32,000',
      guests: 4,
      nights: 4
    },
    {
      id: 'BK007',
      guestName: 'Anita Joshi',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20woman%20guest%20avatar%20headshot%20with%20traditional%20style%20warm%20expression%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-007&orientation=squarish',
      propertyName: 'Kolkata Heritage',
      checkIn: '2023-12-15',
      checkOut: '2023-12-20',
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: '₹22,000',
      guests: 2,
      nights: 5
    },
    {
      id: 'BK008',
      guestName: 'Suresh Nair',
      guestPhoto: 'https://readdy.ai/api/search-image?query=professional%20Indian%20man%20guest%20avatar%20headshot%20with%20casual%20style%20friendly%20smile%20bright%20natural%20lighting%20clean%20background&width=40&height=40&seq=guest-008&orientation=squarish',
      propertyName: 'Kochi Waterfront',
      checkIn: '2024-01-30',
      checkOut: '2024-02-05',
      status: 'upcoming',
      paymentStatus: 'paid',
      totalAmount: '₹38,000',
      guests: 5,
      nights: 6
    }
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSearch = booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'checkin':
        return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
      case 'guest':
        return a.guestName.localeCompare(b.guestName);
      case 'property':
        return a.propertyName.localeCompare(b.propertyName);
      case 'amount':
        return parseInt(b.totalAmount.replace(/[₹,]/g, '')) - parseInt(a.totalAmount.replace(/[₹,]/g, ''));
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = sortedBookings.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              <h1 className="text-2xl font-semibold text-gray-800">Bookings Management</h1>
              <div className="text-sm text-gray-500">
                <span>{filteredBookings.length} bookings found</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              </div>
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-bell text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
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
                    <span>
                      {statusFilter === 'all' ? 'All Bookings' :
                      statusFilter === 'upcoming' ? 'Upcoming' :
                      statusFilter === 'ongoing' ? 'Ongoing' :
                      statusFilter === 'completed' ? 'Completed' : 'Cancelled'}
                    </span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="status-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    {['all', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          document.getElementById('status-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {status === 'all' ? 'All Bookings' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Date Range:</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('date-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span>{dateRange === 'all' ? 'All Dates' : dateRange}</span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="date-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    {['all', 'Today', 'This Week', 'This Month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setDateRange(range);
                          document.getElementById('date-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {range === 'all' ? 'All Dates' : range}
                      </button>
                    ))}
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
                    <span>
                      {sortBy === 'checkin' ? 'Check-in Date' :
                      sortBy === 'guest' ? 'Guest Name' :
                      sortBy === 'property' ? 'Property Name' : 'Amount'}
                    </span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="sort-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    {[
                      { value: 'checkin', label: 'Check-in Date' },
                      { value: 'guest', label: 'Guest Name' },
                      { value: 'property', label: 'Property Name' },
                      { value: 'amount', label: 'Amount' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          document.getElementById('sort-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap">
              <i className="fas fa-plus mr-2"></i>
              Add New Booking
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Booking ID</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Guest</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Property</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Check-in</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Check-out</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Payment</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-gray-900">{booking.id}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={booking.guestPhoto}
                            alt={booking.guestName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.guestName}</p>
                            <p className="text-xs text-gray-500">{booking.guests} guests</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.propertyName}</p>
                          <p className="text-xs text-gray-500">{booking.nights} nights</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">{new Date(booking.checkOut).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-gray-900">{booking.totalAmount}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 cursor-pointer">
                            <i className="fas fa-eye text-sm"></i>
                          </button>
                          <button className="text-green-600 hover:text-green-800 cursor-pointer">
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <button className="text-red-600 hover:text-red-800 cursor-pointer">
                              <i className="fas fa-times text-sm"></i>
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onClick={() => {
                                const dropdown = document.getElementById(`action-${booking.id}`);
                                if (dropdown) {
                                  dropdown.classList.toggle('hidden');
                                }
                              }}
                              className="text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                              <i className="fas fa-ellipsis-v text-sm"></i>
                            </button>
                            <div id={`action-${booking.id}`} className="hidden absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm">
                                View Details
                              </button>
                              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm">
                                Send Message
                              </button>
                              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm">
                                Download Invoice
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show</span>
              <div className="relative">
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('items-dropdown');
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <span>{itemsPerPage}</span>
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </button>
                <div id="items-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                  {[10, 25, 50, 100].map((items) => (
                    <button
                      key={items}
                      onClick={() => {
                        setItemsPerPage(items);
                        setCurrentPage(1);
                        document.getElementById('items-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      {items}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-700">entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedBookings.length)} of {sortedBookings.length} entries
              </span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
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
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Bookings;