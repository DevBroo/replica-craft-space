
import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Check,
  Eye,
  Trash2,
  X,
  ArrowUpDown,
  MapPin,
  List,
  CheckCircle,
  XCircle,
  ChevronDown,
  Search,
  Home,
  Edit,
  Loader2,
  Lock,
  Unlock,
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import IconButton from '../../components/admin/ui/IconButton';
import EnhancedPropertyDetailsDrawer from '../../components/admin/EnhancedPropertyDetailsDrawer';
import PropertyFilters from '../../components/admin/PropertyFilters';
import ApproveRejectModal from '../../components/admin/ApproveRejectModal';
import { PropertyService } from '../../lib/propertyService';
import { supabase } from '../../integrations/supabase/client';
import { usePropertyApprovalStats } from '../../hooks/usePropertyApprovalStats';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/admin/ui/alert-dialog';

interface PropertyWithOwner {
  id: string;
  title: string;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  
  // New modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [modalPropertyIds, setModalPropertyIds] = useState<string[]>([]);
  const [modalPropertyTitles, setModalPropertyTitles] = useState<string[]>([]);

  const { stats, loading: statsLoading } = usePropertyApprovalStats();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          property_type,
          status,
          created_at,
          owner_id
        `)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      if (!propertiesData) {
        setProperties([]);
        return;
      }

      // Fetch owner details for each property
      const propertiesWithOwners = await Promise.all(
        propertiesData.map(async (property) => {
          const { data: owner, error: ownerError } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', property.owner_id)
            .single();

          return {
            ...property,
            admin_blocked: false, // Default value until column exists
            menu_available: false, // Default value until column exists
            owner: ownerError ? null : owner
          } as PropertyWithOwner;
        })
      );

      setProperties(propertiesWithOwners);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const filteredProperties = properties.filter(property => {
    const ownerName = property.owner?.full_name || '';
    const ownerEmail = property.owner?.email || '';
    const createdAt = new Date(property.created_at);
    
    // Search filter
    const matchesSearch = !searchTerm || 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.property_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || property.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Type filter
    const matchesType = selectedType === 'all' || property.property_type === selectedType;
    
    // Owner filter
    const matchesOwner = !ownerFilter || 
      ownerName.toLowerCase().includes(ownerFilter.toLowerCase()) ||
      ownerEmail.toLowerCase().includes(ownerFilter.toLowerCase());
    
    // Date range filter
    const matchesDateRange = (!startDate || createdAt >= new Date(startDate)) &&
                             (!endDate || createdAt <= new Date(endDate + 'T23:59:59'));
    
    return matchesSearch && matchesStatus && matchesType && matchesOwner && matchesDateRange;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'property_type':
        aValue = a.property_type;
        bValue = b.property_type;
        break;
      default: // created_at
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const totalPages = Math.ceil(filteredProperties.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + rowsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(paginatedProperties.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties([...selectedProperties, propertyId]);
    } else {
      setSelectedProperties(selectedProperties.filter(id => id !== propertyId));
    }
  };

  const handleSingleApprove = (propertyId: string, propertyTitle: string) => {
    setModalPropertyIds([propertyId]);
    setModalPropertyTitles([propertyTitle]);
    setShowApproveModal(true);
  };

  const handleSingleReject = (propertyId: string, propertyTitle: string) => {
    setModalPropertyIds([propertyId]);
    setModalPropertyTitles([propertyTitle]);
    setShowRejectModal(true);
  };

  const handleBulkApprove = () => {
    const selectedTitles = selectedProperties.map(id => 
      properties.find(p => p.id === id)?.title || 'Unknown'
    );
    setModalPropertyIds(selectedProperties);
    setModalPropertyTitles(selectedTitles);
    setShowApproveModal(true);
  };

  const handleBulkReject = () => {
    const selectedTitles = selectedProperties.map(id => 
      properties.find(p => p.id === id)?.title || 'Unknown'
    );
    setModalPropertyIds(selectedProperties);
    setModalPropertyTitles(selectedTitles);
    setShowRejectModal(true);
  };

  const handleToggleStatus = async (propertyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'inactive' ? 'approved' : 'inactive';
    try {
      await PropertyService.updatePropertyStatus(propertyId, newStatus);
      toast.success(`Property ${newStatus} successfully`);
      fetchProperties();
    } catch (error) {
      console.error(`Error ${newStatus} property:`, error);
      toast.error(`Failed to ${newStatus} property`);
    }
  };

  const handleViewProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowPropertyDetails(true);
  };

  const handleEditProperty = (propertyId: string) => {
    window.open(`/admin/properties/${propertyId}/edit`, '_blank');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSelectedType('all');
    setOwnerFilter('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await PropertyService.deleteProperty(propertyId);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProperties.length} properties?`)) return;
    
    try {
      await Promise.all(
        selectedProperties.map(id => PropertyService.deleteProperty(id))
      );
      toast.success(`${selectedProperties.length} properties deleted`);
      setSelectedProperties([]);
      setShowBulkActions(false);
      fetchProperties();
    } catch (error) {
      console.error('Error performing bulk delete:', error);
      toast.error('Failed to delete properties');
    }
  };

  const onModalComplete = () => {
    setSelectedProperties([]);
    setShowBulkActions(false);
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Property Approval" 
          breadcrumb="Property Approval"
          searchPlaceholder="Search properties..."
        />

        {/* Stats Cards */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : stats.total_pending}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : stats.total_approved}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : stats.total_rejected}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Avg. Pending Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : `${Math.round(stats.avg_pending_hours)}h`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <PropertyFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={selectedType}
          onTypeChange={setSelectedType}
          ownerFilter={ownerFilter}
          onOwnerChange={setOwnerFilter}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          onClearFilters={clearFilters}
        />

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.open('/owner/add-property', '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Property
              </button>
              
              {selectedProperties.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer flex items-center"
                  >
                    <List className="w-4 h-4 mr-2" />
                    Bulk Actions ({selectedProperties.length})
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={handleBulkApprove}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-green-600 flex items-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve Selected
                      </button>
                      <button
                        onClick={handleBulkReject}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-600 flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject Selected
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-600 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {paginatedProperties.length} of {filteredProperties.length} properties
            </div>
          </div>
        </div>

        {/* Property Table */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading properties...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchProperties}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedProperties.length === paginatedProperties.length && paginatedProperties.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                        <div className="flex items-center space-x-1">
                          <span>Property ID</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                        <div className="flex items-center space-x-1">
                          <span>Property Name</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                        <div className="flex items-center space-x-1">
                          <span>Submission Date</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
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
                    {paginatedProperties.length > 0 ? paginatedProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProperties.includes(property.id)}
                            onChange={(e) => handleSelectProperty(property.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {property.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                              <Home className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{property.title}</div>
                              <div className="text-sm text-gray-500">{property.property_type}</div>
                              <div className="flex items-center space-x-2 mt-1">
                                {property.admin_blocked && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Blocked
                                  </span>
                                )}
                                {property.menu_available && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Menu Available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{property.owner?.full_name || 'Unknown'}</div>
                            <div className="text-gray-500">{property.owner?.email || 'No email'}</div>
                            <div className="text-gray-500">{property.owner?.phone || 'No phone'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(property.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.property_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            {property.address}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                            {formatStatus(property.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex space-x-1">
                            <IconButton
                              icon={Eye}
                              onClick={() => handleViewProperty(property.id)}
                              variant="ghost"
                              size="sm"
                              tooltip="View Details"
                              aria-label="View property details"
                            />
                            <IconButton
                              icon={BarChart3}
                              onClick={() => handleViewProperty(property.id)}
                              variant="ghost"
                              size="sm"
                              tooltip="View Insights"
                              aria-label="View property insights"
                            />
                            <IconButton
                              icon={Edit}
                              onClick={() => handleEditProperty(property.id)}
                              variant="ghost"
                              size="sm"
                              tooltip="Edit Property"
                              aria-label="Edit property"
                            />
                            {property.status === 'pending' ? (
                              <>
                                <IconButton
                                  icon={Check}
                                  onClick={() => handleSingleApprove(property.id, property.title)}
                                  variant="ghost"
                                  size="sm"
                                  tooltip="Approve"
                                  aria-label="Approve property"
                                  className="text-green-600 hover:text-green-800"
                                />
                                <IconButton
                                  icon={X}
                                  onClick={() => handleSingleReject(property.id, property.title)}
                                  variant="ghost"
                                  size="sm"
                                  tooltip="Reject"
                                  aria-label="Reject property"
                                  className="text-red-600 hover:text-red-800"
                                />
                              </>
                            ) : (
                              <IconButton
                                icon={property.status === 'inactive' ? Unlock : Lock}
                                onClick={() => handleToggleStatus(property.id, property.status)}
                                variant="ghost"
                                size="sm"
                                tooltip={property.status === 'inactive' ? 'Activate' : 'Deactivate'}
                                aria-label={property.status === 'inactive' ? 'Activate property' : 'Deactivate property'}
                                className={property.status === 'inactive' ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'}
                              />
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <IconButton
                                  icon={Trash2}
                                  variant="ghost"
                                  size="sm"
                                  tooltip="Delete"
                                  aria-label="Delete property"
                                  className="text-red-600 hover:text-red-800"
                                />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this property? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProperty(property.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          No properties found
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
                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredProperties.length)} of {filteredProperties.length} entries
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
        
        {/* Enhanced Property Details Drawer */}
        <EnhancedPropertyDetailsDrawer
          isOpen={showPropertyDetails}
          onClose={() => setShowPropertyDetails(false)}
          propertyId={selectedPropertyId}
        />

        {/* Approve Modal */}
        <ApproveRejectModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          propertyIds={modalPropertyIds}
          propertyTitles={modalPropertyTitles}
          action="approve"
          onComplete={onModalComplete}
        />

        {/* Reject Modal */}
        <ApproveRejectModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          propertyIds={modalPropertyIds}
          propertyTitles={modalPropertyTitles}
          action="reject"
          onComplete={onModalComplete}
        />
      </div>
    </div>
  );
};

export default PropertyApproval;
