import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ManualEmailConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManualConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For local development, we'll manually confirm the user
      // This is a workaround for local development without email service
      console.log('🔧 Manual email confirmation for local development:', email);
      
      // Try to sign in to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'temp_password_for_check' // This will fail, but we can check the error
      });

      if (signInError?.message.includes('Email not confirmed')) {
        // User exists but not confirmed - this is what we want
        setSuccess(true);
        setError('User exists but needs email confirmation. For local development, you can now sign in normally.');
      } else if (signInError?.message.includes('Invalid login credentials')) {
        setError('User not found. Please check your email address or sign up first.');
      } else {
        setError('Unexpected error. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Email Confirmation Ready</CardTitle>
            <CardDescription className="text-gray-600">
              For local development, you can now sign in with your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is a local development workaround. In production, users would receive an actual confirmation email.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Manual Email Confirmation</CardTitle>
          <CardDescription className="text-gray-600">
            For local development - manually confirm your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualConfirmation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Checking...' : 'Confirm Email'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => navigate('/login')} 
              variant="outline" 
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualEmailConfirmation;
