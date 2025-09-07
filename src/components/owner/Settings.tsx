import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/lib/notificationService';
import { OwnerService } from '@/lib/ownerService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, ChevronDown, Key, Download, Trash2, ArrowLeft, Settings as SettingsIcon, X, Eye, EyeOff } from 'lucide-react';

interface SettingsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  embedded?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab, embedded = false }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationList, setNotificationList] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
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

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Load user settings on component mount
  useEffect(() => {
    // Simulate loading user settings
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Load stored settings from localStorage
        loadStoredSettings();
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // In real app, load from API
        console.log('Settings loaded for user:', user?.email);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadSettings();
    }
  }, [user]);

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingNotifications(true);
      const notificationsData = await NotificationService.getUserNotifications(user.id);
      setNotificationList(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
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

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.is_read) {
        await NotificationService.markAsRead(notification.id);
        setNotificationList(prev => prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await NotificationService.markAllAsRead(user.id);
      setNotificationList(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Save settings function
  const saveSettings = async (settingsType: string, data: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store in localStorage for persistence
      const settingsKey = `picnify_${settingsType}_settings`;
      localStorage.setItem(settingsKey, JSON.stringify(data));
      
      toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings saved successfully!`);
      console.log(`Saving ${settingsType}:`, data);
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error(`Failed to save ${settingsType} settings. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings from localStorage
  const loadStoredSettings = () => {
    try {
      const notificationSettings = localStorage.getItem('picnify_notification_settings');
      const privacySettings = localStorage.getItem('picnify_privacy_settings');
      
      if (notificationSettings) {
        const parsed = JSON.parse(notificationSettings);
        setNotificationSettings(prev => ({ ...prev, ...parsed }));
      }
      
      if (privacySettings) {
        const parsed = JSON.parse(privacySettings);
        setPrivacy(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading stored settings:', error);
    }
  };

  // Handle notification changes
  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotificationSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newNotificationSettings);
    saveSettings('notification', newNotificationSettings);
  };

  // Handle privacy changes
  const handlePrivacyChange = (key: string, value: boolean) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);
    saveSettings('privacy', newPrivacy);
  };

  // Handle password change functionality
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return errors;
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordErrors([]);
      
      // Validate form
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordErrors(['All fields are required']);
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordErrors(['New passwords do not match']);
        return;
      }

      // Validate new password strength
      const validationErrors = validatePassword(passwordForm.newPassword);
      if (validationErrors.length > 0) {
        setPasswordErrors(validationErrors);
        return;
      }

      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        setPasswordErrors([error.message || 'Failed to update password']);
        return;
      }

      // Success
      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors([]);

    } catch (error) {
      console.error('Password change error:', error);
      setPasswordErrors(['An unexpected error occurred. Please try again.']);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors([]);
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  };

  // Handle account action
  // Handle data export functionality
  const handleDataExport = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Fetch actual data from database
      const [bookings, reviews, earnings] = await Promise.all([
        OwnerService.getOwnerBookings(user.id).catch(() => []),
        OwnerService.getOwnerReviews(user.id).catch(() => []),
        OwnerService.getOwnerEarnings(user.id).catch(() => null)
      ]);

      // Get properties data
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
      }

      // Create comprehensive data export
      const exportData = {
        user_profile: {
          name: user?.full_name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          role: user?.role || '',
          created_at: user?.created_at || '',
          last_sign_in: user?.created_at || '',
          user_id: user.id
        },
        properties: {
          total_count: properties?.length || 0,
          properties: properties?.map(p => ({
            id: p.id,
            title: p.title,
            property_type: p.property_type,
            status: p.status,
            created_at: p.created_at,
            rating: p.rating,
            review_count: p.review_count,
            max_guests: p.max_guests,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms
          })) || []
        },
        bookings: {
          total_count: bookings.length,
          bookings: bookings.map(b => ({
            id: b.id,
            property_title: b.property_title,
            guest_name: b.guest_name,
            check_in_date: b.check_in_date,
            check_out_date: b.check_out_date,
            status: b.status,
            total_amount: b.total_amount,
            guests_count: b.guests_count,
            nights: b.nights,
            created_at: b.created_at
          }))
        },
        reviews: {
          total_count: reviews.length,
          reviews: reviews.map(r => ({
            id: r.id,
            property_title: r.property_title,
            reviewer_name: r.reviewer_name,
            rating: r.rating,
            comment: r.comment,
            response: r.response,
            created_at: r.created_at
          }))
        },
        earnings: earnings ? {
          total_revenue: earnings.total_revenue,
          monthly_earnings: earnings.monthly_earnings,
          pending_payments: earnings.pending_payments,
          completed_transactions: earnings.completed_transactions,
          commission_rate: earnings.commission_rate
        } : null,
        settings: {
          notifications: notificationSettings,
          privacy: privacy,
          account: accountSettings
        },
        export_metadata: {
          exported_at: new Date().toISOString(),
          exported_by: user?.email || 'Unknown',
          data_version: '2.0',
          total_records: (properties?.length || 0) + bookings.length + reviews.length
        }
      };

      // Convert to JSON with proper formatting
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Create and download the file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `picnify-complete-data-export-${user?.email?.split('@')[0] || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Data export downloaded successfully! Exported ${exportData.export_metadata.total_records} records.`);
      console.log('Complete data export completed for:', user?.email);
      
    } catch (error) {
      console.error('Data export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'changePassword':
          // Open password change modal
          setShowPasswordModal(true);
          break;
          
        case 'exportData':
          // Create and download actual data export
          await handleDataExport();
          break;
          
        case 'deleteAccount':
          // Show confirmation dialog
          const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, properties, and bookings.'
          );
          
          if (confirmed) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.error('Account deletion requires additional verification. Please contact support at support@picnify.com for assistance.');
            console.log('Account deletion requested for:', user?.email);
          } else {
            toast.info('Account deletion cancelled.');
          }
          break;
          
        default:
          toast.error('Unknown action requested');
      }
    } catch (error) {
      console.error('Account action error:', error);
      toast.error(`Failed to ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}. Please try again.`);
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
    <div className={embedded ? "" : "min-h-screen bg-gray-50"}>
      {/* Sidebar - only show if not embedded */}
      {!embedded && (
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
      )}

      {/* Main Content */}
      <div className={embedded ? "" : `transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer mr-2"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
              <div className="text-sm text-gray-500">
                <span>Manage your account preferences and security</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative notification-dropdown">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading notifications...
                        </div>
                      ) : notificationList.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications yet
                        </div>
                      ) : (
                        notificationList.map((notification) => (
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
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20Indian%20property%20owner%20businessman%20avatar%20headshot%20with%20traditional%20modern%20fusion%20style%20confident%20expression&width=40&height=40&seq=owner-avatar-001&orientation=squarish"
                  alt="Owner Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name || user?.email || 'Host'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
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
                      checked={notificationSettings.emailBookings}
                      onChange={(e) => handleNotificationChange('emailBookings', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Reviews and ratings</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailReviews}
                      onChange={(e) => handleNotificationChange('emailReviews', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payment confirmations</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailPayments}
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
                      checked={notificationSettings.pushBookings}
                      onChange={(e) => handleNotificationChange('pushBookings', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Reviews and ratings</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushReviews}
                      onChange={(e) => handleNotificationChange('pushReviews', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payment confirmations</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushPayments}
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

            {/* Account Actions - Hidden for hosts */}
            {false && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Account</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your account settings</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button 
                    onClick={() => handleAccountAction('changePassword')}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                  >
                    <Key className="h-4 w-4" />
                    <span className="font-medium">{isLoading ? 'Processing...' : 'Change Password'}</span>
                  </button>
                  
                  <button 
                    onClick={() => handleAccountAction('exportData')}
                    disabled={isLoading}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">{isLoading ? 'Processing...' : 'Export Data'}</span>
                  </button>
                  
                  <button 
                    onClick={() => handleAccountAction('deleteAccount')}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">{isLoading ? 'Processing...' : 'Delete Account'}</span>
                  </button>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">Important Notice</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Account actions may take time to process. You will receive email confirmations for all actions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <button
                  onClick={closePasswordModal}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character (@$!%*?&)</li>
                  </ul>
                </div>

                {/* Error Messages */}
                {passwordErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <ul className="text-sm text-red-700 space-y-1">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={closePasswordModal}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;