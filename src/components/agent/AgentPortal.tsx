import React, { useState } from 'react';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import ManageBookings from './ManageBookings';
import Commissions from './Commissions';
import Customers from './Customers';
import Profile from './Profile';
import Settings from './Settings';

// Using the exact same logo and avatar as the original Picnify portal
const LOGO_URL = "https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png";
const AVATAR_URL = "https://readdy.ai/api/search-image?query=professional%20Indian%20agent%20businessman%20avatar%20headshot%20with%20traditional%20modern%20fusion%20style%20confident%20expression&width=40&height=40&seq=agent-avatar-001&orientation=squarish";

interface BookingStats {
  totalBookings: number;
  totalCommission: number;
  pendingBookings: number;
  completedBookings: number;
}

interface Property {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  commission: number;
}

const AgentPortal: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'otp' | 'signup' | 'dashboard' | 'bookings' | 'commission' | 'customers' | 'profile' | 'settings'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDates, setSelectedDates] = useState({ start: '', end: '' });

  const [bookingStats, setBookingStats] = useState<BookingStats>({
    totalBookings: 156,
    totalCommission: 25600,
    pendingBookings: 12,
    completedBookings: 144
  });

  const [properties, setProperties] = useState<Property[]>([
    {
      id: '1',
      name: 'Luxury Villa with Pool',
      location: 'Mumbai',
      price: 15000,
      rating: 4.8,
      image: 'https://readdy.ai/api/search-image?query=modern%20luxury%20villa%20with%20swimming%20pool%20in%20Mumbai%2C%20contemporary%20architecture%2C%20palm%20trees%2C%20professional%20real%20estate%20photography%2C%20high%20end%20property&width=400&height=300&seq=prop1&orientation=landscape',
      commission: 1500
    },
    {
      id: '2',
      name: 'Beachfront Apartment',
      location: 'Goa',
      price: 12000,
      rating: 4.6,
      image: 'https://readdy.ai/api/search-image?query=modern%20beachfront%20apartment%20in%20Goa%20with%20ocean%20view%2C%20contemporary%20interior%2C%20sunset%20view%2C%20professional%20real%20estate%20photography&width=400&height=300&seq=prop2&orientation=landscape',
      commission: 1200
    },
    {
      id: '3',
      name: 'Mountain View Cottage',
      location: 'Shimla',
      price: 8000,
      rating: 4.7,
      image: 'https://readdy.ai/api/search-image?query=cozy%20mountain%20cottage%20in%20Shimla%20with%20snow%20capped%20mountain%20views%2C%20wooden%20architecture%2C%20pine%20trees%2C%20professional%20real%20estate%20photography&width=400&height=300&seq=prop3&orientation=landscape',
      commission: 800
    }
  ]);

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Shimla', 'Chennai'];

  const topPerformingProperties = [
    {
      name: 'Luxury Villa with Pool',
      bookings: 24,
      revenue: 36000,
      image: 'https://readdy.ai/api/search-image?query=luxury%20villa%20exterior%20with%20modern%20architecture%2C%20swimming%20pool%2C%20professional%20real%20estate%20photography%2C%20high%20end%20property%20showcase&width=200&height=150&seq=top1&orientation=landscape'
    },
    {
      name: 'Beachfront Apartment',
      bookings: 18,
      revenue: 21600,
      image: 'https://readdy.ai/api/search-image?query=modern%20beachfront%20apartment%20exterior%20with%20ocean%20view%2C%20contemporary%20architecture%2C%20professional%20real%20estate%20photography&width=200&height=150&seq=top2&orientation=landscape'
    },
    {
      name: 'Mountain View Cottage',
      bookings: 15,
      revenue: 12000,
      image: 'https://readdy.ai/api/search-image?query=mountain%20cottage%20exterior%20with%20scenic%20view%2C%20wooden%20architecture%2C%20professional%20real%20estate%20photography&width=200&height=150&seq=top3&orientation=landscape'
    }
  ];

  const monthlyCommissions = [
    { month: 'Jan', amount: 4200 },
    { month: 'Feb', amount: 3800 },
    { month: 'Mar', amount: 5100 },
    { month: 'Apr', amount: 4700 },
    { month: 'May', amount: 5600 },
    { month: 'Jun', amount: 6200 }
  ];

  const recentBookings = [
    {
      id: 'BK001',
      property: 'Luxury Villa with Pool',
      customer: 'Rahul Sharma',
      date: '2025-07-25',
      amount: 15000,
      status: 'Confirmed'
    },
    {
      id: 'BK002',
      property: 'Beachfront Apartment',
      customer: 'Priya Patel',
      date: '2025-07-24',
      amount: 12000,
      status: 'Pending'
    },
    {
      id: 'BK003',
      property: 'Mountain View Cottage',
      customer: 'Amit Kumar',
      date: '2025-07-23',
      amount: 8000,
      status: 'Confirmed'
    }
  ];

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    agencyName: '',
    specialization: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    experience: ''
  });

  // Dashboard state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const filterProperties = (query: string, city: string) => {
    return properties.filter(property => {
      const matchesQuery = property.name.toLowerCase().includes(query.toLowerCase()) ||
        property.location.toLowerCase().includes(query.toLowerCase());
      const matchesCity = city === '' || property.location === city;
      return matchesQuery && matchesCity;
    });
  };

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
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Manage Bookings' },
    { id: 'commission', label: 'Commission' },
    { id: 'customers', label: 'Customers' },
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderLoginView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-agent-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <img
                src={LOGO_URL}
                alt="Agent Portal Logo"
                className="h-12 w-auto mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Agent Portal</h1>
              <p className="text-muted-foreground">Real Estate Agent Dashboard</p>
            </div>

            <div className="flex mb-6 bg-secondary rounded-lg p-1">
              <Button
                variant={loginMethod === 'email' ? 'default' : 'ghost'}
                onClick={() => setLoginMethod('email')}
                className="flex-1"
                size="sm"
              >
                ✉️ Email
              </Button>
              <Button
                variant={loginMethod === 'phone' ? 'default' : 'ghost'}
                onClick={() => setLoginMethod('phone')}
                className="flex-1"
                size="sm"
              >
                📱 Phone
              </Button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <Input
                  type={loginMethod === 'email' ? 'email' : 'tel'}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {loginMethod === 'email' ? '✉️' : '📱'}
                </span>
              </div>
            </div>

            {loginMethod === 'email' ? (
              <Button
                onClick={handleEmailSignIn}
                disabled={!contactValue.trim()}
                className="w-full mb-6"
                size="lg"
              >
                🔑 Sign In
              </Button>
            ) : (
              <Button
                onClick={handleSendOTP}
                disabled={!contactValue.trim()}
                className="w-full mb-6"
                size="lg"
              >
                📨 Send OTP
              </Button>
            )}

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-6">
                <p>By continuing, you agree to our</p>
                <div className="mt-1">
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>
                  <span className="mx-1">and</span>
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-muted-foreground text-sm mb-2">Don't have an account?</p>
                <Button
                  onClick={() => setCurrentView('signup')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  👨‍💼 Sign Up as Agent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOTPView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-agent-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verify OTP</h1>
              <p className="text-muted-foreground">
                We've sent a 6-digit code to {contactValue}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Enter OTP</label>
              <Input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={otpValue.length !== 6}
              className="w-full mb-4"
              size="lg"
            >
              ✅ Verify OTP
            </Button>

            <div className="text-center">
              {canResend ? (
                <Button
                  onClick={handleResendOTP}
                  variant="link"
                  className="text-primary"
                >
                  🔄 Resend OTP
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Resend OTP in {otpTimer}s
                </p>
              )}
            </div>

            <div className="text-center mt-4">
              <Button
                onClick={() => setCurrentView('login')}
                variant="link"
                className="text-muted-foreground"
              >
                ← Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSignupView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-agent-lg">
          <CardContent className="p-8">
            <div className="text-center mb-4">
              <Button
                onClick={() => setCurrentView('login')}
                variant="link"
                className="text-muted-foreground mb-4"
              >
                ← Back to login
              </Button>
            </div>
            
            <div className="text-center mb-8">
              <img
                src={LOGO_URL}
                alt="Agent Portal Logo"
                className="h-12 w-auto mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-foreground mb-2">Complete Your Profile</h1>
              <p className="text-muted-foreground">Let's set up your agent account</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSignupSubmit(); }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">First Name *</label>
                  <Input
                    type="text"
                    value={signupData.firstName}
                    onChange={(e) => handleSignupChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name *</label>
                  <Input
                    type="text"
                    value={signupData.lastName}
                    onChange={(e) => handleSignupChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
                  <Input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => handleSignupChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
                  <Input
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => handleSignupChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">License Number *</label>
                  <Input
                    type="text"
                    value={signupData.licenseNumber}
                    onChange={(e) => handleSignupChange('licenseNumber', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Agency Name</label>
                  <Input
                    type="text"
                    value={signupData.agencyName}
                    onChange={(e) => handleSignupChange('agencyName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Specialization</label>
                  <select
                    value={signupData.specialization}
                    onChange={(e) => handleSignupChange('specialization', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select specialization</option>
                    <option value="residential">Residential Sales</option>
                    <option value="commercial">Commercial Real Estate</option>
                    <option value="rental">Rental Properties</option>
                    <option value="luxury">Luxury Properties</option>
                    <option value="investment">Investment Properties</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Years of Experience</label>
                  <select
                    value={signupData.experience}
                    onChange={(e) => handleSignupChange('experience', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select experience</option>
                    <option value="0-1">0-1 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Address *</label>
                <Input
                  type="text"
                  value={signupData.address}
                  onChange={(e) => handleSignupChange('address', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                  <Input
                    type="text"
                    value={signupData.city}
                    onChange={(e) => handleSignupChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">State *</label>
                  <Input
                    type="text"
                    value={signupData.state}
                    onChange={(e) => handleSignupChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ZIP Code *</label>
                  <Input
                    type="text"
                    value={signupData.zipCode}
                    onChange={(e) => handleSignupChange('zipCode', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  👨‍💼 Create Agent Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                src={LOGO_URL}
                alt="Agent Portal Logo"
                className="h-8 w-auto"
              />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="mt-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'bookings') {
                  setCurrentView('bookings');
                } else if (item.id === 'commission') {
                  setCurrentView('commission');
                } else if (item.id === 'customers') {
                  setCurrentView('customers');
                } else if (item.id === 'profile') {
                  setCurrentView('profile');
                } else if (item.id === 'settings') {
                  setCurrentView('settings');
                } else if (item.id === 'dashboard') {
                  setCurrentView('dashboard');
                }
              }}
              className={`w-full flex items-center px-4 py-3 text-left cursor-pointer ${
                activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {currentView === 'bookings' ? (
          <ManageBookings />
        ) : currentView === 'commission' ? (
          <Commissions />
        ) : currentView === 'customers' ? (
          <Customers />
        ) : currentView === 'profile' ? (
          <Profile />
        ) : currentView === 'settings' ? (
          <Settings />
        ) : (
          <>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-800">Agent Dashboard</h1>
              <div className="text-sm text-gray-500">
                <span>Monitor your performance and track commissions</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20Indian%20real%20estate%20agent%20avatar%20headshot%20with%20business%20attire%20confident%20expression&width=40&height=40&seq=agent-avatar-001&orientation=squarish"
                  alt="Agent Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">Priya Sharma</span>
                <span className="text-xs text-gray-500">Mumbai Region</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <span className="text-blue-600">📅</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Total Bookings</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{bookingStats.totalBookings}</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="text-green-500">↗ 12%</span> vs last month
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <span className="text-green-600">💰</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Total Commission</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">₹{bookingStats.totalCommission}</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="text-green-500">↗ 8%</span> vs last month
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-100 rounded-full p-3">
                  <span className="text-yellow-600">⏰</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Pending Bookings</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{bookingStats.pendingBookings}</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="text-yellow-500">− No change</span> vs last month
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <span className="text-purple-600">✅</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Completed Bookings</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{bookingStats.completedBookings}</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="text-green-500">↗ 15%</span> vs last month
              </p>
            </div>
          </div>

          {/* Top Performing Properties */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Properties</h3>
              <div className="space-y-4">
                {topPerformingProperties.map((property, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img src={property.image} alt={property.name} className="w-20 h-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{property.name}</h4>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          <span className="text-blue-600 mr-1">📅</span>
                          {property.bookings} bookings
                        </span>
                        <span className="text-sm text-gray-500">
                          <span className="text-green-600 mr-1">💰</span>
                          ₹{property.revenue}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Commission</h3>
              <div className="h-64">
                <div className="h-full flex items-end space-x-4">
                  {monthlyCommissions.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t-lg"
                        style={{ height: `${(item.amount / 6200) * 100}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                      <span className="text-xs font-medium">₹{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Recent Bookings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.property}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{booking.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
          </>
        )}
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
    case 'bookings':
      return renderDashboard();
    case 'commission':
      return renderDashboard();
    case 'customers':
      return renderDashboard();
    case 'profile':
      return renderDashboard();
    case 'settings':
      return renderDashboard();
    case 'dashboard':
      return renderDashboard();
    default:
      return renderLoginView();
  }
};

export default AgentPortal;