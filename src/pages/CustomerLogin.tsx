import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';

const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success message from signup
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear any existing errors when we have a success message
      clearError();
      // Pre-fill email if provided
      if (location.state.email) {
        setEmail(location.state.email);
      }
    }
  }, [location.state, clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if we need to return to booking
      const returnTo = location.state?.returnTo;
      if (returnTo) {
        navigate(returnTo, { replace: true });
        return;
      }
      
      // Default role-based redirects
      switch (user.role) {
        case 'property_owner':
        case 'owner':
          navigate('/owner/view', { replace: true });
          break;
        case 'agent':
          navigate('/agent/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'customer':
        case 'user':
        default:
          navigate('/', { replace: true });
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      await login({ email, password });
      // The redirect will be handled by the useEffect above
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-brand-orange/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <img src={picnifyLogo} alt="Picnify.in Logo" className="h-12" />
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to explore amazing properties</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Customer Login</CardTitle>
            <p className="text-muted-foreground">
              Access your bookings and explore properties
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error?.message}
                </AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-brand-orange hover:text-brand-red font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-orange to-brand-red hover:from-orange-600 hover:to-red-600 text-white font-medium py-3"
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

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-brand-orange hover:text-brand-red font-medium">
                  Create Account
                </Link>
              </p>
            </div>

            {/* Other Login Options */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Looking for something else?
              </p>
              <div className="space-y-2">
                <Link 
                  to="/owner/login" 
                  className="block w-full text-center py-2 px-4 border border-border rounded-md text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  Host Login
                </Link>
                <Link 
                  to="/agent/login" 
                  className="block w-full text-center py-2 px-4 border border-border rounded-md text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  Agent Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerLogin;
