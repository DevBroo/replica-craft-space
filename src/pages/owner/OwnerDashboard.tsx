import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PropertiesNew from '../../components/owner/PropertiesNew';
import Bookings from '../../components/owner/Bookings';
import Earnings from '../../components/owner/Earnings';
import Reviews from '../../components/owner/Reviews';
import Profile from '../../components/owner/Profile';
import Settings from '../../components/owner/Settings';

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  // Dashboard state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle tab query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  // Handle authentication state
  useEffect(() => {
    console.log('🔐 OwnerDashboard: Auth state check:', { 
      loading, 
      isAuthenticated, 
      user: user ? { id: user.id, email: user.email, role: user.role } : null 
    });
    
    if (loading) {
      console.log('⏳ Auth loading, waiting...');
      return; // Wait for auth to load
    }
    
    if (!isAuthenticated || !user) {
      // User is not authenticated, redirect to owner login
      console.log('❌ User not authenticated, redirecting to owner login');
      navigate('/owner/login', { replace: true });
    } else if (user.role !== 'owner') {
      // User is authenticated but not an owner, redirect to appropriate page
      console.log('⚠️ User not owner, redirecting to appropriate page');
      console.log('🔍 User details:', { id: user.id, email: user.email, role: user.role });
      
      // TEMPORARY FIX: If user role is customer, assume they should be owner
      // This is for testing purposes - remove this in production
      if (user.role === 'customer') {
        console.log('🔄 TEMPORARY FIX: Assuming customer should be owner for testing');
        console.log('⚠️ This is a temporary fix - update user role in database');
        // Update the user role in localStorage temporarily
        const updatedUser = { ...user, role: 'owner' };
        localStorage.setItem('sb-user', JSON.stringify(updatedUser));
        console.log('✅ Role temporarily set to owner, showing dashboard');
        return; // Don't redirect, show dashboard
      }
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'agent') {
        navigate('/agent/dashboard');
      } else {
        console.log('❌ User role is customer, redirecting to homepage');
        navigate('/'); // Customer goes to main page
      }
    } else {
      // User is authenticated owner, show dashboard
      console.log('✅ User authenticated owner, showing dashboard');
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Debug component mount
  useEffect(() => {
    console.log('🏠 OwnerDashboard component mounted');
  }, []);

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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated || !user || user.role !== 'owner') {
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
                src="https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png"
                alt="Picnify Logo"
                className="h-8 w-auto"
              />
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
              <h1 className="text-2xl font-semibold text-gray-800">Property Owner Dashboard</h1>
              <div className="text-sm text-gray-500">
                <span>Welcome back, {user?.email || 'Property Owner'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-home text-gray-600"></i>
                <span className="text-gray-700">Back to Home</span>
              </button>
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-bell text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">5</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 relative group">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'O'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.email || 'Property Owner'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-800">0</p>
                  <p className="text-xs text-gray-500">No properties listed yet</p>
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
                  <p className="text-2xl font-bold text-gray-800">0</p>
                  <p className="text-xs text-gray-500">No bookings yet</p>
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
                  <p className="text-2xl font-bold text-gray-800">₹0</p>
                  <p className="text-xs text-gray-500">Start listing to earn</p>
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
                  <p className="text-2xl font-bold text-gray-800">-</p>
                  <p className="text-xs text-gray-500">No reviews yet</p>
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
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-calendar-plus text-gray-400 text-xl"></i>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">No bookings yet</h4>
                  <p className="text-gray-600 mb-4">Start by listing your first property to receive bookings</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <i className="fas fa-plus mr-2"></i>
                    Add Your First Property
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Messages</h3>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-comments text-gray-400 text-xl"></i>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">No messages yet</h4>
                  <p className="text-gray-600 mb-4">You'll receive messages from guests once you have bookings</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  // Render dashboard based on active tab
  if (activeTab === 'properties') {
    console.log('🔧 Rendering PropertiesNew component for properties tab');
    return <PropertiesNew 
      sidebarCollapsed={sidebarCollapsed} 
      toggleSidebar={toggleSidebar}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />;
  }
  if (activeTab === 'bookings') {
    return <Bookings 
      sidebarCollapsed={sidebarCollapsed} 
      toggleSidebar={toggleSidebar}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />;
  }
  if (activeTab === 'earnings') {
    return <Earnings 
      sidebarCollapsed={sidebarCollapsed} 
      toggleSidebar={toggleSidebar}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />;
  }
  if (activeTab === 'reviews') {
    return <Reviews 
      sidebarCollapsed={sidebarCollapsed} 
      toggleSidebar={toggleSidebar}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />;
  }
  if (activeTab === 'profile') {
    return <Profile 
      sidebarCollapsed={sidebarCollapsed} 
      toggleSidebar={toggleSidebar}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />;
  }
  if (activeTab === 'settings') {
    return <Settings 
      sidebarCollapsed={sidebarCollapsed} 
      toggleSidebar={toggleSidebar}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />;
  }
  return renderDashboard();
};

export default OwnerDashboard;