import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  DollarSign, 
  Calendar, 
  Plus, 
  Settings, 
  LogOut,
  Home,
  MapPin,
  Star,
  Eye,
  MessageSquare,
  FileText,
  TrendingUp,
  Bell,
  User,
  Shield,
  CreditCard,
  BarChart3
} from 'lucide-react';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle authentication state
  useEffect(() => {
    console.log('🔐 AgentDashboard: Auth state check:', { 
      loading, 
      isAuthenticated, 
      user: user ? { id: user.id, email: user.email, role: user.role } : null 
    });
    
    if (loading) {
      console.log('⏳ Auth loading, waiting...');
      return; // Wait for auth to load
    }
    
    if (!isAuthenticated || !user) {
      // User is not authenticated, redirect to login
      console.log('❌ User not authenticated, redirecting to login');
      navigate('/agent/login', { replace: true });
    } else if (user.role !== 'agent') {
      // User is authenticated but not an agent, redirect to appropriate page
      console.log('⚠️ User not agent, redirecting to appropriate page');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/'); // Customer goes to main page
      }
    } else {
      // User is authenticated agent, show dashboard
      console.log('✅ User authenticated agent, showing dashboard');
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Debug component mount
  useEffect(() => {
    console.log('🏠 AgentDashboard component mounted');
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/agent/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Menu items for sidebar
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'properties', label: 'My Properties', icon: 'fas fa-home' },
    { id: 'bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
    { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
    { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  // Mock data for demonstration
  const stats = {
    totalProperties: 12,
    activeBookings: 8,
    totalEarnings: 45000,
    pendingApprovals: 3,
    monthlyRevenue: 12500,
    averageRating: 4.7,
    totalGuests: 156,
    commissionRate: 15
  };

  const recentProperties = [
    {
      id: 1,
      name: 'Sunset Villa Resort',
      location: 'Goa',
      status: 'active',
      bookings: 15,
      rating: 4.8,
      price: 2500,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
    },
    {
      id: 2,
      name: 'Mountain View Cottage',
      location: 'Manali',
      status: 'pending',
      bookings: 8,
      rating: 4.6,
      price: 1800,
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400'
    },
    {
      id: 3,
      name: 'Beachside Paradise',
      location: 'Kerala',
      status: 'active',
      bookings: 22,
      rating: 4.9,
      price: 3200,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
    }
  ];

  const recentBookings = [
    {
      id: 1,
      property: 'Sunset Villa Resort',
      guest: 'John Doe',
      checkIn: '2024-01-15',
      checkOut: '2024-01-18',
      amount: 7500,
      status: 'confirmed',
      commission: 1125
    },
    {
      id: 2,
      property: 'Mountain View Cottage',
      guest: 'Jane Smith',
      checkIn: '2024-01-20',
      checkOut: '2024-01-22',
      amount: 3600,
      status: 'pending',
      commission: 540
    },
    {
      id: 3,
      property: 'Beachside Paradise',
      guest: 'Mike Johnson',
      checkIn: '2024-01-25',
      checkOut: '2024-01-28',
      amount: 9600,
      status: 'confirmed',
      commission: 1440
    }
  ];

  const recentMessages = [
    {
      id: 1,
      from: 'John Doe',
      subject: 'Property inquiry for Sunset Villa',
      message: 'Hi, I\'m interested in booking the Sunset Villa for next month...',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      from: 'Jane Smith',
      subject: 'Booking confirmation',
      message: 'Thank you for confirming my booking. Looking forward to...',
      time: '1 day ago',
      unread: false
    }
  ];

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Agent Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated || !user || user.role !== 'agent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <img
                src={picnifyLogo}
                alt="Picnify Logo"
                className="h-8 w-auto"
              />
              <span className="text-sm font-medium text-gray-600">Agent Portal</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="fas fa-bars text-gray-600"></i>
          </button>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              <i className={`${item.icon} w-5 text-center`}></i>
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-800">Travel Agent Dashboard</h1>
              <div className="text-sm text-gray-500">
                <span>Welcome back, {user?.email || 'Travel Agent'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-bell text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 relative group">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.email || 'Travel Agent'}
                </span>
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalProperties}</p>
                  <p className="text-xs text-gray-500">Managed properties</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-home text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Bookings</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.activeBookings}</p>
                  <p className="text-xs text-gray-500">Current bookings</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-check text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">₹{stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{stats.commissionRate}% commission</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.averageRating}</p>
                  <p className="text-xs text-gray-500">From {stats.totalGuests} guests</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-star text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Properties */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Properties</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                    <img 
                      src={property.image} 
                      alt={property.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{property.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {property.location}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          <i className="fas fa-star text-yellow-400 mr-1"></i>
                          {property.rating}
                        </span>
                        <span className="text-sm text-gray-600">
                          ₹{property.price}/night
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Bookings</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{booking.property}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Guest: {booking.guest}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {booking.checkIn} - {booking.checkOut}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">
                        ₹{booking.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-green-600">
                        Commission: ₹{booking.commission}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Messages</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message.id} className={`p-3 border rounded-lg hover:bg-gray-50 ${message.unread ? 'bg-blue-50 border-blue-200' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{message.from}</h4>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{message.subject}</p>
                    <p className="text-sm text-gray-600 truncate">{message.message}</p>
                    {message.unread && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
                  <i className="fas fa-plus text-2xl text-gray-400 mb-2"></i>
                  <p className="text-sm font-medium text-gray-700">Add Property</p>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
                  <i className="fas fa-calendar-plus text-2xl text-gray-400 mb-2"></i>
                  <p className="text-sm font-medium text-gray-700">New Booking</p>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
                  <i className="fas fa-chart-bar text-2xl text-gray-400 mb-2"></i>
                  <p className="text-sm font-medium text-gray-700">View Reports</p>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
                  <i className="fas fa-cog text-2xl text-gray-400 mb-2"></i>
                  <p className="text-sm font-medium text-gray-700">Settings</p>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  // Render based on active tab
  switch (activeTab) {
    case 'dashboard':
      return renderDashboard();
    case 'properties':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-home text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">My Properties</h2>
            <p className="text-gray-600">Property management section coming soon...</p>
          </div>
        </div>
      );
    case 'bookings':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-calendar-check text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Bookings</h2>
            <p className="text-gray-600">Booking management section coming soon...</p>
          </div>
        </div>
      );
    case 'earnings':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-dollar-sign text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Earnings</h2>
            <p className="text-gray-600">Earnings and commission tracking coming soon...</p>
          </div>
        </div>
      );
    case 'reviews':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-star text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Reviews</h2>
            <p className="text-gray-600">Review management section coming soon...</p>
          </div>
        </div>
      );
    case 'messages':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-envelope text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Messages</h2>
            <p className="text-gray-600">Message center coming soon...</p>
          </div>
        </div>
      );
    case 'reports':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-chart-bar text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Reports</h2>
            <p className="text-gray-600">Analytics and reports coming soon...</p>
          </div>
        </div>
      );
    case 'profile':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-user text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile</h2>
            <p className="text-gray-600">Profile management coming soon...</p>
          </div>
        </div>
      );
    case 'settings':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-cog text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Settings</h2>
            <p className="text-gray-600">Settings and preferences coming soon...</p>
          </div>
        </div>
      );
    default:
      return renderDashboard();
  }
};

export default AgentDashboard;
