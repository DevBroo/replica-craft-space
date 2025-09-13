import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Building2,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AgentSignupForm {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  location: string;
  about: string;
  languages: string[];
  experience_years: number;
  agreeToTerms: boolean;
  agreeToCommission: boolean;
}

const AgentSignup: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgentSignupForm>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    about: '',
    languages: [],
    experience_years: 0,
    agreeToTerms: false,
    agreeToCommission: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      languages: checked 
        ? [...prev.languages, language]
        : prev.languages.filter(l => l !== language)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    if (!formData.agreeToCommission) {
      setError('You must agree to the commission structure');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Register the user with agent role
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        role: 'agent'
      });

      // Get the current user after registration
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update the profile with agent-specific information
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            location: formData.location,
            about: formData.about,
            languages: formData.languages,
            commission_rate: 5.00, // Default commission rate
            is_active: false, // Will be activated by admin
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Create initial commission settings
        const { error: commissionError } = await supabase
          .from('agent_commission_settings')
          .insert({
            agent_id: user.id,
            commission_rate: 5.00,
            is_active: true,
            effective_from: new Date().toISOString()
          });

        if (commissionError) {
          console.error('Commission settings error:', commissionError);
        }

        toast({
          title: "Agent Account Created!",
          description: "Your agent account has been created successfully. Please wait for admin approval to start earning commissions.",
          variant: "default",
        });

        navigate('/agent/login', { 
          state: { 
            message: 'Agent account created successfully! Please login to access your dashboard.' 
          } 
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const commonLanguages = [
    'English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 
    'Bengali', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Sanskrit'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as a Property Agent</h1>
          <p className="text-gray-600">Start earning commissions by helping customers find their perfect properties</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Benefits Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Why Become an Agent?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Earn Commissions</h4>
                    <p className="text-sm text-gray-600">Get 5% commission on every successful booking you facilitate</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Help Customers</h4>
                    <p className="text-sm text-gray-600">Assist customers in finding their perfect property match</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Access Properties</h4>
                    <p className="text-sm text-gray-600">Get access to our entire property database</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-semibold">Flexible Work</h4>
                    <p className="text-sm text-gray-600">Work from anywhere, anytime that suits you</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-600">Commission Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Base Commission Rate</span>
                    <span className="font-semibold text-green-600">5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Payment Schedule</span>
                    <span className="text-sm">Monthly</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Minimum Payout</span>
                    <span className="text-sm">₹500</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <p className="text-xs text-gray-600">
                  Commission rates may vary based on performance and admin settings. 
                  All rates are subject to admin approval and may be adjusted.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Signup Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Create Agent Account</CardTitle>
              <CardDescription>
                Fill in your details to start your journey as a property agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="City, State"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About You</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="about"
                      name="about"
                      value={formData.about}
                      onChange={handleInputChange}
                      className="pl-10 min-h-[80px]"
                      placeholder="Tell us about your experience and why you want to become an agent..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Languages You Speak</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {commonLanguages.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={language}
                          checked={formData.languages.includes(language)}
                          onCheckedChange={(checked) => 
                            handleLanguageChange(language, checked as boolean)
                          }
                        />
                        <Label htmlFor={language} className="text-sm">
                          {language}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('agreeToTerms', checked as boolean)
                      }
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-600 hover:underline">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToCommission"
                      checked={formData.agreeToCommission}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('agreeToCommission', checked as boolean)
                      }
                    />
                    <Label htmlFor="agreeToCommission" className="text-sm">
                      I understand and agree to the commission structure and payment terms
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Agent Account'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an agent account?{' '}
                    <Link to="/agent/login" className="text-blue-600 hover:underline">
                      Sign in here
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

export default AgentSignup;
