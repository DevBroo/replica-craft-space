import { supabase } from '@/integrations/supabase/client';

export interface EnhancedBookingData {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string;
  user_id: string;
  owner_id?: string;
  agent_id?: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  refund_amount: number;
  status: string;
  payment_status: string;
  refund_status: string;
  payment_mode?: string;
  transaction_id?: string;
  cancellation_reason?: string;
  modification_reason?: string;
  last_modified_by?: string;
  cancelled_at?: string;
  refund_requested_at?: string;
  refund_processed_at?: string;
  property_title?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  owner_name?: string;
  agent_name?: string;
  last_modified_by_name?: string;
}

export interface BookingAnalytics {
  total_bookings: number;
  total_revenue: number;
  total_refunds: number;
  average_booking_value: number;
  bookings_by_status: Record<string, number>;
  payments_by_status: Record<string, number>;
  refunds_by_status: Record<string, number>;
  cancellation_rate: number;
  top_properties: Array<{
    property_id: string;
    title: string;
    bookings: number;
    revenue: number;
  }>;
  top_owners: Array<{
    owner_id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  revenue_trend: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface BookingFilters {
  status?: string;
  payment_status?: string;
  refund_status?: string;
  property_id?: string;
  owner_id?: string;
  agent_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface BookingUpdateData {
  status?: string;
  payment_status?: string;
  refund_status?: string;
  refund_amount?: number;
  payment_mode?: string;
  transaction_id?: string;
  cancellation_reason?: string;
  modification_reason?: string;
  check_in_date?: string;
  check_out_date?: string;
  guests?: number;
  total_amount?: number;
}

export class EnhancedBookingService {
  static async getBookings(
    page: number = 1,
    pageSize: number = 10,
    filters: BookingFilters = {},
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    try {
      let query = supabase.from('booking_admin_list').select('*', { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters.refund_status) {
        query = query.eq('refund_status', filters.refund_status);
      }
      if (filters.property_id) {
        query = query.eq('property_id', filters.property_id);
      }
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }
      if (filters.search) {
        query = query.or(`user_name.ilike.%${filters.search}%,property_title.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%,transaction_id.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page
      };
    } catch (error) {
      console.error('EnhancedBookingService.getBookings error:', error);
      throw error;
    }
  }

  static async getBookingAnalytics(
    startDate?: string,
    endDate?: string,
    propertyFilter?: string,
    ownerFilter?: string,
    agentFilter?: string
  ): Promise<BookingAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_booking_analytics_enhanced', {
        start_date: startDate,
        end_date: endDate,
        property_filter: propertyFilter,
        owner_filter: ownerFilter,
        agent_filter: agentFilter
      });

      if (error) {
        console.error('Error fetching booking analytics:', error);
        throw error;
      }

      const result = data?.[0];
      if (!result) {
        throw new Error('No analytics data returned');
      }

      return {
        total_bookings: result.total_bookings || 0,
        total_revenue: result.total_revenue || 0,
        total_refunds: result.total_refunds || 0,
        average_booking_value: result.average_booking_value || 0,
        bookings_by_status: (result.bookings_by_status as Record<string, number>) || {},
        payments_by_status: (result.payments_by_status as Record<string, number>) || {},
        refunds_by_status: (result.refunds_by_status as Record<string, number>) || {},
        cancellation_rate: result.cancellation_rate || 0,
        top_properties: (result.top_properties as any[]) || [],
        top_owners: (result.top_owners as any[]) || [],
        revenue_trend: (result.revenue_trend as any[]) || []
      };
    } catch (error) {
      console.error('EnhancedBookingService.getBookingAnalytics error:', error);
      throw error;
    }
  }

  static async updateBooking(bookingId: string, updateData: BookingUpdateData, reason?: string) {
    try {
      const updatePayload: any = {
        ...updateData,
        updated_at: new Date().toISOString(),
        last_modified_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (reason) {
        updatePayload.modification_reason = reason;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        throw error;
      }

      // Log the action
      if (reason) {
        await this.logBookingAction(bookingId, 'manual_update', reason, updateData);
      }

      return data;
    } catch (error) {
      console.error('EnhancedBookingService.updateBooking error:', error);
      throw error;
    }
  }

  static async bulkUpdateBookings(bookingIds: string[], updateData: BookingUpdateData, reason?: string) {
    try {
      const updatePayload: any = {
        ...updateData,
        updated_at: new Date().toISOString(),
        last_modified_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (reason) {
        updatePayload.modification_reason = reason;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .in('id', bookingIds)
        .select();

      if (error) {
        console.error('Error bulk updating bookings:', error);
        throw error;
      }

      // Log the bulk action
      if (reason) {
        for (const bookingId of bookingIds) {
          await this.logBookingAction(bookingId, 'bulk_update', reason, { ...updateData, affected_count: bookingIds.length });
        }
      }

      return data;
    } catch (error) {
      console.error('EnhancedBookingService.bulkUpdateBookings error:', error);
      throw error;
    }
  }

  static async cancelBooking(bookingId: string, reason: string, refundAmount?: number) {
    try {
      const updateData: BookingUpdateData = {
        status: 'cancelled',
        cancellation_reason: reason
      };

      if (refundAmount !== undefined) {
        updateData.refund_amount = refundAmount;
        updateData.refund_status = refundAmount > 0 ? 'requested' : 'none';
      }

      return await this.updateBooking(bookingId, updateData, `Cancelled: ${reason}`);
    } catch (error) {
      console.error('EnhancedBookingService.cancelBooking error:', error);
      throw error;
    }
  }

  static async processRefund(bookingId: string, refundAmount: number, reason?: string) {
    try {
      const updateData: BookingUpdateData = {
        refund_amount: refundAmount,
        refund_status: 'processed'
      };

      return await this.updateBooking(bookingId, updateData, reason || 'Refund processed');
    } catch (error) {
      console.error('EnhancedBookingService.processRefund error:', error);
      throw error;
    }
  }

  static async getBookingHistory(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from('booking_action_logs')
        .select(`
          *,
          actor:profiles!actor_id (
            full_name
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching booking history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('EnhancedBookingService.getBookingHistory error:', error);
      throw error;
    }
  }

  private static async logBookingAction(bookingId: string, action: string, reason?: string, metadata?: any) {
    try {
      await supabase.rpc('log_booking_action', {
        p_booking_id: bookingId,
        p_action: action,
        p_reason: reason,
        p_metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error logging booking action:', error);
      // Don't throw here as this is auxiliary functionality
    }
  }

  static async exportBookings(filters: BookingFilters = {}, format: 'csv' | 'excel' = 'csv') {
    try {
      // Get all bookings for export (no pagination)
      const { data } = await this.getBookings(1, 10000, filters);
      
      if (format === 'csv') {
        return this.exportToCSV(data);
      } else {
        return this.exportToExcel(data);
      }
    } catch (error) {
      console.error('EnhancedBookingService.exportBookings error:', error);
      throw error;
    }
  }

  private static exportToCSV(bookings: EnhancedBookingData[]): string {
    const headers = [
      'Booking ID', 'Created At', 'Property', 'Guest Name', 'Guest Email', 'Guest Phone',
      'Check In', 'Check Out', 'Guests', 'Total Amount', 'Refund Amount', 'Status',
      'Payment Status', 'Refund Status', 'Payment Mode', 'Transaction ID', 
      'Owner', 'Agent', 'Cancellation Reason'
    ];

    const csvContent = [
      headers.join(','),
      ...bookings.map(booking => [
        booking.id,
        new Date(booking.created_at).toLocaleDateString(),
        `"${booking.property_title || ''}"`,
        `"${booking.user_name || ''}"`,
        booking.user_email || '',
        booking.user_phone || '',
        booking.check_in_date,
        booking.check_out_date,
        booking.guests,
        booking.total_amount,
        booking.refund_amount,
        booking.status,
        booking.payment_status,
        booking.refund_status,
        booking.payment_mode || '',
        booking.transaction_id || '',
        `"${booking.owner_name || ''}"`,
        `"${booking.agent_name || ''}"`,
        `"${booking.cancellation_reason || ''}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  private static exportToExcel(bookings: EnhancedBookingData[]): Blob {
    // For now, return CSV as Excel. In a real implementation, you'd use a library like xlsx
    const csvContent = this.exportToCSV(bookings);
    return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  }
}