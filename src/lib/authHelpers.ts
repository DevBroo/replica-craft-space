import { supabase } from '@/integrations/supabase/client';

export const checkAdminAuth = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { isAuthenticated: false, error: 'No valid session' };
    }

    // Check admin role in profiles table first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    let hasAdminAccess = false;

    // Check profiles table first
    if (profile && profile.role === 'admin') {
      hasAdminAccess = true;
    }

    // If not admin in profiles, check user_roles table
    if (!hasAdminAccess) {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['admin', 'super_admin']);

      if (!rolesError && userRoles && userRoles.length > 0) {
        hasAdminAccess = true;
      }
    }

    if (!hasAdminAccess) {
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
      return { isAuthenticated: false, error: 'Host access required' };
    }

    return { isAuthenticated: true, user: session.user, role: profile.role };
  } catch (error) {
    return { isAuthenticated: false, error: error instanceof Error ? error.message : 'Authentication failed' };
  }
};