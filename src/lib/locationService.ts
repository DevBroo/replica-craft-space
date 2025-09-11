// COMMENTED OUT: Location service temporarily disabled to fix build errors
// This service needs database schema fixes

export interface Location {
  id: string;
  name: string;
  state: string;
  region: string;
  category: string;
  featured: boolean;
  trending: boolean;
  cover_image_url: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
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
  static async getLocations(): Promise<Location[]> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error);
      throw new Error('Failed to fetch locations');
    }

    return data || [];
  }

  static async getAllLocationsForAdmin(): Promise<Location[]> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching locations for admin:', error);
      throw new Error('Failed to fetch locations');
    }

    return data || [];
  }

  static async createLocation(locationData: LocationFormData): Promise<Location> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('locations')
      .insert({
        ...locationData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      throw new Error('Failed to create location');
    }

    return data;
  }

  static async updateLocation(id: string, locationData: Partial<LocationFormData>): Promise<Location> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('locations')
      .update(locationData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      throw new Error('Failed to update location');
    }

    return data;
  }

  static async deleteLocation(id: string): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      throw new Error('Failed to delete location');
    }
  }

  static async toggleLocationStatus(id: string, is_active: boolean): Promise<Location> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('locations')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling location status:', error);
      throw new Error('Failed to update location status');
    }

    return data;
  }

  static async updateDisplayOrder(locations: { id: string; display_order: number }[]): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const updates = locations.map(async (location) => {
      const { error } = await supabase
        .from('locations')
        .update({ display_order: location.display_order })
        .eq('id', location.id);
      
      if (error) {
        console.error(`Error updating display order for location ${location.id}:`, error);
        throw new Error(`Failed to update display order for location ${location.id}`);
      }
    });

    await Promise.all(updates);
  }

  static async uploadCoverImage(file: File, locationName: string): Promise<string> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${locationName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
    const filePath = `locations/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('location-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error('Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('location-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  static async deleteCoverImage(imageUrl: string): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'location-images');
    if (bucketIndex === -1) return;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('location-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }
}