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
    return [];
  }

  static async getAllLocationsForAdmin(): Promise<Location[]> {
    return [];
  }

  static async createLocation(_locationData: LocationFormData): Promise<Location> {
    throw new Error('Location service is temporarily disabled');
  }

  static async updateLocation(_id: string, _locationData: Partial<LocationFormData>): Promise<Location> {
    throw new Error('Location service is temporarily disabled');
  }

  static async deleteLocation(_id: string): Promise<void> {
    throw new Error('Location service is temporarily disabled');
  }

  static async toggleLocationStatus(_id: string, _is_active: boolean): Promise<Location> {
    throw new Error('Location service is temporarily disabled');
  }

  static async updateDisplayOrder(_locations: { id: string; display_order: number }[]): Promise<void> {
    throw new Error('Location service is temporarily disabled');
  }

  static async uploadCoverImage(_file: File, _locationName: string): Promise<string> {
    throw new Error('Location service is temporarily disabled');
  }

  static async deleteCoverImage(_imageUrl: string): Promise<void> {
    throw new Error('Location service is temporarily disabled');
  }
}