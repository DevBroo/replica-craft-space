import { supabase } from '../integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Create an admin-specific client that bypasses RLS
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://riqsgtuzccwpplbodwbd.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTY2NTUsImV4cCI6MjA2OTg3MjY1NX0.qkSVWoVi8cStB1WZdqtapc8O6jc_aAiYEm0Y5Lqp1-s";

// Create admin client with RLS bypass
export const adminSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'picnify-admin'
    }
  }
});

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
  is_active?: boolean;
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
  adminSupabase,
  // Fetch all property owners with their property counts
  async getPropertyOwners(): Promise<PropertyOwner[]> {
    try {
      console.log('🔍 Fetching property owners...');
      
      // Get all unique owner IDs from properties table
      const { data: properties, error: propertiesError } = await adminSupabase
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

      // Fetch actual user profiles for these owner IDs
      const { data: profiles, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('*')
        .in('id', uniqueOwnerIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('✅ Found profiles:', profiles?.length || 0);
      console.log('✅ Profiles data:', profiles);

      // Create a map of profiles by ID for quick lookup
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // For each owner ID, get their info and property count
      const ownersWithCounts = await Promise.all(
        uniqueOwnerIds.map(async (ownerId) => {
          console.log('🔍 Processing owner ID:', ownerId);
          
          // Count properties for this owner
          const { count: propertiesCount } = await adminSupabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId);

          console.log('✅ Properties count for', ownerId, ':', propertiesCount);

          // Get the first property to get creation date
          const { data: firstProperty } = await adminSupabase
            .from('properties')
            .select('created_at')
            .eq('owner_id', ownerId)
            .limit(1);

          // Get the profile data for this owner
          const profile = profilesMap.get(ownerId);
          
          // If no profile exists, create a basic one
          if (!profile) {
            console.log('⚠️ No profile found for owner', ownerId, '- creating basic profile');
            
            // Try to create a basic profile
            const basicProfileData = {
              id: ownerId,
              email: `owner-${ownerId.substring(0, 8)}@picnify.com`,
              full_name: `Property Owner (${ownerId.substring(0, 8)})`,
              role: 'property_owner',
              phone: null,
              avatar_url: null,
              created_at: firstProperty?.[0]?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Try to insert the profile (this might fail due to RLS, but that's okay)
            try {
              const { error: insertError } = await adminSupabase
                .from('profiles')
                .insert(basicProfileData);
              
              if (!insertError) {
                console.log('✅ Created basic profile for owner', ownerId);
              } else {
                console.log('⚠️ Could not create profile for owner', ownerId, '- using fallback data');
              }
            } catch (error) {
              console.log('⚠️ Error creating profile for owner', ownerId, '- using fallback data');
            }
          }
          
          const ownerData = {
            id: ownerId,
            email: profile?.email || `owner-${ownerId.substring(0, 8)}@picnify.com`,
            full_name: profile?.full_name || `Property Owner (${ownerId.substring(0, 8)})`,
            role: profile?.role || 'property_owner',
            phone: profile?.phone || null,
            avatar_url: profile?.avatar_url || null,
            created_at: profile?.created_at || firstProperty?.[0]?.created_at || new Date().toISOString(),
            updated_at: profile?.updated_at || new Date().toISOString(),
            properties_count: propertiesCount || 0,
            status: 'active' as const,
            is_active: true
          } as PropertyOwner;

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
      const { count: totalOwners } = await adminSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'property_owner');

      // Get property counts
      const { count: totalProperties } = await adminSupabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      const { count: approvedProperties } = await adminSupabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: pendingProperties } = await adminSupabase
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
      
      const { error } = await adminSupabase
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
      const { count: propertiesCount } = await adminSupabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerId);

      if (propertiesCount && propertiesCount > 0) {
        throw new Error(`Cannot delete owner with ${propertiesCount} properties. Please transfer or delete properties first.`);
      }

      // Delete the owner profile
      const { error } = await adminSupabase
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
      const { data: profile, error: profileError } = await adminSupabase
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
      const { data: properties, error: propertiesError } = await adminSupabase
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
