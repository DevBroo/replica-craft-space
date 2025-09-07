import React, { useState, useEffect } from 'react';
import { 
  Check,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  ArrowUpDown,
  X,
  Search,
  ChevronDown,
  Loader2,
  RefreshCw,
  TrendingUp,
  User,
  Bell,
  MoreVertical
} from 'lucide-react';
import IconButton from '../../components/admin/ui/IconButton';
import AdminLayout from '../../components/admin/AdminLayout';
import OwnerDetailsModal from '../../components/admin/OwnerDetailsModal';
import OwnerFilters from '../../components/admin/OwnerFilters';
import OwnerInsightsModal from '../../components/admin/OwnerInsightsModal';
import SendNotificationModal from '../../components/admin/SendNotificationModal';
import { adminService, Host, OwnerFilters as FilterType } from '../../lib/adminService';

const OwnerManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [owners, setOwners] = useState<Host[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showOwnerDetails, setShowOwnerDetails] = useState<Host | null>(null);
  const [showOwnerInsights, setShowOwnerInsights] = useState<Host | null>(null);
  const [showSendNotification, setShowSendNotification] = useState<Host | null>(null);
  
  // Filter states
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterType>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Fetch hosts on component mount
  useEffect(() => {
    console.log('🏠 OwnerManagement component mounted');
    fetchHosts();
    fetchAdminUsers();
  }, []);

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(currentFilters.search || '');
    }, 300);

    return () => clearTimeout(timer);
  }, [currentFilters.search]);

  // Apply filters to owners list
  useEffect(() => {
    applyFilters();
  }, [owners, debouncedSearchTerm, currentFilters.status, currentFilters.startDate, currentFilters.endDate, currentFilters.createdBy, currentFilters.propertiesCount, adminUsers]);

  const fetchHosts = async (filters?: FilterType) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching hosts...', filters);
      
      const ownersData = await adminService.getHosts(filters);
      setOwners(ownersData);
      console.log('✅ Hosts loaded:', ownersData.length);
    } catch (err) {
      console.error('❌ Error fetching hosts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch hosts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const users = await adminService.getAdminUsers();
      setAdminUsers(users);
    } catch (err) {
      console.error('❌ Error fetching admin users:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...owners];

    // Apply client-side filters for better UX (server-side filtering is also applied)
    if (debouncedSearchTerm) {
      const searchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(owner => 
        (owner.full_name || '').toLowerCase().includes(searchTerm) ||
        (owner.email || '').toLowerCase().includes(searchTerm) ||
        owner.id.toLowerCase().includes(searchTerm)
      );
    }

    if (currentFilters.status && currentFilters.status !== 'all') {
      const isActive = currentFilters.status === 'active';
      filtered = filtered.filter(owner => owner.is_active === isActive);
    }

    // Apply date range filters
    if (currentFilters.startDate) {
      const startDate = new Date(currentFilters.startDate);
      filtered = filtered.filter(owner => new Date(owner.created_at) >= startDate);
    }

    if (currentFilters.endDate) {
      const endDate = new Date(currentFilters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(owner => new Date(owner.created_at) <= endDate);
    }

    // Apply created by filter
    if (currentFilters.createdBy) {
      filtered = filtered.filter(owner => 
        owner.created_by === currentFilters.createdBy
      );
    }

    // Apply properties count filter
    if (currentFilters.propertiesCount) {
      switch (currentFilters.propertiesCount) {
        case '0':
          filtered = filtered.filter(owner => (owner.properties_count || 0) === 0);
          break;
        case '1-5':
          filtered = filtered.filter(owner => {
            const count = owner.properties_count || 0;
            return count >= 1 && count <= 5;
          });
          break;
        case '6-10':
          filtered = filtered.filter(owner => {
            const count = owner.properties_count || 0;
            return count >= 6 && count <= 10;
          });
          break;
        case '10+':
          filtered = filtered.filter(owner => (owner.properties_count || 0) > 10);
          break;
      }
    }

    setFilteredOwners(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFiltersChange = async (filters: FilterType) => {
    setCurrentFilters(filters);
    // For better performance, we could debounce this call
    await fetchHosts(filters);
  };

  const handleStatusUpdate = async (ownerId: string, isActive: boolean) => {
    try {
      await adminService.updateOwnerStatus(ownerId, isActive);
      // Refresh the owners list
      await fetchHosts(currentFilters);
    } catch (err) {
      throw err; // Let the modal handle the error display
    }
  };

  const handleDeleteOwner = async (owner: Host) => {
    if (!confirm(`Are you sure you want to delete owner "${owner.full_name || owner.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminService.deleteOwner(owner.id);
      alert('Owner deleted successfully!');
      await fetchHosts(currentFilters);
    } catch (err) {
      alert('Failed to delete owner: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(filteredOwners.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedOwners = filteredOwners.slice(startIndex, startIndex + rowsPerPage);

  console.log('🎨 OwnerManagement rendering, owners count:', owners.length, 'loading:', loading);
  
  return (
    <AdminLayout 
      title="Owner Management" 
      breadcrumb="Owner Management"
      searchPlaceholder="Search owners..."
    >
      {/* Action Bar */}
      <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">

              <IconButton
                icon={RefreshCw}
                variant="secondary"
                onClick={() => fetchHosts(currentFilters)}
                disabled={loading}
                loading={loading}
                tooltip="Refresh owner list"
                aria-label="Refresh owner list"
                className="px-4 py-2"
              >
                Refresh
              </IconButton>
            </div>
            
            {/* Summary Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Total: {filteredOwners.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Active: {filteredOwners.filter(o => o.is_active).length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Inactive: {filteredOwners.filter(o => !o.is_active).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6">
          {/* Enhanced Filters */}
          <OwnerFilters 
            onFiltersChange={handleFiltersChange}
            adminUsers={adminUsers}
          />

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error.includes('Authentication') || error.includes('401') ? 'Authentication Error' : 
                     error.includes('Access denied') || error.includes('403') ? 'Access Denied' : 
                     'Error loading hosts'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => fetchHosts(currentFilters)}
                      className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                    >
                      Try Again
                    </button>
                    {(error.includes('Authentication') || error.includes('Access denied')) && (
                      <button
                        onClick={() => window.location.href = '/admin/login'}
                        className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200"
                      >
                        Go to Admin Login
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading hosts...</span>
              </div>
            </div>
          )}

          {/* Owner Table */}
          {!loading && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                        <div className="flex items-center space-x-1">
                          <span>Owner</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Information
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Properties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                        <div className="flex items-center space-x-1">
                          <span>Joined Date</span>
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
                    {paginatedOwners.length > 0 ? (
                      paginatedOwners.map((owner) => (
                        <tr key={owner.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                                <span className="text-white text-sm font-medium">
                                  {(owner.full_name || owner.email || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {owner.full_name || 'Unnamed Owner'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {owner.id.substring(0, 8)}...
                                </div>
                                {owner.created_by_profile && (
                                  <div className="text-xs text-gray-400">
                                    Created by: {owner.created_by_profile.full_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">
                                {owner.email || 'No email'}
                              </div>
                              <div className="text-gray-500">{owner.phone || 'No phone'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {owner.properties_count || 0} Properties
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">
                              {((owner.commission_rate || 0.10) * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(owner.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(owner.is_active ? 'active' : 'inactive')}`}>
                              {owner.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <IconButton
                                icon={Eye}
                                variant="ghost"
                                size="sm"
                                tooltip="View Details"
                                aria-label="View owner details"
                                onClick={() => setShowOwnerDetails(owner)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              />
                              <IconButton
                                icon={TrendingUp}
                                variant="ghost"
                                size="sm"
                                tooltip="View Insights"
                                aria-label="View owner insights"
                                onClick={() => setShowOwnerInsights(owner)}
                                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                              />

                              <IconButton
                                icon={Bell}
                                variant="ghost"
                                size="sm"
                                tooltip="Send Notification"
                                aria-label="Send notification to owner"
                                onClick={() => setShowSendNotification(owner)}
                                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                              />
                              
                              {/* Dropdown Menu for More Actions */}
                              <div className="relative">
                                <IconButton
                                  icon={MoreVertical}
                                  variant="ghost"
                                  size="sm"
                                  tooltip="More Actions"
                                  aria-label="More actions"
                                  onClick={() => setActiveDropdown(activeDropdown === owner.id ? null : owner.id)}
                                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                />
                                
                                {activeDropdown === owner.id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                    <div className="py-1">
                                      <button
                                        onClick={async () => {
                                          setActiveDropdown(null);
                                          if (confirm(`Are you sure you want to ${owner.is_active ? 'deactivate' : 'activate'} this owner?`)) {
                                            try {
                                              await handleStatusUpdate(owner.id, !owner.is_active);
                                              alert(`Owner ${owner.is_active ? 'deactivated' : 'activated'} successfully!`);
                                            } catch (err) {
                                              alert(`Failed to ${owner.is_active ? 'deactivate' : 'activate'} owner: ` + (err instanceof Error ? err.message : 'Unknown error'));
                                            }
                                          }
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        {owner.is_active ? (
                                          <>
                                            <Ban className="w-4 h-4 mr-2 text-red-500" />
                                            Deactivate Owner
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                            Activate Owner
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveDropdown(null);
                                          handleDeleteOwner(owner);
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Owner
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No owners found</h3>
                            <p className="text-gray-500 mb-4">
                              {Object.keys(currentFilters).length > 0 
                                ? 'No hosts match your current filters.' 
                                : 'No hosts available yet.'
                              }
                            </p>
                            <button
                              onClick={() => fetchHosts(currentFilters)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Refresh
                            </button>
                          </div>
                        </td>
                      </tr>
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
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredOwners.length)} of {filteredOwners.length} entries
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
          )}
        </main>

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* Modals */}

      {showOwnerInsights && (
        <OwnerInsightsModal
          isOpen={!!showOwnerInsights}
          onClose={() => setShowOwnerInsights(null)}
          owner={showOwnerInsights}
        />
      )}

      {showSendNotification && (
        <SendNotificationModal
          isOpen={!!showSendNotification}
          onClose={() => setShowSendNotification(null)}
          recipientType="owner"
          recipientId={showSendNotification.id}
          recipientName={showSendNotification.full_name || showSendNotification.email || 'Owner'}
          onSent={() => {
            // Optionally refresh data or show success message
            console.log('Notification sent successfully');
          }}
        />
      )}

      {/* Keep the existing OwnerDetailsModal for backward compatibility */}
      {showOwnerDetails && (
        <OwnerDetailsModal
          owner={showOwnerDetails}
          isOpen={!!showOwnerDetails}
          onClose={() => setShowOwnerDetails(null)}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={() => fetchHosts(currentFilters)}
        />
      )}
    </AdminLayout>
  );
};

export default OwnerManagement;
