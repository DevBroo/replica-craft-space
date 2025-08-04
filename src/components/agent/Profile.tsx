import React, { useState } from 'react';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'Vikram',
    lastName: 'Mehta',
    email: 'vikram.mehta@email.com',
    phone: '+91 98765 43210',
    licenseNumber: 'RE12345678',
    agencyName: 'Elite Properties',
    specialization: 'Luxury Properties',
    experience: '8 years',
    address: '123 Business District, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400069',
    bio: 'Experienced real estate agent specializing in luxury properties across Mumbai. Committed to providing exceptional service and finding the perfect match for clients.',
    languages: ['English', 'Hindi', 'Marathi', 'Gujarati'],
    certifications: ['Certified Real Estate Professional', 'Luxury Home Marketing Specialist', 'Property Investment Advisor']
  });

  const stats = {
    totalSales: 245,
    totalCommission: 2850000,
    avgDealSize: 1850000,
    clientSatisfaction: 4.8,
    activeListings: 23,
    soldThisMonth: 12
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-800">Agent Profile</h1>
            <div className="text-sm text-gray-500">
              <span>Manage your professional information</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <span className="mr-2">💾</span>
                  Save Changes
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <span className="mr-2">❌</span>
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <span className="mr-2">✏️</span>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Header Card */}
      <div className="p-6 bg-white border-b">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-6">
            <img
              src="https://readdy.ai/api/search-image?query=professional%20Indian%20real%20estate%20agent%20avatar%20headshot%20vikram%20confident%20friendly%20expression%20modern%20business%20attire%20clean%20background&width=120&height=120&seq=agent-profile-001&orientation=squarish"
              alt="Agent Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profileData.firstName} {profileData.lastName}</h2>
              <p className="text-blue-100 text-lg">{profileData.specialization}</p>
              <p className="text-blue-100">{profileData.agencyName} • {profileData.experience} experience</p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center">
                  <span className="mr-1">⭐</span>
                  <span>{stats.clientSatisfaction} Rating</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-1">🏆</span>
                  <span>{stats.totalSales} Sales</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-1">💰</span>
                  <span>₹{(stats.totalCommission / 100000).toFixed(1)}L Commission</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="p-6 bg-white border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Sales</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
                <p className="text-green-100 text-sm mt-1">Lifetime</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                <span className="text-xl">🏠</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg Deal Size</p>
                <p className="text-2xl font-bold">₹{(stats.avgDealSize / 100000).toFixed(1)}L</p>
                <p className="text-purple-100 text-sm mt-1">Per transaction</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                <span className="text-xl">💎</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">This Month</p>
                <p className="text-2xl font-bold">{stats.soldThisMonth}</p>
                <p className="text-orange-100 text-sm mt-1">Properties sold</p>
              </div>
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
                <span className="text-xl">📈</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'personal', label: 'Personal Info', icon: '👤' },
              { id: 'professional', label: 'Professional Details', icon: '💼' },
              { id: 'performance', label: 'Performance', icon: '📊' },
              { id: 'settings', label: 'Account Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === tab.id
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
        {activeTab === 'personal' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.phone}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.bio}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'professional' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <p className="text-gray-900">{profileData.licenseNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name</label>
                  <p className="text-gray-900">{profileData.agencyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <p className="text-gray-900">{profileData.specialization}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <p className="text-gray-900">{profileData.experience}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Languages & Certifications</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.languages.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  <div className="space-y-2">
                    {profileData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-900">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <span className="text-4xl text-gray-400 mb-2">📈</span>
                  <p className="text-gray-500">Sales performance chart</p>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <span className="text-4xl text-gray-400 mb-2">🎯</span>
                  <p className="text-gray-500">Goal achievement chart</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Account Settings</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-gray-700">Email notifications for new bookings</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-gray-700">SMS notifications for urgent matters</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2 text-gray-700">Weekly performance reports</span>
                  </label>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Privacy</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-gray-700">Show profile in agent directory</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2 text-gray-700">Allow customers to contact directly</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Profile;