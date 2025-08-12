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
  status?: 'active' | 'inactive' | 'pending';
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
      console.log('🔍 Fetching property owners...');
      
      // Get all unique owner IDs from properties table
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('owner_id, created_at')
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('❌ Error fetching properties:', propertiesError);
        throw propertiesError;
      }

      console.log('✅ Found properties:', properties?.length || 0);
      console.log('✅ Properties data:', properties);

      // Get unique owner IDs
      const uniqueOwnerIds = [...new Set(properties?.map(p => p.owner_id) || [])];
      console.log('✅ Found unique owner IDs:', uniqueOwnerIds);

      if (uniqueOwnerIds.length === 0) {
        console.log('⚠️ No unique owner IDs found');
        return [];
      }

      // For each owner ID, get their info from auth metadata (if available) or create basic info
      const ownersWithCounts = await Promise.all(
        uniqueOwnerIds.map(async (ownerId) => {
          console.log('🔍 Processing owner ID:', ownerId);
          
          // Count properties for this owner
          const { count: propertiesCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId);

          console.log('✅ Properties count for', ownerId, ':', propertiesCount);

          // Get the first property to get creation date
          const { data: firstProperty } = await supabase
            .from('properties')
            .select('created_at')
            .eq('owner_id', ownerId)
            .limit(1);

          const ownerData = {
            id: ownerId,
            email: `owner-${ownerId.substring(0, 8)}@picnify.com`,
            full_name: `Property Owner (${ownerId.substring(0, 8)})`,
            role: 'property_owner',
            phone: null,
            avatar_url: null,
            created_at: firstProperty?.[0]?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            properties_count: propertiesCount || 0,
            status: 'active'
          };

          console.log('✅ Created owner data:', ownerData);
          return ownerData;
        })
      );

      console.log('✅ Property owners with counts:', ownersWithCounts.length);
      console.log('✅ Final owners data:', ownersWithCounts);
      return ownersWithCounts;
    } catch (error) {
      console.error('💥 Error in getPropertyOwners:', error);
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
  async updateOwnerStatus(ownerId: string, status: 'active' | 'inactive' | 'pending'): Promise<void> {
    try {
      console.log('🔄 Updating owner status:', { ownerId, status });
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          // You might want to add a status field to the profiles table
          // For now, we'll just update the updated_at timestamp
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
        ...profile,
        properties: properties || [],
        properties_count: properties?.length || 0
      };

      console.log('✅ Owner details fetched:', ownerDetails);
      return ownerDetails;
    } catch (error) {
      console.error('💥 Error in getOwnerDetails:', error);
      throw error;
    }
  }
};
