import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export class WishlistService {
  /**
   * Add a property to user's wishlist
   */
  static async addToWishlist(userId: string, propertyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_saved_properties')
        .insert({
          user_id: userId,
          property_id: propertyId,
        });

      if (error) {
        console.error('Error adding to wishlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  }

  /**
   * Remove a property from user's wishlist
   */
  static async removeFromWishlist(userId: string, propertyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_saved_properties')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId);

      if (error) {
        console.error('Error removing from wishlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }

  /**
   * Get all saved properties for a user with property details
   */
  static async getUserWishlist(userId: string): Promise<Property[]> {
    try {
      const { data, error } = await supabase
        .from('user_saved_properties')
        .select(`
          id,
          property_id,
          created_at,
          properties (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
        return [];
      }

      // Extract properties from the join
      return data?.map((item: any) => item.properties).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }

  /**
   * Get user's saved property IDs only (for checking saved status)
   */
  static async getUserSavedPropertyIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_saved_properties')
        .select('property_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching saved property IDs:', error);
        return [];
      }

      return data?.map(item => item.property_id) || [];
    } catch (error) {
      console.error('Error fetching saved property IDs:', error);
      return [];
    }
  }

  /**
   * Check if a property is saved by the user
   */
  static async isPropertySaved(userId: string, propertyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_saved_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if property is saved:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if property is saved:', error);
      return false;
    }
  }

  /**
   * Get count of saved properties for a user
   */
  static async getSavedPropertiesCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_saved_properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting saved properties count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting saved properties count:', error);
      return 0;
    }
  }
}