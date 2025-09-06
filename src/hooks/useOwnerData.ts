import { useState, useEffect } from 'react';
import { PropertyService } from '@/lib/propertyService';
import { BookingService } from '@/lib/bookingService';
import { supabase } from '@/integrations/supabase/client';
import { measureAsync, CacheMetrics, devLog } from '@/lib/performanceUtils';

export interface OwnerStats {
  totalProperties: number;
  activeBookings: number;
  totalRevenue: number;
  averageRating: number;
  propertiesThisMonth: number;
  revenueThisMonth: number;
}

export interface OwnerProperty {
  id: string;
  title: string;
  property_type: string;
  status: string;
  images: string[];
  pricing: any;
  created_at: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  rating: number;
  review_count: number;
}

export interface OwnerBooking {
  id: string;
  property_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  status: string;
  created_at: string;
  property: {
    title: string;
    images: string[];
  };
}

// Cache for owner properties to avoid repeated API calls
const ownerPropertiesCache = new Map<string, { data: OwnerProperty[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useOwnerProperties(ownerId: string, dashboardLimit?: number) {
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!ownerId) return;
      
      try {
        setError(null);
        
        // Check cache first
        const cacheKey = `${ownerId}_${dashboardLimit || 'all'}`;
        const cached = ownerPropertiesCache.get(cacheKey);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          devLog('Using cached properties data');
          CacheMetrics.recordHit();
          setProperties(cached.data);
          setLoading(false);
          return;
        }
        
        CacheMetrics.recordMiss();
        
        setLoading(true);
        devLog('Fetching fresh properties data...');
        
        const data = await measureAsync(
          `getOwnerProperties-${dashboardLimit ? 'limited' : 'all'}`,
          () => PropertyService.getOwnerProperties(ownerId, dashboardLimit)
        );
        setProperties(data);
        
        // Cache the result
        ownerPropertiesCache.set(cacheKey, { data, timestamp: now });
        devLog('Properties cached for faster future loads');
        
      } catch (err) {
        console.error('❌ Error fetching properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [ownerId, dashboardLimit]);

  const refetch = async (force = false) => {
    if (!ownerId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (force) {
        // Clear cache if forcing refresh
        const cacheKey = `${ownerId}_${dashboardLimit || 'all'}`;
        ownerPropertiesCache.delete(cacheKey);
      }
      
      const data = await PropertyService.getOwnerProperties(ownerId, dashboardLimit);
      setProperties(data);
      
      // Update cache
      const cacheKey = `${ownerId}_${dashboardLimit || 'all'}`;
      ownerPropertiesCache.set(cacheKey, { data, timestamp: Date.now() });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  return { properties, loading, error, refetch };
}

export function useOwnerBookings(ownerId: string) {
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!ownerId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get bookings for all properties owned by this user
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            property:properties(title, images)
          `)
          .eq('properties.owner_id', ownerId);

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [ownerId]);

  return { bookings, loading, error };
}

// Cache for owner stats
const ownerStatsCache = new Map<string, { data: OwnerStats; timestamp: number }>();

export function useOwnerStats(ownerId: string) {
  const [stats, setStats] = useState<OwnerStats>({
    totalProperties: 0,
    activeBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    propertiesThisMonth: 0,
    revenueThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!ownerId) return;
    
    try {
      setError(null);
      
      // Check cache first
      const cached = ownerStatsCache.get(ownerId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('🚀 Using cached stats data');
        setStats(cached.data);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      console.log('📊 Fetching fresh stats data...');

      // First get property IDs, then use them for booking query
      const propertiesResult = await supabase
        .from('properties')
        .select('id, created_at, rating, review_count, status')
        .eq('owner_id', ownerId);

      if (propertiesResult.error) throw propertiesResult.error;
      
      const propertiesData = propertiesResult.data || [];
      const propertyIds = propertiesData.map(p => p.id);

      // Get bookings for owner's properties (only if there are properties)
      let bookingsData: any[] = [];
      if (propertyIds.length > 0) {
        const bookingsResult = await supabase
          .from('bookings')
          .select(`
            total_amount, 
            status, 
            created_at, 
            check_in_date, 
            check_out_date,
            property_id
          `)
          .in('property_id', propertyIds);
          
        if (bookingsResult.error) throw bookingsResult.error;
        bookingsData = bookingsResult.data || [];
      }

      const now_date = new Date();
      const thisMonth = new Date(now_date.getFullYear(), now_date.getMonth(), 1);
      const currentDate = now_date.toISOString().split('T')[0];

      // Calculate stats efficiently
      const totalProperties = propertiesData.length;
      const propertiesThisMonth = propertiesData.filter(p => 
        new Date(p.created_at) >= thisMonth
      ).length;

      const activeBookings = bookingsData.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.check_out_date) >= new Date(currentDate)
      ).length;

      const totalRevenue = bookingsData.reduce((sum, b) => 
        sum + (Number(b.total_amount) || 0), 0
      );

      const revenueThisMonth = bookingsData
        .filter(b => new Date(b.created_at) >= thisMonth)
        .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

      // Calculate average rating
      const propertiesWithRatings = propertiesData.filter(p => 
        p.rating && p.rating > 0
      );
      const averageRating = propertiesWithRatings.length > 0 
        ? propertiesWithRatings.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / propertiesWithRatings.length
        : 0;

      const calculatedStats = {
        totalProperties,
        activeBookings,
        totalRevenue,
        averageRating,
        propertiesThisMonth,
        revenueThisMonth,
      };

      setStats(calculatedStats);
      
      // Cache the result
      ownerStatsCache.set(ownerId, { data: calculatedStats, timestamp: now });
      console.log('✅ Stats cached for faster future loads');
      
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [ownerId]);

  // Add a refresh function that can be called manually
  const refreshStats = (force = false) => {
    if (force) {
      ownerStatsCache.delete(ownerId);
    }
    fetchStats();
  };

  return { stats, loading, error, refreshStats };
}