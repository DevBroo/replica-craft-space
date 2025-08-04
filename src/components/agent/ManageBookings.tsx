import React, { useState } from 'react';
import { Search, Filter, Download, Bell, ChevronDown, Calendar, CalendarCheck, Users, Eye, Edit, Check, X } from 'lucide-react';

const ManageBookings: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table');

  const statusFilters = [
    { id: 'all', label: 'All Bookings', count: 142 },
    { id: 'pending', label: 'Pending', count: 8 },
    { id: 'confirmed', label: 'Confirmed', count: 98 },
    { id: 'cancelled', label: 'Cancelled', count: 12 },
    { id: 'completed', label: 'Completed', count: 24 }
  ];

  const mockBookings = [
    {
      id: 'BK001',
      customer: { name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 9876543210' },
      property: { name: 'Ocean View Villa', type: 'Villa', location: 'Mumbai, Maharashtra' },
      checkIn: '2025-02-15',
      checkOut: '2025-02-18',
      status: 'confirmed',
      commission: 2500,
      totalAmount: 12500,
      guests: 4,
      nights: 3
    },
    {
      id: 'BK002',
      customer: { name: 'Amit Kumar', email: 'amit.kumar@email.com', phone: '+91 9876543211' },
      property: { name: 'Heritage Palace', type: 'Hotel', location: 'Jaipur, Rajasthan' },
      checkIn: '2025-02-18',
      checkOut: '2025-02-22',
      status: 'pending',
      commission: 1800,
      totalAmount: 9000,
      guests: 2,
      nights: 4
    },
    {
      id: 'BK003',
      customer: { name: 'Sneha Patel', email: 'sneha.patel@email.com', phone: '+91 9876543212' },
      property: { name: 'Mountain Resort', type: 'Resort', location: 'Manali, Himachal Pradesh' },
      checkIn: '2025-02-20',
      checkOut: '2025-02-25',
      status: 'confirmed',
      commission: 3200,
      totalAmount: 16000,
      guests: 6,
      nights: 5
    },
    {
      id: 'BK004',
      customer: { name: 'Rajesh Singh', email: 'rajesh.singh@email.com', phone: '+91 9876543213' },
      property: { name: 'City Hotel', type: 'Hotel', location: 'Delhi, NCR' },
      checkIn: '2025-02-12',
      checkOut: '2025-02-14',
      status: 'cancelled',
      commission: 0,
      totalAmount: 8000,
      guests: 2,
      nights: 2
    },
    {
      id: 'BK005',
      customer: { name: 'Kavya Reddy', email: 'kavya.reddy@email.com', phone: '+91 9876543214' },
      property: { name: 'Beach Resort', type: 'Resort', location: 'Goa' },
      checkIn: '2025-01-28',
      checkOut: '2025-02-02',
      status: 'completed',
      commission: 4500,
      totalAmount: 22500,
      guests: 8,
      nights: 5
    },
    {
      id: 'BK006',
      customer: { name: 'Arjun Mehta', email: 'arjun.mehta@email.com', phone: '+91 9876543215' },
      property: { name: 'Lake View Lodge', type: 'Lodge', location: 'Udaipur, Rajasthan' },
      checkIn: '2025-02-25',
      checkOut: '2025-02-28',
      status: 'pending',
      commission: 2800,
      totalAmount: 14000,
      guests: 4,
      nights: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="h-3 w-3 mr-1" />;
      case 'pending': return <Calendar className="h-3 w-3 mr-1" />;
      case 'cancelled': return <X className="h-3 w-3 mr-1" />;
      case 'completed': return <CalendarCheck className="h-3 w-3 mr-1" />;
      default: return <Calendar className="h-3 w-3 mr-1" />;
    }
  };

  const filteredBookings = mockBookings.filter(booking => {
    const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
    const matchesSearch = searchQuery === '' ||
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setSelectedCustomer('');
    setSelectedProperty('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-800">Manage Bookings</h1>
            <div className="text-sm text-gray-500">
              <span>Total: {filteredBookings.length} bookings</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Download className="h-4 w-4 mr-2 inline" />
              Export
            </button>
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">5</span>
            </button>
          </div>
            <div className="flex items-center space-x-2">
              <img
                src="https://readdy.ai/api/search-image?query=professional%20Indian%20booking%20agent%20avatar%20headshot%20with%20confident%20friendly%20expression%20modern%20business%20attire%20clean%20background&width=40&height=40&seq=agent-avatar-001&orientation=squarish"
                alt="Agent Avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            <span className="text-sm font-medium text-gray-700">Vikram Mehta</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="p-6 bg-white border-b">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
                placeholder="Search bookings, customers, properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Filter className="h-4 w-4 mr-2 inline" />
              Advanced Filters
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg cursor-pointer ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg cursor-pointer ${viewMode === 'card' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedStatus(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                selectedStatus === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Properties</option>
                  <option value="hotel">Hotel</option>
                  <option value="villa">Villa</option>
                  <option value="resort">Resort</option>
                  <option value="lodge">Lodge</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Range (₹)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="p-6">
        {/* Bulk Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Check className="h-4 w-4 mr-2 inline" />
              Bulk Confirm
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
              <X className="h-4 w-4 mr-2 inline" />
              Bulk Cancel
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
          </div>
        </div>

        {/* Bookings Table */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded cursor-pointer" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                          #{booking.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={`https://readdy.ai/api/search-image?query=professional%20Indian%20customer%20avatar%20headshot%20${booking.customer.name.split(' ')[0].toLowerCase()}%20friendly%20expression%20modern%20attire%20clean%20white%20background&width=40&height=40&seq=customer-${booking.id}&orientation=squarish`}
                            alt={booking.customer.name}
                            className="w-8 h-8 rounded-full object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.customer.name}</div>
                            <div className="text-sm text-gray-500">{booking.customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={`https://readdy.ai/api/search-image?query=luxury%20${booking.property.type.toLowerCase()}%20${booking.property.name.toLowerCase().replace(/\s+/g, '%20')}%20exterior%20view%20beautiful%20architecture%20modern%20design%20clean%20background%20professional%20photography&width=40&height=40&seq=property-${booking.id}&orientation=squarish`}
                            alt={booking.property.name}
                            className="w-8 h-8 rounded-lg object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.property.name}</div>
                            <div className="text-sm text-gray-500">{booking.property.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 text-gray-400 mr-2" />
                            {booking.checkIn}
                          </div>
                          <div className="flex items-center mt-1">
                            <CalendarCheck className="h-3 w-3 text-gray-400 mr-2" />
                            {booking.checkOut}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{booking.nights} nights, {booking.guests} guests</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{booking.commission.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">of ₹{booking.totalAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 cursor-pointer">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 cursor-pointer">
                            <Edit className="h-4 w-4" />
                          </button>
                          {booking.status === 'pending' && (
                            <button className="text-green-600 hover:text-green-900 cursor-pointer">
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button className="text-red-600 hover:text-red-900 cursor-pointer">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                    #{booking.id}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center mb-4">
                  <img
                    src={`https://readdy.ai/api/search-image?query=professional%20Indian%20customer%20avatar%20headshot%20${booking.customer.name.split(' ')[0].toLowerCase()}%20friendly%20expression%20modern%20attire%20clean%20white%20background&width=40&height=40&seq=customer-card-${booking.id}&orientation=squarish`}
                    alt={booking.customer.name}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{booking.customer.name}</div>
                    <div className="text-sm text-gray-500">{booking.customer.phone}</div>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  <img
                    src={`https://readdy.ai/api/search-image?query=luxury%20${booking.property.type.toLowerCase()}%20${booking.property.name.toLowerCase().replace(/\s+/g, '%20')}%20exterior%20view%20beautiful%20architecture%20modern%20design%20clean%20background%20professional%20photography&width=40&height=40&seq=property-card-${booking.id}&orientation=squarish`}
                    alt={booking.property.name}
                    className="w-10 h-10 rounded-lg object-cover mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{booking.property.name}</div>
                    <div className="text-sm text-gray-500">{booking.property.location}</div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    📅 Check-in: {booking.checkIn}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    ✅ Check-out: {booking.checkOut}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    👥 {booking.guests} guests, {booking.nights} nights
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">₹{booking.commission.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Commission</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">₹{booking.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total Amount</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">👁️</button>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer">✏️</button>
                    {booking.status === 'pending' && (
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer">✅</button>
                    )}
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">❌</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ◀
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <img
              src="https://readdy.ai/api/search-image?query=empty%20state%20illustration%20no%20bookings%20found%20modern%20flat%20design%20clean%20background%20professional%20style%20booking%20management%20system&width=200&height=150&seq=empty-bookings-001&orientation=landscape"
              alt="No bookings found"
              className="w-48 h-36 mx-auto mb-4 object-cover"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters to find more bookings.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageBookings;