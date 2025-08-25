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
  Loader2
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import { PropertyService } from '../../lib/propertyService';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface PropertyWithOwner {
  id: string;
  title: string;
  address: string;
  property_type: string;
  status: string;
  created_at: string;
  owner_id: string;
  owner?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const PropertyApproval: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('properties');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Fetch owner details for each property
      const propertiesWithOwners = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: owner, error: ownerError } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', property.owner_id)
            .single();

          return {
            ...property,
            owner: ownerError ? null : owner
          };
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
    const matchesSearch = 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = selectedType === 'all' || property.property_type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
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

  const handleStatusUpdate = async (propertyId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await PropertyService.updatePropertyStatus(propertyId, newStatus);
      toast.success(`Property ${newStatus} successfully`);
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error(`Error ${newStatus} property:`, error);
      toast.error(`Failed to ${newStatus} property`);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await PropertyService.deleteProperty(propertyId);
      toast.success('Property deleted successfully');
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProperties.length === 0) return;
    
    try {
      if (action === 'approve') {
        await Promise.all(
          selectedProperties.map(id => PropertyService.updatePropertyStatus(id, 'approved'))
        );
        toast.success(`${selectedProperties.length} properties approved`);
      } else if (action === 'reject') {
        await Promise.all(
          selectedProperties.map(id => PropertyService.updatePropertyStatus(id, 'rejected'))
        );
        toast.success(`${selectedProperties.length} properties rejected`);
      } else if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${selectedProperties.length} properties?`)) return;
        await Promise.all(
          selectedProperties.map(id => PropertyService.deleteProperty(id))
        );
        toast.success(`${selectedProperties.length} properties deleted`);
      }
      
      setSelectedProperties([]);
      setShowBulkActions(false);
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to ${action} properties`);
    }
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

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Property
              </button>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="Day Picnic">Day Picnic</option>
                  <option value="Villa">Villa</option>
                  <option value="Resort">Resort</option>
                  <option value="Farmhouse">Farmhouse</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
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
                        onClick={() => handleBulkAction('approve')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-green-600 flex items-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('reject')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-600 flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 cursor-pointer p-1" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            {property.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleStatusUpdate(property.id, 'approved')}
                                  className="text-green-600 hover:text-green-800 cursor-pointer p-1" 
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(property.id, 'rejected')}
                                  className="text-red-600 hover:text-red-800 cursor-pointer p-1" 
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button className="text-gray-600 hover:text-gray-800 cursor-pointer p-1" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProperty(property.id)}
                              className="text-red-600 hover:text-red-800 cursor-pointer p-1" 
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </div>
    </div>
  );
};

export default PropertyApproval;