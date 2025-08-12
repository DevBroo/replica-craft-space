import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
type Property = Database['public']['Tables']['properties']['Row'];

export interface PropertyFormData {
  name: string;
  type: string;
  location: string;
  city: string;
  state: string;
  price: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  amenities: string[];
  images: string[];
}

export class PropertyService {
  /**
   * Add a new property to the database
   */
  static async addProperty(propertyData: PropertyFormData, ownerId: string): Promise<Property | null> {
    try {
      console.log('💾 Adding property to database:', propertyData);
      console.log('🔐 Owner ID:', ownerId);
      
      // Verify user session exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('✅ Session verified for user:', session.user.id);
      
      // Ensure the owner_id matches the authenticated user
      if (session.user.id !== ownerId) {
        throw new Error('User ID mismatch. Please log in again.');
      }
      
      const propertyInsert: PropertyInsert = {
        owner_id: ownerId,
        title: propertyData.name,
        description: propertyData.description,
        location: {
          city: propertyData.city,
          state: propertyData.state,
          address: propertyData.location
        },
        address: `${propertyData.location}, ${propertyData.city}, ${propertyData.state}`,
        property_type: propertyData.type,
        amenities: propertyData.amenities,
        pricing: {
          daily_rate: propertyData.price,
          currency: 'INR'
        },
        images: propertyData.images,
        max_guests: propertyData.capacity,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        status: 'pending',
        is_featured: false,
        rating: 0,
        review_count: 0
      };

      console.log('📝 Property insert object:', propertyInsert);

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyInsert)
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding property to database:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Provide user-friendly error messages
        if (error.message.includes('row-level security')) {
          throw new Error('Permission denied. Please ensure you are logged in and have the correct permissions.');
        } else if (error.message.includes('violates')) {
          throw new Error('Data validation failed. Please check all required fields are filled correctly.');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      console.log('✅ Property added to database successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to add property to database:', error);
      throw error;
    }
  }

  /**
   * Update an existing property in the database
   */
  static async updateProperty(propertyId: string, propertyData: PropertyFormData): Promise<Property | null> {
    try {
      console.log('💾 Updating property in database:', propertyId, propertyData);
      
      const propertyUpdate: PropertyUpdate = {
        title: propertyData.name,
        description: propertyData.description,
        location: {
          city: propertyData.city,
          state: propertyData.state,
          address: propertyData.location
        },
        address: `${propertyData.location}, ${propertyData.city}, ${propertyData.state}`,
        property_type: propertyData.type,
        amenities: propertyData.amenities,
        pricing: {
          daily_rate: propertyData.price,
          currency: 'INR'
        },
        images: propertyData.images,
        max_guests: propertyData.capacity,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms
      };

      const { data, error } = await supabase
        .from('properties')
        .update(propertyUpdate)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating property in database:', error);
        throw error;
      }

      console.log('✅ Property updated in database successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update property in database:', error);
      throw error;
    }
  }

  /**
   * Delete a property from the database
   */
  static async deleteProperty(propertyId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting property from database:', propertyId);
      
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        console.error('❌ Error deleting property from database:', error);
        throw error;
      }

      console.log('✅ Property deleted from database successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete property from database:', error);
      throw error;
    }
  }

  /**
   * Get all properties for a specific owner
   */
  static async getOwnerProperties(ownerId: string): Promise<Property[]> {
    try {
      console.log('🔍 Fetching properties for owner:', ownerId);
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching owner properties:', error);
        throw error;
      }

      console.log('✅ Owner properties fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch owner properties:', error);
      throw error;
    }
  }

  /**
   * Get all properties (for admin/cache purposes)
   */
  static async getAllProperties(): Promise<Property[]> {
    try {
      console.log('🔍 Fetching all properties');
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all properties:', error);
        throw error;
      }

      console.log('✅ Successfully fetched all properties:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch all properties:', error);
      throw error;
    }
  }

  /**
   * Get all active properties for public display
   */
  static async getActiveProperties(): Promise<Property[]> {
    try {
      console.log('🔍 Fetching properties for public display');
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('status', ['approved', 'pending'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching properties:', error);
        throw error;
      }

      console.log('✅ Properties fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch properties:', error);
      throw error;
    }
  }

  /**
   * Update property status
   */
  static async updatePropertyStatus(propertyId: string, status: 'pending' | 'approved' | 'rejected' | 'inactive'): Promise<Property | null> {
    try {
      console.log('🔄 Updating property status:', propertyId, status);
      
      const { data, error } = await supabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating property status:', error);
        throw error;
      }

      console.log('✅ Property status updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update property status:', error);
      throw error;
    }
  }

  /**
   * Get a single property by ID
   */
  static async getPropertyById(propertyId: string): Promise<Property | null> {
    try {
      console.log('🔍 Fetching property by ID:', propertyId);
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) {
        console.error('❌ Error fetching property by ID:', error);
        throw error;
      }

      console.log('✅ Property fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch property by ID:', error);
      throw error;
    }
  }

  /**
   * Convert database property to frontend format
   */
  static convertToFrontendFormat(dbProperty: Property): any {
    return {
      id: dbProperty.id,
      name: dbProperty.title,
      type: dbProperty.property_type,
      location: (dbProperty.location as any)?.address || '',
      city: (dbProperty.location as any)?.city || '',
      state: (dbProperty.location as any)?.state || '',
      price: (dbProperty.pricing as any)?.daily_rate || 0,
      capacity: dbProperty.max_guests,
      bedrooms: dbProperty.bedrooms || 0,
      bathrooms: dbProperty.bathrooms || 0,
      status: dbProperty.status,
      rating: dbProperty.rating,
      totalBookings: dbProperty.review_count,
      totalEarnings: 0, // This would need to be calculated from bookings
      images: dbProperty.images || [],
      amenities: dbProperty.amenities || [],
      description: dbProperty.description || '',
      createdAt: dbProperty.created_at,
      lastUpdated: dbProperty.updated_at,
      ownerEmail: dbProperty.owner_id // This would need to be joined with users table
    };
  }

  /**
   * Convert frontend property to database format
   */
  static convertToDatabaseFormat(frontendProperty: any): PropertyFormData {
    return {
      name: frontendProperty.name,
      type: frontendProperty.type,
      location: frontendProperty.location,
      city: frontendProperty.city,
      state: frontendProperty.state,
      price: frontendProperty.price,
      capacity: frontendProperty.capacity,
      bedrooms: frontendProperty.bedrooms,
      bathrooms: frontendProperty.bathrooms,
      description: frontendProperty.description,
      amenities: frontendProperty.amenities,
      images: frontendProperty.images
    };
  }

  /**
   * Clear all properties from database (DANGEROUS - use with caution)
   */
  static async clearAllProperties(): Promise<boolean> {
    try {
      console.log('🗑️ Clearing all properties from database...');
      
      const { error } = await supabase
        .from('properties')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) {
        console.error('❌ Error clearing all properties:', error);
        throw error;
      }

      console.log('✅ All properties cleared from database successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear all properties:', error);
      throw error;
    }
  }
}
