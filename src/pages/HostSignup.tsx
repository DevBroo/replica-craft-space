import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Phone, Lock, User, Loader2, Home, UserCheck } from 'lucide-react';

const HostSignup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading, error, isAuthenticated, user, clearError } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hostType, setHostType] = useState<'owner' | 'agent'>('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [hasAttemptedRegistration, setHasAttemptedRegistration] = useState(false);

  // Show success message and redirect to host dashboard after signup
  useEffect(() => {
    if (signupSuccess && !loading && !error) {
      const timer = setTimeout(() => {
        if (isAuthenticated && user) {
          navigate('/host/dashboard', { 
            state: { 
              message: 'Account created successfully! Welcome to Picnify!',
              email: email 
            },
            replace: true 
          });
        } else {
          navigate('/host/login', { 
            state: { 
              message: 'Account created successfully! Please check your email to verify your account. Click the verification link in your email to complete the setup.',
              email: email 
            },
            replace: true 
          });
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [signupSuccess, loading, error, navigate, email, user, isAuthenticated]);

  // Set success state when registration completes
  useEffect(() => {
    if (hasAttemptedRegistration && !loading && !error && !signupSuccess) {
      if (isAuthenticated && user) {
        setSignupSuccess(true);
      } else if (!isAuthenticated && !user) {
        setSignupSuccess(true);
      }
    } else if (error && signupSuccess) {
      setSignupSuccess(false);
    }
  }, [loading, error, signupSuccess, hasAttemptedRegistration, isAuthenticated, user]);

  // Reset registration state when component mounts
  useEffect(() => {
    setSignupSuccess(false);
    setHasAttemptedRegistration(false);
    setFormErrors({});
  }, [location.pathname]);

  // Redirect if already authenticated and is host
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      if (user.role === 'owner' || user.role === 'agent') {
        navigate('/host/dashboard', { replace: true });
      } else if (user.role === 'customer') {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    clearError();
    setHasAttemptedRegistration(true);
    
    try {
      await register({
        email,
        password,
        firstName: firstName,
        lastName: lastName,
        phone,
        role: hostType
      });
    } catch (err) {
      console.error('Registration error:', err);
    }
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
            src="/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png" 
            alt="Picnify Logo" 
            className="h-12 mx-auto mb-4" 
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Create Host Account
          </h1>
          <p className="text-gray-600 mt-2">
            Join Picnify as a host and start managing properties
          </p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-center">Host Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert className="mt-4" variant="destructive">
                  <AlertDescription className="space-y-2">
                    <div className="font-medium">{error.message}</div>
                    {error.message.includes('already exists') && (
                      <div className="text-sm opacity-90">
                        💡 <strong>Already have an account?</strong>{' '}
                        <Link to="/host/login" className="underline hover:no-underline">
                          Sign in here
                        </Link>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {signupSuccess && !error && !loading && (
                <Alert className="mt-4" variant="default">
                  <AlertDescription className="space-y-2">
                    <div className="font-semibold text-green-800">
                      🎉 Host Account Created Successfully!
                    </div>
                    <div className="text-sm text-green-700">
                      {isAuthenticated && user ? (
                        <>
                          <p>✅ Your host account has been created successfully!</p>
                          <p className="mt-2">
                            <strong>Next Steps:</strong>
                          </p>
                          <ol className="list-decimal list-inside space-y-1 mt-1">
                            <li>You're automatically logged in and ready to go!</li>
                            <li>Start listing and managing your properties!</li>
                          </ol>
                          <p className="mt-2 text-blue-600">
                            Redirecting to dashboard in 3 seconds...
                          </p>
                        </>
                      ) : (
                        <>
                          <p>✅ Your account has been created and a confirmation email has been sent to <strong>{email}</strong></p>
                          <p className="mt-2 text-blue-600">
                            Redirecting to login page in 3 seconds...
                          </p>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Host Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="hostType">I am a</Label>
                <Select value={hostType} onValueChange={(value: 'owner' | 'agent') => setHostType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">
                      <div className="flex items-center">
                        <Home className="w-4 h-4 mr-2" />
                        Host
                      </div>
                    </SelectItem>
                    <SelectItem value="agent">
                      <div className="flex items-center">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Property Agent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`pl-10 ${formErrors.firstName ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500">{formErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`pl-10 ${formErrors.lastName ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`pl-10 ${formErrors.phone ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-sm text-red-500">{formErrors.phone}</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-10 pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
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
                  {formErrors.password && (
                    <p className="text-sm text-red-500">{formErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 pr-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-none">
                  I agree to the{' '}
                  <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-800">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {formErrors.terms && (
                <p className="text-sm text-red-500">{formErrors.terms}</p>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Host Account'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <div className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/host/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign in here
                </Link>
              </div>
              <div className="text-sm text-gray-600">
                Want to book properties instead?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                  Customer Sign Up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostSignup;