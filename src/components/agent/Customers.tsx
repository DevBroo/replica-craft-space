import React, { useState } from 'react';

const Customers: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const customerSegmentTabs = [
    { id: 'all', label: 'All Customers', count: 248 },
    { id: 'vip', label: 'VIP Customers', count: 42 },
    { id: 'regular', label: 'Regular Customers', count: 156 },
    { id: 'new', label: 'New Customers', count: 50 }
  ];

  const statusFilters = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'vip', label: 'VIP' }
  ];

  const mockCustomerData = [
    {
      id: 'CUST001',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43210',
      location: 'Mumbai, Maharashtra',
      totalBookings: 8,
      totalSpend: 125000,
      lastBooking: '2025-01-20',
      joinDate: '2023-06-15',
      status: 'vip',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20Indian%20woman%20customer%20avatar%20headshot%20priya%20friendly%20expression%20modern%20business%20attire%20clean%20white%20background&width=40&height=40&seq=customer-priya-001&orientation=squarish'
    },
    {
      id: 'CUST002',
      name: 'Amit Kumar',
      email: 'amit.kumar@email.com',
      phone: '+91 98765 43211',
      location: 'Delhi, NCR',
      totalBookings: 5,
      totalSpend: 75000,
      lastBooking: '2025-01-18',
      joinDate: '2023-08-20',
      status: 'regular',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20Indian%20man%20customer%20avatar%20headshot%20amit%20friendly%20expression%20modern%20business%20attire%20clean%20white%20background&width=40&height=40&seq=customer-amit-002&orientation=squarish'
    },
    {
      id: 'CUST003',
      name: 'Sneha Patel',
      email: 'sneha.patel@email.com',
      phone: '+91 98765 43212',
      location: 'Ahmedabad, Gujarat',
      totalBookings: 12,
      totalSpend: 180000,
      lastBooking: '2025-01-25',
      joinDate: '2022-12-10',
      status: 'vip',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20Indian%20woman%20customer%20avatar%20headshot%20sneha%20friendly%20expression%20modern%20business%20attire%20clean%20white%20background&width=40&height=40&seq=customer-sneha-003&orientation=squarish'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'regular': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return '👑';
      case 'regular': return '👤';
      case 'new': return '⭐';
      case 'inactive': return '👤';
      default: return '👤';
    }
  };

  const filteredCustomers = mockCustomerData.filter(customer => {
    const matchesTab = activeTab === 'all' || customer.status === activeTab;
    const matchesSearch = searchQuery === '' ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    return matchesTab && matchesSearch && matchesStatus;
  });

  const totalCustomers = mockCustomerData.length;
  const vipCustomers = mockCustomerData.filter(c => c.status === 'vip').length;
  const newCustomers = mockCustomerData.filter(c => c.status === 'new').length;
  const averageCustomerValue = mockCustomerData.reduce((sum, c) => sum + c.totalSpend, 0) / totalCustomers;

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-800">My Customers</h1>
            <div className="text-sm text-gray-500">
              <span>Total: {totalCustomers} customers</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <span className="mr-2">📥</span>
              Export Data
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <span className="mr-2">➕</span>
              Add Customer
            </button>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="p-6 bg-white border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
                <p className="text-blue-100 text-sm mt-1">Active database</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                <span className="text-xl">👥</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">VIP Customers</p>
                <p className="text-2xl font-bold">{vipCustomers}</p>
                <p className="text-purple-100 text-sm mt-1">Premium tier</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                <span className="text-xl">👑</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">New Customers</p>
                <p className="text-2xl font-bold">{newCustomers}</p>
                <p className="text-green-100 text-sm mt-1">Last 30 days</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                <span className="text-xl">⭐</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Average Value</p>
                <p className="text-2xl font-bold">₹{Math.round(averageCustomerValue).toLocaleString()}</p>
                <p className="text-orange-100 text-sm mt-1">Per customer</p>
              </div>
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
                <span className="text-xl">📈</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segmentation Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {customerSegmentTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 bg-white border-b">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
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
              <span className="mr-2">🔽</span>
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Filter Chips */}
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
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Customer List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={customer.avatar}
                          alt={customer.name}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">ID: {customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                      <div className="text-sm text-gray-500">{customer.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.totalBookings}</div>
                      <div className="text-sm text-gray-500">Last: {customer.lastBooking}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{customer.totalSpend.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Avg: ₹{Math.round(customer.totalSpend / customer.totalBookings).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                        <span className="mr-1">{getStatusIcon(customer.status)}</span>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 cursor-pointer" title="View Details">
                          👁️
                        </button>
                        <button className="text-green-600 hover:text-green-900 cursor-pointer" title="Contact">
                          ✉️
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 cursor-pointer" title="Edit">
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default Customers;