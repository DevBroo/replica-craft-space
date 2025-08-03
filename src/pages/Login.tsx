import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'bookings' | 'profile' | 'settings'>('dashboard');
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp' | 'google'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let formData = new URLSearchParams();
    if (loginMethod === 'email') {
      formData.append('email', email);
      formData.append('password', password);
      formData.append('login_method', 'email');
    } else if (loginMethod === 'otp') {
      formData.append('mobile', mobile);
      formData.append('otp', otp);
      formData.append('login_method', 'otp');
    } else if (loginMethod === 'google') {
      formData.append('login_method', 'google');
    }

    try {
      const response = await fetch('https://readdy.ai/api/form/d23simbnpq37em5ubapg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (response.ok) {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
        successMessage.textContent = 'Login successful!';
        document.body.appendChild(successMessage);
        // Remove success message after 3 seconds
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
        // Set logged in state
        setIsLoggedIn(true);
        setCurrentUser({
          name: 'John Doe',
          email: email || 'user@example.com',
          avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20a%20business%20person%20with%20clean%20white%20background&width=64&height=64&seq=user-avatar-1&orientation=squarish'
        });
      } else {
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
        errorMessage.textContent = 'Login failed. Please try again.';
        document.body.appendChild(errorMessage);
        // Remove error message after 3 seconds
        setTimeout(() => {
          errorMessage.remove();
        }, 3000);
      }
    } catch (error) {
      // Show error message for network issues
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
      errorMessage.textContent = 'Network error. Please check your connection.';
      document.body.appendChild(errorMessage);
      // Remove error message after 3 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setEmail('');
    setPassword('');
    setMobile('');
    setOtp('');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-16">
              <div className="flex items-center space-x-2">
                <img src="/lovable-uploads/4a6c26a9-df9d-4bbe-a6d2-acb1b3d99100.png" alt="Picnify Logo" className="h-8" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Login Form Container */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your account to continue</p>
              </div>

              {/* Login Method Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap !rounded-button ${
                    loginMethod === 'email'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap !rounded-button ${
                    loginMethod === 'otp'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Phone
                </button>
                <button
                  onClick={() => setLoginMethod('google')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap !rounded-button ${
                    loginMethod === 'google'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Google
                </button>
              </div>

              {/* Login Forms */}
              <form onSubmit={handleLogin} className="space-y-6" data-readdy-form>
                {loginMethod === 'email' && (
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-envelope text-gray-400 text-sm"></i>
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-lock text-gray-400 text-sm"></i>
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400 text-sm`}></i>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {loginMethod === 'otp' && (
                  <>
                    <div>
                      <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-phone text-gray-400 text-sm"></i>
                        </div>
                        <input
                          id="mobile"
                          name="mobile"
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          placeholder="Enter your mobile number"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                        OTP Code
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-key text-gray-400 text-sm"></i>
                        </div>
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                        />
                      </div>
                      <button
                        type="button"
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 cursor-pointer whitespace-nowrap"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </>
                )}

                {loginMethod === 'google' && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer whitespace-nowrap !rounded-button"
                    >
                      <i className="fab fa-google text-red-500 mr-3"></i>
                      Continue with Google
                    </button>
                    <p className="mt-4 text-sm text-gray-600">
                      Click the button above to sign in with your Google account
                    </p>
                  </div>
                )}

                {loginMethod !== 'google' && (
                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors cursor-pointer whitespace-nowrap !rounded-button"
                    >
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Sign In
                    </button>
                  </div>
                )}
              </form>

              {/* Forgot Password Link */}
              <div className="text-center mt-6">
                <a
                  href="#"
                  className="text-sm text-red-600 hover:text-red-500 cursor-pointer"
                >
                  Forgot your password?
                </a>
              </div>

              {/* Divider */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">New to Picnify?</span>
                  </div>
                </div>
              </div>

              {/* Sign Up Prompt */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
                  >
                    Sign up now
                  </Link>
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/src/assets/picnify-logo.png" alt="Picnify Logo" className="h-8" />
              <span className="text-2xl font-bold text-red-600">Picnify</span>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap ${
                  currentPage === 'dashboard'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="fas fa-tachometer-alt mr-2"></i>
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('bookings')}
                className={`px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap ${
                  currentPage === 'bookings'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="fas fa-calendar-check mr-2"></i>
                Bookings
              </button>
              <button
                onClick={() => setCurrentPage('profile')}
                className={`px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap ${
                  currentPage === 'profile'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="fas fa-user mr-2"></i>
                Profile
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap ${
                  currentPage === 'settings'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="fas fa-cog mr-2"></i>
                Settings
              </button>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={currentUser?.avatar}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">{currentUser?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap !rounded-button"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Content */}
        {currentPage === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap !rounded-button">
                <i className="fas fa-plus mr-2"></i>
                New Booking
              </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="fas fa-calendar-check text-2xl text-blue-500"></i>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="fas fa-clock text-2xl text-yellow-500"></i>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="fas fa-check-circle text-2xl text-green-500"></i>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">18</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="fas fa-times-circle text-2xl text-red-500"></i>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src="https://readdy.ai/api/search-image?query=luxury%20hotel%20room%20with%20modern%20interior%20design%20clean%20white%20background&width=48&height=48&seq=hotel-1&orientation=squarish"
                        alt="Hotel"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Grand Palace Hotel</p>
                        <p className="text-sm text-gray-500">Booking confirmed for Dec 25-27, 2024</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Confirmed
                    </span>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src="https://readdy.ai/api/search-image?query=boutique%20hotel%20exterior%20with%20elegant%20architecture%20clean%20white%20background&width=48&height=48&seq=hotel-2&orientation=squarish"
                        alt="Hotel"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Boutique Inn</p>
                        <p className="text-sm text-gray-500">Payment pending for Jan 10-12, 2025</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src="https://readdy.ai/api/search-image?query=modern%20resort%20with%20pool%20and%20palm%20trees%20clean%20white%20background&width=48&height=48&seq=hotel-3&orientation=squarish"
                        alt="Hotel"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Ocean View Resort</p>
                        <p className="text-sm text-gray-500">Booking cancelled for Nov 15-18, 2024</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Cancelled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Bookings</h1>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400 text-sm"></i>
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-auto"
                    placeholder="Search bookings..."
                  />
                </div>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 whitespace-nowrap">
                  <i className="fas fa-plus mr-2"></i>
                  New Booking
                </button>
              </div>
            </div>

            {/* Booking Cards */}
            <div className="grid gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <img
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=96&h=96&fit=crop&crop=center"
                        alt="Hotel Room"
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover mx-auto sm:mx-0"
                      />
                      <div className="text-center sm:text-left">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Grand Palace Hotel - Deluxe Suite</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          Downtown, New York
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-calendar mr-1"></i>
                          Dec 25 - Dec 27, 2024 • 2 nights
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-users mr-1"></i>
                          2 guests
                        </p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Confirmed
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-2">$489</p>
                      <p className="text-xs sm:text-sm text-gray-500">total</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                      <i className="fas fa-eye mr-2"></i>
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200">
                      <i className="fas fa-times mr-2"></i>
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <img
                        src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=96&h=96&fit=crop&crop=center"
                        alt="Hotel Room"
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover mx-auto sm:mx-0"
                      />
                      <div className="text-center sm:text-left">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Boutique Inn - Premium Room</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          SoHo, New York
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-calendar mr-1"></i>
                          Jan 10 - Jan 12, 2025 • 2 nights
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-users mr-1"></i>
                          1 guest
                        </p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Payment
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-2">$325</p>
                      <p className="text-xs sm:text-sm text-gray-500">total</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                      <i className="fas fa-credit-card mr-2"></i>
                      Pay Now
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200">
                      <i className="fas fa-times mr-2"></i>
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <img
                        src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=96&h=96&fit=crop&crop=center"
                        alt="Hotel Room"
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover mx-auto sm:mx-0"
                      />
                      <div className="text-center sm:text-left">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ocean View Resort - Villa Suite</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          Malibu, California
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-calendar mr-1"></i>
                          Nov 15 - Nov 18, 2024 • 3 nights
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          <i className="fas fa-users mr-1"></i>
                          4 guests
                        </p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Cancelled
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-2">$750</p>
                      <p className="text-xs sm:text-sm text-gray-500">refunded</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200">
                      <i className="fas fa-receipt mr-2"></i>
                      View Receipt
                    </button>
                    <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                      <i className="fas fa-redo mr-2"></i>
                      Book Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add other page content here as needed */}
      </main>
    </div>
  );
};

export default Login;
