import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Phone, Lock, Loader2 } from 'lucide-react';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';

const OwnerLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithOtp, verifyOtp, loading, error, isAuthenticated, user, clearError } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success message from signup
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Pre-fill email if provided
      if (location.state.email) {
        setEmail(location.state.email);
      }
    }
  }, [location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔍 OwnerLogin - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user);
    
    // Wait for auth state to stabilize
    if (loading) {
      console.log('⏳ Auth still loading, waiting before redirect...');
      return;
    }
    
    if (isAuthenticated && user) {
      console.log('✅ User is authenticated, redirecting to dashboard');
      navigate('/owner/view', { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  // OTP timer effect
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Owner login attempt with email:', email);
    clearError();
    await login({ email, password });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    console.log('🚀 Owner login attempt with phone:', phone);
    clearError();
    await loginWithOtp(phone);
    setOtpSent(true);
    setOtpTimer(60);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return;
    
    console.log('🚀 Owner OTP verification for phone:', phone);
    clearError();
    await verifyOtp(phone, otp);
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    clearError();
    await loginWithOtp(phone);
    setOtpTimer(60);
  };

  const handleTabChange = (value: string) => {
    setLoginMethod(value as 'email' | 'otp');
    clearError();
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Website
          </Link>
          <img 
            src={picnifyLogo}
            alt="Picnify Logo" 
            className="h-12 mx-auto mb-4" 
          />
          <h1 className="text-2xl font-bold text-gray-900">Property Owner Login</h1>
          <p className="text-gray-600 mt-2">Access your property management dashboard</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6" variant="default">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-center">Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Login Method Tabs */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleTabChange('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  loginMethod === 'email'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Mail className="w-4 h-4 mr-2 inline" />
                Email
              </button>
              <button
                onClick={() => handleTabChange('otp')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  loginMethod === 'otp'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Phone className="w-4 h-4 mr-2 inline" />
                Phone
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {/* Email Login Form */}
            {loginMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            )}

            {/* Phone OTP Login Form */}
            {loginMethod === 'otp' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp}>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div>
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'OTP expired'}
                      </span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpTimer > 0}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        Resend OTP
                      </button>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <div className="text-sm text-gray-600">
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800">
                  Forgot your password?
                </Link>
              </div>
              <div className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/owner/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign up as Property Owner
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerLogin;
