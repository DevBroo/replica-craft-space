import { supabase } from '@/integrations/supabase/client';

export interface GuestReview {
  id: string;
  booking_id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  // Joined data
  booking?: {
    check_in_date: string;
    check_out_date: string;
    status: string;
  };
  property?: {
    title: string;
    images: string[];
    property_type: string;
  };
  reviewer?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}

export class ReviewService {
  /**
   * Get all reviews for a specific property (public view)
   */
  static async getPropertyReviews(propertyId: string): Promise<GuestReview[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          booking_id,
          property_id,
          user_id,
          rating,
          comment,
          created_at,
          updated_at,
          profiles!reviews_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching property reviews:', error);
        throw error;
      }

      return (data || []).map((review: any) => ({
        id: review.id,
        booking_id: review.booking_id,
        property_id: review.property_id,
        user_id: review.user_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        updated_at: review.updated_at,
        reviewer: {
          full_name: review.profiles?.full_name || 'Guest',
          avatar_url: review.profiles?.avatar_url
        }
      }));
    } catch (error) {
      console.error('ReviewService.getPropertyReviews error:', error);
      throw error;
    }
  }

  /**
   * Get bookings eligible for review (completed stays)
   */
  static async getEligibleBookingsForReview(userId: string): Promise<any[]> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          property_id,
          check_in_date,
          check_out_date,
          status,
          total_amount,
          guests,
          properties (
            title,
            images,
            property_type,
            address
          ),
          reviews!reviews_booking_id_fkey (
            id,
            rating,
            comment,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .lte('check_out_date', currentDate)
        .order('check_out_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching eligible bookings:', error);
        throw error;
      }

      // Filter out bookings that already have reviews
      const eligibleBookings = (data || []).filter(booking => 
        !booking.reviews || booking.reviews.length === 0
      );

      console.log(`✅ Found ${eligibleBookings.length} bookings eligible for review`);
      return eligibleBookings;
    } catch (error) {
      console.error('ReviewService.getEligibleBookingsForReview error:', error);
      throw error;
    }
  }

  /**
   * Get user's past reviews
   */
  static async getUserReviews(userId: string): Promise<GuestReview[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          booking_id,
          property_id,
          user_id,
          rating,
          comment,
          created_at,
          updated_at,
          bookings!reviews_booking_id_fkey (
            check_in_date,
            check_out_date,
            status
          ),
          properties!reviews_property_id_fkey (
            title,
            images,
            property_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user reviews:', error);
        throw error;
      }

      return (data || []).map((review: any) => ({
        id: review.id,
        booking_id: review.booking_id,
        property_id: review.property_id,
        user_id: review.user_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        updated_at: review.updated_at,
        booking: review.bookings ? {
          check_in_date: review.bookings.check_in_date,
          check_out_date: review.bookings.check_out_date,
          status: review.bookings.status
        } : undefined,
        property: review.properties ? {
          title: review.properties.title,
          images: review.properties.images || [],
          property_type: review.properties.property_type
        } : undefined
      }));
    } catch (error) {
      console.error('ReviewService.getUserReviews error:', error);
      throw error;
    }
  }

  /**
   * Submit a new review for a booking
   */
  static async submitReview(
    bookingId: string, 
    propertyId: string, 
    reviewData: ReviewFormData
  ): Promise<GuestReview> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // First, verify the booking is eligible for review
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, user_id, status, check_out_date, property_id')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found or not eligible for review');
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('user_id', user.id)
        .single();

      if (existingReview) {
        throw new Error('Review already exists for this booking');
      }

      // Submit the review
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          property_id: propertyId,
          user_id: user.id,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
        .select(`
          id,
          booking_id,
          property_id,
          user_id,
          rating,
          comment,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error('❌ Error submitting review:', error);
        throw error;
      }

      // Update property rating and review count
      await this.updatePropertyRating(propertyId);

      console.log('✅ Review submitted successfully:', data.id);
      return data as GuestReview;
    } catch (error) {
      console.error('ReviewService.submitReview error:', error);
      throw error;
    }
  }

  /**
   * Update property's average rating and review count
   */
  static async updatePropertyRating(propertyId: string): Promise<void> {
    try {
      // Get all reviews for this property
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId);

      if (reviewsError) {
        console.error('❌ Error fetching reviews for rating update:', reviewsError);
        return;
      }

      if (!reviews || reviews.length === 0) {
        return;
      }

      // Calculate new average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      const reviewCount = reviews.length;

      // Update property
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          review_count: reviewCount
        })
        .eq('id', propertyId);

      if (updateError) {
        console.error('❌ Error updating property rating:', updateError);
      } else {
        console.log(`✅ Property rating updated: ${averageRating.toFixed(1)} (${reviewCount} reviews)`);
      }
    } catch (error) {
      console.error('ReviewService.updatePropertyRating error:', error);
    }
  }

  /**
   * Delete a review (if allowed)
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting review:', error);
        throw error;
      }

      console.log('✅ Review deleted successfully');
    } catch (error) {
      console.error('ReviewService.deleteReview error:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a property
   */
  static async getPropertyReviewStats(propertyId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { rating: number; count: number; percentage: number }[];
  }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId);

      if (error) {
        console.error('❌ Error fetching review stats:', error);
        throw error;
      }

      const totalReviews = reviews?.length || 0;
      
      if (totalReviews === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: []
        };
      }

      const totalRating = reviews!.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;

      // Calculate rating distribution
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews!.forEach(review => {
        ratingCounts[review.rating as keyof typeof ratingCounts]++;
      });

      const ratingDistribution = Object.entries(ratingCounts)
        .map(([rating, count]) => ({
          rating: parseInt(rating),
          count,
          percentage: Math.round((count / totalReviews) * 100)
        }))
        .reverse(); // Show 5 stars first

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution
      };
    } catch (error) {
      console.error('ReviewService.getPropertyReviewStats error:', error);
      throw error;
    }
  }
}
