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
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Activity,
  Settings,
  Search,
  Filter,
  Moon,
  Sun,
  Shield,
  Plus
} from 'lucide-react';
import { adminService, PropertyOwner } from '@/lib/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

const ModernAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      console.log('🔍 Loading modern admin dashboard data...');
      
      const ownersData = await adminService.getPropertyOwners();
      console.log('✅ Property owners loaded:', ownersData);

      const { data: propertiesData, error: propertiesError } = await adminService.adminSupabase
        .from('properties')
        .select('*');

      if (propertiesError) throw propertiesError;

      const processedProperties = propertiesData?.map(property => {
        const owner = ownersData?.find(o => o.id === property.owner_id);
        return {
          id: property.id,
          title: property.title || 'Untitled Property',
          owner_id: property.owner_id,
          owner_email: owner?.email || 'Unknown',
          status: property.status || 'pending',
          created_at: property.created_at,
          property_type: property.property_type || 'Property',
          location: property.location || null
        };
      }) || [];

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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const updatePropertyStatus = async (propertyId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await adminService.adminSupabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(prev => 
        prev.map(property => 
          property.id === propertyId 
            ? { ...property, status }
            : property
        )
      );
    } catch (error) {
      console.error('Error updating property status:', error);
    }
  };

  const stats = {
    totalOwners: owners.length,
    activeOwners: owners.filter(o => o.is_active === true).length,
    totalProperties: properties.length,
    pendingProperties: properties.filter(p => p.status === 'pending').length,
    approvedProperties: properties.filter(p => p.status === 'approved').length,
    rejectedProperties: properties.filter(p => p.status === 'rejected').length,
    totalRevenue: 89432,
    totalBookings: 2847,
    avgRating: 4.7
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading modern dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Picnify Admin
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search everything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover-glow">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="border-border">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Modern Navigation */}
      <nav className="border-b border-border bg-card/50">
        <div className="container">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'owners', label: 'Property Owners', icon: Users },
              { id: 'properties', label: 'Properties', icon: Building },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container py-8 space-y-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Modern Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="modern-card stats-card gradient-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs opacity-80">+8.2% from last month</p>
                </CardContent>
              </Card>

              <Card className="modern-card stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">+12.5% from last month</p>
                </CardContent>
              </Card>

              <Card className="modern-card stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.approvedProperties}</div>
                  <p className="text-xs text-muted-foreground">+5.1% from last month</p>
                </CardContent>
              </Card>

              <Card className="modern-card stats-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgRating}</div>
                  <p className="text-xs text-muted-foreground">+0.3 from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="modern-card hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Pending Approvals</h3>
                      <p className="text-sm text-muted-foreground">{stats.pendingProperties} properties awaiting review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-success/10 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Active Owners</h3>
                      <p className="text-sm text-muted-foreground">{stats.activeOwners} property owners</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-warning/10 rounded-lg">
                      <Activity className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">System Status</h3>
                      <p className="text-sm text-muted-foreground">All systems operational</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across your platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { action: 'New property approved', user: 'john@example.com', time: '2 minutes ago', type: 'success' },
                  { action: 'Booking created', user: 'sarah@example.com', time: '5 minutes ago', type: 'info' },
                  { action: 'Property rejected', user: 'mike@example.com', time: '10 minutes ago', type: 'warning' },
                  { action: 'New owner registered', user: 'emma@example.com', time: '15 minutes ago', type: 'success' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Owners Tab */}
        {activeTab === 'owners' && (
          <Card className="modern-table">
            <CardHeader>
              <CardTitle>Property Owners</CardTitle>
              <CardDescription>Manage all property owners and their accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="modern-table">
                      <th className="text-left p-4">Owner</th>
                      <th className="text-left p-4">Properties</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Joined</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOwners.map((owner) => (
                      <tr key={owner.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{owner.email}</div>
                            <div className="text-sm text-muted-foreground">{owner.full_name || 'No name provided'}</div>
                          </div>
                        </td>
                        <td className="p-4">{owner.properties_count} properties</td>
                        <td className="p-4">
                          <Badge variant={owner.is_active === true ? "default" : "secondary"}>
                            {owner.is_active === true ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(owner.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <Card className="modern-table">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Properties</CardTitle>
                  <CardDescription>Manage property listings and approvals</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="modern-table">
                      <th className="text-left p-4">Property</th>
                      <th className="text-left p-4">Owner</th>
                      <th className="text-left p-4">Type</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Created</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => (
                      <tr key={property.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-medium">{property.title}</td>
                        <td className="p-4 text-sm text-muted-foreground">{property.owner_email}</td>
                        <td className="p-4 text-sm">{property.property_type}</td>
                        <td className="p-4">
                          <Badge variant={
                            property.status === 'approved' ? 'default' :
                            property.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {property.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(property.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            {property.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updatePropertyStatus(property.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => updatePropertyStatus(property.id, 'rejected')}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ModernAdminDashboard;