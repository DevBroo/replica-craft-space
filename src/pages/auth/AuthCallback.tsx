import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, loading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('🎭 AuthCallback mounted');
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    console.log('🔍 Current auth state:', { user: user?.email, session: !!session, loading });

    const handleAuthCallback = async () => {
      // Check for error parameters first
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        console.error('❌ Auth callback error:', error, errorDescription);
        setStatus('error');
        setMessage(errorDescription || error);
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        return;
      }

      // Check for confirmation tokens
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      console.log('🔍 Callback params:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken, 
        type 
      });

      if (type === 'signup' || accessToken) {
        console.log('✅ Email confirmation detected');
        setStatus('success');
        setMessage('Your email has been confirmed! Redirecting you to your dashboard...');
        
        // Wait for auth state to update, then redirect based on role
        const checkAuthAndRedirect = () => {
          if (!loading && session && user) {
            console.log('🎭 User confirmed and ready:', { email: user.email, role: user.role });
            
            // Role-based redirect
            setTimeout(() => {
              switch (user.role) {
                case 'owner':
                  console.log('🏠 Redirecting owner to dashboard');
                  navigate('/owner/view', { replace: true });
                  break;
                case 'admin':
                  console.log('👑 Redirecting admin to dashboard');
                  navigate('/admin/dashboard', { replace: true });
                  break;
                case 'agent':
                  console.log('🤝 Redirecting agent to dashboard');
                  navigate('/agent/dashboard', { replace: true });
                  break;
                default:
                  console.log('👤 Redirecting customer to home');
                  navigate('/', { replace: true });
                  break;
              }
            }, 2000);
            return;
          }
          
          // If not ready yet, check again in a bit
          if (loading || !session) {
            setTimeout(checkAuthAndRedirect, 500);
          } else {
            // Fallback: redirect to login if no session after waiting
            console.log('⚠️ No session found, redirecting to login');
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
          }
        };
        
        checkAuthAndRedirect();
      } else {
        // No specific confirmation tokens, might be a general callback
        console.log('🔍 General auth callback, checking current state');
        
        if (!loading) {
          if (session && user) {
            console.log('✅ User already authenticated, redirecting based on role');
            setStatus('success');
            setMessage('Welcome back! Redirecting you to your dashboard...');
            
            setTimeout(() => {
              switch (user.role) {
                case 'owner':
                  navigate('/owner/view', { replace: true });
                  break;
                case 'admin':
                  navigate('/admin/dashboard', { replace: true });
                  break;
                case 'agent':
                  navigate('/agent/dashboard', { replace: true });
                  break;
                default:
                  navigate('/', { replace: true });
                  break;
              }
            }, 1500);
          } else {
            console.log('⚠️ No authenticated user found, redirecting to login');
            setStatus('error');
            setMessage('Authentication required. Redirecting to login...');
            
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
          }
        }
      }
    };

    // Small delay to ensure auth state is updated
    setTimeout(handleAuthCallback, 100);
  }, [searchParams, user, session, loading, navigate]);

  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Processing your request...</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your email and set up your account.
            </p>
          </div>
        );
      
      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold text-foreground">Success!</h2>
            <p className="text-muted-foreground text-center">
              {message}
            </p>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground">Oops! Something went wrong</h2>
            <p className="text-muted-foreground text-center">
              {message}
            </p>
            <div className="text-sm text-muted-foreground">
              If this problem persists, please contact support.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Mail className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Email Confirmation</h1>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          {renderStatus()}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Having trouble? <a href="/help-center" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}