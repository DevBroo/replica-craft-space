import React, { useState } from 'react';
import Properties from '../../components/owner/Properties';
import Bookings from '../../components/owner/Bookings';
import Earnings from '../../components/owner/Earnings';
import Reviews from '../../components/owner/Reviews';
import Profile from '../../components/owner/Profile';
import Settings from '../../components/owner/Settings';

const Index: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'otp' | 'signup' | 'dashboard'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    taxId: ''
  });

  // Dashboard state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleEmailSignIn = () => {
    if (contactValue.trim()) {
      setCurrentView('dashboard');
    }
  };

  const handleSendOTP = () => {
    if (contactValue.trim()) {
      setCurrentView('otp');
      setOtpTimer(60);
      setCanResend(false);
      // Start countdown timer
      const countdown = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleVerifyOTP = () => {
    if (otpValue.length === 6) {
      // Simulate checking if user exists
      const isExistingUser = Math.random() > 0.5; // Random for demo
      if (isExistingUser) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('signup');
      }
    }
  };

  const handleResendOTP = () => {
    setOtpTimer(60);
    setCanResend(false);
    setOtpValue('');
    const countdown = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSignupSubmit = () => {
    setCurrentView('dashboard');
  };

  const handleSignupChange = (field: string, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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

  const renderLoginView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img
              src="https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png"
              alt="Picnify Logo"
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Picnify</h1>
            <p className="text-gray-600">Property Owner Portal</p>
          </div>
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer !rounded-button whitespace-nowrap ${
                loginMethod === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fas fa-envelope mr-2"></i>
              Email
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer !rounded-button whitespace-nowrap ${
                loginMethod === 'phone'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fas fa-phone mr-2"></i>
              Phone
            </button>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <div className="relative">
              <input
                type={loginMethod === 'email' ? 'email' : 'tel'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <i className={`${loginMethod === 'email' ? 'fas fa-envelope' : 'fas fa-phone'} absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400`}></i>
            </div>
          </div>
          {loginMethod === 'email' ? (
            <button
              onClick={handleEmailSignIn}
              disabled={!contactValue.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer !rounded-button whitespace-nowrap mb-6"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </button>
          ) : (
            <button
              onClick={handleSendOTP}
              disabled={!contactValue.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer !rounded-button whitespace-nowrap mb-6"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Send OTP
            </button>
          )}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-6">
              <p>By continuing, you agree to our</p>
              <div className="mt-1">
                <a href="#" className="text-blue-600 hover:text-blue-800 cursor-pointer">Terms of Service</a>
                <span className="mx-1">and</span>
                <a href="#" className="text-blue-600 hover:text-blue-800 cursor-pointer">Privacy Policy</a>
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-gray-600 text-sm">Don't have an account?</p>
              <button
                onClick={() => setCurrentView('signup')}
                className="mt-2 w-full bg-gray-100 text-gray-800 py-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Sign Up as Property Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOTPView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-mobile-alt text-blue-600 text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h1>
            <p className="text-gray-600">
              We've sent a 6-digit code to {contactValue}
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
            <input
              type="text"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
            />
          </div>
          <button
            onClick={handleVerifyOTP}
            disabled={otpValue.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer !rounded-button whitespace-nowrap mb-4"
          >
            <i className="fas fa-check mr-2"></i>
            Verify OTP
          </button>
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResendOTP}
                className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
              >
                <i className="fas fa-redo mr-1"></i>
                Resend OTP
              </button>
            ) : (
              <p className="text-sm text-gray-600">
                Resend OTP in {otpTimer}s
              </p>
            )}
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => setCurrentView('login')}
              className="text-gray-600 hover:text-gray-800 text-sm cursor-pointer"
            >
              <i className="fas fa-arrow-left mr-1"></i>
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSignupView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer mr-4"
            >
              <i className="fas fa-arrow-left text-gray-600"></i>
            </button>
            <div className="flex-1 text-center">
              <img
                src="https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png"
                alt="Picnify Logo"
                className="h-12 w-auto mx-auto mb-4"
              />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Let's set up your property owner account</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSignupSubmit(); }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={signupData.firstName}
                  onChange={(e) => handleSignupChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={signupData.lastName}
                  onChange={(e) => handleSignupChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => handleSignupChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={signupData.phone}
                  onChange={(e) => handleSignupChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={signupData.businessName}
                  onChange={(e) => handleSignupChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                <div className="relative">
                  <select
                    value={signupData.businessType}
                    onChange={(e) => handleSignupChange('businessType', e.target.value)}
                    className="appearance-none w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                  >
                    <option value="">Select type</option>
                    <option value="individual">Individual Owner</option>
                    <option value="company">Company</option>
                    <option value="llc">LLC</option>
                    <option value="partnership">Partnership</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                value={signupData.address}
                onChange={(e) => handleSignupChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  value={signupData.city}
                  onChange={(e) => handleSignupChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  value={signupData.state}
                  onChange={(e) => handleSignupChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                <input
                  type="text"
                  value={signupData.zipCode}
                  onChange={(e) => handleSignupChange('zipCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID (Optional)</label>
              <input
                type="text"
                value={signupData.taxId}
                onChange={(e) => handleSignupChange('taxId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="EIN or SSN"
              />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

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
                <span>Welcome back, Rajesh</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-bell text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">5</span>
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

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-800">12</p>
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
                  <p className="text-2xl font-bold text-gray-800">8</p>
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
                  <p className="text-2xl font-bold text-gray-800">₹18,50,000</p>
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
                  <p className="text-2xl font-bold text-gray-800">4.8</p>
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
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://readdy.ai/api/search-image?query=modern%20vacation%20rental%20property%20exterior%20with%20beautiful%20landscaping%20and%20clean%20architecture%20bright%20natural%20lighting&width=60&height=60&seq=property-thumb-001&orientation=squarish"
                      alt="Property"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Oceanview Villa</p>
                      <p className="text-sm text-gray-600">March 15-22, 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₹1,85,000</p>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Confirmed</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://readdy.ai/api/search-image?query=modern%20luxury%20apartment%20complex%20in%20Ahmedabad%20with%20contemporary%20architecture%20and%20landscaping%20Indian%20style&width=60&height=60&seq=property-thumb-002&orientation=squarish"
                      alt="Property"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Ahmedabad Heights</p>
                      <p className="text-sm text-gray-600">March 20-25, 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₹1,25,000</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Pending</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://readdy.ai/api/search-image?query=beautiful%20villa%20in%20Gandhinagar%20with%20modern%20Indian%20architecture%20and%20garden%20traditional%20elements%20fusion&width=60&height=60&seq=property-thumb-003&orientation=squarish"
                      alt="Property"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Gandhinagar Villa</p>
                      <p className="text-sm text-gray-600">April 1-7, 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">$2,100</p>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Confirmed</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Messages</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <img
                    src="https://readdy.ai/api/search-image?query=modern%20Indian%20professional%20guest%20avatar%20headshot%20with%20friendly%20smile%20traditional%20contemporary%20fusion%20style&width=40&height=40&seq=guest-avatar-001&orientation=squarish"
                    alt="Guest"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">Priya Sharma</p>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Hi! I have a question about the check-in process for next week...</p>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <img
                    src="https://readdy.ai/api/search-image?query=young%20Indian%20business%20professional%20guest%20avatar%20headshot%20with%20confident%20expression%20modern%20style&width=40&height=40&seq=guest-avatar-002&orientation=squarish"
                    alt="Guest"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">Amit Shah</p>
                      <span className="text-xs text-gray-500">5 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Thank you for the wonderful stay! The property was exactly as described.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <img
                    src="https://readdy.ai/api/search-image?query=modern%20Indian%20family%20guest%20avatar%20headshot%20with%20warm%20smile%20contemporary%20professional%20style&width=40&height=40&seq=guest-avatar-003&orientation=squarish"
                    alt="Guest"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">Meera Desai</p>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Is it possible to extend our stay by one more night?</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
                View All Messages
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  // Render based on current view
  switch (currentView) {
    case 'login':
      return renderLoginView();
    case 'otp':
      return renderOTPView();
    case 'signup':
      return renderSignupView();
    case 'dashboard':
      if (activeTab === 'properties') {
        return <Properties 
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
    default:
      return renderLoginView();
  }
};

export default Index;