
import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Activity,
  Users,
  Home,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PropertyOwner, adminService } from '@/lib/adminService';

interface OwnerInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: PropertyOwner;
}

interface OwnerInsights {
  properties: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  bookings: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    commission: number;
    commission_rate: number;
  };
  recent_properties: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
  recent_bookings: Array<{
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    property_id: string;
  }>;
}

interface ActivityLog {
  id: string;
  action: string;
  actor_type: string;
  metadata: any;
  created_at: string;
}

const OwnerInsightsModal: React.FC<OwnerInsightsModalProps> = ({
  isOpen,
  onClose,
  owner
}) => {
  const [insights, setInsights] = useState<OwnerInsights | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && owner) {
      loadInsightsData();
    }
  }, [isOpen, owner]);

  const loadInsightsData = async () => {
    setLoading(true);
    try {
      // Load insights using admin service
      const insightsData = await adminService.getOwnerInsights(owner.id);
      setInsights(insightsData);

      // Load activity logs
      const { data: logs, error: logsError } = await supabase
        .from('owner_activity_logs')
        .select('*')
        .eq('owner_id', owner.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;
      setActivityLogs(logs || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'confirmed':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'property_submitted':
        return <Home className="w-4 h-4" />;
      case 'booking_created':
        return <Calendar className="w-4 h-4" />;
      case 'status_changed':
        return <Activity className="w-4 h-4" />;
      case 'profile_updated':
        return <Users className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionDescription = (log: ActivityLog) => {
    const metadata = log.metadata || {};
    
    switch (log.action) {
      case 'property_submitted':
        return `Submitted property "${metadata.title || 'Unknown'}"`;
      case 'booking_created':
        return `New booking received for ${formatCurrency(metadata.total_amount || 0)}`;
      case 'status_changed':
        return `Status changed from ${metadata.previous_status} to ${metadata.new_status}`;
      case 'profile_updated':
        return `Profile updated - ${metadata.updated_fields?.join(', ') || 'various fields'}`;
      default:
        return log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Owner Insights</h3>
            <p className="text-sm text-gray-500 mt-1">
              {owner.full_name || owner.email} • ID: {owner.id.substring(0, 8)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading insights...</span>
            </div>
          ) : insights ? (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Properties</p>
                          <p className="text-2xl font-bold text-blue-800">{insights.properties.total}</p>
                        </div>
                        <Home className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-800">
                            {formatCurrency(insights.revenue.total)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Total Bookings</p>
                          <p className="text-2xl font-bold text-purple-800">{insights.bookings.total}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Commission Rate</p>
                          <p className="text-2xl font-bold text-orange-800">
                            {(insights.revenue.commission_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <Star className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Property Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-600">Approved</span>
                          </div>
                          <span className="font-medium">{insights.properties.approved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                            <span className="text-sm text-gray-600">Pending</span>
                          </div>
                          <span className="font-medium">{insights.properties.pending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-sm text-gray-600">Rejected</span>
                          </div>
                          <span className="font-medium">{insights.properties.rejected}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Booking Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-600">Active</span>
                          </div>
                          <span className="font-medium">{insights.bookings.active}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-600">Completed</span>
                          </div>
                          <span className="font-medium">{insights.bookings.completed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-sm text-gray-600">Cancelled</span>
                          </div>
                          <span className="font-medium">{insights.bookings.cancelled}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Properties Tab */}
              {activeTab === 'properties' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-800">Recent Properties</h4>
                  <div className="space-y-3">
                    {insights.recent_properties.map(property => (
                      <div key={property.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-800">{property.title}</h5>
                            <p className="text-sm text-gray-500">
                              Submitted on {formatDate(property.created_at)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revenue Tab */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Total Revenue</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(insights.revenue.total)}
                      </p>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Commission Earned</h4>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(insights.revenue.commission)}
                      </p>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Owner Share</h4>
                      <p className="text-3xl font-bold text-orange-600">
                        {formatCurrency(insights.revenue.total - insights.revenue.commission)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Recent Bookings</h4>
                    <div className="space-y-3">
                      {insights.recent_bookings.map(booking => (
                        <div key={booking.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-800">
                              Booking #{booking.id.substring(0, 8)}...
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(booking.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(booking.total_amount)}
                            </p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-800">Recent Activity</h4>
                  <div className="space-y-3">
                    {activityLogs.map(log => (
                      <div key={log.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {getActionDescription(log)}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDate(log.created_at)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 capitalize">
                                {log.actor_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No insights available</h3>
              <p className="text-gray-500">Unable to load insights for this owner.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerInsightsModal;
