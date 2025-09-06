
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminRole = () => {
  const [roles, setRoles] = useState({
    isAdmin: false,
    isSuperAdmin: false,
    isFinanceAdmin: false,
    isNotificationsAdmin: false,
    isSupportAdmin: false,
    isAnalyticsAdmin: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRoles();
  }, []);

  const checkUserRoles = async () => {
    try {
      setLoading(true);
      
      // Check basic admin role from profiles
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        return false;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isBasicAdmin = profile?.role === 'admin';

      // Check extended roles from user_roles table
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roleSet = new Set(userRoles?.map(r => r.role) || []);

      setRoles({
        isAdmin: isBasicAdmin || roleSet.has('admin') || roleSet.has('super_admin'),
        isSuperAdmin: roleSet.has('super_admin'),
        isFinanceAdmin: isBasicAdmin || roleSet.has('admin') || roleSet.has('super_admin') || roleSet.has('finance_admin'),
        isNotificationsAdmin: isBasicAdmin || roleSet.has('admin') || roleSet.has('super_admin') || roleSet.has('notifications_admin'),
        isSupportAdmin: isBasicAdmin || roleSet.has('admin') || roleSet.has('super_admin') || roleSet.has('support_admin'),
        isAnalyticsAdmin: isBasicAdmin || roleSet.has('admin') || roleSet.has('super_admin') || roleSet.has('analytics_admin')
      });
    } catch (error) {
      console.error('Error checking user roles:', error);
      setRoles({
        isAdmin: false,
        isSuperAdmin: false,
        isFinanceAdmin: false,  
        isNotificationsAdmin: false,
        isSupportAdmin: false,
        isAnalyticsAdmin: false
      });
    } finally {
      setLoading(false);
    }
  };

  return { ...roles, loading, refreshRoles: checkUserRoles };
};
