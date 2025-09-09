import React, { useState } from 'react';
import { NotificationPreferences } from '@/components/shared/NotificationPreferences';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [notifications, setNotifications] = useState({
    emailBookings: true,
    smsUrgent: true,
    weeklyReports: false,
    marketingEmails: false,
    pushNotifications: true,
    soundAlerts: true
  });

  const [privacy, setPrivacy] = useState({
    showInDirectory: true,
    allowDirectContact: true,
    sharePerformanceData: false,
    publicProfile: true
  });

  const [preferences, setPreferences] = useState({
    language: 'English',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light'
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
            <div className="text-sm text-gray-500">
              <span>Manage your account and application preferences</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <span className="mr-2">💾</span>
              Save All Changes
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <span className="mr-2">🔄</span>
              Reset to Default
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'account', label: 'Account Settings', icon: '👤' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
              { id: 'preferences', label: 'Preferences', icon: '⚙️' },
              { id: 'billing', label: 'Billing & Plans', icon: '💳' },
              { id: 'support', label: 'Help & Support', icon: '❓' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm cursor-pointer ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="vikram.mehta@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="+91 98765 43210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  Update Password
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Account Actions</h3>
              <div className="space-y-4">
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors cursor-pointer">
                  <span className="mr-2">📥</span>
                  Export Account Data
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
                  <span className="mr-2">🗑️</span>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <NotificationPreferences />
        )}

        {activeTab === 'privacy' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Privacy & Security Settings</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Profile Visibility</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Show profile in agent directory</span>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={privacy.showInDirectory}
                      onChange={(e) => handlePrivacyChange('showInDirectory', e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Allow customers to contact directly</span>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={privacy.allowDirectContact}
                      onChange={(e) => handlePrivacyChange('allowDirectContact', e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Public profile page</span>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={privacy.publicProfile}
                      onChange={(e) => handlePrivacyChange('publicProfile', e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Data Sharing</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Share performance data for market insights</span>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={privacy.sharePerformanceData}
                      onChange={(e) => handlePrivacyChange('sharePerformanceData', e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Security</h4>
                <div className="space-y-3">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <span className="mr-2">🔐</span>
                    Enable Two-Factor Authentication
                  </button>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                    <span className="mr-2">📋</span>
                    View Login History
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Application Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी</option>
                  <option value="Marathi">मराठी</option>
                  <option value="Gujarati">ગુજરાતી</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={preferences.currency}
                  onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Current Plan</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-blue-900">Premium Agent Plan</h4>
                    <p className="text-blue-700">₹2,999/month • Next billing: Feb 15, 2025</p>
                    <p className="text-sm text-blue-600 mt-1">✓ Unlimited listings ✓ Priority support ✓ Advanced analytics</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    Manage Plan
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Payment Method</h3>
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-medium">**** **** **** 4532</p>
                  <p className="text-sm text-gray-600">Expires 12/27</p>
                </div>
                <button className="ml-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                  Update
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Billing History</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Jan 2025 - Premium Plan</p>
                    <p className="text-sm text-gray-600">Jan 15, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹2,999</p>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Paid</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Dec 2024 - Premium Plan</p>
                    <p className="text-sm text-gray-600">Dec 15, 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹2,999</p>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Paid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Help & Support</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium mb-2">📚 Knowledge Base</h4>
                  <p className="text-sm text-gray-600">Browse articles and tutorials</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium mb-2">💬 Live Chat</h4>
                  <p className="text-sm text-gray-600">Chat with our support team</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium mb-2">📧 Email Support</h4>
                  <p className="text-sm text-gray-600">Send us a detailed message</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium mb-2">📞 Phone Support</h4>
                  <p className="text-sm text-gray-600">Call us during business hours</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href="mailto:support@picnify.in?subject=Bug%20Report&body=Please%20describe%20the%20issue%20you%20encountered%2C%20including%20steps%20to%20reproduce%20it%3A%0A%0A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-left block"
                  aria-label="Report a bug via email"
                >
                  <span className="mr-2">🐛</span>
                  Report a Bug
                </a>
                <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-left">
                  <span className="mr-2">💡</span>
                  Request a Feature
                </button>
                <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer text-left">
                  <span className="mr-2">📖</span>
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Settings;