import { supabase } from "@/integrations/supabase/client";

export interface Location {
  id: string;
  name: string;
  state: string;
  region: string;
  category: string;
  cover_image_url?: string;
  description?: string;
  featured: boolean;
  trending: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Computed fields
  properties?: number;
  startingPrice?: number;
}

export interface LocationFormData {
  name: string;
  state: string;
  region: string;
  category: string;
  cover_image_url?: string;
  description?: string;
  featured: boolean;
  trending: boolean;
  display_order: number;
  is_active: boolean;
}

export const LOCATION_CATEGORIES = [
  { value: 'beach', label: 'Beach Destinations', icon: 'fas fa-umbrella-beach' },
  { value: 'hill', label: 'Hill Stations', icon: 'fas fa-mountain' },
  { value: 'heritage', label: 'Heritage Cities', icon: 'fas fa-monument' },
  { value: 'spiritual', label: 'Spiritual Places', icon: 'fas fa-om' },
  { value: 'nature', label: 'Nature & Wildlife', icon: 'fas fa-leaf' },
  { value: 'adventure', label: 'Adventure Sports', icon: 'fas fa-hiking' },
  { value: 'desert', label: 'Desert Destinations', icon: 'fas fa-sun' },
  { value: 'lake', label: 'Lake Destinations', icon: 'fas fa-water' },
  { value: 'general', label: 'General', icon: 'fas fa-map-marker-alt' }
] as const;

export const INDIAN_REGIONS = [
  { value: 'North', label: 'North India' },
  { value: 'South', label: 'South India' },
  { value: 'East', label: 'East India' },
  { value: 'West', label: 'West India' },
  { value: 'Northeast', label: 'Northeast India' },
  { value: 'Central', label: 'Central India' }
] as const;

export class LocationService {
  /**
   * Get all active locations with property counts and starting prices
   */
  static async getLocations(): Promise<Location[]> {
    try {
      console.log('🌍 Fetching locations...');
      
      // Get locations from database
      const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Get property counts and starting prices for each location
      const locationsWithStats = await Promise.all(
        (locations || []).map(async (location) => {
          // Query properties where location JSONB matches the city name exactly
          const { count, error: countError } = await supabase
            .from('properties_public')
            .select('*', { count: 'exact', head: true })
            .or(`location->>city.ilike.${location.name},location->>state.ilike.${location.state}`);

          let startingPrice = 0;
          const { data: priceData, error: priceError } = await supabase
            .from('properties_public')
            .select('pricing')
            .or(`location->>city.ilike.${location.name},location->>state.ilike.${location.state}`)
            .order('pricing->>daily_rate', { ascending: true })
            .limit(1);

          if (!priceError && priceData && priceData.length > 0) {
            const pricing = priceData[0].pricing;
            if (pricing && typeof pricing === 'object') {
              startingPrice = pricing.daily_rate || pricing.base_price || 0;
            }
          }

          return {
            ...location,
            properties: count || 0,
            startingPrice
          };
        })
      );

      console.log('✅ Locations loaded:', locationsWithStats.length);
      return locationsWithStats;
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      throw error;
    }
  }

  /**
   * Get all locations for admin management (including inactive)
   */
  static async getAllLocationsForAdmin(): Promise<Location[]> {
    try {
      console.log('🔧 Fetching all locations for admin...');
      
      const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Get property counts for each location
      const locationsWithStats = await Promise.all(
        (locations || []).map(async (location) => {
          const { count } = await supabase
            .from('properties_public')
            .select('*', { count: 'exact', head: true })
            .or(`location->>city.ilike.${location.name},location->>state.ilike.${location.state}`);

          return {
            ...location,
            properties: count || 0
          };
        })
      );

      console.log('✅ Admin locations loaded:', locationsWithStats.length);
      return locationsWithStats;
    } catch (error) {
      console.error('❌ Error fetching admin locations:', error);
      throw error;
    }
  }

  /**
   * Create a new location
   */
  static async createLocation(locationData: LocationFormData): Promise<Location> {
    try {
      console.log('➕ Creating location:', locationData.name);
      
      const { data, error } = await supabase
        .from('locations')
        .insert({
          ...locationData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Location created successfully');
      return data;
    } catch (error) {
      console.error('❌ Error creating location:', error);
      throw error;
    }
  }

  /**
   * Update an existing location
   */
  static async updateLocation(id: string, locationData: Partial<LocationFormData>): Promise<Location> {
    try {
      console.log('📝 Updating location:', id);
      
      const { data, error } = await supabase
        .from('locations')
        .update(locationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Location updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error updating location:', error);
      throw error;
    }
  }

  /**
   * Delete a location
   */
  static async deleteLocation(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting location:', id);
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Location deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Toggle location active status
   */
  static async toggleLocationStatus(id: string, is_active: boolean): Promise<Location> {
    try {
      console.log('🔄 Toggling location status:', id, is_active);
      
      const { data, error } = await supabase
        .from('locations')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Location status updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error toggling location status:', error);
      throw error;
    }
  }

  /**
   * Update location display order
   */
  static async updateDisplayOrder(locations: { id: string; display_order: number }[]): Promise<void> {
    try {
      console.log('🔢 Updating display order for locations...');
      
      const updates = locations.map(({ id, display_order }) =>
        supabase
          .from('locations')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(updates);

      console.log('✅ Display order updated successfully');
    } catch (error) {
      console.error('❌ Error updating display order:', error);
      throw error;
    }
  }

  /**
   * Upload location cover image
   */
  static async uploadCoverImage(file: File, locationName: string): Promise<string> {
    try {
      console.log('📸 Uploading cover image for:', locationName);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${locationName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public-images')
        .getPublicUrl(filePath);

      console.log('✅ Cover image uploaded successfully');
      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error uploading cover image:', error);
      throw error;
    }
  }

  /**
   * Delete location cover image
   */
  static async deleteCoverImage(imageUrl: string): Promise<void> {
    try {
      console.log('🗑️ Deleting cover image:', imageUrl);
      
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // covers/filename.ext

      const { error } = await supabase.storage
        .from('public-images')
        .remove([filePath]);

      if (error) throw error;

      console.log('✅ Cover image deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting cover image:', error);
      throw error;
    }
  }
}
