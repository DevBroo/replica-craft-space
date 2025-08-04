import React, { useState } from 'react';
import { Search, Filter, Download, Bell, ChevronDown, TrendingUp, PieChart, Clock, DollarSign, BarChart3, History, Percent, Eye, RotateCcw, Check, Calendar, CalendarCheck } from 'lucide-react';

const Commissions: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('this-month');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedProperty, setSelectedProperty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('overview');

  const timeRangeFilters = [
    { id: 'this-month', label: 'This Month' },
    { id: 'last-month', label: 'Last Month' },
    { id: 'last-3-months', label: 'Last 3 Months' },
    { id: 'this-year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' }
  ];

  const paymentStatusFilters = [
    { id: 'all', label: 'All Payments', count: 156 },
    { id: 'paid', label: 'Paid', count: 98 },
    { id: 'pending', label: 'Pending', count: 42 },
    { id: 'failed', label: 'Failed', count: 16 }
  ];

  const mockCommissionData = [
    {
      id: 'COM001',
      bookingId: 'BK001',
      customer: { name: 'Priya Sharma', email: 'priya.sharma@email.com' },
      property: { name: 'Ocean View Villa', type: 'Villa', location: 'Mumbai, Maharashtra' },
      bookingDate: '2025-01-15',
      checkIn: '2025-02-15',
      checkOut: '2025-02-18',
      totalAmount: 12500,
      commissionRate: 20,
      commissionAmount: 2500,
      paymentStatus: 'paid',
      paymentDate: '2025-01-20',
      transactionId: 'TXN001234567'
    },
    {
      id: 'COM002',
      bookingId: 'BK002',
      customer: { name: 'Amit Kumar', email: 'amit.kumar@email.com' },
      property: { name: 'Heritage Palace', type: 'Hotel', location: 'Jaipur, Rajasthan' },
      bookingDate: '2025-01-18',
      checkIn: '2025-02-18',
      checkOut: '2025-02-22',
      totalAmount: 9000,
      commissionRate: 20,
      commissionAmount: 1800,
      paymentStatus: 'pending',
      paymentDate: null,
      transactionId: null
    },
    {
      id: 'COM003',
      bookingId: 'BK003',
      customer: { name: 'Sneha Patel', email: 'sneha.patel@email.com' },
      property: { name: 'Mountain Resort', type: 'Resort', location: 'Manali, Himachal Pradesh' },
      bookingDate: '2025-01-20',
      checkIn: '2025-02-20',
      checkOut: '2025-02-25',
      totalAmount: 16000,
      commissionRate: 20,
      commissionAmount: 3200,
      paymentStatus: 'paid',
      paymentDate: '2025-01-25',
      transactionId: 'TXN001234568'
    },
    {
      id: 'COM004',
      bookingId: 'BK004',
      customer: { name: 'Rajesh Singh', email: 'rajesh.singh@email.com' },
      property: { name: 'City Hotel', type: 'Hotel', location: 'Delhi, NCR' },
      bookingDate: '2025-01-12',
      checkIn: '2025-02-12',
      checkOut: '2025-02-14',
      totalAmount: 8000,
      commissionRate: 20,
      commissionAmount: 1600,
      paymentStatus: 'failed',
      paymentDate: null,
      transactionId: null
    },
    {
      id: 'COM005',
      bookingId: 'BK005',
      customer: { name: 'Kavya Reddy', email: 'kavya.reddy@email.com' },
      property: { name: 'Beach Resort', type: 'Resort', location: 'Goa' },
      bookingDate: '2025-01-28',
      checkIn: '2025-01-28',
      checkOut: '2025-02-02',
      totalAmount: 22500,
      commissionRate: 20,
      commissionAmount: 4500,
      paymentStatus: 'paid',
      paymentDate: '2025-02-03',
      transactionId: 'TXN001234569'
    }
  ];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="h-3 w-3 mr-1" />;
      case 'pending': return <Clock className="h-3 w-3 mr-1" />;
      case 'failed': return <TrendingUp className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const filteredCommissions = mockCommissionData.filter(commission => {
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || commission.paymentStatus === selectedPaymentStatus;
    const matchesSearch = searchQuery === '' ||
      commission.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.bookingId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPaymentStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCommissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCommissions = filteredCommissions.slice(startIndex, startIndex + itemsPerPage);

  const totalEarnings = mockCommissionData.reduce((sum, commission) =>
    commission.paymentStatus === 'paid' ? sum + commission.commissionAmount : sum, 0
  );

  const pendingEarnings = mockCommissionData.reduce((sum, commission) =>
    commission.paymentStatus === 'pending' ? sum + commission.commissionAmount : sum, 0
  );

  const clearFilters = () => {
    setSelectedPaymentStatus('all');
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setSelectedProperty('');
    setCurrentPage(1);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-800">Commissions</h1>
            <div className="text-sm text-gray-500">
              <span>Total Earnings: ₹{totalEarnings.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Download className="h-4 w-4 mr-2 inline" />
              Export Data
            </button>
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
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

      {/* Quick Stats */}
      <div className="p-6 bg-white border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</p>
                <p className="text-blue-100 text-sm mt-1">This month</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold">₹{pendingEarnings.toLocaleString()}</p>
                <p className="text-orange-100 text-sm mt-1">Awaiting payment</p>
              </div>
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Average Commission</p>
                <p className="text-2xl font-bold">20%</p>
                <p className="text-green-100 text-sm mt-1">Per booking</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                <Percent className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Transactions</p>
                <p className="text-2xl font-bold">{mockCommissionData.length}</p>
                <p className="text-purple-100 text-sm mt-1">This month</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'earnings', label: 'Earnings Summary', icon: DollarSign },
              { id: 'payments', label: 'Payment History', icon: History },
              { id: 'rates', label: 'Commission Rates', icon: Percent }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
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
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search commissions, customers, properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Calendar className="h-4 w-4 mr-2 inline" />
                {timeRangeFilters.find(f => f.id === selectedTimeRange)?.label}
                <ChevronDown className="h-4 w-4 ml-2 inline" />
              </button>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Filter className="h-4 w-4 mr-2 inline" />
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Payment Status Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {paymentStatusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedPaymentStatus(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                selectedPaymentStatus === filter.id
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
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
                <div className="relative">
                  <button className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left cursor-pointer">
                    All Properties
                    <ChevronDown className="h-4 w-4 float-right mt-0.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-end">
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Earnings Trend</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Earnings trend chart will be displayed here</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Commission by Property Type</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Property type distribution chart will be displayed here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
                  <span className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
                    View All Bookings
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCommissions.slice(0, 5).map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{commission.id}</div>
                          <div className="text-sm text-gray-500">Booking: {commission.bookingId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={`https://readdy.ai/api/search-image?query=professional%20Indian%20customer%20avatar%20headshot%20${commission.customer.name.split(' ')[0].toLowerCase()}%20friendly%20expression%20modern%20attire%20clean%20white%20background&width=40&height=40&seq=customer-${commission.id}&orientation=squarish`}
                              alt={commission.customer.name}
                              className="w-8 h-8 rounded-full object-cover mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{commission.customer.name}</div>
                              <div className="text-sm text-gray-500">{commission.customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{commission.property.name}</div>
                          <div className="text-sm text-gray-500">{commission.property.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{commission.commissionAmount.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{commission.commissionRate}% of ₹{commission.totalAmount.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(commission.paymentStatus)}`}>
                            {getPaymentStatusIcon(commission.paymentStatus)}
                            {commission.paymentStatus.charAt(0).toUpperCase() + commission.paymentStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {commission.paymentDate || commission.bookingDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Earnings Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{commission.id}</div>
                        <div className="text-sm text-gray-500">Booking: {commission.bookingId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={`https://readdy.ai/api/search-image?query=professional%20Indian%20customer%20avatar%20headshot%20${commission.customer.name.split(' ')[0].toLowerCase()}%20friendly%20expression%20modern%20attire%20clean%20white%20background&width=40&height=40&seq=customer-earnings-${commission.id}&orientation=squarish`}
                            alt={commission.customer.name}
                            className="w-8 h-8 rounded-full object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{commission.customer.name}</div>
                            <div className="text-sm text-gray-500">{commission.customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={`https://readdy.ai/api/search-image?query=luxury%20${commission.property.type.toLowerCase()}%20${commission.property.name.toLowerCase().replace(/\s+/g, '%20')}%20exterior%20view%20beautiful%20architecture%20modern%20design%20clean%20background%20professional%20photography&width=40&height=40&seq=property-earnings-${commission.id}&orientation=squarish`}
                            alt={commission.property.name}
                            className="w-8 h-8 rounded-lg object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{commission.property.name}</div>
                            <div className="text-sm text-gray-500">{commission.property.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 text-gray-400 mr-2" />
                            {commission.checkIn}
                          </div>
                          <div className="flex items-center mt-1">
                            <CalendarCheck className="h-3 w-3 text-gray-400 mr-2" />
                            {commission.checkOut}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{commission.commissionAmount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{commission.commissionRate}% of ₹{commission.totalAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(commission.paymentStatus)}`}>
                          {getPaymentStatusIcon(commission.paymentStatus)}
                          {commission.paymentStatus.charAt(0).toUpperCase() + commission.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 cursor-pointer">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 cursor-pointer">
                            <Download className="h-4 w-4" />
                          </button>
                          {commission.paymentStatus === 'failed' && (
                            <button className="text-orange-600 hover:text-orange-900 cursor-pointer">
                              <RotateCcw className="h-4 w-4" />
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
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockCommissionData.filter(c => c.paymentStatus === 'paid').map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 rounded-full p-2">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Payment Received</div>
                        <div className="text-sm text-gray-500">Commission for booking #{commission.bookingId}</div>
                        <div className="text-sm text-gray-500">Transaction ID: {commission.transactionId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">₹{commission.commissionAmount.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{commission.paymentDate}</div>
                    </div>
                  </div>
                ))}
                {mockCommissionData.filter(c => c.paymentStatus === 'pending').map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-100 rounded-full p-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Payment Pending</div>
                        <div className="text-sm text-gray-500">Commission for booking #{commission.bookingId}</div>
                        <div className="text-sm text-gray-500">Expected payment date: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">₹{commission.commissionAmount.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Pending</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Current Commission Rates</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { type: 'Hotel', rate: 20, bookings: 45, earnings: 28500 },
                    { type: 'Villa', rate: 25, bookings: 23, earnings: 34200 },
                    { type: 'Resort', rate: 22, bookings: 31, earnings: 41800 },
                    { type: 'Lodge', rate: 18, bookings: 12, earnings: 15600 }
                  ].map((item) => (
                    <div key={item.type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{item.type}</h4>
                        <span className="text-2xl font-bold text-blue-600">{item.rate}%</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Bookings:</span>
                          <span>{item.bookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Earnings:</span>
                          <span>₹{item.earnings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Rate History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Villa</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">22%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">25%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2025-01-01</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Resort</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">22%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-12-15</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {(activeTab === 'earnings' || activeTab === 'overview') && (
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
                <ChevronDown className="h-4 w-4 rotate-90" />
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
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCommissions.length === 0 && (
          <div className="text-center py-12">
            <img
              src="https://readdy.ai/api/search-image?query=empty%20state%20illustration%20no%20commission%20data%20found%20modern%20flat%20design%20clean%20background%20professional%20style%20financial%20dashboard%20system&width=200&height=150&seq=empty-commissions-001&orientation=landscape"
              alt="No commissions found"
              className="w-48 h-36 mx-auto mb-4 object-cover"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No commission data found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters to find more commission records.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default Commissions;
