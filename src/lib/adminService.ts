import { supabase } from '../integrations/supabase/client';
import { bankingService } from './bankingService';
import { profileSecurityService } from './profileSecurityService';

export interface Host {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  properties_count?: number;
  is_active: boolean;
  commission_rate?: number;
  created_by?: string;
  created_by_profile?: { full_name: string };
}

export interface AdminStats {
  total_owners: number;
  active_owners: number;
  pending_owners: number;
  total_properties: number;
  approved_properties: number;
  pending_properties: number;
}

export interface OwnerFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  propertiesCount?: string;
}

export const adminService = {
  // Helper function to get authorization headers
  async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found. Please log in again.');
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  },

  // Fetch all hosts with their property counts and optional filters
  async getHosts(filters?: OwnerFilters): Promise<Host[]> {
    try {
      console.log('🔍 Fetching hosts using edge function...', filters);
      
      // Get current session and verify authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-owners', {
        body: { 
          action: 'list',
          filters: filters || {}
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'X-Action': 'list',
          'X-Picnify-Action': 'list'
        }
      });

      if (error) {
        console.error('❌ Error fetching hosts:', error);
        
        // Handle specific error types
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          throw new Error('Authentication failed. Please log in again as an admin.');
        }
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          throw new Error('Access denied. Admin privileges required.');
        }
        
        throw error;
      }

      console.log('✅ Hosts loaded:', data.owners?.length || 0);
      return data.owners || [];
    } catch (error) {
      console.error('💥 Error in getHosts:', error);
      throw error;
    }
  },

  // Add new host
  async addHost(ownerData: { email: string; full_name: string; phone?: string }): Promise<void> {
    try {
      console.log('👤 Adding new host:', ownerData.email);
      
      // Get current session and verify authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      // Simple client-side check to prevent admin from inviting themselves
      if (session.user?.email === ownerData.email.toLowerCase()) {
        throw new Error('You cannot invite yourself as a host.');
      }
      
      const { data, error } = await supabase.functions.invoke('admin-owners', {
        body: { 
          action: 'invite',
          ...ownerData
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'X-Action': 'invite',
          'X-Picnify-Action': 'invite',
          'X-Owner-Email': ownerData.email,
          'X-Owner-Name': ownerData.full_name,
          'X-Owner-Phone': ownerData.phone || ''
        }
      });

      if (error) {
        console.error('❌ Error adding host:', error);
        
        // Handle specific error types
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          throw new Error('Authentication failed. Please log in again as an admin.');
        }
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          throw new Error('Access denied. Admin privileges required.');
        }
        
        throw error;
      }

      // Check for success/failure in the response data
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to add host');
      }

      console.log('✅ Host added successfully:', data);
    } catch (error) {
      console.error('💥 Error in addHost:', error);
      throw error;
    }
  },

  // Update owner status using Edge Function
  async updateOwnerStatus(ownerId: string, isActive: boolean): Promise<void> {
    try {
      console.log('🔄 Updating owner status:', { ownerId, isActive });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-owners', {
        body: { 
          action: 'update_status',
          owner_id: ownerId,
          is_active: isActive
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error updating owner status:', error);
        throw error;
      }

      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to update owner status');
      }

      console.log('✅ Owner status updated successfully');
    } catch (error) {
      console.error('💥 Error in updateOwnerStatus:', error);
      throw error;
    }
  },

  // Get owner insights
  async getOwnerInsights(ownerId: string): Promise<any> {
    try {
      console.log('📊 Fetching owner insights:', ownerId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-owners', {
        body: { 
          action: 'insights',
          owner_id: ownerId
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error fetching owner insights:', error);
        throw error;
      }

      console.log('✅ Owner insights fetched successfully');
      return data.insights;
    } catch (error) {
      console.error('💥 Error in getOwnerInsights:', error);
      throw error;
    }
  },

  // Get owner details with extended profile and bank details
  async getOwnerDetailsExtended(ownerId: string): Promise<any> {
    try {
      console.log('🔍 Fetching extended owner details:', ownerId);
      
      // Get profile data securely with audit logging
      const profile = await profileSecurityService.getFullProfileForAdmin(
        ownerId,
        'Owner details retrieval for admin management - extended details view'
      );

      if (!profile) {
        throw new Error('Owner profile not found or access denied');
      }

      // Get extended owner profile
      const { data: ownerProfile, error: ownerProfileError } = await supabase
        .from('owner_profiles')
        .select('*')
        .eq('user_id', ownerId)
        .single();

      // Get bank details securely
      const bankDetails = await bankingService.getBankDetails(ownerId);

      // Get owner's properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('❌ Error fetching owner properties:', propertiesError);
        throw propertiesError;
      }

      // Get activity logs
      const { data: activityLogs, error: activityError } = await supabase
        .from('owner_activity_logs')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(50);

      const ownerDetails = {
        ...profile,
        owner_profile: ownerProfile,
        bank_details: bankDetails,
        properties: properties || [],
        properties_count: properties?.length || 0,
        activity_logs: activityLogs || []
      };

      console.log('✅ Extended owner details fetched:', ownerDetails);
      return ownerDetails;
    } catch (error) {
      console.error('💥 Error in getOwnerDetailsExtended:', error);
      throw error;
    }
  },

  // Send notification to owner
  async sendNotificationToOwner(
    ownerId: string, 
    notification: {
      title: string;
      message: string;
      type: 'email' | 'sms' | 'in-app';
      priority: 'low' | 'normal' | 'high';
    }
  ): Promise<void> {
    try {
      console.log('📧 Sending notification to owner:', ownerId, notification.type);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      // Create notification record
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          target_user_id: ownerId,
          title: notification.title,
          content: notification.message,
          type: notification.type === 'in-app' ? 'info' : notification.type,
          priority: notification.priority,
          status: 'unread',
          target_audience: null,
          related_entity_type: 'owner',
          related_entity_id: ownerId
        });

      if (notificationError) throw notificationError;

      // Log activity
      await supabase.rpc('log_owner_activity_fn', {
        p_owner_id: ownerId,
        p_action: 'notification_sent',
        p_actor_id: session.user?.id,
        p_actor_type: 'admin',
        p_metadata: {
          notification_type: notification.type,
          title: notification.title,
          priority: notification.priority
        }
      });

      console.log('✅ Notification sent successfully');
    } catch (error) {
      console.error('💥 Error in sendNotificationToOwner:', error);
      throw error;
    }
  },

  // Update owner profile and bank details
  async updateOwnerProfile(
    ownerId: string,
    profileData: {
      basic?: {
        full_name?: string;
        phone?: string;
        commission_rate?: number;
        is_active?: boolean;
      };
      business?: {
        company_name?: string;
        gst_number?: string;
        pan_number?: string;
        aadhar_number?: string;
        office_address?: any;
        is_office_same_as_property?: boolean;
        property_types_offered?: string[];
        logo_url?: string;
        documents?: any;
      };
      bank?: {
        account_holder_name?: string;
        bank_name?: string;
        branch_name?: string;
        account_number?: string;
        ifsc_code?: string;
        account_type?: string;
        pan_number?: string;
        upi_id?: string;
        micr_code?: string;
      };
    }
  ): Promise<void> {
    try {
      console.log('📝 Updating owner profile:', ownerId);
      
      // Update basic profile if provided
      if (profileData.basic) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            ...profileData.basic,
            updated_at: new Date().toISOString()
          })
          .eq('id', ownerId);

        if (profileError) throw profileError;
      }

      // Update business profile if provided
      if (profileData.business) {
        const { error: businessError } = await supabase
          .from('owner_profiles')
          .upsert({
            user_id: ownerId,
            ...profileData.business,
            updated_at: new Date().toISOString()
          });

        if (businessError) throw businessError;
      }

      // Update bank details if provided - using secure banking service
      if (profileData.bank && profileData.bank.account_holder_name && profileData.bank.bank_name && profileData.bank.account_number && profileData.bank.ifsc_code) {
        await bankingService.saveBankDetails(ownerId, {
          account_holder_name: profileData.bank.account_holder_name,
          bank_name: profileData.bank.bank_name,
          branch_name: profileData.bank.branch_name,
          account_number: profileData.bank.account_number,
          ifsc_code: profileData.bank.ifsc_code,
          account_type: profileData.bank.account_type,
          pan_number: profileData.bank.pan_number,
          upi_id: profileData.bank.upi_id,
          micr_code: profileData.bank.micr_code
        });
      }

      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.rpc('log_owner_activity_fn', {
        p_owner_id: ownerId,
        p_action: 'profile_updated',
        p_actor_id: session?.user?.id,
        p_actor_type: 'admin',
        p_metadata: {
          updated_sections: Object.keys(profileData)
        }
      });

      console.log('✅ Owner profile updated successfully');
    } catch (error) {
      console.error('💥 Error in updateOwnerProfile:', error);
      throw error;
    }
  },

  // Get admin dashboard statistics
  async getAdminStats(): Promise<AdminStats> {
    try {
      console.log('📊 Fetching admin statistics...');
      
      // Get owner counts
      const { count: totalOwners } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'property_owner');

      // Get property counts
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      const { count: approvedProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: pendingProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const stats: AdminStats = {
        total_owners: totalOwners || 0,
        active_owners: totalOwners || 0, // You can add logic to determine active owners
        pending_owners: 0, // You can add logic to determine pending owners
        total_properties: totalProperties || 0,
        approved_properties: approvedProperties || 0,
        pending_properties: pendingProperties || 0,
      };

      console.log('✅ Admin stats:', stats);
      return stats;
    } catch (error) {
      console.error('💥 Error in getAdminStats:', error);
      throw error;
    }
  },

  // Delete owner (with confirmation)
  async deleteOwner(ownerId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting owner:', ownerId);
      
      // First, check if owner has properties
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerId);

      if (propertiesCount && propertiesCount > 0) {
        throw new Error(`Cannot delete owner with ${propertiesCount} properties. Please transfer or delete properties first.`);
      }

      // Delete the owner profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', ownerId)
        .eq('role', 'property_owner');

      if (error) {
        console.error('❌ Error deleting owner:', error);
        throw error;
      }

      console.log('✅ Owner deleted successfully');
    } catch (error) {
      console.error('💥 Error in deleteOwner:', error);
      throw error;
    }
  },

  // Get owner details with properties
  async getOwnerDetails(ownerId: string): Promise<Host & { properties: any[] }> {
    try {
      console.log('🔍 Fetching owner details:', ownerId);
      
      // Get owner profile securely  
      const profile = await profileSecurityService.getFullProfileForAdmin(
        ownerId,
        'Owner details retrieval for admin management - basic view'
      );

      if (!profile) {
        throw new Error('Owner profile not found or access denied');
      }

      // Get owner's properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('❌ Error fetching owner properties:', propertiesError);
        throw propertiesError;
      }

      const ownerDetails = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        is_active: profile.is_active,
        commission_rate: profile.commission_rate,
        created_by: profile.created_by,
        properties: properties || [],
        properties_count: properties?.length || 0
      } as Host & { properties: any[] };

      console.log('✅ Owner details fetched:', ownerDetails);
      return ownerDetails;
    } catch (error) {
      console.error('💥 Error in getOwnerDetails:', error);
      throw error;
    }
  },

  // Get list of admin users for filters
  async getAdminUsers(): Promise<Array<{ id: string; full_name: string }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'admin')
        .order('full_name');

      if (error) {
        console.error('❌ Error fetching admin users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('💥 Error in getAdminUsers:', error);
      return [];
    }
  }
};
