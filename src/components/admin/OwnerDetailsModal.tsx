import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Star,
  Bell,
  Shield,
  Activity,
  Eye,
  Edit2,
  Ban,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { PropertyOwner } from '../../lib/adminService';

interface OwnerDetailsModalProps {
  owner: PropertyOwner;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (ownerId: string, isActive: boolean) => Promise<void>;
  onRefresh: () => void;
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
  recent_properties: any[];
  recent_bookings: any[];
}

const OwnerDetailsModal: React.FC<OwnerDetailsModalProps> = ({
  owner,
  isOpen,
  onClose,
  onStatusUpdate,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [insights, setInsights] = useState<OwnerInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchInsights = async () => {
    if (!owner.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/owners/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        },
        body: JSON.stringify({
          action: 'insights',
          owner_id: owner.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error fetching owner insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && owner.id) {
      fetchInsights();
    }
  }, [isOpen, owner.id]);

  const handleStatusToggle = async () => {
    setUpdatingStatus(true);
    try {
      await onStatusUpdate(owner.id, !owner.is_active);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{owner.full_name || 'Unnamed Owner'}</h2>
              <p className="text-blue-100">{owner.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStatusToggle}
              disabled={updatingStatus}
              className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                owner.is_active 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50`}
            >
              {updatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : owner.is_active ? (
                <Ban className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{owner.is_active ? 'Deactivate' : 'Activate'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">{owner.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {owner.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {owner.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        owner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {owner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Account Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <p className="text-gray-900">{owner.role || 'property_owner'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Commission Rate</label>
                      <p className="text-gray-900">{((owner.commission_rate || 0.10) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Joined Date</label>
                      <p className="text-gray-900">
                        {new Date(owner.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-gray-900">
                        {new Date(owner.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              {insights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Total Properties</p>
                        <p className="text-2xl font-bold text-blue-900">{insights.properties.total}</p>
                      </div>
                      <Building className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Total Bookings</p>
                        <p className="text-2xl font-bold text-green-900">{insights.bookings.total}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-purple-900">₹{insights.revenue.total.toLocaleString()}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading insights...</span>
                </div>
              ) : insights ? (
                <>
                  {/* Revenue & Commission */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-lg p-6 text-white">
                      <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                      <p className="text-3xl font-bold">₹{insights.revenue.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-6 text-white">
                      <h3 className="text-lg font-semibold mb-2">Commission Earned</h3>
                      <p className="text-3xl font-bold">₹{insights.revenue.commission.toLocaleString()}</p>
                      <p className="text-sm opacity-80">at {(insights.revenue.commission_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg p-6 text-white">
                      <h3 className="text-lg font-semibold mb-2">Avg. Revenue/Property</h3>
                      <p className="text-3xl font-bold">
                        ₹{insights.properties.total > 0 ? Math.round(insights.revenue.total / insights.properties.total).toLocaleString() : '0'}
                      </p>
                    </div>
                  </div>

                  {/* Properties & Bookings Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Property Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Approved</span>
                          <span className="font-semibold text-green-600">{insights.properties.approved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending</span>
                          <span className="font-semibold text-yellow-600">{insights.properties.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rejected</span>
                          <span className="font-semibold text-red-600">{insights.properties.rejected}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Active</span>
                          <span className="font-semibold text-blue-600">{insights.bookings.active}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed</span>
                          <span className="font-semibold text-green-600">{insights.bookings.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cancelled</span>
                          <span className="font-semibold text-red-600">{insights.bookings.cancelled}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No insights data available
                </div>
              )}
            </div>
          )}

          {/* Other tabs can be implemented later */}
          {activeTab !== 'overview' && activeTab !== 'insights' && (
            <div className="text-center py-8 text-gray-500">
              {tabs.find(t => t.id === activeTab)?.label} content coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDetailsModal;
