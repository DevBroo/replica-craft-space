import { supabase } from '../integrations/supabase/client';

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Direct Supabase API calls to bypass CORS issues
const SUPABASE_URL = "https://riqsgtuzccwpplbodwbd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTY2NTUsImV4cCI6MjA2OTg3MjY1NX0.qkSVWoVi8cStB1WZdqtapc8O6jc_aAiYEm0Y5Lqp1-s";

// Direct fetch-based authentication
export const directSignIn = async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    console.log('🔐 Attempting direct sign in...');
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'X-Client-Info': 'picnify-web'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Direct sign in failed:', errorData);
      
      return {
        user: null,
        error: {
          message: errorData.error_description || errorData.message || 'Sign in failed',
          status: response.status,
          code: errorData.error
        }
      };
    }

    const data = await response.json();
    console.log('✅ Direct sign in successful:', data.user?.email);
    
    // Store the session
    localStorage.setItem('sb-access-token', data.access_token);
    localStorage.setItem('sb-refresh-token', data.refresh_token);
    
    // Get user details from database
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&id=eq.${data.user.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${data.access_token}`
      }
    });

    let userData = null;
    if (userResponse.ok) {
      const users = await userResponse.json();
      userData = users[0];
      console.log('📊 User data from database:', userData);
    } else {
      console.log('⚠️ Failed to fetch user data from database');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email,
      role: userData?.role || 'customer', // Default to customer instead of user
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };

    console.log('👤 User object created:', user);

    // Store user in localStorage
    localStorage.setItem('sb-user', JSON.stringify(user));

    return { user, error: null };

  } catch (error) {
    console.error('💥 Direct sign in error:', error);
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Network error occurred',
        code: 'NETWORK_ERROR'
      }
    };
  }
};

// Get current session
export const getCurrentSession = async (): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const accessToken = localStorage.getItem('sb-access-token');
    if (!accessToken) {
      return { user: null, error: null };
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      return { user: null, error: null };
    }

    const data = await response.json();
    
    // Get user details from database
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&id=eq.${data.id}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let userData = null;
    if (userResponse.ok) {
      const users = await userResponse.json();
      userData = users[0];
    }

    const user: User = {
      id: data.id,
      email: data.email,
      role: userData?.role || 'customer', // Default to customer instead of user
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    // Store user in localStorage
    localStorage.setItem('sb-user', JSON.stringify(user));

    return { user, error: null };

  } catch (error) {
    console.error('💥 Get session error:', error);
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Network error occurred',
        code: 'NETWORK_ERROR'
      }
    };
  }
};

// Sign out
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const accessToken = localStorage.getItem('sb-access-token');
    if (accessToken) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    }
    
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-user');
    
    return { error: null };
  } catch (error) {
    console.error('💥 Sign out error:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Sign out failed',
        code: 'SIGNOUT_ERROR'
      }
    };
  }
};

// Legacy functions for compatibility
export const signInWithPassword = async (email: string, password: string) => {
  return directSignIn(email, password);
};

export const getSession = async () => {
  return getCurrentSession();
};

export const signUp = async (email: string, password: string, userData: any) => {
  try {
    console.log('🔐 Attempting direct sign up...');
    console.log('📤 Signup data being sent:', { email, password, userData });
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'X-Client-Info': 'picnify-web'
      },
      body: JSON.stringify({
        email,
        password,
        data: userData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Direct sign up failed:', errorData);
      
      return {
        user: null,
        error: {
          message: errorData.error_description || errorData.message || 'Sign up failed',
          status: response.status,
          code: errorData.error
        }
      };
    }

    const data = await response.json();
    console.log('✅ Direct sign up successful:', data.user?.email);
    
    return { user: data.user, error: null };

  } catch (error) {
    console.error('💥 Direct sign up error:', error);
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Network error occurred',
        code: 'NETWORK_ERROR'
      }
    };
  }
};

// Auth Service Interface
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

// Auth Service Implementation
export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    console.log('🔐 Login attempt for:', credentials.email);
    const result = await directSignIn(credentials.email, credentials.password);
    
    if (result.user) {
      console.log('✅ Login successful, user role:', result.user.role);
      // Check if we need to update the user's role in the database
      if (result.user.role === 'customer') {
        console.log('⚠️ User role is customer, checking if they should be owner');
        // This could be a user who signed up as owner but role wasn't saved properly
        // For now, we'll let the dashboard handle the redirect
      }
    }
    
    return result;
  },

  async register(data: RegisterData): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    console.log('🔐 Registration data:', { email: data.email, role: data.role });
    
    // First, register the user
    const signupResult = await signUp(data.email, data.password, {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      role: data.role
    });
    
    if (signupResult.error) {
      return signupResult;
    }
    
    // If registration is successful, automatically log in the user
    const loginResult = await directSignIn(data.email, data.password);
    
    if (loginResult.error) {
      return {
        user: null,
        error: {
          message: 'Registration successful but automatic login failed. Please log in manually.',
          code: 'AUTO_LOGIN_FAILED'
        }
      };
    }
    
    // Ensure the role is preserved from registration
    if (loginResult.user && loginResult.user.role !== data.role) {
      console.log('⚠️ Role mismatch detected, correcting from', loginResult.user.role, 'to', data.role);
      loginResult.user.role = data.role;
      // Update localStorage with corrected user data
      localStorage.setItem('sb-user', JSON.stringify(loginResult.user));
    }
    
    return loginResult;
  },

  async logout(): Promise<{ error: AuthError | null }> {
    return signOut();
  },

  async loginWithOtp(phone: string): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          type: 'sms'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error_description || 'Failed to send OTP',
            status: response.status
          }
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to send OTP',
          code: 'OTP_ERROR'
        }
      };
    }
  },

  async verifyOtp(phone: string, token: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          token,
          type: 'sms'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          user: null,
          error: {
            message: errorData.error_description || 'Invalid OTP',
            status: response.status
          }
        };
      }

      const data = await response.json();
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || phone,
        role: 'user',
        created_at: data.user.created_at,
        updated_at: data.user.updated_at
      };

      return { user, error: null };
    } catch (error) {
      return {
        user: null,
        error: {
          message: error instanceof Error ? error.message : 'OTP verification failed',
          code: 'OTP_ERROR'
        }
      };
    }
  },

  async updateProfile(updates: Partial<AuthUser>): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const accessToken = localStorage.getItem('sb-access-token');
      if (!accessToken) {
        return {
          user: null,
          error: { message: 'No active session' }
        };
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${updates.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        return {
          user: null,
          error: { message: 'Failed to update profile' }
        };
      }

      const currentUser = this.getCurrentUser();
      return { user: currentUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: {
          message: error instanceof Error ? error.message : 'Profile update failed'
        }
      };
    }
  },

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error_description || 'Failed to send reset email',
            status: response.status
          }
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Password reset failed'
        }
      };
    }
  },

  async resendVerification(email: string): Promise<{ error: AuthError | null }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, type: 'signup' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error_description || 'Failed to resend verification',
            status: response.status
          }
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to resend verification'
        }
      };
    }
  },

  async changePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const accessToken = localStorage.getItem('sb-access-token');
      if (!accessToken) {
        return { error: { message: 'No active session' } };
      }

      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error_description || 'Failed to change password',
            status: response.status
          }
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Password change failed'
        }
      };
    }
  },

  getCurrentUser(): AuthUser | null {
    const accessToken = localStorage.getItem('sb-access-token');
    if (!accessToken) return null;

    // Try to get user from localStorage first
    const storedUser = localStorage.getItem('sb-user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }

    // If no stored user, return null (will trigger re-authentication)
    return null;
  },

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
};
