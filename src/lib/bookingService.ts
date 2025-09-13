import { supabase } from '@/integrations/supabase/client';

export interface BookingData {
  property_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  // Mandatory guest information fields
  guest_name: string;
  guest_phone: string;
  guest_date_of_birth: string;
  booking_details?: Record<string, any>;
  status?: string;
  payment_method?: 'phonepe' | 'razorpay' | 'stripe' | 'cash';
  customer_details?: {
    name?: string;
    email: string;
    phone?: string;
  };
}

export class BookingService {
  static async createBooking(bookingData: BookingData) {
    try {
      // Validate mandatory fields
      if (!bookingData.guest_name?.trim()) {
        throw new Error('Guest name is required');
      }
      if (!bookingData.guest_phone?.trim()) {
        throw new Error('Guest phone number is required');
      }
      if (!bookingData.guest_date_of_birth) {
        throw new Error('Guest date of birth is required');
      }

      // Validate date of birth format and reasonableness
      const dobDate = new Date(bookingData.guest_date_of_birth);
      if (isNaN(dobDate.getTime())) {
        throw new Error('Invalid date of birth format');
      }
      
      const today = new Date();
      const minDate = new Date('1900-01-01');
      if (dobDate > today || dobDate < minDate) {
        throw new Error('Date of birth must be between 1900 and today');
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          property_id: bookingData.property_id,
          user_id: bookingData.user_id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
          guests: bookingData.guests,
          total_amount: bookingData.total_amount,
          // Add mandatory guest information
          guest_name: bookingData.guest_name.trim(),
          guest_phone: bookingData.guest_phone.trim(),
          guest_date_of_birth: bookingData.guest_date_of_birth,
          booking_details: {
            ...bookingData.booking_details,
            payment_method: bookingData.payment_method || 'phonepe',
            customer_details: bookingData.customer_details
          },
          status: bookingData.status || 'pending',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('BookingService.createBooking error:', error);
      throw error;
    }
  }

  static async createBookingWithPayment(bookingData: BookingData) {
    try {
      // Create booking first
      const booking = await this.createBooking(bookingData);

      // Return booking data for payment processing
      return {
        booking,
        paymentData: {
          bookingId: booking.id,
          propertyId: bookingData.property_id,
          userId: bookingData.user_id,
          amount: bookingData.total_amount,
          currency: 'INR',
          description: `Booking for property ${bookingData.property_id}`,
          customerEmail: bookingData.customer_details?.email || '',
          customerPhone: bookingData.customer_details?.phone,
          customerName: bookingData.customer_details?.name
        }
      };
    } catch (error) {
      console.error('BookingService.createBookingWithPayment error:', error);
      throw error;
    }
  }

  static async getUserBookings(userId: string, userEmail?: string) {
    try {
      // First try to get bookings by user_id
      let { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            images,
            address,
            property_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // If no results by user_id and we have email, try by email
      if ((!data || data.length === 0) && userEmail) {
        const { data: emailData, error: emailError } = await supabase
          .from('bookings')
          .select(`
            *,
            properties (
              title,
              images,
              address,
              property_type
            )
          `)
          .ilike('customer_email', userEmail)
          .order('created_at', { ascending: false });
        
        if (emailError) {
          console.error('Error fetching user bookings by email:', emailError);
          throw emailError;
        }
        
        data = emailData;
        error = emailError;
      }

      if (error) {
        console.error('Error fetching user bookings:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('BookingService.getUserBookings error:', error);
      throw error;
    }
  }

  static async getBookingById(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            images,
            address,
            property_type,
            location,
            pricing
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('BookingService.getBookingById error:', error);
      throw error;
    }
  }

  static async updateBookingStatus(bookingId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('BookingService.updateBookingStatus error:', error);
      throw error;
    }
  }

  static async modifyBooking(bookingId: string, updateData: {
    check_in_date?: string;
    check_out_date?: string;
    guests?: number;
    total_amount?: number;
    modification_reason?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error modifying booking:', error);
        throw error;
      }

      // Log the modification action
      await supabase
        .from('booking_action_logs')
        .insert({
          booking_id: bookingId,
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'customer_modification',
          reason: updateData.modification_reason,
          metadata: updateData
        });

      return data;
    } catch (error) {
      console.error('BookingService.modifyBooking error:', error);
      throw error;
    }
  }

  static async cancelBooking(bookingId: string, cancellationData: {
    cancellation_reason: string;
    cancellation_type: string;
    cancellation_fee: number;
    refund_amount: number;
  }) {
    try {
      // First, get the current booking to check payment status
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('payment_status, total_amount')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching booking for cancellation:', fetchError);
        throw fetchError;
      }

      // Determine payment status based on cancellation fee
      let newPaymentStatus = currentBooking.payment_status;
      if (cancellationData.cancellation_fee === 0) {
        // Full refund - payment was completed but fully refunded
        newPaymentStatus = 'refunded';
      } else if (cancellationData.cancellation_fee < currentBooking.total_amount) {
        // Partial refund - payment was completed but partially refunded
        newPaymentStatus = 'partially_refunded';
      } else {
        // No refund - payment was completed, no refund
        newPaymentStatus = 'completed';
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: newPaymentStatus,
          cancellation_reason: cancellationData.cancellation_reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          booking_details: {
            cancellation_type: cancellationData.cancellation_type,
            cancellation_fee: cancellationData.cancellation_fee,
            refund_amount: cancellationData.refund_amount,
            original_payment_status: currentBooking.payment_status,
            cancellation_payment_status: newPaymentStatus,
          }
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      // Log the cancellation action
      await supabase
        .from('booking_action_logs')
        .insert({
          booking_id: bookingId,
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'customer_cancellation',
          reason: cancellationData.cancellation_reason,
          metadata: {
            ...cancellationData,
            original_payment_status: currentBooking.payment_status,
            new_payment_status: newPaymentStatus
          }
        });

      return data;
    } catch (error) {
      console.error('BookingService.cancelBooking error:', error);
      throw error;
    }
  }
}