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
import { Eye, EyeOff, Mail, Phone, Lock, User, Loader2 } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading, error, isAuthenticated, user, clearError } = useAuth();
  
  // Debug logging (commented out for production)
  // console.log('🔄 Signup component render:', { 
  //   loading, 
  //   error: error?.message, 
  //   isAuthenticated, 
  //   user: user ? { id: user.id, email: user.email, role: user.role } : null 
  // });
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [hasAttemptedRegistration, setHasAttemptedRegistration] = useState(false);

  const getDefaultRedirect = useCallback((userRole: string) => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'owner':
      case 'agent':
        return '/host/dashboard';
      case 'customer':
        return '/';
      default:
        return '/';
    }
  }, []);

  // Show success message and redirect to appropriate dashboard after signup
  useEffect(() => {
    console.log('🔄 Success effect triggered:', { signupSuccess, loading, error: error?.message });
    
    if (signupSuccess && !loading && !error) {
      console.log('✅ All conditions met, redirecting in 3 seconds');
      
      // Wait 3 seconds before redirecting to show the success message
      const timer = setTimeout(() => {
        // Clear any errors before navigation to prevent stale errors
        clearError();
        
        if (isAuthenticated && user) {
          // User is authenticated, redirect to dashboard
          const userRole = user.role || role;
          const dashboardPath = (userRole === 'owner' || userRole === 'agent') ? '/host/dashboard' : '/';
          
          console.log('🚀 Redirecting to dashboard:', dashboardPath, 'for role:', userRole);
          navigate(dashboardPath, { 
            state: { 
              message: 'Account created successfully! Welcome to Picnify!',
              email: email 
            },
            replace: true 
          });
        } else {
          // User needs email verification, redirect to login
          const loginPath = '/login';
          
          console.log('🚀 Redirecting to login:', loginPath, 'for role:', role);
          navigate(loginPath, { 
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
  }, [signupSuccess, loading, error, navigate, email, role, user, isAuthenticated]);

  // Set success state when registration completes (either authenticated or email verification required)
  useEffect(() => {
    console.log('🔄 Registration state check:', { 
      loading, 
      error: error?.message, 
      signupSuccess, 
      hasAttemptedRegistration,
      isAuthenticated, 
      user: user ? { email: user.email, role: user.role } : null 
    });
    
    // Only show success if a registration has actually been attempted
    if (hasAttemptedRegistration && !loading && !error && !signupSuccess) {
      if (isAuthenticated && user) {
        console.log('✅ Registration successful and user authenticated, setting success state');
        setSignupSuccess(true);
      } else if (!isAuthenticated && !user) {
        // Registration succeeded but email verification required
        console.log('✅ Registration successful, email verification required');
        setSignupSuccess(true);
      }
    } else if (error && signupSuccess) {
      // If there's an error and we previously set success, clear it
      console.log('❌ Error occurred, clearing success state');
      setSignupSuccess(false);
    }
  }, [loading, error, signupSuccess, hasAttemptedRegistration, isAuthenticated, user]);

  // Set role to customer (this component is only for customer signup now)
  useEffect(() => {
    console.log('✅ Setting role to customer (customer signup only)');
    setRole('customer');
  }, []);

  // Debug component mount and reset registration state
  useEffect(() => {
    console.log('🏠 Signup component mounted at path:', location.pathname);
    
    // Reset registration state when component mounts
    setSignupSuccess(false);
    setHasAttemptedRegistration(false);
    setFormErrors({});
  }, [location.pathname]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      console.log('🔄 User already authenticated, checking role and redirecting');
      console.log('🔍 User details:', { email: user.email, role: user.role });
      
      // Redirect to appropriate dashboard based on role
      if (user.role === 'owner' || user.role === 'agent') {
        navigate('/host/dashboard', { replace: true });
      } else if (user.role === 'customer') {
        navigate('/', { replace: true });
      } else {
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
    
    console.log('📝 Form submitted, validating...');
    
    // Check if user is already authenticated
    if (isAuthenticated && user) {
      console.log('⚠️ User already authenticated, checking if role change is needed');
      if (user.role === role) {
        console.log('✅ User already has the correct role, redirecting to dashboard');
        navigate('/', { replace: true });
        return;
      } else {
        console.log('🔄 User role mismatch, proceeding with registration for new role');
      }
    }
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    console.log('✅ Form validation passed, starting registration');
    clearError();
    setHasAttemptedRegistration(true);
    console.log('🚀 Starting registration for:', { email, role });
    
    try {
      await register({
        email,
        password,
        firstName: firstName,
        lastName: lastName,
        phone,
        role
      });
      
      console.log('📝 Registration call completed');
    } catch (err) {
      console.error('💥 Registration error:', err);
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
            Create Customer Account
          </h1>
          <p className="text-gray-600 mt-2">
            Join Picnify and start your journey
          </p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-center">
              Customer Sign Up
            </CardTitle>
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
                        <Link to="/login" className="underline hover:no-underline">
                          Sign in here
                        </Link>
                      </div>
                    )}
                    {error.message.includes('weak password') && (
                      <div className="text-sm opacity-90">
                        💡 <strong>Password requirements:</strong> At least 8 characters with uppercase, lowercase, and numbers.
                      </div>
                    )}
                    {error.message.includes('invalid email') && (
                      <div className="text-sm opacity-90">
                        💡 <strong>Email format:</strong> Please enter a valid email address (e.g., user@example.com).
                      </div>
                    )}
                    {error.message.includes('too many attempts') && (
                      <div className="text-sm opacity-90">
                        💡 <strong>Rate limited:</strong> Please wait a few minutes before trying again.
                      </div>
                    )}
                    {error.message.includes('network error') && (
                      <div className="text-sm opacity-90">
                        💡 <strong>Connection issue:</strong> Please check your internet connection and try again.
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
                      🎉 Account Created Successfully!
                    </div>
                    <div className="text-sm text-green-700">
                      {isAuthenticated && user ? (
                        <>
                          <p>✅ Your account has been created successfully!</p>
                          <p className="mt-2">
                            <strong>Next Steps:</strong>
                          </p>
                          <ol className="list-decimal list-inside space-y-1 mt-1">
                            <li>You're automatically logged in and ready to go!</li>
                            <li>Start exploring amazing properties!</li>
                          </ol>
                          <p className="mt-2 text-blue-600">
                            Redirecting to dashboard in 3 seconds...
                          </p>
                        </>
                      ) : (
                        <>
                          <p>✅ Your account has been created and a confirmation email has been sent to <strong>{email}</strong></p>
                          <p className="mt-2">
                            <strong>Next Steps:</strong>
                          </p>
                          <ol className="list-decimal list-inside space-y-1 mt-1">
                            <li>Check your email and click the verification link</li>
                            <li>Once verified, you can log in to your account</li>
                            <li>Start exploring amazing properties!</li>
                          </ol>
                          <p className="mt-2 text-blue-600">
                            Redirecting to login page in 3 seconds...
                          </p>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

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
                {formErrors.email ? (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    We'll send a confirmation email to verify your account
                  </p>
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formErrors.password ? (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                ) : (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Password requirements:</strong></p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li className={password.length >= 8 ? 'text-green-600' : ''}>
                        At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                        One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                        One lowercase letter
                      </li>
                      <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                        One number
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{' '}
                    <Link to="/terms" className="text-red-600 hover:text-red-500 underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-red-600 hover:text-red-500 underline">
                      Privacy Policy
                    </Link>
                  </Label>
                  {formErrors.terms && (
                    <p className="text-sm text-red-500">{formErrors.terms}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Already have an account?{' '}
                <span className="font-medium text-red-600 hover:text-red-500">
                  Sign in here
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-red-600 hover:text-red-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-red-600 hover:text-red-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;