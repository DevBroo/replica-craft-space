import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { formatPropertyType } from '@/lib/utils';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
type Property = Database['public']['Tables']['properties']['Row'];

// Type for the secure public properties view (excludes sensitive fields)
type PublicProperty = Omit<Property, 'owner_id' | 'contact_phone' | 'license_number' | 'address' | 'tax_information'> & {
  general_location: string;
};

export interface PropertyFormData {
  // Basic details
  title: string;
  property_type: string;
  property_subtype?: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postal_code?: string;
  country?: string;
  contact_phone?: string;
  license_number?: string;
  star_rating?: number;
  languages_spoken?: string[];
  
  // Rooms & capacity
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  rooms_count?: number | null;
  capacity_per_room?: number | null;
  day_picnic_capacity?: number | null;
  day_picnic_duration_category?: string;
  rooms_details?: any;
  
  // Amenities & facilities
  amenities: string[];
  amenities_details?: any;
  facilities?: any;
  
  // Media
  images: string[];
  photos_with_captions?: Array<{
    image_url: string;
    caption?: string;
    alt_text?: string;
    category?: string;
    display_order?: number;
    is_primary?: boolean;
  }>;
  
  // Pricing & policies
  pricing: {
    daily_rate: number;
    currency: string;
  };
  seasonal_pricing?: any;
  minimum_stay?: number;
  cancellation_policy?: string;
  check_in_time?: string;
  check_out_time?: string;
  payment_methods?: string[];
  policies_extended?: any;
  meal_plans?: string[];
  
  // Safety & nearby
  safety_security?: any;
  nearby_attractions?: any;
  
  // Legacy compatibility
  name: string;
  type: string;
  location: string;
  price: number;
  capacity: number;
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
        title: propertyData.title || propertyData.name,
        description: propertyData.description,
        location: {
          city: propertyData.city,
          state: propertyData.state,
          address: propertyData.address || propertyData.location
        },
        address: propertyData.address || `${propertyData.location}, ${propertyData.city}, ${propertyData.state}`,
        property_type: propertyData.property_type || formatPropertyType(propertyData.type),
        property_subtype: propertyData.property_subtype,
        amenities: propertyData.amenities,
        pricing: propertyData.pricing || {
          daily_rate: propertyData.price || 0,
          currency: 'INR'
        },
        images: propertyData.images,
        max_guests: propertyData.max_guests || propertyData.capacity,
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        rooms_count: propertyData.rooms_count,
        capacity_per_room: propertyData.capacity_per_room,
        day_picnic_capacity: propertyData.day_picnic_capacity,
        day_picnic_duration_category: propertyData.day_picnic_duration_category || null,
        postal_code: propertyData.postal_code,
        country: propertyData.country || 'India',
        contact_phone: propertyData.contact_phone,
        license_number: propertyData.license_number,
        star_rating: propertyData.star_rating,
        languages_spoken: propertyData.languages_spoken ? JSON.stringify(propertyData.languages_spoken) : null,
        minimum_stay: propertyData.minimum_stay || 1,
        cancellation_policy: propertyData.cancellation_policy || 'moderate',
        check_in_time: propertyData.check_in_time || '15:00',
        check_out_time: propertyData.check_out_time || '11:00',
        payment_methods: propertyData.payment_methods || ['card', 'cash'],
        meal_plans: propertyData.meal_plans || [],
        rooms_details: propertyData.rooms_details || { types: [], configurations: {}, amenities_per_room: {} },
        amenities_details: propertyData.amenities_details || { services: [], recreation: [], connectivity: {}, accessibility: [], room_features: [], property_facilities: [] },
        facilities: propertyData.facilities || { family: [], parking: {}, business: [], internet: {}, recreation: [] },
        safety_security: propertyData.safety_security || { fire_safety: [], health_safety: [], security_features: [], emergency_procedures: [] },
        nearby_attractions: propertyData.nearby_attractions || { dining: [], distances: {}, landmarks: [], transport: {}, entertainment: [] },
        seasonal_pricing: propertyData.seasonal_pricing || { seasons: [], discounts: {}, special_rates: {} },
        policies_extended: propertyData.policies_extended || { pet_policy: {}, child_policy: {}, damage_policy: {}, smoking_policy: {}, group_booking_policy: {} },
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
      
      // Handle photos with captions if provided
      if (propertyData.photos_with_captions && propertyData.photos_with_captions.length > 0) {
        await this.savePhotosWithCaptions(data.id, propertyData.photos_with_captions);
      }
      
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
        title: propertyData.title || propertyData.name,
        description: propertyData.description,
        location: {
          city: propertyData.city,
          state: propertyData.state,
          address: propertyData.address || propertyData.location
        },
        address: propertyData.address || `${propertyData.location}, ${propertyData.city}, ${propertyData.state}`,
        property_type: propertyData.property_type || formatPropertyType(propertyData.type),
        property_subtype: propertyData.property_subtype,
        amenities: propertyData.amenities,
        pricing: propertyData.pricing || {
          daily_rate: propertyData.price || 0,
          currency: 'INR'
        },
        images: propertyData.images,
        max_guests: propertyData.max_guests || propertyData.capacity,
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        rooms_count: propertyData.rooms_count,
        capacity_per_room: propertyData.capacity_per_room,
        day_picnic_capacity: propertyData.day_picnic_capacity,
        day_picnic_duration_category: propertyData.day_picnic_duration_category || null,
        postal_code: propertyData.postal_code,
        country: propertyData.country || 'India',
        contact_phone: propertyData.contact_phone,
        license_number: propertyData.license_number,
        star_rating: propertyData.star_rating,
        languages_spoken: propertyData.languages_spoken ? JSON.stringify(propertyData.languages_spoken) : null,
        minimum_stay: propertyData.minimum_stay || 1,
        cancellation_policy: propertyData.cancellation_policy || 'moderate',
        check_in_time: propertyData.check_in_time || '15:00',
        check_out_time: propertyData.check_out_time || '11:00',
        payment_methods: propertyData.payment_methods || ['card', 'cash'],
        meal_plans: propertyData.meal_plans || [],
        rooms_details: propertyData.rooms_details || { types: [], configurations: {}, amenities_per_room: {} },
        amenities_details: propertyData.amenities_details || { services: [], recreation: [], connectivity: {}, accessibility: [], room_features: [], property_facilities: [] },
        facilities: propertyData.facilities || { family: [], parking: {}, business: [], internet: {}, recreation: [] },
        safety_security: propertyData.safety_security || { fire_safety: [], health_safety: [], security_features: [], emergency_procedures: [] },
        nearby_attractions: propertyData.nearby_attractions || { dining: [], distances: {}, landmarks: [], transport: {}, entertainment: [] },
        seasonal_pricing: propertyData.seasonal_pricing || { seasons: [], discounts: {}, special_rates: {} },
        policies_extended: propertyData.policies_extended || { pet_policy: {}, child_policy: {}, damage_policy: {}, smoking_policy: {}, group_booking_policy: {} }
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
      
      // Handle photos with captions if provided
      if (propertyData.photos_with_captions && propertyData.photos_with_captions.length > 0) {
        await this.savePhotosWithCaptions(propertyId, propertyData.photos_with_captions);
      }
      
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
   * Get all properties for a specific owner (optimized)
   */
  static async getOwnerProperties(ownerId: string, limit?: number): Promise<Property[]> {
    try {
      console.log('🔍 Fetching properties for owner:', ownerId);
      
      // Build optimized query - only select essential fields for dashboard
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          property_type,
          status,
          images,
          pricing,
          created_at,
          max_guests,
          bedrooms,
          bathrooms,
          rating,
          review_count
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      // Add limit for dashboard view to load faster
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

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
   * Get all active properties for public display (using secure public view) - optimized
   */
  static async getActiveProperties(): Promise<any[]> {
    try {
      console.log('🔍 Fetching properties for public display using secure view (optimized)');
      
      // Slim select - only fetch essential fields for listing
      const { data, error } = await supabase
        .from('properties_public')
        .select(`
          id,
          title,
          images,
          pricing,
          location,
          general_location,
          rating,
          review_count,
          property_type,
          status,
          created_at,
          max_guests,
          bedrooms,
          bathrooms
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (!data) {
        console.warn('⚠️ No data returned from Supabase');
        return [];
      }

      console.log('✅ Properties fetched successfully from secure view:', {
        count: data.length,
        firstProperty: data[0] ? {
          id: data[0].id,
          title: data[0].title,
          status: data[0].status
        } : 'none'
      });
      
      // Convert public properties to match expected interface for existing code
      const convertedData = data.map(publicProperty => ({
        ...publicProperty,
        // Add missing fields with safe defaults for compatibility
        address: publicProperty.general_location || 'Location Available',
        contact_phone: null, // Explicitly excluded for security
        license_number: null, // Explicitly excluded for security  
        owner_id: null, // Explicitly excluded for security
        tax_information: null // Explicitly excluded for security
      }));
      
      return convertedData;
    } catch (error: any) {
      console.error('❌ Failed to fetch properties:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        cause: error?.cause || 'No cause'
      });
      
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  /**
   * Get paginated properties for public display
   */
  static async getPaginatedProperties(page: number = 1, pageSize: number = 12): Promise<{ properties: any[], totalCount: number }> {
    try {
      console.log('🔍 Fetching paginated properties:', { page, pageSize });
      
      const offset = (page - 1) * pageSize;
      
      // Get total count first
      const { count: totalCount } = await supabase
        .from('properties_public')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Get paginated data with slim select
      const { data, error } = await supabase
        .from('properties_public')
        .select(`
          id,
          title,
          images,
          pricing,
          location,
          general_location,
          rating,
          review_count,
          property_type,
          status,
          created_at,
          max_guests,
          bedrooms,
          bathrooms
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Error fetching paginated properties:', error);
        throw error;
      }

      const convertedData = (data || []).map(publicProperty => ({
        ...publicProperty,
        address: publicProperty.general_location || 'Location Available',
        contact_phone: null,
        license_number: null,
        owner_id: null,
        tax_information: null
      }));

      console.log('✅ Paginated properties fetched:', { count: convertedData.length, totalCount });
      
      return { 
        properties: convertedData, 
        totalCount: totalCount || 0 
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch paginated properties:', error);
      return { properties: [], totalCount: 0 };
    }
  }

  /**
   * Get property contact information (authenticated users only)
   */
  static async getPropertyContactInfo(propertyId: string): Promise<{
    contact_phone?: string;
    owner_email?: string;
    property_title?: string;
  } | null> {
    try {
      console.log('📞 Fetching contact info for property:', propertyId);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required to access contact information');
      }
      
      const { data, error } = await supabase.rpc('get_property_contact_info', {
        property_id: propertyId
      });

      if (error) {
        console.error('❌ Error fetching contact info:', error);
        throw error;
      }

      console.log('✅ Contact info fetched successfully');
      return data?.[0] || null;
    } catch (error) {
      console.error('❌ Failed to fetch contact info:', error);
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
        .maybeSingle();

      if (error) {
        console.error('❌ Error updating property status:', error);
        return null;
      }

      console.log('✅ Property status updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update property status:', error);
      return null;
    }
  }

  /**
   * Get a single property by ID
   */
  static async getPropertyById(propertyId: string, forceFullData: boolean = false): Promise<Property | null> {
    try {
      console.log('🔍 Fetching property by ID:', propertyId, forceFullData ? '(full data)' : '');
      
      // If forceFullData is true, get directly from properties table to include all fields
      if (forceFullData) {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching property by ID from full table:', error);
          return null;
        }

        if (!data) {
          console.log('ℹ️ Property not found in full table:', propertyId);
          return null;
        }

        console.log('✅ Property fetched successfully from full table:', data);
        return data;
      }
      
      // First try to get from the public view (for approved properties)
      const { data: publicData, error: publicError } = await supabase
        .from('properties_public')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle();

      if (publicData) {
        console.log('✅ Property fetched from public view:', publicData);
        return publicData as any;
      }

      // If not found in public view, try the main properties table (for owners/admins)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching property by ID:', error);
        return null;
      }

      if (!data) {
        console.log('ℹ️ Property not found:', propertyId);
        return null;
      }

      console.log('✅ Property fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch property by ID:', error);
      return null;
    }
  }

  /**
   * Convert database property to frontend format
   */
  static convertToFrontendFormat(dbProperty: Property): any {
    // Extract location data from the structured location object
    const locationData = dbProperty.location as any;
    const city = locationData?.city || '';
    const state = locationData?.state || '';
    const displayLocation = city && state ? `${city}, ${state}` : 
                           city || state || dbProperty.address || 'Location not specified';
    
    return {
      id: dbProperty.id,
      name: dbProperty.title,
      title: dbProperty.title,
      type: dbProperty.property_type,
      location: displayLocation,
      city: city,
      state: state,
      postal_code: dbProperty.postal_code || '',
      price: (dbProperty.pricing as any)?.daily_rate || 0,
      capacity: dbProperty.max_guests,
      bedrooms: dbProperty.bedrooms || 0,
      bathrooms: dbProperty.bathrooms || 0,
      rooms_count: dbProperty.rooms_count,
      capacity_per_room: dbProperty.capacity_per_room,
      day_picnic_capacity: dbProperty.day_picnic_capacity,
      day_picnic_duration_category: dbProperty.day_picnic_duration_category,
      status: dbProperty.status,
      rating: dbProperty.rating,
      totalBookings: dbProperty.review_count,
      totalEarnings: 0, // This would need to be calculated from bookings
      images: dbProperty.images || [],
      amenities: dbProperty.amenities || [],
      description: dbProperty.description || '',
      contact_phone: dbProperty.contact_phone || '',
      license_number: dbProperty.license_number || '',
      createdAt: dbProperty.created_at,
      lastUpdated: dbProperty.updated_at,
      ownerEmail: dbProperty.owner_id // This would need to be joined with users table
    };
  }

  /**
   * Save photos with captions to database
   */
  static async savePhotosWithCaptions(propertyId: string, photos: Array<{
    image_url: string;
    caption?: string;
    alt_text?: string;
    category?: string;
    display_order?: number;
    is_primary?: boolean;
  }>): Promise<void> {
    try {
      console.log('💾 Saving photos with captions for property:', propertyId);
      
      // Clear existing photos for this property
      const { error: deleteError } = await supabase
        .from('photos_with_captions')
        .delete()
        .eq('property_id', propertyId);
      
      if (deleteError) {
        console.error('❌ Error deleting existing photos:', deleteError);
        throw deleteError;
      }
      
      // Insert new photos
      const photosToInsert = photos.map((photo, index) => ({
        property_id: propertyId,
        image_url: photo.image_url,
        caption: photo.caption || null,
        alt_text: photo.alt_text || null,
        category: photo.category || null,
        display_order: photo.display_order || index,
        is_primary: photo.is_primary || false
      }));
      
      const { error: insertError } = await supabase
        .from('photos_with_captions')
        .insert(photosToInsert);
      
      if (insertError) {
        console.error('❌ Error inserting photos with captions:', insertError);
        throw insertError;
      }
      
      console.log('✅ Photos with captions saved successfully');
    } catch (error) {
      console.error('❌ Failed to save photos with captions:', error);
      // Don't throw error to prevent property creation from failing
    }
  }

  /**
   * Convert database property to wizard form format
   */
  static convertToWizardFormat(dbProperty: Property): any {
    const locationData = dbProperty.location as any;
    const pricingData = dbProperty.pricing as any;
    const amenitiesDetails = dbProperty.amenities_details as any;
    const facilitiesData = dbProperty.facilities as any;
    const roomsDetails = dbProperty.rooms_details as any;
    const safetyData = dbProperty.safety_security as any;
    const nearbyData = dbProperty.nearby_attractions as any;
    const policiesData = dbProperty.policies_extended as any;
    const seasonalData = dbProperty.seasonal_pricing as any;
    const extrasData = dbProperty.extra_services as any;
    const bedConfig = dbProperty.bed_configuration as any;

    return {
      title: dbProperty.title || '',
      property_type: dbProperty.property_type || '',
      property_subtype: dbProperty.property_subtype || '',
      description: dbProperty.description || '',
      address: dbProperty.address || '',
      postal_code: dbProperty.postal_code || '',
      country: dbProperty.country || 'India',
      contact_phone: dbProperty.contact_phone || '',
      license_number: dbProperty.license_number || '',
      star_rating: dbProperty.star_rating || 3,
      languages_spoken: typeof dbProperty.languages_spoken === 'string' 
        ? JSON.parse(dbProperty.languages_spoken) 
        : (dbProperty.languages_spoken as string[]) || ['English', 'Hindi'],
      
      location: {
        city: locationData?.city || '',
        state: locationData?.state || '',
        coordinates: locationData?.coordinates
      },
      
      rooms_count: dbProperty.rooms_count || 1,
      capacity_per_room: dbProperty.capacity_per_room || 2,
      max_guests: dbProperty.max_guests || 2,
      bedrooms: dbProperty.bedrooms || 1,
      bathrooms: dbProperty.bathrooms || 1,
      day_picnic_capacity: dbProperty.day_picnic_capacity,
      day_picnic_duration_category: dbProperty.day_picnic_duration_category,
      
      rooms_details: roomsDetails || {
        types: [],
        configurations: {},
        amenities_per_room: {}
      },
      
      amenities: dbProperty.amenities || [],
      amenities_details: {
        property_facilities: amenitiesDetails?.property_facilities || [],
        room_features: amenitiesDetails?.room_features || [],
        connectivity: amenitiesDetails?.connectivity || {},
        recreation: amenitiesDetails?.recreation || [],
        services: amenitiesDetails?.services || [],
        accessibility: amenitiesDetails?.accessibility || []
      },
      
      facilities: {
        parking: facilitiesData?.parking || {},
        internet: facilitiesData?.internet || {},
        recreation: facilitiesData?.recreation || [],
        business: facilitiesData?.business || [],
        family: facilitiesData?.family || []
      },
      
      pricing: {
        currency: pricingData?.currency || 'INR',
        daily_rate: pricingData?.daily_rate || 1000
      },
      
      seasonal_pricing: {
        seasons: seasonalData?.seasons || [],
        special_rates: seasonalData?.special_rates || {},
        discounts: seasonalData?.discounts || {}
      },
      
      minimum_stay: dbProperty.minimum_stay || 1,
      cancellation_policy: dbProperty.cancellation_policy || 'moderate',
      check_in_time: dbProperty.check_in_time || '15:00',
      check_out_time: dbProperty.check_out_time || '11:00',
      payment_methods: dbProperty.payment_methods || ['card', 'cash'],
      
      policies_extended: {
        child_policy: policiesData?.child_policy || {},
        pet_policy: policiesData?.pet_policy || {},
        smoking_policy: policiesData?.smoking_policy || {},
        damage_policy: policiesData?.damage_policy || {},
        group_booking_policy: policiesData?.group_booking_policy || {}
      },
      
      safety_security: {
        fire_safety: safetyData?.fire_safety || [],
        security_features: safetyData?.security_features || [],
        emergency_procedures: safetyData?.emergency_procedures || [],
        health_safety: safetyData?.health_safety || []
      },
      
      nearby_attractions: {
        landmarks: nearbyData?.landmarks || [],
        transport: nearbyData?.transport || {},
        dining: nearbyData?.dining || [],
        entertainment: nearbyData?.entertainment || [],
        distances: nearbyData?.distances || {}
      },
      
      images: dbProperty.images || [],
      photos_with_captions: [], // Will be loaded separately in PropertyWizard
      
      extra_services: {
        meals: extrasData?.meals || {},
        transportation: extrasData?.transportation || [],
        activities: extrasData?.activities || [],
        spa_wellness: extrasData?.spa_wellness || []
      },
      
      meal_plans: dbProperty.meal_plans || [],
      bed_configuration: {
        beds: bedConfig?.beds || {}
      }
    };
  }

  /**
   * Get property photos with captions
   */
  static async getPropertyPhotos(propertyId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('photos_with_captions')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching property photos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch property photos:', error);
      return [];
    }
  }

  /**
   * Convert frontend property to database format
   */
  static convertToDatabaseFormat(frontendProperty: any): PropertyFormData {
    // Sync images array from photos_with_captions
    const images = frontendProperty.photos_with_captions?.length > 0 
      ? frontendProperty.photos_with_captions.map((photo: any) => photo.image_url)
      : frontendProperty.images || [];

    return {
      // New wizard fields
      title: frontendProperty.title || frontendProperty.name,
      property_type: frontendProperty.property_type || frontendProperty.type,
      property_subtype: frontendProperty.property_subtype,
      description: frontendProperty.description,
      address: frontendProperty.address || frontendProperty.location,
      city: frontendProperty.location?.city || frontendProperty.city,
      state: frontendProperty.location?.state || frontendProperty.state,
      postal_code: frontendProperty.postal_code,
      country: frontendProperty.country,
      contact_phone: frontendProperty.contact_phone,
      license_number: frontendProperty.license_number,
      star_rating: frontendProperty.star_rating,
      languages_spoken: frontendProperty.languages_spoken,
      
      max_guests: frontendProperty.max_guests || frontendProperty.capacity,
      bedrooms: frontendProperty.bedrooms,
      bathrooms: frontendProperty.bathrooms,
      rooms_count: frontendProperty.rooms_count,
      capacity_per_room: frontendProperty.capacity_per_room,
      day_picnic_capacity: frontendProperty.day_picnic_capacity,
      day_picnic_duration_category: frontendProperty.day_picnic_duration_category,
      rooms_details: frontendProperty.rooms_details,
      
      amenities: PropertyService.mergeAllAmenities(frontendProperty),
      amenities_details: frontendProperty.amenities_details,
      facilities: frontendProperty.facilities,
      
      images: images, // Synchronized from photos_with_captions
      photos_with_captions: frontendProperty.photos_with_captions,
      
      pricing: frontendProperty.pricing || {
        daily_rate: frontendProperty.price || 0,
        currency: 'INR'
      },
      seasonal_pricing: frontendProperty.seasonal_pricing,
      minimum_stay: frontendProperty.minimum_stay,
      cancellation_policy: frontendProperty.cancellation_policy,
      check_in_time: frontendProperty.check_in_time,
      check_out_time: frontendProperty.check_out_time,
      payment_methods: frontendProperty.payment_methods,
      policies_extended: frontendProperty.policies_extended,
      meal_plans: frontendProperty.meal_plans,
      
      safety_security: frontendProperty.safety_security,
      nearby_attractions: frontendProperty.nearby_attractions,
      
      // Legacy compatibility
      name: frontendProperty.name || frontendProperty.title,
      type: frontendProperty.type || frontendProperty.property_type,
      location: frontendProperty.location || frontendProperty.address,
      price: frontendProperty.price || frontendProperty.pricing?.daily_rate || 0,
      capacity: frontendProperty.capacity || frontendProperty.max_guests
    };
  }

  /**
   * Merge all amenities from detailed selections and legacy amenities
   */
  static mergeAllAmenities(property: any): string[] {
    const mergedAmenities: string[] = [];
    
    // Add legacy amenities
    if (property.amenities && Array.isArray(property.amenities)) {
      mergedAmenities.push(...property.amenities);
    }
    
    // Add amenities from detailed selections
    if (property.amenities_details) {
      const details = property.amenities_details;
      
      // Add property facilities
      if (details.property_facilities && Array.isArray(details.property_facilities)) {
        mergedAmenities.push(...details.property_facilities);
      }
      
      // Add room features
      if (details.room_features && Array.isArray(details.room_features)) {
        mergedAmenities.push(...details.room_features);
      }
      
      // Add recreation facilities
      if (details.recreation && Array.isArray(details.recreation)) {
        mergedAmenities.push(...details.recreation);
      }
      
      // Add accessibility features
      if (details.accessibility && Array.isArray(details.accessibility)) {
        mergedAmenities.push(...details.accessibility);
      }
    }
    
    // Remove duplicates and return
    return [...new Set(mergedAmenities)];
  }

  /**
   * Get approved day picnic packages with minimal property data
   */
  static async getApprovedDayPicnics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('day_picnic_packages')
        .select(`
          id,
          start_time,
          end_time,
          duration_hours,
          base_price,
          pricing_type,
          property_id,
          properties_public!inner (
            id,
            title,
            images,
            location,
            rating,
            review_count,
            status
          )
        `)
        .eq('properties_public.status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching day picnic packages:', error);
        return [];
      }

      // Transform data to include general_location derived from location
      const transformedData = data?.map(item => {
        const location = item.properties_public?.location as any;
        return {
          ...item,
          properties: {
            ...item.properties_public,
            general_location: location?.city && location?.state 
              ? `${location.city}, ${location.state}`
              : 'Location not specified'
          }
        };
      }) || [];

      console.log('✅ Day picnic packages fetched and transformed:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('❌ Exception fetching day picnic packages:', error);
      return [];
    }
  }

  /**
   * Get owner's day picnic packages (including unapproved) for preview
   */
  static async getOwnerDayPicnics(ownerId?: string): Promise<any[]> {
    try {
      if (!ownerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        ownerId = user.id;
      }

      const { data, error } = await supabase
        .from('day_picnic_packages')
        .select(`
          id,
          property_id,
          start_time,
          end_time,
          duration_hours,
          base_price,
          pricing_type,
          properties!inner (
            id,
            title,
            images,
            location,
            status,
            property_type,
            owner_id
          )
        `)
        .eq('properties.owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(pkg => ({
        id: pkg.id,
        property_id: pkg.property_id,
        start_time: pkg.start_time,
        end_time: pkg.end_time,
        duration_hours: pkg.duration_hours,
        base_price: pkg.base_price,
        pricing_type: pkg.pricing_type,
        property: {
          id: pkg.properties.id,
          title: pkg.properties.title,
          images: pkg.properties.images,
          location: pkg.properties.location,
          status: pkg.properties.status,
          property_type: pkg.properties.property_type,
          general_location: (pkg.properties.location as any)?.city || 'Unknown location',
          pricing: { daily_rate: pkg.base_price, currency: 'INR' },
          max_guests: 0,
          bedrooms: 0,
          bathrooms: 0,
          rating: 0,
          review_count: 0,
          created_at: new Date().toISOString()
        }
      })) || [];
    } catch (error) {
      console.error('❌ Failed to fetch owner day picnics:', error);
      return [];
    }
  }

  /**
   * Get day picnic packages for a specific property
   */
  static async getDayPicnicPackagesForProperty(propertyId: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching day picnic packages for property:', propertyId);
      
      const { data, error } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching day picnic packages:', error);
        throw error;
      }

      const packages = data || [];
      
      // Fetch option prices for all packages
      if (packages.length > 0) {
        const packageIds = packages.map(pkg => pkg.id);
        const { data: optionPricesData, error: optionPricesError } = await supabase
          .from('day_picnic_option_prices')
          .select('*')
          .in('package_id', packageIds)
          .in('option_type', ['inclusion', 'exclusion', 'add_on']);

        if (optionPricesError) {
          console.error('Error fetching option prices:', optionPricesError);
        } else {
          const allOptionPrices = optionPricesData || [];
          
          // Attach priced options to each package
          packages.forEach((pkg: any) => {
            const packageOptionPrices = allOptionPrices.filter(option => option.package_id === pkg.id);
            pkg.exclusionsPriced = packageOptionPrices.filter(option => option.option_type === 'exclusion');
            pkg.inclusionsPriced = packageOptionPrices.filter(option => option.option_type === 'inclusion');
            pkg.addOnsPriced = packageOptionPrices.filter(option => option.option_type === 'add_on');
          });
        }
      }

      console.log('✅ Day picnic packages fetched successfully:', packages.length);
      return packages;
    } catch (error) {
      console.error('❌ Failed to fetch day picnic packages:', error);
      return [];
    }
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
