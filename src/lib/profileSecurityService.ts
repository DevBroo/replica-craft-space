import { supabase } from "@/integrations/supabase/client";

/**
 * Secure Profile Service - Handles personal information with enhanced security
 * Features:
 * - Automatic audit logging for all access
 * - Data masking for sensitive fields
 * - Access reason requirements for admin operations
 * - Field-level access controls
 */

export interface SecureProfile {
  id: string;
  full_name: string;
  email_masked: string;
  phone_masked: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FullProfileData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  commission_rate: number;
  created_by: string | null;
}

export interface ProfilesListItem {
  id: string;
  full_name: string;
  email_partial: string;
  phone_partial: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  total_count: number;
}

export const profileSecurityService = {
  /**
   * Get a user's own profile or admin access with audit logging
   */
  async getProfile(profileId: string, accessReason?: string): Promise<SecureProfile | null> {
    try {
      const { data, error } = await supabase.rpc('get_profile_secure', {
        p_profile_id: profileId,
        p_access_reason: accessReason || 'Profile access'
      });

      if (error) {
        console.error('Error fetching secure profile:', error);
        throw new Error('Failed to fetch profile: ' + error.message);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Profile security service error:', error);
      throw error;
    }
  },

  /**
   * Get profiles list for admin with automatic masking and audit logging
   */
  async getProfilesList(
    limit: number = 50,
    offset: number = 0,
    search?: string,
    roleFilter?: string,
    accessReason: string = 'Admin user management'
  ): Promise<ProfilesListItem[]> {
    try {
      const { data, error } = await supabase.rpc('get_profiles_admin_list', {
        p_limit: limit,
        p_offset: offset,
        p_search: search || null,
        p_role_filter: roleFilter || null,
        p_access_reason: accessReason
      });

      if (error) {
        console.error('Error fetching profiles list:', error);
        throw new Error('Failed to fetch profiles list: ' + error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Profile security service error:', error);
      throw error;
    }
  },

  /**
   * Get full profile details for admin with mandatory access reason
   */
  async getFullProfileForAdmin(
    profileId: string,
    accessReason: string
  ): Promise<FullProfileData | null> {
    try {
      if (!accessReason || accessReason.trim().length < 10) {
        throw new Error('Access reason must be at least 10 characters for full profile access');
      }

      const { data, error } = await supabase.rpc('get_profile_admin_full', {
        p_profile_id: profileId,
        p_access_reason: accessReason.trim()
      });

      if (error) {
        console.error('Error fetching full profile:', error);
        throw new Error('Failed to fetch full profile: ' + error.message);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Profile security service error:', error);
      throw error;
    }
  },

  /**
   * Update profile with audit logging
   */
  async updateProfile(
    profileId: string,
    updates: Partial<{
      full_name: string;
      phone: string;
      avatar_url: string;
      role: string;
      is_active: boolean;
      commission_rate: number;
    }>,
    accessReason: string = 'Profile update'
  ): Promise<void> {
    try {
      // Log the update attempt
      await supabase.rpc('log_profile_access', {
        p_profile_id: profileId,
        p_access_type: 'update',
        p_accessed_fields: Object.keys(updates),
        p_access_reason: accessReason
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile: ' + error.message);
      }
    } catch (error) {
      console.error('Profile security service error:', error);
      throw error;
    }
  },

  /**
   * Get audit logs for a profile (admin only)
   */
  async getProfileAuditLogs(
    profileId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles_access_audit')
        .select(`
          *,
          accessed_by_profile:profiles!accessed_by(full_name, email)
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw new Error('Failed to fetch audit logs: ' + error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Profile security service error:', error);
      throw error;
    }
  },

  /**
   * Check if current user can access full profile data
   */
  async canAccessFullProfiles(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      return profile?.role === 'admin';
    } catch {
      return false;
    }
  },

  /**
   * Mask email for display
   */
  maskEmail(email: string): string {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    return parts[0].slice(0, 3) + '***@' + parts[1];
  },

  /**
   * Mask phone for display
   */
  maskPhone(phone: string): string {
    if (!phone) return '';
    if (phone.length < 4) return 'XXX-XXX';
    return 'XXX-XXX-' + phone.slice(-4);
  },

  /**
   * Validate access reason for admin operations
   */
  validateAccessReason(reason: string): void {
    if (!reason || reason.trim().length < 10) {
      throw new Error('Access reason must be at least 10 characters for security compliance');
    }

    const validReasons = [
      'user support',
      'account verification',
      'security investigation',
      'data correction',
      'compliance audit',
      'business verification',
      'fraud investigation',
      'system maintenance'
    ];

    const lowerReason = reason.toLowerCase();
    const hasValidContext = validReasons.some(valid => lowerReason.includes(valid));
    
    if (!hasValidContext) {
      console.warn('Admin provided non-standard access reason:', reason);
    }
  }
};