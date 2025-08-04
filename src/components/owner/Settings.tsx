import React, { useState } from 'react';

interface SettingsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
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
                <span className="text-sm font-medium text-gray-700">Rajesh Patel</span>
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
                      onChange={(e) => setNotifications({...notifications, emailBookings: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Reviews and ratings</span>
                    <input
                      type="checkbox"
                      checked={notifications.emailReviews}
                      onChange={(e) => setNotifications({...notifications, emailReviews: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payment confirmations</span>
                    <input
                      type="checkbox"
                      checked={notifications.emailPayments}
                      onChange={(e) => setNotifications({...notifications, emailPayments: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      onChange={(e) => setNotifications({...notifications, pushBookings: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Reviews and ratings</span>
                    <input
                      type="checkbox"
                      checked={notifications.pushReviews}
                      onChange={(e) => setNotifications({...notifications, pushReviews: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payment confirmations</span>
                    <input
                      type="checkbox"
                      checked={notifications.pushPayments}
                      onChange={(e) => setNotifications({...notifications, pushPayments: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    onChange={(e) => setPrivacy({...privacy, profileVisible: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    onChange={(e) => setPrivacy({...privacy, showContactInfo: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    onChange={(e) => setPrivacy({...privacy, allowMessaging: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <i className="fas fa-key mr-2"></i>
                  Change Password
                </button>
                <button className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer ml-0 sm:ml-2">
                  <i className="fas fa-download mr-2"></i>
                  Export Data
                </button>
                <button className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer ml-0 sm:ml-2">
                  <i className="fas fa-trash mr-2"></i>
                  Delete Account
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