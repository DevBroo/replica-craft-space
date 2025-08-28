import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Check,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  ArrowUpDown,
  X,
  Search,
  ChevronDown,
  Edit,
  Loader2,
  RefreshCw,
  TrendingUp,
  User
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import OwnerDetailsModal from '../../components/admin/OwnerDetailsModal';
import OwnerFilters from '../../components/admin/OwnerFilters';
import { adminService, PropertyOwner, OwnerFilters as FilterType } from '../../lib/adminService';

const OwnerManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOwnerDetails, setShowOwnerDetails] = useState<PropertyOwner | null>(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterType>({});

  // Fetch property owners on component mount
  useEffect(() => {
    console.log('🏠 OwnerManagement component mounted');
    fetchPropertyOwners();
    fetchAdminUsers();
  }, []);

  // Apply filters to owners list
  useEffect(() => {
    applyFilters();
  }, [owners, currentFilters]);

  const fetchPropertyOwners = async (filters?: FilterType) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching property owners...', filters);
      
      const ownersData = await adminService.getPropertyOwners(filters);
      setOwners(ownersData);
      console.log('✅ Property owners loaded:', ownersData.length);
    } catch (err) {
      console.error('❌ Error fetching property owners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch property owners');
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
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
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

    setFilteredOwners(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFiltersChange = async (filters: FilterType) => {
    setCurrentFilters(filters);
    // For better performance, we could debounce this call
    await fetchPropertyOwners(filters);
  };

  const handleStatusUpdate = async (ownerId: string, isActive: boolean) => {
    try {
      await adminService.updateOwnerStatus(ownerId, isActive);
      // Refresh the owners list
      await fetchPropertyOwners(currentFilters);
    } catch (err) {
      throw err; // Let the modal handle the error display
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
    <div className="min-h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Owner Management" 
          breadcrumb="Owner Management"
        />

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Owner
              </button>
              <button
                onClick={() => fetchPropertyOwners(currentFilters)}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer flex items-center disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </button>
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
                     'Error loading property owners'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => fetchPropertyOwners(currentFilters)}
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
                <span className="ml-3 text-gray-600">Loading property owners...</span>
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
                            <div className="flex space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-800 cursor-pointer p-1" 
                                title="View Details"
                                onClick={() => setShowOwnerDetails(owner)}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                className="text-purple-600 hover:text-purple-800 cursor-pointer p-1" 
                                title="View Insights"
                                onClick={() => setShowOwnerDetails(owner)}
                              >
                                <TrendingUp className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-800 cursor-pointer p-1" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                className={`cursor-pointer p-1 ${owner.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                title={owner.is_active ? 'Deactivate' : 'Activate'}
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to ${owner.is_active ? 'deactivate' : 'activate'} this owner?`)) {
                                    try {
                                      await handleStatusUpdate(owner.id, !owner.is_active);
                                      alert(`Owner ${owner.is_active ? 'deactivated' : 'activated'} successfully!`);
                                    } catch (err) {
                                      alert(`Failed to ${owner.is_active ? 'deactivate' : 'activate'} owner: ` + (err instanceof Error ? err.message : 'Unknown error'));
                                    }
                                  }
                                }}
                              >
                                {owner.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
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
                                ? 'No property owners match your current filters.' 
                                : 'No property owners available yet.'
                              }
                            </p>
                            <button
                              onClick={() => fetchPropertyOwners(currentFilters)}
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
      </div>

      {/* Enhanced Owner Details Modal */}
      {showOwnerDetails && (
        <OwnerDetailsModal
          owner={showOwnerDetails}
          isOpen={!!showOwnerDetails}
          onClose={() => setShowOwnerDetails(null)}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={() => fetchPropertyOwners(currentFilters)}
        />
      )}

      {/* Add New Owner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Owner</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form 
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.full_name || !formData.email) {
                  alert('Please fill in all required fields');
                  return;
                }
                
                setSubmitting(true);
                try {
                  await adminService.addPropertyOwner(formData);
                  alert('Property owner invited successfully! They will receive an email invitation.');
                  setShowAddModal(false);
                  setFormData({ full_name: '', email: '', phone: '' });
                  fetchPropertyOwners(currentFilters); // Refresh the list
                } catch (err) {
                  alert('Failed to add property owner: ' + (err instanceof Error ? err.message : 'Unknown error'));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter owner's full name"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter email address"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter phone number"
                  disabled={submitting}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ full_name: '', email: '', phone: '' });
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Owner'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerManagement;
