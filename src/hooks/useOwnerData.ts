import { useState, useEffect } from 'react';
import { PropertyService } from '@/lib/propertyService';
import { BookingService } from '@/lib/bookingService';
import { supabase } from '@/integrations/supabase/client';

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

export function useOwnerProperties(ownerId: string) {
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!ownerId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await PropertyService.getOwnerProperties(ownerId);
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [ownerId]);

  const refetch = async () => {
    if (!ownerId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await PropertyService.getOwnerProperties(ownerId);
      setProperties(data);
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

  useEffect(() => {
    const fetchStats = async () => {
      if (!ownerId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Get properties stats
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('id, created_at, rating, review_count, status')
          .eq('owner_id', ownerId);

        if (propertiesError) throw propertiesError;

        // Get bookings stats
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('total_amount, status, created_at, check_in_date, check_out_date')
          .in('property_id', propertiesData?.map(p => p.id) || []);

        if (bookingsError) throw bookingsError;

        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentDate = new Date().toISOString().split('T')[0];

        // Calculate stats
        const totalProperties = propertiesData?.length || 0;
        const propertiesThisMonth = propertiesData?.filter(p => 
          new Date(p.created_at) >= thisMonth
        ).length || 0;

        const activeBookings = bookingsData?.filter(b => 
          b.status === 'confirmed' && 
          new Date(b.check_out_date) >= new Date(currentDate)
        ).length || 0;

        const totalRevenue = bookingsData?.reduce((sum, b) => 
          sum + (Number(b.total_amount) || 0), 0
        ) || 0;

        const revenueThisMonth = bookingsData?.filter(b => 
          new Date(b.created_at) >= thisMonth
        ).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

        // Calculate average rating
        const propertiesWithRatings = propertiesData?.filter(p => 
          p.rating && p.rating > 0
        ) || [];
        const averageRating = propertiesWithRatings.length > 0 
          ? propertiesWithRatings.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / propertiesWithRatings.length
          : 0;

        setStats({
          totalProperties,
          activeBookings,
          totalRevenue,
          averageRating,
          propertiesThisMonth,
          revenueThisMonth,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [ownerId]);

  return { stats, loading, error };
}