
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer 
} from 'recharts';
import { supportTicketService, TicketAnalytics } from '@/lib/supportTicketService';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Download, Users, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const SupportTicketReports: React.FC = () => {
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadAnalytics = async (showRefreshToast = false) => {
    try {
      setLoading(!showRefreshToast);
      setRefreshing(showRefreshToast);
      let start, end;
      
      if (dateRange === 'custom' && startDate && endDate) {
        start = startDate;
        end = endDate;
      } else if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        start = startDate.toISOString().split('T')[0];
        end = endDate.toISOString().split('T')[0];
      }

      const data = await supportTicketService.getTicketAnalytics(start, end);
      setAnalytics(data);
      
      if (showRefreshToast) {
        toast.success('Analytics refreshed');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('support-tickets-analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets'
      }, () => {
        loadAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, startDate, endDate]);

  const exportReport = () => {
    if (!analytics) return;
    
    const reportData = {
      summary: {
        total_tickets: analytics.total_tickets,
        open_tickets: analytics.open_tickets,
        resolved_tickets: analytics.resolved_tickets,
        avg_resolution_hours: analytics.avg_resolution_hours
      },
      by_category: analytics.by_category,
      by_status: analytics.by_status,
      by_agent: analytics.by_agent,
      trend: analytics.tickets_trend
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-tickets-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const categoryData = analytics?.by_category ? 
    Object.entries(analytics.by_category).map(([name, value]) => ({ name, value })) : [];

  const statusData = analytics?.by_status ? 
    Object.entries(analytics.by_status).map(([name, value]) => ({ name, value })) : [];

  const agentData = analytics?.by_agent || [];

  const trendData = analytics?.tickets_trend?.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Support Ticket Reports</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
              <option value="all">All time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Tickets</p>
              <p className="text-3xl font-bold">{analytics?.total_tickets || 0}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Open Tickets</p>
              <p className="text-3xl font-bold">{analytics?.open_tickets || 0}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Resolved Tickets</p>
              <p className="text-3xl font-bold">{analytics?.resolved_tickets || 0}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Resolution</p>
              <p className="text-3xl font-bold">{Math.round(analytics?.avg_resolution_hours || 0)}h</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tickets by Category */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <AlertCircle className="w-12 h-12 mb-2 text-gray-400" />
              <p className="text-lg font-medium">No category data available</p>
              <p className="text-sm">Create some tickets to see category distribution</p>
            </div>
          )}
        </div>

        {/* Tickets by Status */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <Clock className="w-12 h-12 mb-2 text-gray-400" />
              <p className="text-lg font-medium">No status data available</p>
              <p className="text-sm">Create some tickets to see status distribution</p>
            </div>
          )}
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h3>
          {agentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agent_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" fill="#8884d8" name="Tickets Handled" />
                <Bar dataKey="avg_resolution_hours" fill="#82ca9d" name="Avg Resolution (hours)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <Users className="w-12 h-12 mb-2 text-gray-400" />
              <p className="text-lg font-medium">No agent data available</p>
              <p className="text-sm">Assign tickets to agents to see performance metrics</p>
            </div>
          )}
        </div>

        {/* Ticket Trend */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Volume Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tickets" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <TrendingUp className="w-12 h-12 mb-2 text-gray-400" />
              <p className="text-lg font-medium">No trend data available</p>
              <p className="text-sm">Create tickets over time to see volume trends</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Performance Table */}
      {agentData.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Agent Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets Handled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Resolution Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentData.map((agent, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {agent.agent_name || 'Unknown Agent'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agent.tickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(agent.avg_resolution_hours)} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        agent.avg_resolution_hours < 24 
                          ? 'bg-green-100 text-green-800'
                          : agent.avg_resolution_hours < 48
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.avg_resolution_hours < 24 ? 'Excellent' : 
                         agent.avg_resolution_hours < 48 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketReports;
