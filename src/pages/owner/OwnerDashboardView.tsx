
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerStats } from '@/hooks/useOwnerData';
import { NotificationService } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Bell, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PropertiesNew from '@/components/owner/PropertiesNew';
import Bookings from '@/components/owner/Bookings';
import Earnings from '@/components/owner/Earnings';
import Reviews from '@/components/owner/Reviews';
import Messages from '@/components/owner/Messages';
import Profile from '@/components/owner/Profile';
import Settings from '@/components/owner/Settings';

const OwnerDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { toast } = useToast();
  const { stats, loading: statsLoading, refreshStats } = useOwnerStats(user?.id || '');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setNotificationsLoading(true);
      const userNotifications = await NotificationService.getUserNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark notification as read
    if (!notification.is_read) {
      NotificationService.markAsRead(notification.id, user?.id);
      loadNotifications();
    }

    // Handle notification action
    if (notification.action_url) {
      // Navigate to specific tab based on notification type
      if (notification.action_url.includes('booking')) {
        setActiveTab('bookings');
      } else if (notification.action_url.includes('review')) {
        setActiveTab('reviews');
      } else if (notification.action_url.includes('property')) {
        setActiveTab('properties');
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      if (!user?.id) return;
      
      // Get all notification IDs
      const allNotificationIds = notifications.map(n => n.id);
      
      // Mark all notifications as read in localStorage
      await NotificationService.markAllAsRead(user.id, allNotificationIds);
      
      // Reload notifications to reflect the changes
      loadNotifications();
      
      toast({
        title: "All Notifications Marked as Read",
        description: "All notifications have been marked as read.",
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive",
      });
    }
  };

  // Real-time updates for dashboard stats
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('owner-dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'properties'
      }, (payload) => {
        console.log('🏠 Property updated:', payload);
        // Refresh stats when properties change
        refreshStats();
        loadNotifications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('📅 Booking updated:', payload);
        // Refresh stats when bookings change
        refreshStats();
        loadNotifications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews'
      }, (payload) => {
        console.log('⭐ Review updated:', payload);
        // Refresh stats when reviews change
        refreshStats();
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Load notifications on component mount
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);
  
  // Dashboard state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle deep linking from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['properties', 'bookings', 'earnings', 'reviews', 'profile', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Handle authentication state
  useEffect(() => {
    console.log('🔐 OwnerDashboardView: Auth state check:', { 
      loading, 
      isAuthenticated, 
      user: user ? { id: user.id, email: user.email, role: user.role } : null 
    });
    
    if (loading) {
      console.log('⏳ Auth loading, waiting...');
      return;
    }
    
    if (!isAuthenticated || !user) {
      console.log('❌ User not authenticated, redirecting to owner login');
      navigate('/owner/login', { replace: true });
    } else {
      console.log('✅ User authenticated, showing dashboard');
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/owner/login');
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
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'properties':
        return <PropertiesNew />;
      case 'bookings':
        return (
          <Bookings 
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      case 'earnings':
        return (
          <Earnings 
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      case 'reviews':
        return (
          <Reviews 
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      case 'messages':
        return (
          <Messages 
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      case 'profile':
        return (
          <Profile 
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      case 'settings':
        return (
          <Settings 
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      default:
        return (
          <>
            {/* Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalProperties}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalProperties === 0 ? 'No properties listed yet' : 'Properties listed'}
                    </p>
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
                    <p className="text-xs text-gray-500">
                      {stats.activeBookings === 0 ? 'No bookings yet' : 'Active bookings'}
                    </p>
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
                    <p className="text-2xl font-bold text-gray-800">₹{stats.revenueThisMonth}</p>
                    <p className="text-xs text-gray-500">
                      {stats.revenueThisMonth === 0 ? 'Start listing to earn' : 'This month'}
                    </p>
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
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.averageRating === 0 ? 'No reviews yet' : 'Average rating'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-star text-purple-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Bookings</h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-calendar-plus text-gray-400 text-xl"></i>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">
                    {stats.activeBookings > 0 ? `You have ${stats.activeBookings} active bookings` : 'No bookings yet'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {stats.totalProperties > 0 
                      ? 'Click the button below to view and manage your bookings' 
                      : 'Start by listing your first property to receive bookings'
                    }
                  </p>
                  <button 
                    onClick={() => setActiveTab(stats.totalProperties > 0 ? 'bookings' : 'properties')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <i className={`fas ${stats.totalProperties > 0 ? 'fa-calendar-check' : 'fa-plus'} mr-2`}></i>
                    {stats.totalProperties > 0 ? 'View Bookings' : 'Add Your First Property'}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Messages</h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-envelope text-gray-400 text-xl"></i>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">
                    {stats.activeBookings > 0 ? 'You have messages from guests' : 'No messages yet'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {stats.activeBookings > 0 
                      ? 'Click the button below to view and respond to guest messages' 
                      : 'You\'ll receive messages from guests once you have bookings'
                    }
                  </p>
                  <button 
                    onClick={() => setActiveTab('messages')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <i className="fas fa-envelope mr-2"></i>
                    View Messages
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveTab('properties')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <i className="fas fa-home text-blue-600 mr-3 text-xl"></i>
                    <div>
                      <p className="font-medium text-gray-800">Manage Properties</p>
                      <p className="text-sm text-gray-600">{stats.totalProperties} properties</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('earnings')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <i className="fas fa-chart-line text-green-600 mr-3 text-xl"></i>
                    <div>
                      <p className="font-medium text-gray-800">View Earnings</p>
                      <p className="text-sm text-gray-600">₹{stats.revenueThisMonth} this month</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <i className="fas fa-star text-yellow-600 mr-3 text-xl"></i>
                    <div>
                      <p className="font-medium text-gray-800">Manage Reviews</p>
                      <p className="text-sm text-gray-600">{stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} avg rating` : 'No reviews yet'}</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <i className="fas fa-cog text-purple-600 mr-3 text-xl"></i>
                    <div>
                      <p className="font-medium text-gray-800">Settings</p>
                      <p className="text-sm text-gray-600">Account & preferences</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png"
                alt="Picnify Logo"
                className="h-8 w-auto"
              />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <i className="fas fa-bars text-gray-600"></i>
          </button>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
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
              <h1 className="text-2xl font-semibold text-gray-800">Host Dashboard</h1>
              <div className="text-sm text-gray-500">
                <span>Welcome back, {user?.email || 'Host'}</span>
                <span className="ml-2 text-blue-600">(Role: {user?.role || 'Unknown'})</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={async () => {
                  setIsRefreshing(true);
                  await refreshStats();
                  setIsRefreshing(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                title="Refresh Dashboard Data"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="relative notification-dropdown">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown - Portal Based */}
                {showNotifications && createPortal(
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-25 z-[99998]"
                      onClick={() => setShowNotifications(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="fixed top-20 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-[99999] max-h-96 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <div className="flex items-center space-x-2">
                            {notifications.filter(n => !n.is_read).length > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                Mark all as read
                              </button>
                            )}
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-center">
                            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-400 mt-1">You'll receive notifications about your properties and bookings here</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                                !notification.is_read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  !notification.is_read ? 'bg-blue-500' : 'bg-gray-300'
                                }`}></div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="p-4 border-t">
                          <button
                            onClick={() => setActiveTab('messages')}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>,
                  document.body
                )}
              </div>
              <div className="flex items-center space-x-2 relative group">
                {user?.avatar_url ? (
                  <img
                    key={user.avatar_url}
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'O'}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.email || 'Host'}
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboardView;
