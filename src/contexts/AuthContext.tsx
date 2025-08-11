import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { authService, AuthUser, LoginCredentials, RegisterData, AuthError } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
  changePassword: (newPassword: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);


  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (err: unknown) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const { user: authUser, error: authError } = await authService.login(credentials);
      
      if (authError) {
        setError(authError);
        return;
      }
      
      // Set the user directly from the login response
      if (authUser) {
        setUser(authUser);
        console.log('✅ User logged in successfully:', authUser);
      } else {
        // Fallback to getting user from auth service
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        console.log('✅ User set from auth service:', currentUser);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user: authUser, error: authError } = await authService.register(data);
      
      if (authError) {
        setError(authError);
        return;
      }
      
      setUser(authUser);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: authError } = await authService.logout();
      
      if (authError) {
        setError(authError);
        return;
      }
      
      // Update context state to match auth service
      setUser(authService.getCurrentUser());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithOtp = useCallback(async (phone: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error: authError } = await authService.loginWithOtp(phone);
      
      if (authError) {
        setError(authError);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'OTP login failed';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user: authUser, error: authError } = await authService.verifyOtp(phone, token);
      
      if (authError) {
        setError(authError);
        return;
      }
      
      // Update context state to match auth service
      setUser(authService.getCurrentUser());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    try {
      setLoading(true);
      setError(null);
      const { user: authUser, error: authError } = await authService.updateProfile(updates);
      
      if (authError) {
        setError(authError);
        return;
      }
      
      // Update context state to match auth service
      setUser(authService.getCurrentUser());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.resetPassword(email);
      
      if (result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      const errorCode = (err as { code?: string })?.code;
      const authError = {
        message: errorMessage,
        code: errorCode,
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
      const result = await authService.resendVerification(email);
      
      if (result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email';
      const errorCode = (err as { code?: string })?.code;
      const authError = {
        message: errorMessage,
        code: errorCode,
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
      const { error: authError } = await authService.changePassword(newPassword);
      
      if (authError) {
        setError(authError);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return authService.hasRole(role);
  }, []);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return authService.hasAnyRole(roles);
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    loginWithOtp,
    verifyOtp,
    updateProfile,
    resetPassword,
    resendVerification,
    changePassword,
    clearError,
    isAuthenticated: !!user,
    hasRole,
    hasAnyRole,
  }), [user, loading, error, login, register, logout, loginWithOtp, verifyOtp, updateProfile, resetPassword, resendVerification, changePassword, clearError, hasRole, hasAnyRole]);

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
export const useAdminAuth = () => {
  const auth = useAuth();
  return {
    ...auth,
    isAdmin: auth.hasRole('admin'),
  };
};

export const useOwnerAuth = () => {
  const auth = useAuth();
  return {
    ...auth,
    isOwner: auth.hasRole('owner'),
  };
};

export const useAgentAuth = () => {
  const auth = useAuth();
  return {
    ...auth,
    isAgent: auth.hasRole('agent'),
  };
};

export const useCustomerAuth = () => {
  const auth = useAuth();
  return {
    ...auth,
    isCustomer: auth.hasRole('customer'),
  };
};
