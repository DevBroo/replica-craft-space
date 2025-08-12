import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
  changePassword: (newPassword: string) => Promise<void>;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Helper function to get user profile from database
  const getUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email || '',
        role: data.role || 'user',
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        phone: data.phone,
      };
    } catch (err) {
      console.error('Error in getUserProfile:', err);
      return null;
    }
  };

  // Helper function to create or update user profile
  const ensureUserProfile = async (authUser: User, userRole?: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email || '',
          role: userRole || 'user',
          full_name: authUser.user_metadata?.full_name || '',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          phone: authUser.user_metadata?.phone || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating/updating user profile:', error);
      } else {
        console.log('✅ User profile created/updated successfully');
      }
    } catch (err) {
      console.error('Error in ensureUserProfile:', err);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user) {
          // Ensure user profile exists
          await ensureUserProfile(session.user);
          
          // Get user profile data
          const userProfile = await getUserProfile(session.user.id);
          setUser(userProfile);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('📋 Existing session found:', session.user?.email);
        setSession(session);
        
        // Defer profile fetching to avoid blocking
        setTimeout(async () => {
          await ensureUserProfile(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setUser(userProfile);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        setError({
          message: error.message,
          code: error.name,
        });
        return;
      }

      console.log('✅ User logged in successfully:', data.user?.email);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError({
        message: errorMessage,
        code: 'LOGIN_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.full_name || '',
            role: data.role || 'user',
          }
        }
      });
      
      if (error) {
        setError({
          message: error.message,
          code: error.name,
        });
        return;
      }

      console.log('✅ User registered successfully:', authData.user?.email);
      
      // Profile creation will be handled by the auth state change listener
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError({
        message: errorMessage,
        code: 'REGISTER_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError({
          message: error.message,
          code: error.name,
        });
        return;
      }

      console.log('✅ User logged out successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError({
        message: errorMessage,
        code: 'LOGOUT_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setError({ message: 'No user logged in' });
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) {
        setError({
          message: error.message,
          code: error.code,
        });
        return;
      }
      
      // Refresh user data
      const updatedProfile = await getUserProfile(user.id);
      setUser(updatedProfile);
      
      console.log('✅ Profile updated successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError({
        message: errorMessage,
        code: 'UPDATE_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        const authError = {
          message: error.message,
          code: error.name,
        };
        setError(authError);
        return { error: authError };
      }
      
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      const authError = {
        message: errorMessage,
        code: 'RESET_ERROR',
      };
      setError(authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        const authError = {
          message: error.message,
          code: error.name,
        };
        setError(authError);
        return { error: authError };
      }
      
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification';
      const authError = {
        message: errorMessage,
        code: 'RESEND_ERROR',
      };
      setError(authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setError({
          message: error.message,
          code: error.name,
        });
        return;
      }

      console.log('✅ Password changed successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError({
        message: errorMessage,
        code: 'CHANGE_PASSWORD_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithOtp = useCallback(async (phone: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone
      });
      
      if (error) {
        setError({
          message: error.message,
          code: error.name,
        });
        return;
      }

      console.log('✅ OTP sent successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'OTP login failed';
      setError({
        message: errorMessage,
        code: 'OTP_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      });
      
      if (error) {
        setError({
          message: error.message,
          code: error.name,
        });
        return;
      }

      console.log('✅ OTP verified successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      setError({
        message: errorMessage,
        code: 'OTP_VERIFY_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    resendVerification,
    changePassword,
    loginWithOtp,
    verifyOtp,
    clearError,
    isAuthenticated: !!user && !!session,
    hasRole,
    hasAnyRole,
  }), [user, session, loading, error, login, register, logout, updateProfile, resetPassword, resendVerification, changePassword, loginWithOtp, verifyOtp, clearError, hasRole, hasAnyRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hooks for specific roles
export const useOwnerAuth = () => {
  const auth = useAuth();
  return {
    ...auth,
    isOwner: auth.hasRole('owner') || auth.hasRole('user'),
  };
};
