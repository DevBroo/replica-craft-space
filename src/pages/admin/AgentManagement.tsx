
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
    if (agent.agent_profile?.status === 'blocked') return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (agent: Agent) => {
    if (!agent.is_active) return 'Inactive';
    if (agent.agent_profile?.status === 'blocked') return 'Blocked';
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
                          {agent.agent_profile?.coverage_area || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {agent.properties_count || 0} Properties
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.agent_profile?.joining_date 
                            ? new Date(agent.agent_profile.joining_date).toLocaleDateString('en-US', {
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
                              className="text-blue-600 hover:text-blue-800 cursor-pointer p-1" 
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditAgent(agent)}
                              className="text-green-600 hover:text-green-800 cursor-pointer p-1" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAgentInsights(agent)}
                              className="text-purple-600 hover:text-purple-800 cursor-pointer p-1" 
                              title="View Insights"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleSendNotification(agent)}
                              className="text-yellow-600 hover:text-yellow-800 cursor-pointer p-1" 
                              title="Send Notification"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleResetPassword(agent)}
                              className="text-orange-600 hover:text-orange-800 cursor-pointer p-1" 
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(agent)}
                              className={`cursor-pointer p-1 ${
                                agent.is_active && agent.agent_profile?.status !== 'blocked'
                                  ? 'text-red-600 hover:text-red-800' 
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                              title={
                                agent.is_active && agent.agent_profile?.status !== 'blocked'
                                  ? 'Deactivate' 
                                  : 'Activate'
                              }
                            >
                              {agent.is_active && agent.agent_profile?.status !== 'blocked' ? (
                                <Ban className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeleteAgent(agent)}
                              className="text-red-600 hover:text-red-800 cursor-pointer p-1" 
                              title="Delete"
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredAgents.length)} of {filteredAgents.length} entries
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
        </div>
      </div>

      {/* Modals */}
      {showFormModal && (
        <AgentFormModal
          agent={selectedAgent}
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedAgent(null);
          }}
          onSave={() => {
            fetchAgents();
            fetchStats();
          }}
          mode={modalMode}
        />
      )}

      {showInsightsModal && selectedAgent && (
        <AgentInsightsModal
          agent={selectedAgent}
          isOpen={showInsightsModal}
          onClose={() => {
            setShowInsightsModal(false);
            setSelectedAgent(null);
          }}
        />
      )}

      {showNotificationModal && selectedAgent && (
        <SendNotificationModal
          isOpen={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            setSelectedAgent(null);
          }}
          recipientType="agent"
          recipientId={selectedAgent.id}
          recipientName={selectedAgent.full_name || ''}
          onSent={() => {
            toast.success('Notification sent successfully!');
          }}
        />
      )}
    </div>
  );
};

export default AgentManagement;
