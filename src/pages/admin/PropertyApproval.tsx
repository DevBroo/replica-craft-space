
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  History,
  RefreshCw,
  Ban,
  Bell,
  Trash2,
  ArrowUpDown,
  Plus,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IconButton from '@/components/admin/ui/IconButton';
import SharedSidebar from '@/components/admin/SharedSidebar';
import SharedHeader from '@/components/admin/SharedHeader';
import ApproveRejectModal from '@/components/admin/ApproveRejectModal';
import EnhancedPropertyDetailsDrawer from '@/components/admin/EnhancedPropertyDetailsDrawer';
import SendNotificationModal from '@/components/admin/SendNotificationModal';
import { usePropertyApprovalStats } from '@/hooks/usePropertyApprovalStats';

interface PropertyWithOwner {
  id: string;
  title: string;
  description: string;
  address: string;
  property_type: string;
  status: string;
  created_at: string;
  owner_id: string;
  admin_blocked?: boolean;
  menu_available?: boolean;
  host_details?: any;
  video_url?: string;
  banquet_hall_capacity?: number;
  ground_lawn_capacity?: number;
  owner?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const PropertyApproval: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject';
    propertyIds: string[];
    propertyTitles: string[];
  }>({
    isOpen: false,
    action: 'approve',
    propertyIds: [],
    propertyTitles: [],
  });
  const [detailsDrawer, setDetailsDrawer] = useState<{
    isOpen: boolean;
    propertyId: string | null;
  }>({
    isOpen: false,
    propertyId: null,
  });
  const [showSendNotification, setShowSendNotification] = useState<PropertyWithOwner | null>(null);

  const { stats } = usePropertyApprovalStats();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching properties with resilient approach...');
      
      // First, fetch properties with only safe/core fields
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          address,
          property_type,
          status,
          created_at,
          owner_id
        `)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('❌ Error fetching properties:', propertiesError);
        toast.error('Failed to fetch properties');
        setProperties([]);
        return;
      }

      if (!propertiesData) {
        console.log('ℹ️ No properties found');
        setProperties([]);
        return;
      }

      console.log(`✅ Successfully fetched ${propertiesData.length} properties`);

      // Now try to enhance with additional fields - if this fails, we'll continue with defaults
      let enhancedProperties = propertiesData;
      try {
        const { data: enhancedData, error: enhancedError } = await supabase
          .from('properties')
          .select(`
            id,
            menu_available,
            admin_blocked,
            host_details,
            video_url,
            banquet_hall_capacity,
            ground_lawn_capacity
          `)
          .in('id', propertiesData.map(p => p.id));

        if (!enhancedError && enhancedData) {
          // Merge enhanced data with base properties
          const enhancedMap = new Map(enhancedData.map(item => [item.id, item]));
          enhancedProperties = propertiesData.map(prop => ({
            ...prop,
            ...enhancedMap.get(prop.id),
          }));
          console.log('✅ Enhanced properties with additional fields');
        } else {
          console.log('⚠️ Enhanced fields not available, using defaults');
        }
      } catch (enhanceError) {
        console.log('⚠️ Enhanced fields not available, continuing with defaults:', enhanceError);
      }

      // Fetch owner details for each property
      const propertiesWithOwners = await Promise.all(
        enhancedProperties.map(async (property: any) => {
          try {
            const { data: owner, error: ownerError } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', property.owner_id)
              .single();

            if (ownerError) {
              console.warn(`⚠️ Could not fetch owner for property ${property.id}:`, ownerError);
            }

            return {
              ...property,
              owner: ownerError ? null : owner
            } as PropertyWithOwner;
          } catch (error) {
            console.warn(`⚠️ Error processing property ${property.id}:`, error);
            return {
              ...property,
              owner: null
            } as PropertyWithOwner;
          }
        })
      );

      setProperties(propertiesWithOwners);
      console.log('✅ Properties with owners loaded successfully');
    } catch (error) {
      console.error('❌ Critical error fetching properties:', error);
      toast.error('Failed to fetch properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.property_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    setFilteredProperties(filtered);
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id));
    }
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    if (selectedProperties.length === 0) {
      toast.error('Please select properties first');
      return;
    }

    const selectedProps = properties.filter(p => selectedProperties.includes(p.id));
    setModalState({
      isOpen: true,
      action,
      propertyIds: selectedProperties,
      propertyTitles: selectedProps.map(p => p.title),
    });
  };

  const handleModalComplete = () => {
    setSelectedProperties([]);
    fetchProperties();
  };

  const handleToggleAdminBlock = async (property: PropertyWithOwner) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ admin_blocked: !property.admin_blocked } as any)
        .eq('id', property.id);

      if (error) {
        console.error('Error updating admin block status:', error);
        toast.error('Admin block toggle not available - column may not exist');
        return;
      }

      toast.success(`Property ${!property.admin_blocked ? 'blocked' : 'unblocked'} by admin`);
      fetchProperties();
    } catch (error) {
      console.error('Error toggling admin block:', error);
      toast.error('Failed to update admin block status');
    }
  };

  const handleToggleMenuAvailable = async (property: PropertyWithOwner) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ menu_available: !property.menu_available } as any)
        .eq('id', property.id);

      if (error) {
        console.error('Error updating menu status:', error);
        toast.error('Menu toggle not available - column may not exist');
        return;
      }

      toast.success(`Menu ${!property.menu_available ? 'enabled' : 'disabled'} for this property`);
      fetchProperties();
    } catch (error) {
      console.error('Error toggling menu status:', error);
      toast.error('Failed to update menu status');
    }
  };

  const handleDeleteProperty = async (property: PropertyWithOwner) => {
    if (!confirm(`Are you sure you want to delete property "${property.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (error) {
        console.error('Error deleting property:', error);
        toast.error('Failed to delete property');
        return;
      }

      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const openDetailsDrawer = (propertyId: string) => {
    setDetailsDrawer({
      isOpen: true,
      propertyId,
    });
  };

  const closeDetailsDrawer = () => {
    setDetailsDrawer({
      isOpen: false,
      propertyId: null,
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProperties.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Property Approval" 
          breadcrumb="Property Approval"
        />

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <IconButton
                icon={Plus}
                variant="primary"
                onClick={() => navigate('/host/signup')}
                tooltip="Add new property"
                aria-label="Add new property"
                className="px-4 py-2"
              >
                Add New Property
              </IconButton>
              <IconButton
                icon={RefreshCw}
                variant="secondary"
                onClick={fetchProperties}
                disabled={loading}
                loading={loading}
                tooltip="Refresh property list"
                aria-label="Refresh property list"
                className="px-4 py-2"
              >
                Refresh
              </IconButton>
              {selectedProperties.length > 0 && (
                <>
                  <IconButton
                    icon={CheckCircle}
                    variant="primary"
                    onClick={() => handleBulkAction('approve')}
                    tooltip={`Approve ${selectedProperties.length} selected properties`}
                    aria-label="Bulk approve selected properties"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700"
                  >
                    Approve ({selectedProperties.length})
                  </IconButton>
                  <IconButton
                    icon={XCircle}
                    variant="secondary"
                    onClick={() => handleBulkAction('reject')}
                    tooltip={`Reject ${selectedProperties.length} selected properties`}
                    aria-label="Bulk reject selected properties"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reject ({selectedProperties.length})
                  </IconButton>
                </>
              )}
            </div>
            
            {/* Summary Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Pending: {stats.total_pending}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Approved: {stats.total_approved}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Rejected: {stats.total_rejected}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Avg Pending: {stats.avg_pending_hours.toFixed(1)}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6">

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <IconButton
                    icon={Filter}
                    variant="secondary"
                    tooltip="Advanced Filters"
                    aria-label="Open advanced filters"
                    className="px-3 py-2"
                  >
                    Advanced Filters
                  </IconButton>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProperties.length === paginatedProperties.length && paginatedProperties.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>Property</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-1">
                        <span>Submitted</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : paginatedProperties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No properties found
                      </td>
                    </tr>
                  ) : (
                    paginatedProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProperties.includes(property.id)}
                            onChange={() => handleSelectProperty(property.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{property.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{property.address}</div>
                            <div className="flex gap-1 mt-1">
                              {property.admin_blocked && (
                                <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                                  Admin Blocked
                                </span>
                              )}
                              {property.menu_available && (
                                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                                  Menu Available
                                </span>
                              )}
                              {property.video_url && (
                                <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded">
                                  Video
                                </span>
                              )}
                              {(property.banquet_hall_capacity || property.ground_lawn_capacity) && (
                                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                                  Events
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {property.owner?.full_name || 'Unknown'}
                            </div>
                            <div className="text-gray-500">{property.owner?.email || 'No email'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.property_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(property.status)}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(property.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <IconButton
                              icon={Eye}
                              variant="ghost"
                              size="sm"
                              tooltip="View Details"
                              aria-label="View property details"
                              onClick={() => openDetailsDrawer(property.id)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            />
                            
                            {property.status === 'pending' && (
                              <div className="contents">
                                <IconButton
                                  icon={CheckCircle}
                                  variant="ghost"
                                  size="sm"
                                  tooltip="Approve Property"
                                  aria-label="Approve property"
                                  onClick={() => setModalState({
                                    isOpen: true,
                                    action: 'approve',
                                    propertyIds: [property.id],
                                    propertyTitles: [property.title],
                                  })}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                />
                                <IconButton
                                  icon={Edit}
                                  variant="ghost"
                                  size="sm"
                                  tooltip="Request Changes"
                                  aria-label="Request changes to property"
                                  onClick={() => setModalState({
                                    isOpen: true,
                                    action: 'reject',
                                    propertyIds: [property.id],
                                    propertyTitles: [property.title],
                                  })}
                                  className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                />
                                <IconButton
                                  icon={XCircle}
                                  variant="ghost"
                                  size="sm"
                                  tooltip="Reject Property"
                                  aria-label="Reject property"
                                  onClick={() => setModalState({
                                    isOpen: true,
                                    action: 'reject',
                                    propertyIds: [property.id],
                                    propertyTitles: [property.title],
                                  })}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                />
                              </div>
                            )}

                            {/* More Actions Dropdown */}
                            <div className="relative dropdown-container">
                              <IconButton
                                icon={MoreVertical}
                                variant="ghost"
                                size="sm"
                                tooltip="More Actions"
                                aria-label="More property actions"
                                onClick={() => setActiveDropdown(activeDropdown === property.id ? null : property.id)}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                              />
                              
                              {activeDropdown === property.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <div className="py-1">
                                    <IconButton
                                      icon={property.admin_blocked ? CheckCircle : Ban}
                                      variant="ghost"
                                      onClick={() => handleToggleAdminBlock(property)}
                                      className={`w-full justify-start px-4 py-2 text-sm rounded-none ${
                                        property.admin_blocked 
                                          ? 'hover:bg-green-50 text-green-600' 
                                          : 'hover:bg-red-50 text-red-600'
                                      }`}
                                    >
                                      {property.admin_blocked ? 'Unblock Property' : 'Admin Block'}
                                    </IconButton>
                                    
                                    <IconButton
                                      icon={CheckCircle}
                                      variant="ghost"
                                      onClick={() => handleToggleMenuAvailable(property)}
                                      className="w-full justify-start px-4 py-2 text-sm rounded-none hover:bg-blue-50 text-blue-600"
                                    >
                                      {property.menu_available ? 'Disable Menu' : 'Enable Menu'}
                                    </IconButton>
                                    
                                    <IconButton
                                      icon={Bell}
                                      variant="ghost"
                                      onClick={() => setShowSendNotification(property)}
                                      className="w-full justify-start px-4 py-2 text-sm rounded-none hover:bg-purple-50 text-purple-600"
                                    >
                                      Send Notification
                                    </IconButton>
                                    
                                    <IconButton
                                      icon={Trash2}
                                      variant="ghost"
                                      onClick={() => handleDeleteProperty(property)}
                                      className="w-full justify-start px-4 py-2 text-sm rounded-none hover:bg-red-50 text-red-600"
                                    >
                                      Delete Property
                                    </IconButton>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filteredProperties.length > 0 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Show</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700">entries</span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredProperties.length)} of {filteredProperties.length} entries
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => (
                        <div key={page} className="contents">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))
                    }
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modals */}
          <ApproveRejectModal
            isOpen={modalState.isOpen}
            onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
            propertyIds={modalState.propertyIds}
            propertyTitles={modalState.propertyTitles}
            action={modalState.action}
            onComplete={handleModalComplete}
          />

          <EnhancedPropertyDetailsDrawer
            isOpen={detailsDrawer.isOpen}
            onClose={closeDetailsDrawer}
            propertyId={detailsDrawer.propertyId}
            onPropertyUpdate={fetchProperties}
          />

          {showSendNotification && showSendNotification.owner_id && (
            <SendNotificationModal
              isOpen={true}
              onClose={() => setShowSendNotification(null)}
              recipientType="owner"
              recipientId={showSendNotification.owner_id}
              recipientName={showSendNotification.owner?.full_name || showSendNotification.owner?.email || 'Property Owner'}
              onSent={() => {
                setShowSendNotification(null);
                toast.success('Notification sent successfully');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default PropertyApproval;
