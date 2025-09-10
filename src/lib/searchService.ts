import { supabase } from "@/integrations/supabase/client";

// Predefined property categories that should be consistent across the system
export const PROPERTY_CATEGORIES = [
  { value: 'day-picnic', label: 'Day Picnic', icon: 'fas fa-sun' },
  { value: 'hotel', label: 'Hotels', icon: 'fas fa-building' },
  { value: 'villa', label: 'Villas', icon: 'fas fa-home' },
  { value: 'resort', label: 'Resorts', icon: 'fas fa-umbrella-beach' },
  { value: 'farmhouse', label: 'Farmhouse', icon: 'fas fa-tractor' },
  { value: 'homestay', label: 'Homestay', icon: 'fas fa-house-user' },
  { value: 'apartment', label: 'Apartment', icon: 'fas fa-building' },
  { value: 'guesthouse', label: 'Guesthouse', icon: 'fas fa-bed' },
  { value: 'hostel', label: 'Hostel', icon: 'fas fa-bunk-bed' },
  { value: 'heritage-palace', label: 'Heritage Palace', icon: 'fas fa-crown' },
  { value: 'banquet-hall', label: 'Banquet Hall', icon: 'fas fa-glass-cheers' },
  { value: 'wedding-venue', label: 'Wedding Venue', icon: 'fas fa-heart' }
] as const;

export type PropertyCategory = typeof PROPERTY_CATEGORIES[number]['value'];

export interface SearchFilters {
  location?: string;
  category?: PropertyCategory;
  date?: string;
  guests?: number;
  priceRange?: [number, number];
  search?: string;
}

export interface PropertyLocation {
  city: string;
  state: string;
  country: string;
  property_count: number;
}

export class SearchService {
  /**
   * Get all unique locations where properties exist in the database
   */
  static async getAvailableLocations(): Promise<PropertyLocation[]> {
    try {
      console.log('🔍 Fetching available locations from properties...');
      
      // Get all approved properties with their location data
      const { data: properties, error } = await supabase
        .from('properties_public')
        .select('location')
        .not('location', 'is', null);

      if (error) {
        console.error('❌ Error fetching locations:', error);
        return [];
      }

      if (!properties || properties.length === 0) {
        console.log('📍 No properties found with location data');
        return [];
      }

      // Extract and aggregate unique locations
      const locationMap = new Map<string, PropertyLocation>();

      properties.forEach(property => {
        if (property.location && typeof property.location === 'object') {
          const loc = property.location as any;
          if (loc.city && loc.state) {
            const key = `${loc.city}-${loc.state}`;
            if (locationMap.has(key)) {
              const existing = locationMap.get(key)!;
              existing.property_count += 1;
            } else {
              locationMap.set(key, {
                city: loc.city,
                state: loc.state,
                country: loc.country || 'India',
                property_count: 1
              });
            }
          }
        }
      });

      const locations = Array.from(locationMap.values())
        .sort((a, b) => b.property_count - a.property_count); // Sort by property count desc

      console.log(`✅ Found ${locations.length} unique locations:`, locations);
      return locations;

    } catch (error) {
      console.error('❌ Error in getAvailableLocations:', error);
      return [];
    }
  }

  /**
   * Search properties based on filters
   */
  static async searchProperties(filters: SearchFilters) {
    try {
      console.log('🔍 Searching properties with filters:', filters);

      let query = supabase
        .from('properties_public')
        .select('*')
        .eq('status', 'approved');

      // Apply text search filter
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        
        // Auto-detect day picnic searches
        if (searchTerm.toLowerCase().includes('day picnic') || searchTerm.toLowerCase().includes('daypicnic')) {
          // If searching for day picnic, ensure we only show day picnic properties - be more strict
          query = query.or('property_type.eq.day-picnic,property_type.eq.Day Picnic,property_type.eq.day_picnic,property_type.eq.daypicnic');
        } else {
          // Regular text search
          query = query.or(
            `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,general_location.ilike.%${searchTerm}%,location->>city.ilike.%${searchTerm}%,location->>state.ilike.%${searchTerm}%`
          );
        }
      }

      // Apply location filter
      if (filters.location && filters.location !== 'all') {
        // Handle "City, State" format by splitting and searching both parts
        const locationParts = filters.location.split(',').map(part => part.trim());
        
        if (locationParts.length === 2) {
          // Search for exact city and state match
          const [city, state] = locationParts;
          query = query
            .ilike('location->>city', city)
            .ilike('location->>state', state);
        } else {
          // Search in both city and state fields for single term
          query = query.or(
            `location->>city.ilike.%${filters.location}%,location->>state.ilike.%${filters.location}%`
          );
        }
      }

      // Apply category filter
      if (filters.category && filters.category !== ('all' as any)) {
        if (filters.category === 'day-picnic') {
          // Only show day picnic properties (handle all variations) - be more strict
          query = query.or('property_type.eq.day-picnic,property_type.eq.Day Picnic,property_type.eq.day_picnic,property_type.eq.daypicnic');
        } else {
          // Show regular properties but exclude day picnics (all variations)
          query = query
            .eq('property_type', filters.category)
            .not('property_type', 'ilike', '%day%picnic%')
            .not('property_type', 'ilike', '%picnic%');
        }
      } else {
        // Check if search term indicates day picnic search
        const isDayPicnicSearch = filters.search && (
          filters.search.toLowerCase().includes('day picnic') || 
          filters.search.toLowerCase().includes('daypicnic')
        );
        
        if (isDayPicnicSearch) {
          // If searching for day picnic, only show day picnic properties - be more strict
          query = query.or('property_type.eq.day-picnic,property_type.eq.Day Picnic,property_type.eq.day_picnic,property_type.eq.daypicnic');
        } else {
          // When no specific category is selected, exclude day picnics by default (all variations)
          // Day picnics should only be shown when explicitly requested
          query = query
            .not('property_type', 'ilike', '%day%picnic%')
            .not('property_type', 'ilike', '%picnic%');
        }
      }

      // Apply guest capacity filter
      if (filters.guests && filters.guests > 0) {
        query = query.gte('max_guests', filters.guests);
      }

      // Apply price range filter only if user has explicitly set non-default values
      if (filters.priceRange && filters.priceRange[0] > 0 && filters.priceRange[0] !== 0) {
        query = query.gte('pricing->>daily_rate', filters.priceRange[0]);
      }
      if (filters.priceRange && filters.priceRange[1] < 50000 && filters.priceRange[1] !== 50000) {
        query = query.lte('pricing->>daily_rate', filters.priceRange[1]);
      }

      // Order by featured first, then by rating, then by newest
      query = query.order('is_featured', { ascending: false })
                   .order('rating', { ascending: false })
                   .order('created_at', { ascending: false });

      const { data: properties, error } = await query;

      if (error) {
        console.error('❌ Error searching properties:', error);
        throw error;
      }

      console.log(`✅ Found ${properties?.length || 0} properties matching filters`);
      return properties || [];

    } catch (error) {
      console.error('❌ Error in searchProperties:', error);
      throw error;
    }
  }

  /**
   * Get property categories with counts
   */
  static async getCategoriesWithCounts(): Promise<Array<{ category: string; count: number; label: string; icon: string }>> {
    try {
      console.log('📊 Fetching property categories with counts...');

      const { data: properties, error } = await supabase
        .from('properties_public')
        .select('property_type');

      if (error) {
        console.error('❌ Error fetching categories:', error);
        return [];
      }

      if (!properties || properties.length === 0) {
        return [];
      }

      // Count properties by category, excluding day picnics from regular property counts
      const categoryCount = new Map<string, number>();
      properties.forEach(property => {
        if (property.property_type) {
          const count = categoryCount.get(property.property_type) || 0;
          categoryCount.set(property.property_type, count + 1);
        }
      });

      // Helper function to check if property is a day picnic (any variation)
      const isDayPicnic = (propertyType: string) => {
        if (!propertyType) return false;
        const normalized = propertyType.toLowerCase().replace(/[_-]/g, ' ').trim();
        return normalized === 'day picnic' || normalized === 'daypicnic';
      };

      // Map to predefined categories with counts
      const categoriesWithCounts = PROPERTY_CATEGORIES
        .map(category => {
          if (category.value === 'day-picnic') {
            // Count all day picnic variations
            const dayPicnicCount = properties.filter(p => isDayPicnic(p.property_type)).length;
            return {
              category: category.value,
              label: category.label,
              icon: category.icon,
              count: dayPicnicCount
            };
          } else {
            // For regular property categories, exclude day picnic properties from count
            const regularPropertyCount = properties.filter(p => 
              p.property_type === category.value && !isDayPicnic(p.property_type)
            ).length;
            return {
              category: category.value,
              label: category.label,
              icon: category.icon,
              count: regularPropertyCount
            };
          }
        })
        .filter(category => category.count > 0) // Only show categories with properties
        .sort((a, b) => b.count - a.count); // Sort by count desc

      console.log('✅ Categories with counts:', categoriesWithCounts);
      return categoriesWithCounts;

    } catch (error) {
      console.error('❌ Error in getCategoriesWithCounts:', error);
      return [];
    }
  }

  /**
   * Validate if a property category is allowed
   */
  static isValidCategory(category: string): boolean {
    return PROPERTY_CATEGORIES.some(cat => cat.value === category);
  }

  /**
   * Get category label by value
   */
  static getCategoryLabel(category: string): string {
    const cat = PROPERTY_CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  }

  /**
   * Get category icon by value
   */
  static getCategoryIcon(category: string): string {
    const cat = PROPERTY_CATEGORIES.find(c => c.value === category);
    return cat?.icon || 'fas fa-home';
  }
}
