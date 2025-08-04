import React, { useState } from 'react';
import { 
  Search,
  ChevronDown,
  Download,
  ListChecks,
  Check,
  UserPlus,
  Flag,
  Trash2,
  Eye,
  X,
  Ticket,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';

const SupportTickets: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAssignAgent, setShowAssignAgent] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<string>('');

  const ticketsData = [
    {
      id: 'ST001',
      customerId: 'CU2025001',
      customerName: 'Sarah Johnson',
      subject: 'Unable to complete booking payment',
      message: 'I am experiencing issues with the payment gateway when trying to book Villa Sunset for August 15-20. The payment fails at the final step.',
      priority: 'high',
      status: 'open',
      assignedAgent: 'Michael Chen',
      agentId: 'AG001',
      createdAt: '2025-07-28T09:30:00Z',
      updatedAt: '2025-07-28T09:30:00Z',
      category: 'Payment Issues',
      tags: ['payment', 'booking', 'urgent']
    },
    {
      id: 'ST002',
      customerId: 'CU2025002',
      customerName: 'Robert Williams',
      subject: 'Property listing not appearing in search',
      message: 'My beachfront property in Miami has been approved but is not showing up in search results. I have verified all details are correct.',
      priority: 'medium',
      status: 'in-progress',
      assignedAgent: 'Emma Davis',
      agentId: 'AG002',
      createdAt: '2025-07-28T08:15:00Z',
      updatedAt: '2025-07-28T10:45:00Z',
      category: 'Property Issues',
      tags: ['property', 'search', 'visibility']
    },
    {
      id: 'ST003',
      customerId: 'CU2025003',
      customerName: 'Lisa Anderson',
      subject: 'Refund request for cancelled booking',
      message: 'Due to a family emergency, I need to cancel booking #BK2025-0891 and request a full refund. The booking was made yesterday.',
      priority: 'medium',
      status: 'resolved',
      assignedAgent: 'James Wilson',
      agentId: 'AG003',
      createdAt: '2025-07-27T16:20:00Z',
      updatedAt: '2025-07-28T11:30:00Z',
      category: 'Refund Request',
      tags: ['refund', 'cancellation', 'booking']
    },
    {
      id: 'ST004',
      customerId: 'CU2025004',
      customerName: 'David Martinez',
      subject: 'Account verification issues',
      message: 'I have uploaded all required documents for account verification but my status still shows as pending after 5 business days.',
      priority: 'low',
      status: 'open',
      assignedAgent: 'Unassigned',
      agentId: '',
      createdAt: '2025-07-27T14:10:00Z',
      updatedAt: '2025-07-27T14:10:00Z',
      category: 'Account Issues',
      tags: ['verification', 'documents', 'account']
    },
    {
      id: 'ST005',
      customerId: 'CU2025005',
      customerName: 'Jennifer Brown',
      subject: 'Commission calculation discrepancy',
      message: 'There appears to be an error in my commission calculation for last month. The amount shown is lower than expected based on my bookings.',
      priority: 'high',
      status: 'in-progress',
      assignedAgent: 'Michael Chen',
      agentId: 'AG001',
      createdAt: '2025-07-27T11:45:00Z',
      updatedAt: '2025-07-28T09:15:00Z',
      category: 'Commission Issues',
      tags: ['commission', 'calculation', 'payment']
    },
    {
      id: 'ST006',
      customerId: 'CU2025006',
      customerName: 'Thomas Wilson',
      subject: 'Mobile app login problems',
      message: 'I cannot log into the mobile app using my credentials. The web version works fine, but the app shows an authentication error.',
      priority: 'medium',
      status: 'open',
      assignedAgent: 'Emma Davis',
      agentId: 'AG002',
      createdAt: '2025-07-27T09:30:00Z',
      updatedAt: '2025-07-27T09:30:00Z',
      category: 'Technical Issues',
      tags: ['mobile', 'login', 'authentication']
    },
    {
      id: 'ST007',
      customerId: 'CU2025007',
      customerName: 'Maria Garcia',
      subject: 'Guest review dispute',
      message: 'A guest left an unfair 1-star review containing false information about my property. I would like to request a review of this rating.',
      priority: 'low',
      status: 'closed',
      assignedAgent: 'James Wilson',
      agentId: 'AG003',
      createdAt: '2025-07-26T15:20:00Z',
      updatedAt: '2025-07-27T16:45:00Z',
      category: 'Review Issues',
      tags: ['review', 'dispute', 'rating']
    },
    {
      id: 'ST008',
      customerId: 'CU2025008',
      customerName: 'Kevin Taylor',
      subject: 'Booking modification request',
      message: 'I need to extend my current booking by 2 additional days. The property appears available but I cannot modify the booking online.',
      priority: 'medium',
      status: 'resolved',
      assignedAgent: 'Emma Davis',
      agentId: 'AG002',
      createdAt: '2025-07-26T12:15:00Z',
      updatedAt: '2025-07-27T10:30:00Z',
      category: 'Booking Issues',
      tags: ['booking', 'modification', 'extension']
    }
  ];

  const agents = [
    { id: 'AG001', name: 'Michael Chen', email: 'michael.chen@picnify.com', activeTickets: 5 },
    { id: 'AG002', name: 'Emma Davis', email: 'emma.davis@picnify.com', activeTickets: 3 },
    { id: 'AG003', name: 'James Wilson', email: 'james.wilson@picnify.com', activeTickets: 2 },
    { id: 'AG004', name: 'Sophie Miller', email: 'sophie.miller@picnify.com', activeTickets: 1 },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTickets = ticketsData.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const ticketDate = new Date(ticket.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + rowsPerPage);

  const totalTickets = ticketsData.length;
  const openTickets = ticketsData.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  const resolvedTickets = ticketsData.filter(t => t.status === 'resolved').length;
  const avgResolutionTime = '2.3 days';

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(paginatedTickets.map(ticket => ticket.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId]);
    } else {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for tickets:`, selectedTickets);
    setSelectedTickets([]);
    setShowBulkActions(false);
  };

  const handleAssignAgent = (ticketId: string, agentId: string) => {
    console.log(`Assign ticket ${ticketId} to agent ${agentId}`);
    setShowAssignAgent(false);
    setSelectedTicketForAssign('');
  };

  const handleUpdateStatus = (ticketId: string, newStatus: string) => {
    console.log(`Update ticket ${ticketId} status to ${newStatus}`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Support Tickets Management" 
          breadcrumb="Support Tickets"
        />

        {/* Statistics Dashboard */}
        <div className="bg-white border-b px-6 py-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Tickets</p>
                  <p className="text-3xl font-bold">{totalTickets}</p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                  <Ticket className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Open Tickets</p>
                  <p className="text-3xl font-bold">{openTickets}</p>
                </div>
                <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Resolved Tickets</p>
                  <p className="text-3xl font-bold">{resolvedTickets}</p>
                </div>
                <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Resolution Time</p>
                  <p className="text-3xl font-bold">{avgResolutionTime}</p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Ticket
              </button>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {selectedTickets.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer flex items-center"
                  >
                    <ListChecks className="w-4 h-4 mr-2" />
                    Bulk Actions ({selectedTickets.length})
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={() => handleBulkAction('assign')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-blue-600 flex items-center"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Agent
                      </button>
                      <button
                        onClick={() => handleBulkAction('status')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-green-600 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Status
                      </button>
                      <button
                        onClick={() => handleBulkAction('priority')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-yellow-600 flex items-center"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Change Priority
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-600 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Tickets List */}
            <div className="divide-y divide-gray-200">
              {/* Header */}
              <div className="px-6 py-4 bg-gray-50 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTickets.length === paginatedTickets.length && paginatedTickets.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mr-4"
                />
                <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">Ticket ID</div>
                  <div className="col-span-2">Customer</div>
                  <div className="col-span-3">Subject</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Assigned Agent</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Tickets */}
              {paginatedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => console.log('View ticket details:', ticket.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(ticket.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectTicket(ticket.id, e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mr-4"
                    />
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <span className="text-sm font-medium text-blue-600">{ticket.id}</span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {ticket.customerName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{ticket.customerName}</p>
                            <p className="text-xs text-gray-500">{ticket.customerId}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                        <p className="text-xs text-gray-500 truncate">{ticket.message}</p>
                      </div>
                      <div className="col-span-1">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {ticket.assignedAgent !== 'Unassigned' ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {ticket.assignedAgent.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">{ticket.assignedAgent}</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicketForAssign(ticket.id);
                              setShowAssignAgent(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Assign Agent
                          </button>
                        )}
                      </div>
                      <div className="col-span-1">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(ticket.createdAt)}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View ticket details:', ticket.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicketForAssign(ticket.id);
                              setShowAssignAgent(true);
                            }}
                            className="text-green-600 hover:text-green-800 cursor-pointer p-1"
                            title="Assign Agent"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(ticket.id, 'resolved');
                            }}
                            className="text-purple-600 hover:text-purple-800 cursor-pointer p-1"
                            title="Update Status"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredTickets.length)} of {filteredTickets.length} entries
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm cursor-pointer ${
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
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Assign Agent Modal */}
      {showAssignAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Assign Agent</h3>
              <button
                onClick={() => {
                  setShowAssignAgent(false);
                  setSelectedTicketForAssign('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Agent for Ticket {selectedTicketForAssign}
                </label>
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => handleAssignAgent(selectedTicketForAssign, agent.id)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.email}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.activeTickets} active tickets
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => {
                  setShowAssignAgent(false);
                  setSelectedTicketForAssign('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;