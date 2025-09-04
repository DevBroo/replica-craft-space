import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SettingsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailReviews: true,
    emailPayments: true,
    pushBookings: false,
    pushReviews: true,
    pushPayments: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showContactInfo: false,
    allowMessaging: true
  });

  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    dataRetention: '1year'
  });

  // Load user settings on component mount
  useEffect(() => {
    // Simulate loading user settings
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // In real app, load from API
        console.log('Settings loaded for user:', user?.email);
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadSettings();
    }
  }, [user]);

  // Save settings function
  const saveSettings = async (settingsType: string, data: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`${settingsType} settings saved successfully!`);
      console.log(`Saving ${settingsType}:`, data);
    } catch (error) {
      toast.error(`Failed to save ${settingsType} settings`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification changes
  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    saveSettings('notification', newNotifications);
  };

  // Handle privacy changes
  const handlePrivacyChange = (key: string, value: boolean) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);
    saveSettings('privacy', newPrivacy);
  };

  // Handle account action
  const handleAccountAction = async (action: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      switch (action) {
        case 'changePassword':
          toast.success('Password change email sent!');
          break;
        case 'exportData':
          toast.success('Data export started! You will receive an email when ready.');
          break;
        case 'deleteAccount':
          toast.error('Account deletion requires additional verification. Please contact support.');
          break;
      }
    } catch (error) {
      toast.error(`Failed to ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'properties', label: 'My Properties', icon: 'fas fa-home' },
    { id: 'bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
    { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
    { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

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
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer mr-2"
              >
                <i className="fas fa-arrow-left text-gray-600"></i>
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
              <div className="text-sm text-gray-500">
                <span>Manage your account preferences and security</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-bell text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20Indian%20property%20owner%20businessman%20avatar%20headshot%20with%20traditional%20modern%20fusion%20style%20confident%20expression&width=40&height=40&seq=owner-avatar-001&orientation=squarish"
                  alt="Owner Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || user?.email || 'Property Owner'}
                </span>
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                <p className="text-sm text-gray-600 mt-1">Manage how you receive notifications</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  </div>
                </div>
                <div className="space-y-3 ml-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">New bookings</span>
                    <input
                      type="checkbox"
                      checked={notifications.emailBookings}
                      onChange={(e) => handleNotificationChange('emailBookings', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Reviews and ratings</span>
                    <input
                      type="checkbox"
                      checked={notifications.emailReviews}
                      onChange={(e) => handleNotificationChange('emailReviews', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payment confirmations</span>
                    <input
                      type="checkbox"
                      checked={notifications.emailPayments}
                      onChange={(e) => handleNotificationChange('emailPayments', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                  </div>
                </div>
                <div className="space-y-3 ml-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">New bookings</span>
                    <input
                      type="checkbox"
                      checked={notifications.pushBookings}
                      onChange={(e) => handleNotificationChange('pushBookings', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Reviews and ratings</span>
                    <input
                      type="checkbox"
                      checked={notifications.pushReviews}
                      onChange={(e) => handleNotificationChange('pushReviews', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payment confirmations</span>
                    <input
                      type="checkbox"
                      checked={notifications.pushPayments}
                      onChange={(e) => handleNotificationChange('pushPayments', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Privacy & Security</h3>
                <p className="text-sm text-gray-600 mt-1">Control your privacy and security settings</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Public profile</span>
                    <p className="text-xs text-gray-600">Make your profile visible to guests</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.profileVisible}
                    onChange={(e) => handlePrivacyChange('profileVisible', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Show contact information</span>
                    <p className="text-xs text-gray-600">Display phone and email on public profile</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showContactInfo}
                    onChange={(e) => handlePrivacyChange('showContactInfo', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Allow messaging</span>
                    <p className="text-xs text-gray-600">Let guests send you direct messages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.allowMessaging}
                    onChange={(e) => handlePrivacyChange('allowMessaging', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Account</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your account settings</p>
              </div>
              <div className="p-6 space-y-4">
                <button 
                  onClick={() => handleAccountAction('changePassword')}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-key mr-2"></i>
                  {isLoading ? 'Processing...' : 'Change Password'}
                </button>
                <button 
                  onClick={() => handleAccountAction('exportData')}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer ml-0 sm:ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-download mr-2"></i>
                  {isLoading ? 'Processing...' : 'Export Data'}
                </button>
                <button 
                  onClick={() => handleAccountAction('deleteAccount')}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer ml-0 sm:ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-trash mr-2"></i>
                  {isLoading ? 'Processing...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;