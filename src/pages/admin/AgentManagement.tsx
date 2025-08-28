import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Search,
  ChevronDown,
  ArrowUpDown,
  Key,
  Bell,
  TrendingUp,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import AgentFormModal from '../../components/admin/AgentFormModal';
import AgentInsightsModal from '../../components/admin/AgentInsightsModal';
import SendNotificationModal from '../../components/admin/SendNotificationModal';
import { agentService, Agent, AgentFilters } from '../../lib/agentService';
import { toast } from 'sonner';

const AgentManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  // Stats
  const [stats, setStats] = useState({
    total_agents: 0,
    active_agents: 0,
    inactive_agents: 0,
    total_assignments: 0
  });

  useEffect(() => {
    fetchAgents();
    fetchStats();
  }, []);

  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchAgents();
    }, 300);

    return () => clearTimeout(delayedFetch);
  }, [searchTerm, statusFilter, startDate, endDate]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const filters: AgentFilters = {
        search: searchTerm,
        status: statusFilter,
        startDate,
        endDate
      };
      const agentsData = await agentService.getAgents(filters);
      setAgents(agentsData);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await agentService.getAgentStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddAgent = () => {
    setSelectedAgent(null);
    setModalMode('add');
    setShowFormModal(true);
  };

  const handleEditAgent = async (agent: Agent) => {
    try {
      const agentDetails = await agentService.getAgentDetailsExtended(agent.id);
      setSelectedAgent(agentDetails);
      setModalMode('edit');
      setShowFormModal(true);
    } catch (error: any) {
      console.error('Error fetching agent details:', error);
      toast.error('Failed to load agent details');
    }
  };

  const handleViewAgent = async (agent: Agent) => {
    try {
      const agentDetails = await agentService.getAgentDetailsExtended(agent.id);
      setSelectedAgent(agentDetails);
      setModalMode('view');
      setShowFormModal(true);
    } catch (error: any) {
      console.error('Error fetching agent details:', error);
      toast.error('Failed to load agent details');
    }
  };

  const handleAgentInsights = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowInsightsModal(true);
  };

  const handleSendNotification = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowNotificationModal(true);
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.is_active ? 'inactive' : 'active';
      await agentService.updateAgentStatus(agent.id, newStatus);
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchAgents();
    } catch (error: any) {
      console.error('Error updating agent status:', error);
      toast.error('Failed to update agent status');
    }
  };

  const handleResetPassword = async (agent: Agent) => {
    if (!window.confirm(`Are you sure you want to reset password for ${agent.full_name}?`)) {
      return;
    }

    try {
      await agentService.resetAgentPassword(agent.id);
      toast.success('Password reset successfully. New password will be sent to the agent.');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!window.confirm(`Are you sure you want to delete ${agent.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await agentService.deleteAgent(agent.id);
      toast.success('Agent deleted successfully');
      fetchAgents();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      toast.error(error.message || 'Failed to delete agent');
    }
  };

  const getStatusColor = (agent: Agent) => {
    if (!agent.is_active) return 'bg-red-100 text-red-800';
    if (agent.status === 'blocked') return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (agent: Agent) => {
    if (!agent.is_active) return 'Inactive';
    if (agent.status === 'blocked') return 'Blocked';
    return 'Active';
  };

  const filteredAgents = agents;
  const totalPages = Math.ceil(filteredAgents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Agent Management" 
          breadcrumb="Agent Management"
        />

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Agents</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_agents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active_agents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Inactive Agents</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.inactive_agents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_assignments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white border rounded-lg mb-6">
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleAddAgent}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Agent
                  </button>
                  
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Agent Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>Agent Info</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coverage Area
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>Joining Date</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading agents...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedAgents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No agents found
                      </td>
                    </tr>
                  ) : (
                    paginatedAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-sm font-medium">
                                {agent.full_name?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {agent.full_name || 'Unnamed Agent'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: AGT{agent.id.slice(-6).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{agent.email || 'No email'}</div>
                            <div className="text-gray-500">{agent.phone || 'No phone'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agent.coverage_area || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {agent.properties_count || 0} Properties
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.joining_date 
                            ? new Date(agent.joining_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : new Date(agent.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent)}`}>
                            {getStatusText(agent)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewAgent(agent)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-all"
                              title="View Agent"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditAgent(agent)}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-all"
                              title="Edit Agent"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAgentInsights(agent)}
                              className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-all"
                              title="View Insights"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleSendNotification(agent)}
                              className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded transition-all"
                              title="Send Notification"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(agent)}
                              className={`p-1 rounded transition-all ${
                                agent.is_active 
                                  ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                              title={agent.is_active ? 'Deactivate Agent' : 'Activate Agent'}
                            >
                              {agent.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleResetPassword(agent)}
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded transition-all"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAgent(agent)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-all"
                              title="Delete Agent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + rowsPerPage, filteredAgents.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredAgents.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFormModal && (
        <AgentFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          mode={modalMode}
          agent={selectedAgent}
          onSave={() => {
            fetchAgents();
            fetchStats();
          }}
        />
      )}

      {showInsightsModal && selectedAgent && (
        <AgentInsightsModal
          isOpen={showInsightsModal}
          onClose={() => setShowInsightsModal(false)}
          agent={selectedAgent}
        />
      )}

      {showNotificationModal && selectedAgent && (
        <SendNotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          recipientType="agent"
          recipientId={selectedAgent.id}
          recipientName={selectedAgent.full_name || selectedAgent.email || 'Agent'}
          onSent={() => {
            console.log('Notification sent successfully');
            setShowNotificationModal(false);
          }}
        />
      )}
    </div>
  );
};

export default AgentManagement;