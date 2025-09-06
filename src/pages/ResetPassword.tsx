import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { changePassword } = useAuth();

  // Get access token from URL params and hash
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  // Also check URL hash (Supabase sometimes puts tokens there)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const hashAccessToken = hashParams.get('access_token');
  const hashRefreshToken = hashParams.get('refresh_token');

  // Use whichever tokens are available
  const finalAccessToken = accessToken || hashAccessToken;
  const finalRefreshToken = refreshToken || hashRefreshToken;

  useEffect(() => {
    // Debug: Log the full URL to see what we received
    console.log('🔍 Full URL:', window.location.href);
    console.log('🔍 URL Search Params:', window.location.search);
    console.log('🔍 URL Hash:', window.location.hash);

    // Check for error parameters (Supabase auth errors)
    const errorParam = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      console.log('🚨 Auth error detected:', { errorParam, errorCode, errorDescription });
      if (errorCode === 'otp_expired') {
        setError('This reset link has expired. Please request a new one.');
        return;
      }
      setError(errorDescription || 'Invalid or expired reset link');
      return;
    }

    // Check for type=recovery (Supabase password recovery)
    const type = searchParams.get('type') || hashParams.get('type');
    if (type === 'recovery') {
      console.log('✅ Password recovery flow detected');
      // User is being auto-logged in by Supabase, show the reset form
      return;
    }

    console.log('🔍 Parsed tokens:', {
      accessToken: finalAccessToken ? 'FOUND' : 'MISSING',
      refreshToken: finalRefreshToken ? 'FOUND' : 'MISSING',
      type: type || 'MISSING'
    });

    // Log what we found for debugging
    const hasTokens = finalAccessToken && finalRefreshToken;
    const hasRecoveryType = type === 'recovery';

    console.log('🔍 Reset password page loaded with:', {
      hasTokens,
      hasRecoveryType,
      hasError: !!errorParam,
      willShowForm: !errorParam
    });

    // No automatic redirect - let the user try to reset their password
    // The form submission will handle validation
  }, [finalAccessToken, finalRefreshToken, navigate, searchParams, hashParams]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and numbers");
      setLoading(false);
      return;
    }

    try {
      // Use Supabase client directly to update password
      const { supabase } = await import('@/integrations/supabase/client');

      // Check if user is already authenticated (Supabase auto-login from email)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // If no user session, try to set session with tokens
        if (finalAccessToken && finalRefreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
        } else {
          throw new Error('No valid session found. Please request a new reset link.');
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-900">
              Password updated successfully!
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              Your password has been reset. You will be redirected to the login page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <p className="text-sm text-gray-600">
                  You can now sign in with your new password. For security reasons,
                  you'll be redirected to the login page in a few seconds.
                </p>
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // More lenient validation - if we're on the reset password page, show the form
  // Only redirect if there's an explicit error
  const type = searchParams.get('type') || hashParams.get('type');
  const isResetPasswordPage = window.location.pathname === '/reset-password';

  // If we have an error, we already handled it above
  // If we're on the reset password page and no error, show the form
  // The form submission will handle session validation

  const validation = validatePassword(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Reset your password
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {password && (
                <div className="mt-2 text-xs space-y-1">
                  <p className="text-gray-600 font-medium">Password requirements:</p>
                  <div className={`flex items-center ${validation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${validation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    One uppercase letter
                  </div>
                  <div className={`flex items-center ${validation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    One lowercase letter
                  </div>
                  <div className={`flex items-center ${validation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    One number
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !validation.isValid || password !== confirmPassword}
            >
              {loading ? "Updating password..." : "Update password"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-red-600 hover:text-red-500"
                  onClick={() => navigate('/login')}
                >
                  Sign in here
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
