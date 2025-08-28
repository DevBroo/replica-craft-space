import { supabase } from '../integrations/supabase/client';

export interface PropertyOwner {
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
}

export interface AdminStats {
  total_owners: number;
  active_owners: number;
  pending_owners: number;
  total_properties: number;
  approved_properties: number;
  pending_properties: number;
}

export const adminService = {
  // Fetch all property owners with their property counts
  async getPropertyOwners(): Promise<PropertyOwner[]> {
    try {
      console.log('🔍 Fetching property owners using edge function...');
      
      const { data, error } = await supabase.functions.invoke('admin-owners', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('❌ Error fetching property owners:', error);
        throw error;
      }

      console.log('✅ Property owners loaded:', data.owners?.length || 0);
      return data.owners || [];
    } catch (error) {
      console.error('💥 Error in getPropertyOwners:', error);
      throw error;
    }
  },

  // Add new property owner
  async addPropertyOwner(ownerData: { email: string; full_name: string; phone?: string }): Promise<void> {
    try {
      console.log('👤 Adding new property owner:', ownerData.email);
      
      const { data, error } = await supabase.functions.invoke('admin-owners', {
        body: { 
          action: 'invite',
          ...ownerData
        }
      });

      if (error) {
        console.error('❌ Error adding property owner:', error);
        throw error;
      }

      console.log('✅ Property owner added successfully:', data);
    } catch (error) {
      console.error('💥 Error in addPropertyOwner:', error);
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

  // Update owner status
  async updateOwnerStatus(ownerId: string, isActive: boolean): Promise<void> {
    try {
      console.log('🔄 Updating owner status:', { ownerId, isActive });
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', ownerId)
        .eq('role', 'property_owner');

      if (error) {
        console.error('❌ Error updating owner status:', error);
        throw error;
      }

      console.log('✅ Owner status updated successfully');
    } catch (error) {
      console.error('💥 Error in updateOwnerStatus:', error);
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
  async getOwnerDetails(ownerId: string): Promise<PropertyOwner & { properties: any[] }> {
    try {
      console.log('🔍 Fetching owner details:', ownerId);
      
      // Get owner profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ownerId)
        .eq('role', 'property_owner')
        .single();

      if (profileError) {
        console.error('❌ Error fetching owner profile:', profileError);
        throw profileError;
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
        properties: properties || [],
        properties_count: properties?.length || 0
      } as PropertyOwner & { properties: any[] };

      console.log('✅ Owner details fetched:', ownerDetails);
      return ownerDetails;
    } catch (error) {
      console.error('💥 Error in getOwnerDetails:', error);
      throw error;
    }
  }
};
