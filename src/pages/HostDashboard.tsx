import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOwnerProperties, useOwnerBookings, useOwnerStats } from '@/hooks/useOwnerData';
import { 
  Home, 
  Calendar, 
  DollarSign, 
  Star, 
  MessageSquare, 
  User, 
  Settings as SettingsIcon, 
  BarChart3, 
  Bell,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Import existing owner dashboard components
import Properties from '@/components/owner/PropertiesNew';
import Bookings from '@/components/owner/Bookings';
import Earnings from '@/components/owner/Earnings';
import Reviews from '@/components/owner/Reviews';
import Profile from '@/components/owner/Profile';
import SettingsComponent from '@/components/owner/Settings';

const HostDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, loading } = useAuth();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch real data using custom hooks
  const { properties, loading: propertiesLoading } = useOwnerProperties(user?.id || '');
  const { bookings, loading: bookingsLoading } = useOwnerBookings(user?.id || '');
  const { stats, loading: statsLoading } = useOwnerStats(user?.id || '');

  // Check for success message from signup/login
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after showing it
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [location.state]);

  // Redirect if not authenticated or not a host
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      navigate('/host/login', { replace: true });
      return;
    }
    
    if (!loading && user && user.role !== 'owner' && user.role !== 'agent') {
      // Redirect non-hosts to appropriate login
      if (user.role === 'customer') {
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/host/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state for non-hosts
  if (!isAuthenticated || !user || (user.role !== 'owner' && user.role !== 'agent')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.email}!
        </h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'owner' ? 'Property Owner' : 'Property Agent'} Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {user.role === 'owner' ? 'Owner' : 'Agent'}
          </Badge>
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.totalProperties}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.propertiesThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.activeBookings}
            </div>
            <p className="text-xs text-muted-foreground">Current confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : `₹${stats.totalRevenue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              ₹{stats.revenueThisMonth.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Across all properties</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookingsLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading bookings...</div>
              ) : bookings.length > 0 ? (
                bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">₹{Number(booking.total_amount).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{booking.property?.title || 'Property'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className={
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No bookings yet</div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setActiveTab('bookings')}>
                View All Bookings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propertiesLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading properties...</div>
              ) : properties.length > 0 ? (
                properties.slice(0, 3).map((property) => (
                  <div key={property.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-gray-600">{property.property_type}</p>
                      <p className="text-xs text-gray-500">
                        ₹{property.pricing?.daily_rate || 0}/night
                      </p>
                    </div>
                    <Badge variant="secondary" className={
                      property.status === 'approved' ? 'bg-green-100 text-green-800' :
                      property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {property.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No properties yet</div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setActiveTab('properties')}>
                View All Properties
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white shadow-lg flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Host Dashboard</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-100"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200">
          {!sidebarCollapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-800">
                {user.email}
              </p>
              <p className="text-xs text-gray-500">
                {user.role === 'owner' ? 'Property Owner' : 'Property Agent'}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'properties' && (
          <Properties
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'bookings' && (
          <Bookings
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'earnings' && (
          <Earnings
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'reviews' && (
          <Reviews
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'messages' && (
          <div className="text-center text-gray-500 mt-20">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Messages Coming Soon</h3>
            <p>Communication features will be available here.</p>
          </div>
        )}
        {activeTab === 'profile' && (
          <Profile
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsComponent
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
};

export default HostDashboard;