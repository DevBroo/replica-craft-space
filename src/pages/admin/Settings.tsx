import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Gauge, 
  Users, 
  User, 
  Home, 
  Calendar, 
  DollarSign, 
  Edit, 
  Bell, 
  Headphones, 
  Settings as SettingsIcon,
  ChevronDown,
  Search,
  Save,
  RotateCcw
} from 'lucide-react';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');

  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Picnify Admin Portal',
    language: 'en',
    timezone: 'UTC-05:00',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12',
    maintenanceMode: false,
    debugMode: false,
    autoBackup: true,
    backupFrequency: 'daily'
  });

  const [userSettings, setUserSettings] = useState({
    defaultRole: 'user',
    autoActivateUsers: false,
    passwordComplexity: 'medium',
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    twoFactorRequired: false,
    emailVerificationRequired: true,
    allowSelfRegistration: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    systemAlerts: true,
    securityAlerts: true,
    maintenanceNotifications: true,
    userActivityNotifications: false,
    bookingNotifications: true,
    paymentNotifications: true,
    reviewNotifications: false,
    notificationFrequency: 'immediate',
    digestEmail: 'daily'
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: '8',
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    passwordExpiration: '90',
    twoFactorAuthentication: false,
    ipWhitelist: '',
    sessionSecurity: 'high',
    loginLogging: true,
    failedLoginNotification: true,
    automaticLogout: true,
    securityQuestions: false
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    sidebarStyle: 'expanded',
    compactMode: false,
    showBreadcrumbs: true,
    showNotificationBadges: true,
    animationsEnabled: true,
    customLogo: '',
    favicon: ''
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge, path: '/dashboard' },
    { id: 'owners', label: 'Owner Management', icon: Users, path: '/owner-management' },
    { id: 'agents', label: 'Agent Management', icon: User, path: '/agent-management' },
    { id: 'properties', label: 'Property Approval', icon: Home, path: '/property-approval' },
    { id: 'bookings', label: 'Booking Management', icon: Calendar, path: '/booking-management' },
    { id: 'commission', label: 'Commission & Disbursement', icon: DollarSign, path: '/commission-disbursement' },
    { id: 'cms', label: 'CMS Management', icon: Edit, path: '/cms-management' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications-management' },
    { id: 'support', label: 'Support Tickets', icon: Headphones, path: '/support-tickets' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const settingsTabs = [
    { id: 'general', label: 'General Settings', icon: SettingsIcon },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Home },
    { id: 'appearance', label: 'Appearance', icon: Edit }
  ];

  const handleSaveSettings = () => {
    console.log('Settings saved successfully');
  };

  const handleResetSettings = () => {
    console.log('Settings reset to defaults');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
          <input
            type="text"
            value={generalSettings.systemName}
            onChange={(e) => setGeneralSettings({...generalSettings, systemName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <div className="relative">
            <select
              value={generalSettings.language}
              onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <div className="relative">
            <select
              value={generalSettings.timezone}
              onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="UTC-05:00">Eastern Time (UTC-05:00)</option>
              <option value="UTC-06:00">Central Time (UTC-06:00)</option>
              <option value="UTC-07:00">Mountain Time (UTC-07:00)</option>
              <option value="UTC-08:00">Pacific Time (UTC-08:00)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
          <div className="relative">
            <select
              value={generalSettings.dateFormat}
              onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
          <div className="flex space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                value="12"
                checked={generalSettings.timeFormat === '12'}
                onChange={(e) => setGeneralSettings({...generalSettings, timeFormat: e.target.value})}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm">12 Hour</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                value="24"
                checked={generalSettings.timeFormat === '24'}
                onChange={(e) => setGeneralSettings({...generalSettings, timeFormat: e.target.value})}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm">24 Hour</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
          <div className="relative">
            <select
              value={generalSettings.backupFrequency}
              onChange={(e) => setGeneralSettings({...generalSettings, backupFrequency: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">System Options</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
              <p className="text-xs text-gray-500">Enable system maintenance mode</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={generalSettings.maintenanceMode}
                onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${generalSettings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${generalSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Debug Mode</span>
              <p className="text-xs text-gray-500">Enable system debug logging</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={generalSettings.debugMode}
                onChange={(e) => setGeneralSettings({...generalSettings, debugMode: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${generalSettings.debugMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${generalSettings.debugMode ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Auto Backup</span>
              <p className="text-xs text-gray-500">Automatic system backups</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={generalSettings.autoBackup}
                onChange={(e) => setGeneralSettings({...generalSettings, autoBackup: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${generalSettings.autoBackup ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${generalSettings.autoBackup ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Default User Role</label>
          <div className="relative">
            <select
              value={userSettings.defaultRole}
              onChange={(e) => setUserSettings({...userSettings, defaultRole: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="user">User</option>
              <option value="agent">Agent</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password Complexity</label>
          <div className="relative">
            <select
              value={userSettings.passwordComplexity}
              onChange={(e) => setUserSettings({...userSettings, passwordComplexity: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            value={userSettings.sessionTimeout}
            onChange={(e) => setUserSettings({...userSettings, sessionTimeout: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            min="5"
            max="480"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
          <input
            type="number"
            value={userSettings.maxLoginAttempts}
            onChange={(e) => setUserSettings({...userSettings, maxLoginAttempts: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            min="3"
            max="10"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">User Management Options</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Auto-activate Users</span>
              <p className="text-xs text-gray-500">Automatically activate new user accounts</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={userSettings.autoActivateUsers}
                onChange={(e) => setUserSettings({...userSettings, autoActivateUsers: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${userSettings.autoActivateUsers ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${userSettings.autoActivateUsers ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Two-Factor Required</span>
              <p className="text-xs text-gray-500">Require 2FA for all users</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={userSettings.twoFactorRequired}
                onChange={(e) => setUserSettings({...userSettings, twoFactorRequired: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${userSettings.twoFactorRequired ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${userSettings.twoFactorRequired ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Email Verification</span>
              <p className="text-xs text-gray-500">Require email verification for new accounts</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={userSettings.emailVerificationRequired}
                onChange={(e) => setUserSettings({...userSettings, emailVerificationRequired: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${userSettings.emailVerificationRequired ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${userSettings.emailVerificationRequired ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Self Registration</span>
              <p className="text-xs text-gray-500">Allow users to register themselves</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={userSettings.allowSelfRegistration}
                onChange={(e) => setUserSettings({...userSettings, allowSelfRegistration: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${userSettings.allowSelfRegistration ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${userSettings.allowSelfRegistration ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
          <div className="relative">
            <select
              value={notificationSettings.notificationFrequency}
              onChange={(e) => setNotificationSettings({...notificationSettings, notificationFrequency: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Digest Email</label>
          <div className="relative">
            <select
              value={notificationSettings.digestEmail}
              onChange={(e) => setNotificationSettings({...notificationSettings, digestEmail: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Notification Types</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Email Notifications</span>
              <p className="text-xs text-gray-500">Receive notifications via email</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notificationSettings.emailNotifications ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">System Alerts</span>
              <p className="text-xs text-gray-500">System status and error alerts</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={notificationSettings.systemAlerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${notificationSettings.systemAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notificationSettings.systemAlerts ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Security Alerts</span>
              <p className="text-xs text-gray-500">Security-related notifications</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={notificationSettings.securityAlerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, securityAlerts: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${notificationSettings.securityAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notificationSettings.securityAlerts ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Maintenance Notifications</span>
              <p className="text-xs text-gray-500">System maintenance updates</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={notificationSettings.maintenanceNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, maintenanceNotifications: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${notificationSettings.maintenanceNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notificationSettings.maintenanceNotifications ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Booking Notifications</span>
              <p className="text-xs text-gray-500">New bookings and updates</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={notificationSettings.bookingNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, bookingNotifications: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${notificationSettings.bookingNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notificationSettings.bookingNotifications ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Payment Notifications</span>
              <p className="text-xs text-gray-500">Payment and transaction alerts</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={notificationSettings.paymentNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, paymentNotifications: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${notificationSettings.paymentNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notificationSettings.paymentNotifications ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
          <input
            type="number"
            value={securitySettings.passwordMinLength}
            onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            min="6"
            max="32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiration (days)</label>
          <input
            type="number"
            value={securitySettings.passwordExpiration}
            onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiration: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            min="30"
            max="365"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Session Security Level</label>
        <div className="relative">
          <select
            value={securitySettings.sessionSecurity}
            onChange={(e) => setSecuritySettings({...securitySettings, sessionSecurity: e.target.value})}
            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">IP Whitelist</label>
        <textarea
          value={securitySettings.ipWhitelist}
          onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
          placeholder="Enter IP addresses separated by commas"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty to allow all IP addresses</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Security Options</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Require Uppercase</span>
              <p className="text-xs text-gray-500">Password must contain uppercase letters</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireUppercase}
                onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireUppercase: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${securitySettings.passwordRequireUppercase ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${securitySettings.passwordRequireUppercase ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Require Numbers</span>
              <p className="text-xs text-gray-500">Password must contain numbers</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireNumbers}
                onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireNumbers: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${securitySettings.passwordRequireNumbers ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${securitySettings.passwordRequireNumbers ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
              <p className="text-xs text-gray-500">Enable 2FA for enhanced security</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorAuthentication}
                onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuthentication: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${securitySettings.twoFactorAuthentication ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${securitySettings.twoFactorAuthentication ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Login Logging</span>
              <p className="text-xs text-gray-500">Log all login attempts</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={securitySettings.loginLogging}
                onChange={(e) => setSecuritySettings({...securitySettings, loginLogging: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${securitySettings.loginLogging ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${securitySettings.loginLogging ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Failed Login Notification</span>
              <p className="text-xs text-gray-500">Notify on failed login attempts</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={securitySettings.failedLoginNotification}
                onChange={(e) => setSecuritySettings({...securitySettings, failedLoginNotification: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${securitySettings.failedLoginNotification ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${securitySettings.failedLoginNotification ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Automatic Logout</span>
              <p className="text-xs text-gray-500">Auto logout on inactivity</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={securitySettings.automaticLogout}
                onChange={(e) => setSecuritySettings({...securitySettings, automaticLogout: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${securitySettings.automaticLogout ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${securitySettings.automaticLogout ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
          <div className="flex space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={appearanceSettings.theme === 'light'}
                onChange={(e) => setAppearanceSettings({...appearanceSettings, theme: e.target.value})}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm">Light</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={appearanceSettings.theme === 'dark'}
                onChange={(e) => setAppearanceSettings({...appearanceSettings, theme: e.target.value})}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm">Dark</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={appearanceSettings.theme === 'auto'}
                onChange={(e) => setAppearanceSettings({...appearanceSettings, theme: e.target.value})}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm">Auto</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Style</label>
          <div className="relative">
            <select
              value={appearanceSettings.sidebarStyle}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, sidebarStyle: e.target.value})}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="expanded">Expanded</option>
              <option value="collapsed">Collapsed</option>
              <option value="mini">Mini</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={appearanceSettings.primaryColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={appearanceSettings.primaryColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={appearanceSettings.secondaryColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, secondaryColor: e.target.value})}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={appearanceSettings.secondaryColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, secondaryColor: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Display Options</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Compact Mode</span>
              <p className="text-xs text-gray-500">Reduce spacing and padding</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={appearanceSettings.compactMode}
                onChange={(e) => setAppearanceSettings({...appearanceSettings, compactMode: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${appearanceSettings.compactMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${appearanceSettings.compactMode ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Show Breadcrumbs</span>
              <p className="text-xs text-gray-500">Display navigation breadcrumbs</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={appearanceSettings.showBreadcrumbs}
                onChange={(e) => setAppearanceSettings({...appearanceSettings, showBreadcrumbs: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${appearanceSettings.showBreadcrumbs ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${appearanceSettings.showBreadcrumbs ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Notification Badges</span>
              <p className="text-xs text-gray-500">Show notification count badges</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={appearanceSettings.showNotificationBadges}
                onChange={(e) => setAppearanceSettings({...appearanceSettings, showNotificationBadges: e.target.checked})}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${appearanceSettings.showNotificationBadges ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${appearanceSettings.showNotificationBadges ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

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
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = item.id === 'settings';
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                  isActive ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-600'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
              <div className="text-sm text-gray-500">
                <span>Super Admin Panel</span> / <span className="text-blue-600">Settings</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20business%20person%20avatar%20headshot%20with%20clean%20background%20modern%20corporate%20style&width=40&height=40&seq=admin-avatar-settings&orientation=squarish"
                  alt="Super Admin Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">Super Admin</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Settings Tabs */}
        <div className="bg-white border-b px-6">
          <div className="flex space-x-8">
            {settingsTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm cursor-pointer flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'users' && renderUserSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
              <button
                onClick={handleResetSettings}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
