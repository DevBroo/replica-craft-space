// Direct Supabase API calls to bypass CORS issues
const SUPABASE_URL = "https://riqsgtuzccwpplbodwbd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTY2NTUsImV4cCI6MjA2OTg3MjY1NX0.qkSVWoVi8cStB1WZdqtapc8O6jc_aAiYEm0Y5Lqp1-s";

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
    
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      role: 'user', // Default role
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };

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
