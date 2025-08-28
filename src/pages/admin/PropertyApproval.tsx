
import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Search, Filter, MoreVertical, Calendar, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ApproveRejectModal from '@/components/admin/ApproveRejectModal';
import EnhancedPropertyDetailsDrawer from '@/components/admin/EnhancedPropertyDetailsDrawer';
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
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
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

  const { stats } = usePropertyApprovalStats();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Approval Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.total_pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Approved</p>
                <p className="text-2xl font-bold text-green-900">{stats.total_approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.total_rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <History className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Avg. Pending</p>
                <p className="text-2xl font-bold text-blue-900">{Math.round(stats.avg_pending_hours)}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
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

            {selectedProperties.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve ({selectedProperties.length})
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject ({selectedProperties.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
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
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No properties found
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={() => handleSelectProperty(property.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {property.owner?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {property.owner?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {property.property_type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(property.status)}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(property.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openDetailsDrawer(property.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {property.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setModalState({
                                isOpen: true,
                                action: 'approve',
                                propertyIds: [property.id],
                                propertyTitles: [property.title],
                              })}
                              className="text-green-600 hover:text-green-800"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setModalState({
                                isOpen: true,
                                action: 'reject',
                                propertyIds: [property.id],
                                propertyTitles: [property.title],
                              })}
                              className="text-red-600 hover:text-red-800"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default PropertyApproval;
