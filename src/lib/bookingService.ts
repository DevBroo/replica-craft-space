import { supabase } from '@/integrations/supabase/client';

export interface BookingData {
  property_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  booking_details?: any;
  status?: string;
}

export class BookingService {
  static async createBooking(bookingData: BookingData) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          property_id: bookingData.property_id,
          user_id: bookingData.user_id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
          guests: bookingData.guests,
          total_amount: bookingData.total_amount,
          booking_details: bookingData.booking_details,
          status: bookingData.status || 'pending'
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

  static async getUserBookings(userId: string) {
    try {
      const { data, error } = await supabase
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