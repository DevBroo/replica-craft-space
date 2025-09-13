import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  TrendingUp,
  Users,
  Building2,
  DollarSign
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AgentLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check if user is already logged in and redirect appropriately
  useEffect(() => {
    if (user) {
      if (user.role === 'agent') {
        navigate('/agent/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  // Show success message if redirected from signup
  useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Account Created!",
        description: location.state.message,
        variant: "default",
      });
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password
      });

      // Check if user is an agent
      if (user?.role === 'agent') {
        navigate('/agent/dashboard');
      } else {
        setError('This account is not registered as an agent. Please contact support.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Login</h1>
          <p className="text-gray-600">Access your agent dashboard and start earning commissions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Benefits Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Agent Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Earn Commissions</h4>
                    <p className="text-sm text-gray-600">Get fixed commission on every successful booking</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Help Customers</h4>
                    <p className="text-sm text-gray-600">Assist customers in finding perfect properties</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Access Properties</h4>
                    <p className="text-sm text-gray-600">Browse our entire property database</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-blue-600">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">5%</div>
                    <div className="text-sm text-gray-600">Commission Rate</div>
                  </div> */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">Monthly</div>
                    <div className="text-sm text-gray-600">Payouts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Login Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Sign In to Your Account</CardTitle>
              <CardDescription>
                Enter your credentials to access your agent dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      placeholder="Enter your password"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an agent account?{' '}
                    <Link to="/agent/signup" className="text-blue-600 hover:underline">
                      Sign up here
                    </Link>
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Are you a customer?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                      Customer login
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;
