
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Calendar, Activity, Users } from 'lucide-react';
import { agentService } from '../../lib/agentService';
import { toast } from 'sonner';

interface AgentInsightsModalProps {
  agent: any;
  isOpen: boolean;
  onClose: () => void;
}

const AgentInsightsModal: React.FC<AgentInsightsModalProps> = ({
  agent,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && agent) {
      fetchInsights();
    }
  }, [isOpen, agent]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await agentService.getAgentInsights(agent.id);
      setInsights(data);
    } catch (error: any) {
      console.error('Error fetching agent insights:', error);
      toast.error('Failed to load agent insights');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Agent Insights</h2>
            <p className="text-sm text-gray-600 mt-1">{agent.full_name} ({agent.email})</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === 'revenue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Revenue & Commission
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity Log
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : insights ? (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {insights.statistics?.total_bookings || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatCurrency(insights.statistics?.total_revenue || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatCurrency(insights.statistics?.commission_earned || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {insights.statistics?.active_assignments || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Profile Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Agent Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Coverage Area:</span>
                        <span className="ml-2 text-gray-900">{agent.agent_profile?.coverage_area || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          agent.agent_profile?.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {agent.agent_profile?.status || 'Active'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Joining Date:</span>
                        <span className="ml-2 text-gray-900">
                          {agent.agent_profile?.joining_date 
                            ? new Date(agent.agent_profile.joining_date).toLocaleDateString('en-IN') 
                            : 'Not specified'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Commission Rate:</span>
                        <span className="ml-2 text-gray-900">
                          {agent.agent_profile?.commission_config?.rate || agent.commission_rate || 5}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue & Commission Tab */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  {/* Commission Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Total Earned</h4>
                      <p className="text-2xl font-semibold text-blue-600">
                        {formatCurrency(insights.statistics?.commission_earned || 0)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Paid Out</h4>
                      <p className="text-2xl font-semibold text-green-600">
                        {formatCurrency(insights.statistics?.commission_paid || 0)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Pending</h4>
                      <p className="text-2xl font-semibold text-orange-600">
                        {formatCurrency(insights.statistics?.commission_pending || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Payout History */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Payout History</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Period
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Gross Revenue
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Commission
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payout
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {insights.payouts && insights.payouts.length > 0 ? (
                              insights.payouts.map((payout: any) => (
                                <tr key={payout.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {payout.period_start && payout.period_end 
                                      ? `${new Date(payout.period_start).toLocaleDateString()} - ${new Date(payout.period_end).toLocaleDateString()}`
                                      : 'N/A'
                                    }
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(payout.gross_revenue || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(payout.commission_amount || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(payout.payout_amount || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      payout.status === 'paid' 
                                        ? 'bg-green-100 text-green-800'
                                        : payout.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {payout.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                  No payout history available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Log Tab */}
              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {insights.recent_activity && insights.recent_activity.length > 0 ? (
                      insights.recent_activity.map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-800">
                                {activity.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatDate(activity.created_at)}
                              </span>
                            </div>
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                {JSON.stringify(activity.metadata, null, 2).replace(/[{}",]/g, ' ').trim()}
                              </p>
                            )}
                            {activity.actor_type && (
                              <p className="text-xs text-gray-500 mt-1">
                                By: {activity.actor_type}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No recent activity found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Failed to load agent insights</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentInsightsModal;
