import { supabase } from '@/integrations/supabase/client';

export const checkAdminAuth = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { isAuthenticated: false, error: 'No valid session' };
    }

    // Verify admin role in database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return { isAuthenticated: false, error: 'Admin access required' };
    }

    return { isAuthenticated: true, user: session.user };
  } catch (error) {
    return { isAuthenticated: false, error: error instanceof Error ? error.message : 'Authentication failed' };
  }
};

export const checkOwnerAuth = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { isAuthenticated: false, error: 'No valid session' };
    }

    // Verify owner role in database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'property_owner' && profile.role !== 'owner')) {
      return { isAuthenticated: false, error: 'Property owner access required' };
    }

    return { isAuthenticated: true, user: session.user, role: profile.role };
  } catch (error) {
    return { isAuthenticated: false, error: error instanceof Error ? error.message : 'Authentication failed' };
  }
};