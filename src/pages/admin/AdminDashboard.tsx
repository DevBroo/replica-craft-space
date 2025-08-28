import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2, 
  LogOut,
  Home,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';
import { adminService, PropertyOwner } from '@/lib/adminService';
import { supabase } from '@/integrations/supabase/client';

interface Property {
  id: string;
  title: string;
  owner_id: string;
  owner_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  property_type: string;
  location: any;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('owners');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Check admin authentication
  useEffect(() => {
    const isAdminAuthenticated = localStorage.getItem('adminAuthenticated');
    if (!isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading admin dashboard data...');
      
      // Use adminService to get property owners
      const ownersData = await adminService.getPropertyOwners();
      console.log('✅ Property owners loaded:', ownersData);

      // Load all properties using supabase
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (propertiesError) throw propertiesError;

      console.log('✅ Properties data loaded:', propertiesData);

      // Process properties data with proper type assertions
      const processedProperties: Property[] = propertiesData?.map(property => {
        const owner = ownersData?.find(o => o.id === property.owner_id);
        return {
          id: String(property.id),
          title: String(property.title || 'Untitled Property'),
          owner_id: String(property.owner_id),
          owner_email: owner?.email || 'Unknown',
          status: (property.status as 'pending' | 'approved' | 'rejected') || 'pending',
          created_at: String(property.created_at),
          property_type: String(property.property_type || 'Property'),
          location: property.location || null
        };
      }) || [];

      console.log('✅ Processed properties:', processedProperties);
      
      setOwners(ownersData);
      setProperties(processedProperties);
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const updatePropertyStatus = async (propertyId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId);

      if (error) throw error;

      // Update local state
      setProperties(prev => 
        prev.map(property => 
          property.id === propertyId 
            ? { ...property, status }
            : property
        )
      );

      console.log(`Property ${propertyId} ${status} successfully`);
    } catch (error) {
      console.error('Error updating property status:', error);
    }
  };

  const toggleOwnerStatus = async (ownerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', ownerId);

      if (error) throw error;

      // Update local state
      setOwners(prev => 
        prev.map(owner => 
          owner.id === ownerId 
            ? { ...owner, is_active: !isActive }
            : owner
        )
      );

      console.log(`Owner ${ownerId} status updated successfully`);
    } catch (error) {
      console.error('Error updating owner status:', error);
    }
  };

  const deleteOwner = async (ownerId: string) => {
    if (!window.confirm('Are you sure you want to delete this owner? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete owner's properties first
      const { error: propertiesError } = await supabase
        .from('properties')
        .delete()
        .eq('owner_id', ownerId);

      if (propertiesError) throw propertiesError;

      // Delete owner profile
      const { error: ownerError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', ownerId);

      if (ownerError) throw ownerError;

      // Update local state
      setOwners(prev => prev.filter(owner => owner.id !== ownerId));
      setProperties(prev => prev.filter(property => property.owner_id !== ownerId));

      console.log(`Owner ${ownerId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting owner:', error);
    }
  };

  const filteredOwners = owners.filter(owner =>
    owner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.full_name && owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProperties = properties.filter(property =>
    (filterStatus === 'all' || property.status === filterStatus) &&
    (property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     property.owner_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    totalOwners: owners.length,
    activeOwners: owners.filter(o => o.is_active === true).length,
    totalProperties: properties.length,
    pendingProperties: properties.filter(p => p.status === 'pending').length,
    approvedProperties: properties.filter(p => p.status === 'approved').length,
    rejectedProperties: properties.filter(p => p.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Picnify Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Owners</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOwners}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProperties}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingProperties}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Owners</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeOwners}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('owners')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'owners'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Property Owners
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'properties'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="h-4 w-4 inline mr-2" />
                Properties
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by email, name, or property title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {activeTab === 'properties' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'owners' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOwners.map((owner) => (
                    <tr key={owner.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{owner.email}</div>
                          <div className="text-sm text-gray-500">{owner.full_name || 'No name provided'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {owner.properties_count} properties
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          owner.is_active === true
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {owner.is_active === true ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(owner.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleOwnerStatus(owner.id, owner.is_active === true)}
                          className={`px-3 py-1 rounded-md text-xs ${
                            owner.is_active === true
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {owner.is_active === true ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteOwner(owner.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProperties.map((property) => (
                    <tr key={property.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.owner_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.property_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.status === 'approved' ? 'bg-green-100 text-green-800' :
                          property.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(property.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {property.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updatePropertyStatus(property.id, 'approved')}
                              className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updatePropertyStatus(property.id, 'rejected')}
                              className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {property.status === 'approved' && (
                          <button
                            onClick={() => updatePropertyStatus(property.id, 'rejected')}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs"
                          >
                            Reject
                          </button>
                        )}
                        {property.status === 'rejected' && (
                          <button
                            onClick={() => updatePropertyStatus(property.id, 'approved')}
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-xs"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Empty State */}
        {((activeTab === 'owners' && filteredOwners.length === 0) || 
          (activeTab === 'properties' && filteredProperties.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'owners' ? <Users className="h-12 w-12 mx-auto" /> : <Building className="h-12 w-12 mx-auto" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === 'owners' ? 'owners' : 'properties'} found
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : `No ${activeTab === 'owners' ? 'property owners' : 'properties'} available yet.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;