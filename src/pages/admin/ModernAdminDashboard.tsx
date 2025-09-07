import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';
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
import SharedSidebar from '@/components/admin/SharedSidebar';
import { adminService, Host } from '@/lib/adminService';
import { supabase } from '@/integrations/supabase/client';
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
  const location = useLocation();
  const [owners, setOwners] = useState<Host[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('❌ No valid session, redirecting to admin login');
          navigate('/admin/login');
          return;
        }

        // Verify admin role in database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          console.error('❌ Admin access required, redirecting to login');
          navigate('/admin/login');
          return;
        }

        console.log('✅ Admin authentication verified');
        loadData();
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        navigate('/admin/login');
      }
    };

    checkAdminAuth();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading modern admin dashboard data...');
      
      const ownersData = await adminService.getHosts();
      console.log('✅ Hosts loaded:', ownersData);

      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (propertiesError) throw propertiesError;

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

      setOwners(ownersData);
      setProperties(processedProperties);
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force redirect even if signOut fails
      navigate('/admin/login');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const updatePropertyStatus = async (propertyId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
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
    rejectedProperties: properties.filter(p => p.status === 'rejected').length
  };

  const filteredOwners = owners.filter(owner =>
    owner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.full_name && owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img 
            src={picnifyLogo} 
            alt="Picnify Logo" 
            className="h-16 w-auto object-contain mx-auto mb-6"
          />
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading modern dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Modern Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={picnifyLogo} 
                  alt="Picnify Logo" 
                  className="h-8 w-auto object-contain"
                />
                <h1 className="text-xl font-bold text-gray-900">
                  Admin Dashboard
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
          { id: 'overview', label: 'Overview', icon: BarChart3, path: '/admin/dashboard' },
          { id: 'owners', label: 'Hosts', icon: Users, path: '/admin/owner-management' },
          { id: 'properties', label: 'Properties', icon: Building, path: '/admin/property-approval' },
          { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/admin/booking-management' },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || (tab.id === 'overview' && location.pathname === '/admin/dashboard');
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
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
          {/* Overview Content */}
          {/* Modern Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="modern-card stats-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOwners}</div>
                <p className="text-xs text-muted-foreground">Hosts registered</p>
              </CardContent>
            </Card>

            <Card className="modern-card stats-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProperties}</div>
                <p className="text-xs text-muted-foreground">{stats.approvedProperties} approved, {stats.pendingProperties} pending</p>
              </CardContent>
            </Card>

            <Card className="modern-card stats-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Owners</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeOwners}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="modern-card hover-lift cursor-pointer" onClick={() => navigate('/admin/property-approval')}>
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

            <Card className="modern-card hover-lift cursor-pointer" onClick={() => navigate('/admin/owner-management')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-success/10 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Active Owners</h3>
                    <p className="text-sm text-muted-foreground">{stats.activeOwners} hosts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift cursor-pointer" onClick={() => navigate('/admin/settings')}>
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

          {/* Recent Property Submissions */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle>Recent Property Submissions</CardTitle>
              <CardDescription>Latest property submissions awaiting review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {properties
                .filter(p => p.status === 'pending')
                .slice(0, 5)
                .map((property) => (
                  <div key={property.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{property.title}</p>
                      <p className="text-xs text-muted-foreground">{property.owner_email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(property.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              {properties.filter(p => p.status === 'pending').length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending submissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ModernAdminDashboard;