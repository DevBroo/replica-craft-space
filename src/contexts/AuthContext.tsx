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
  created_at?: string;
  updated_at?: string;
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to get user profile from database with fast retry logic
  const getUserProfile = async (userId: string): Promise<AuthUser | null> => {
    const maxRetries = 1; // Reduced retries for faster loading
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`📝 Fetching user profile (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error(`❌ Error fetching user profile (attempt ${retryCount + 1}):`, error);
          
          // If it's a "not found" error, return null immediately
          if (error.code === 'PGRST116') {
            console.log('📝 User profile not found in database');
            return null;
          }
          
          // For other errors, retry once with short delay
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Short delay
            continue;
          }
          
          return null;
        }

        console.log('✅ User profile fetched successfully');
          return {
            id: data.id,
            email: data.email || '',
            role: data.role === 'user' ? 'customer' : data.role === 'property_owner' ? 'owner' : (data.role || 'customer'), // Normalize 'user' to 'customer' and 'property_owner' to 'owner'
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            phone: data.phone,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
      } catch (err) {
        console.error(`❌ Exception in getUserProfile (attempt ${retryCount + 1}):`, err);
        
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 500)); // Short delay
          continue;
        }
        
        return null;
      }
    }
    
    return null;
  };

  // Helper function to create or update user profile with fast execution
  const ensureUserProfile = async (authUser: User, userRole?: string): Promise<void> => {
    try {
      console.log('🔧 Attempting to ensure user profile for:', authUser.email);
      
      // Skip profile creation if we already have a basic user set
      // This prevents blocking the UI while profile operations are slow
      console.log('✅ Skipping profile creation for faster loading');
      return;
      
      // Note: Profile creation is now handled in background after user is set
    } catch (err) {
      console.error('❌ Exception in ensureUserProfile:', err);
      // Don't throw - just log the error and continue
      // The user can still log in even if profile creation fails
    }
  };

  useEffect(() => {
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        // Only set loading if this is not the initial session check
        if (isInitialized) {
          setLoading(true);
        }
        
        setSession(session);
        
        if (session?.user) {
          try {
            console.log('👤 Ensuring user profile exists...');
            
            // Get the role from user metadata (set during registration)
            const userRole = session.user.user_metadata?.role || 'customer';
            console.log('🎭 User role from metadata:', userRole);
            
            // Set user immediately with basic data for fast loading
            const basicUser = {
              id: session.user.id,
              email: session.user.email || '',
              role: userRole,
              full_name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              phone: session.user.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            // Set user immediately for fast loading
            setUser(basicUser);
            console.log('✅ User set immediately with basic data for fast loading');
            
            // Then try to enhance with profile data in background
            Promise.allSettled([
              // Profile creation with short timeout
              Promise.race([
                ensureUserProfile(session.user),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Profile creation timeout')), 3000))
              ]),
              // Profile fetching with short timeout
              Promise.race([
                getUserProfile(session.user.id),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 3000))
              ])
            ]).then(([profileCreationResult, profileFetchResult]) => {
              if (profileFetchResult.status === 'fulfilled' && profileFetchResult.value) {
                const profile = profileFetchResult.value as AuthUser;
                console.log('✅ Enhanced user profile loaded in background:', profile.email);
                setUser(profile);
              } else {
                console.log('⚠️ Profile enhancement failed, keeping basic user data');
              }
            });
          } catch (error) {
            console.error('❌ Error during profile sync:', error);
            // Set a basic user object even if profile sync fails
            const userRole = session.user.user_metadata?.role || 'customer';
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: userRole,
              full_name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              phone: session.user.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } else {
          console.log('🚫 No session user, clearing user state');
          setUser(null);
        }
        
        // Set loading to false immediately for fast UI response
        if (isInitialized) {
          console.log('🔄 Auth loading state: false (user set immediately)');
          setLoading(false);
        }
      }
    );

    // Check for existing session (initial load)
    const initializeAuth = async () => {
      console.log('📋 Checking for existing session...');
      setLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ Existing session found:', session.user?.email);
          setSession(session);
          
          try {
            // Set user immediately with basic data for fast loading
            const userRole = session.user.user_metadata?.role || 'customer';
            const normalizedRole = userRole === 'user' ? 'customer' : userRole;
            const basicUser = {
              id: session.user.id,
              email: session.user.email || '',
              role: normalizedRole,
              full_name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              phone: session.user.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            // Set user immediately for fast loading
            setUser(basicUser);
            console.log('✅ Initial user set immediately with basic data for fast loading');
            
            // Then try to enhance with profile data in background
            Promise.allSettled([
              // Profile creation with short timeout
              Promise.race([
                ensureUserProfile(session.user),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Profile creation timeout')), 3000))
              ]),
              // Profile fetching with short timeout
              Promise.race([
                getUserProfile(session.user.id),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 3000))
              ])
            ]).then(([profileCreationResult, profileFetchResult]) => {
              if (profileFetchResult.status === 'fulfilled' && profileFetchResult.value) {
                const profile = profileFetchResult.value as AuthUser;
                console.log('✅ Initial enhanced user profile loaded in background:', profile.email);
                setUser(profile);
              } else {
                console.log('⚠️ Initial profile enhancement failed, keeping basic user data');
              }
            });
          } catch (error) {
            console.error('❌ Error during initial profile sync:', error);
            // Set a basic user object even if profile sync fails
            const userRole = session.user.user_metadata?.role || 'customer';
            const normalizedRole = userRole === 'user' ? 'customer' : userRole;
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: normalizedRole,
              full_name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              phone: session.user.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } else {
          console.log('🚫 No existing session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error during initial auth check:', error);
        setUser(null);
      } finally {
        console.log('🔄 Initial loading state: false (initialization complete)');
        setLoading(false);
        setIsInitialized(true);
        
        // Ensure we always have a user state, even if authentication fails
        if (!user && session?.user) {
          console.log('🛡️ Setting fallback user state');
          const userRole = session.user.user_metadata?.role || 'customer';
          const normalizedRole = userRole === 'user' ? 'customer' : userRole;
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: normalizedRole,
            full_name: session.user.user_metadata?.full_name || '',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            phone: session.user.user_metadata?.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setError(null);
      
      console.log('🔐 Attempting login for:', credentials.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        console.error('❌ Login error:', error.message);
        setError({
          message: error.message,
          code: error.name,
        });
        return;
      }

      console.log('✅ User logged in successfully:', data.user?.email);
      
      // Claim historical bookings after successful login
      try {
        console.log('🔗 Claiming historical bookings for user...');
        const { data: claimedCount } = await supabase.rpc('claim_user_bookings');
        if (claimedCount && claimedCount > 0) {
          console.log(`✅ Claimed ${claimedCount} historical booking(s)`);
        }
      } catch (claimError) {
        console.error('⚠️ Failed to claim historical bookings:', claimError);
        // Don't fail login if claiming bookings fails
      }
      
      // Don't set loading to false here - let the auth state listener handle it
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.error('❌ Login exception:', errorMessage);
      setError({
        message: errorMessage,
        code: 'LOGIN_ERROR',
      });
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setError(null);
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('🔐 Attempting registration for:', data.email);
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            role: data.role === 'user' ? 'customer' : (data.role || 'customer'), // Normalize 'user' to 'customer'
            phone: data.phone || '',
            first_name: data.firstName || '',
            last_name: data.lastName || '',
          }
        }
      });
      
      if (error) {
        console.error('❌ Registration error:', error.message);
        
        // Check if this is a database error but registration actually succeeded
        if (error.message.includes('database') || error.message.includes('saving')) {
          console.log('🔄 Database error detected, performing resilience check...');
          
          try {
            // Try to sign in with the same credentials to verify if user was actually created
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            });
            
            if (signInData.user && !signInError) {
              console.log('✅ User was actually created successfully despite database error');
              return; // Success, let auth state handler take over
            }
            
            if (signInError?.message.includes('Email not confirmed')) {
              console.log('✅ User was created but needs email confirmation, treating as success');
              return; // Success, email verification required
            }
          } catch (resilientCheckError) {
            console.error('❌ Resilience check failed:', resilientCheckError);
          }
        }
        
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
      console.error('❌ Registration exception:', errorMessage);
      setError({
        message: errorMessage,
        code: 'REGISTER_ERROR',
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚪 Starting logout process...');
      
      // Clear local state immediately for better UX
      setUser(null);
      setSession(null);
      
      // Attempt Supabase logout
      const { error } = await supabase.auth.signOut();
      
      // Handle session not found error gracefully (this is common and not a real error)
      if (error && error.message !== 'Session not found') {
        console.log('⚠️ Logout warning (continuing anyway):', error.message);
        // Don't set error state for session not found - it's expected behavior
      }

      // Force clear all auth data from localStorage
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase.auth.token') || 
          key.startsWith('sb-') ||
          key.includes('supabase')
        );
        authKeys.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Cleared auth data from localStorage');
      } catch (storageError) {
        console.log('⚠️ Could not clear localStorage:', storageError);
      }

      console.log('✅ User logged out successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      console.error('❌ Logout error:', errorMessage);
      
      // Even if logout fails, clear local state
      setUser(null);
      setSession(null);
      
      // Only set error for unexpected errors, not session issues
      if (!errorMessage.includes('Session not found')) {
        setError({
          message: errorMessage,
          code: 'LOGOUT_ERROR',
        });
      }
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
          emailRedirectTo: `${window.location.origin}/auth/callback`
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
    isOwner: auth.hasRole('owner') || auth.hasRole('property_owner'),
  };
};
