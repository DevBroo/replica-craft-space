import { supabase } from '@/integrations/supabase/client';

export interface OwnerBooking {
  id: string;
  property_id: string;
  property_title: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
  guests_count: number;
  nights: number;
  created_at: string;
  updated_at: string;
}

export interface OwnerEarnings {
  total_revenue: number;
  monthly_earnings: number;
  pending_payments: number;
  completed_transactions: number;
  commission_rate: number;
}

export interface OwnerReview {
  id: string;
  property_id: string;
  property_title: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  response?: string;
  response_at?: string;
}

export class OwnerService {
  /**
   * Get bookings for owner's properties
   */
  static async getOwnerBookings(ownerId: string): Promise<OwnerBooking[]> {
    try {
      console.log('🔍 Fetching bookings for owner:', ownerId);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(title, owner_id)
        `)
        .eq('properties.owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching owner bookings:', error);
        throw error;
      }

      const bookings = (data || []).map((booking: any) => ({
        id: booking.id,
        property_id: booking.property_id,
        property_title: booking.properties?.title || 'Unknown Property',
        guest_name: booking.guest_name || 'Unknown Guest',
        guest_email: booking.guest_email || '',
        guest_phone: booking.guest_phone || '',
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        status: booking.status,
        total_amount: booking.total_amount,
        guests_count: booking.guests_count,
        nights: this.calculateNights(booking.check_in_date, booking.check_out_date),
        created_at: booking.created_at,
        updated_at: booking.updated_at
      }));

      console.log('✅ Owner bookings fetched:', bookings.length);
      return bookings;
    } catch (error) {
      console.error('❌ Failed to fetch owner bookings:', error);
      throw error;
    }
  }

  /**
   * Get earnings data for owner
   */
  static async getOwnerEarnings(ownerId: string): Promise<OwnerEarnings> {
    try {
      console.log('🔍 Fetching earnings for owner:', ownerId);
      
      // Get all bookings for owner's properties
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(owner_id)
        `)
        .eq('properties.owner_id', ownerId)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('❌ Error fetching owner bookings:', bookingsError);
        throw bookingsError;
      }

      // Get commission data for owner (if exists)
      const { data: commissions, error: commissionError } = await supabase
        .from('commission_disbursements')
        .select('*')
        .eq('owner_id', ownerId);

      if (commissionError) {
        console.warn('⚠️ No commission data found, using booking data:', commissionError);
      }

      // Calculate earnings from bookings
      const totalRevenue = bookings?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      const completedTransactions = bookings?.filter(b => b.status === 'confirmed').length || 0;
      
      // Get current month earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyEarnings = bookings?.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      }).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

      // Calculate pending payments (bookings that are confirmed but not yet paid out)
      const pendingPayments = bookings?.filter(b => 
        b.status === 'confirmed' && 
        !commissions?.some(c => c.booking_id === b.id && c.disbursement_status === 'completed')
      ).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

      const earnings: OwnerEarnings = {
        total_revenue: totalRevenue,
        monthly_earnings: monthlyEarnings,
        pending_payments: pendingPayments,
        completed_transactions: completedTransactions,
        commission_rate: 70 // Default 70% for owners, 30% for admin
      };

      console.log('✅ Owner earnings calculated:', earnings);
      return earnings;
    } catch (error) {
      console.error('❌ Failed to fetch owner earnings:', error);
      throw error;
    }
  }

  /**
   * Get reviews for owner's properties
   */
  static async getOwnerReviews(ownerId: string): Promise<OwnerReview[]> {
    try {
      console.log('🔍 Fetching reviews for owner:', ownerId);
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          properties!inner(title, owner_id)
        `)
        .eq('properties.owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching owner reviews:', error);
        throw error;
      }

      const reviews = (data || []).map((review: any) => ({
        id: review.id,
        property_id: review.property_id,
        property_title: review.properties?.title || 'Unknown Property',
        reviewer_name: review.reviewer_name,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        response: review.response,
        response_at: review.response_at
      }));

      console.log('✅ Owner reviews fetched:', reviews.length);
      return reviews;
    } catch (error) {
      console.error('❌ Failed to fetch owner reviews:', error);
      throw error;
    }
  }

  /**
   * Get owner dashboard statistics
   */
  static async getOwnerStats(ownerId: string) {
    try {
      const [bookings, earnings, reviews] = await Promise.all([
        this.getOwnerBookings(ownerId),
        this.getOwnerEarnings(ownerId),
        this.getOwnerReviews(ownerId)
      ]);

      const activeBookings = bookings.filter(b => ['confirmed', 'checked_in'].includes(b.status)).length;
      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

      return {
        totalBookings: bookings.length,
        activeBookings,
        totalEarnings: earnings.total_revenue,
        pendingPayments: earnings.pending_payments,
        totalReviews: reviews.length,
        averageRating: avgRating,
        completedTransactions: earnings.completed_transactions
      };
    } catch (error) {
      console.error('❌ Failed to fetch owner stats:', error);
      throw error;
    }
  }

  /**
   * Helper function to calculate nights between dates
   */
  private static calculateNights(checkIn: string, checkOut: string): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Respond to a review
   */
  static async respondToReview(reviewId: string, response: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          comment: response, // Using comment field instead of response
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      console.log('✅ Review response saved');
    } catch (error) {
      console.error('❌ Failed to respond to review:', error);
      throw error;
    }
  }
}


