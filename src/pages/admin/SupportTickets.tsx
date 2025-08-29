
import React, { useState, useEffect } from 'react';
import { 
  Search,
  ChevronDown,
  Download,
  ListChecks,
  UserPlus,
  Flag,
  Trash2,
  Eye,
  X,
  Ticket,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Plus,
  BarChart3,
  GitMerge,
  RefreshCcw
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import TicketDetailsDrawer from '../../components/admin/support/TicketDetailsDrawer';
import SupportTicketReports from '../../components/admin/support/SupportTicketReports';
import CreateTicketModal from '../../components/admin/support/CreateTicketModal';
import { supportTicketService, SupportTicket } from '@/lib/supportTicketService';
import { toast } from 'sonner';

const SupportTickets: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0
  });

  useEffect(() => {
    loadTickets();
    loadAnalytics();
  }, [statusFilter, priorityFilter, categoryFilter, searchTerm, currentPage, rowsPerPage]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportTicketService.getTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchTerm || undefined,
        limit: rowsPerPage,
        offset: (currentPage - 1) * rowsPerPage
      });
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await supportTicketService.getTicketAnalytics();
      setAnalytics({
        totalTickets: data.total_tickets,
        openTickets: data.open_tickets,
        resolvedTickets: data.resolved_tickets,
        avgResolutionTime: Math.round(data.avg_resolution_hours / 24 * 10) / 10 // Convert to days
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(tickets.map(ticket => ticket.id));
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

  const handleBulkAction = async (action: string) => {
    try {
      switch (action) {
        case 'resolve':
          await supportTicketService.bulkUpdateStatus(selectedTickets, 'resolved', 'Bulk resolved by admin');
          toast.success(`${selectedTickets.length} tickets resolved`);
          break;
        case 'close':
          await supportTicketService.bulkUpdateStatus(selectedTickets, 'closed', 'Bulk closed by admin');
          toast.success(`${selectedTickets.length} tickets closed`);
          break;
        case 'reopen':
          await supportTicketService.bulkUpdateStatus(selectedTickets, 'open', 'Bulk reopened by admin');
          toast.success(`${selectedTickets.length} tickets reopened`);
          break;
        default:
          console.log(`Bulk ${action} for tickets:`, selectedTickets);
      }
      setSelectedTickets([]);
      setShowBulkActions(false);
      await loadTickets();
      await loadAnalytics();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowTicketDetails(true);
  };

  const exportTickets = () => {
    const csvContent = [
      ['ID', 'Subject', 'Priority', 'Status', 'Category', 'Created', 'Assigned Agent'].join(','),
      ...tickets.map(ticket => [
        ticket.id,
        `"${ticket.subject}"`,
        ticket.priority,
        ticket.status,
        ticket.category,
        new Date(ticket.created_at).toLocaleDateString(),
        (ticket as any)?.assigned_agent_profile?.full_name || 'Unassigned'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-tickets-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const isOverdue = (ticket: SupportTicket) => {
    if (!ticket.sla_due_at || ticket.status === 'resolved' || ticket.status === 'closed') return false;
    return new Date(ticket.sla_due_at) < new Date();
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

        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="px-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Ticket className="inline w-4 h-4 mr-2" />
                Tickets
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="inline w-4 h-4 mr-2" />
                Reports & Analytics
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'tickets' && (
          <>
            {/* Statistics Dashboard */}
            <div className="bg-white border-b px-6 py-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Tickets</p>
                      <p className="text-3xl font-bold">{analytics.totalTickets}</p>
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
                      <p className="text-3xl font-bold">{analytics.openTickets}</p>
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
                      <p className="text-3xl font-bold">{analytics.resolvedTickets}</p>
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
                      <p className="text-3xl font-bold">{analytics.avgResolutionTime}d</p>
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
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
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
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="Payment">Payment Issues</option>
                      <option value="Booking">Booking Issues</option>
                      <option value="Property">Property Issues</option>
                      <option value="Technical">Technical Issues</option>
                      <option value="Other">Other</option>
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
                            onClick={() => handleBulkAction('resolve')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-green-600 flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </button>
                          <button
                            onClick={() => handleBulkAction('close')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-600 flex items-center"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Close Tickets
                          </button>
                          <button
                            onClick={() => handleBulkAction('reopen')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-blue-600 flex items-center"
                          >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Reopen Tickets
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
                  <button 
                    onClick={exportTickets}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <main className="p-6">
              <div className="bg-white rounded-lg shadow-sm border">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading tickets...</div>
                  </div>
                ) : (
                  <>
                    {/* Tickets List */}
                    <div className="divide-y divide-gray-200">
                      {/* Header */}
                      <div className="px-6 py-4 bg-gray-50 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTickets.length === tickets.length && tickets.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mr-4"
                        />
                        <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-1">Ticket ID</div>
                          <div className="col-span-2">Customer</div>
                          <div className="col-span-3">Subject</div>
                          <div className="col-span-1">Category</div>
                          <div className="col-span-1">Priority</div>
                          <div className="col-span-1">Status</div>
                          <div className="col-span-2">Assigned Agent</div>
                          <div className="col-span-1">Actions</div>
                        </div>
                      </div>

                      {/* Tickets */}
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            isOverdue(ticket) ? 'bg-red-50 border-l-4 border-red-500' : ''
                          }`}
                          onClick={() => handleViewTicket(ticket.id)}
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
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    #{ticket.id.slice(0, 8)}
                                  </span>
                                  {ticket.escalated && (
                                    <AlertCircle className="w-4 h-4 text-red-500 ml-1" />
                                  )}
                                  {isOverdue(ticket) && (
                                    <Clock className="w-4 h-4 text-red-500 ml-1" />
                                  )}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      {((ticket as any)?.created_by_profile?.full_name || 'U').charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {(ticket as any)?.created_by_profile?.full_name || 'Unknown User'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {ticket.customer_email || (ticket as any)?.created_by_profile?.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-span-3">
                                <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {ticket.description}
                                </p>
                              </div>
                              <div className="col-span-1">
                                <span className="text-xs text-gray-600">{ticket.category}</span>
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
                                {ticket.assigned_agent ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-medium">
                                        {((ticket as any)?.assigned_agent_profile?.full_name || 'A').charAt(0)}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-900">
                                      {(ticket as any)?.assigned_agent_profile?.full_name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Unassigned</span>
                                )}
                              </div>
                              <div className="col-span-1">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewTicket(ticket.id);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
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
                          Showing {Math.min((currentPage - 1) * rowsPerPage + 1, tickets.length)} to {Math.min(currentPage * rowsPerPage, tickets.length)} of {tickets.length} entries
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={tickets.length < rowsPerPage}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </main>
          </>
        )}

        {activeTab === 'reports' && <SupportTicketReports />}
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTicketCreated={() => {
          loadTickets();
          loadAnalytics();
        }}
      />

      <TicketDetailsDrawer
        ticketId={selectedTicketId}
        isOpen={showTicketDetails}
        onClose={() => setShowTicketDetails(false)}
        onTicketUpdate={() => {
          loadTickets();
          loadAnalytics();
        }}
      />
    </div>
  );
};

export default SupportTickets;
