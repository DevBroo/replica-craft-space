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
}