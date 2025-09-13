import { supabase } from '@/integrations/supabase/client';

export interface AgentCommission {
  id: string;
  agent_id: string;
  booking_id: string;
  commission_rate: number;
  booking_amount: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentCommissionSettings {
  id: string;
  agent_id: string;
  commission_rate: number;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentCommissionPayout {
  id: string;
  agent_id: string;
  total_commission: number;
  commission_count: number;
  payout_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionData {
  id: string;
  commission_id: string;
  property_title: string;
  booking_id: string;
  stay_dates: string;
  owner_name: string;
  agent_name: string;
  total_booking_amount: number;
  admin_commission: number;
  owner_share: number;
  agent_commission: number;
  due_date: string;
  disbursement_status: 'pending' | 'approved' | 'processing' | 'paid' | 'failed' | 'rejected';
  payment_details: {
    method: string;
    reference: string;
    date?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AgentStats {
  total_commission: number;
  pending_commission: number;
  approved_commission: number;
  paid_commission: number;
  total_bookings: number;
  current_rate: number;
}

export class CommissionService {
  /**
   * Calculate commission for a booking
   */
  static async calculateCommission(
    agentId: string,
    bookingId: string,
    bookingAmount: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_agent_commission', {
          p_agent_id: agentId,
          p_booking_id: bookingId,
          p_booking_amount: bookingAmount
        });

      if (error) {
        console.error('Error calculating commission:', error);
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in calculateCommission:', error);
      throw error;
    }
  }

  /**
   * Get agent commission summary
   */
  static async getAgentCommissionSummary(agentId: string): Promise<AgentStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_agent_commission_summary', {
          p_agent_id: agentId
        });

      if (error) {
        console.error('Error fetching commission summary:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in getAgentCommissionSummary:', error);
      throw error;
    }
  }

  /**
   * Get agent commissions with booking details
   */
  static async getAgentCommissions(
    agentId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AgentCommission[]> {
    try {
      const { data, error } = await supabase
        .from('agent_commissions')
        .select(`
          *,
          bookings (
            id,
            property_id,
            check_in_date,
            check_out_date,
            guests,
            total_amount,
            status,
            properties (
              title,
              address
            )
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching agent commissions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAgentCommissions:', error);
      throw error;
    }
  }

  /**
   * Get agent commission settings
   */
  static async getAgentCommissionSettings(agentId: string): Promise<AgentCommissionSettings[]> {
    try {
      const { data, error } = await supabase
        .from('agent_commission_settings')
        .select('*')
        .eq('agent_id', agentId)
        .order('effective_from', { ascending: false });

      if (error) {
        console.error('Error fetching commission settings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAgentCommissionSettings:', error);
      throw error;
    }
  }

  /**
   * Update commission status
   */
  static async updateCommissionStatus(
    commissionId: string,
    status: 'pending' | 'approved' | 'paid' | 'cancelled'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('update_commission_status', {
          p_commission_id: commissionId,
          p_status: status
        });

      if (error) {
        console.error('Error updating commission status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCommissionStatus:', error);
      throw error;
    }
  }

  /**
   * Create commission settings for an agent
   */
  static async createCommissionSettings(
    agentId: string,
    commissionRate: number,
    effectiveFrom?: string,
    effectiveUntil?: string,
    createdBy?: string
  ): Promise<AgentCommissionSettings> {
    try {
      const { data, error } = await supabase
        .from('agent_commission_settings')
        .insert({
          agent_id: agentId,
          commission_rate: commissionRate,
          is_active: true,
          effective_from: effectiveFrom || new Date().toISOString(),
          effective_until: effectiveUntil,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating commission settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createCommissionSettings:', error);
      throw error;
    }
  }

  /**
   * Update commission settings
   */
  static async updateCommissionSettings(
    settingsId: string,
    updates: Partial<AgentCommissionSettings>
  ): Promise<AgentCommissionSettings> {
    try {
      const { data, error } = await supabase
        .from('agent_commission_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId)
        .select()
        .single();

      if (error) {
        console.error('Error updating commission settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCommissionSettings:', error);
      throw error;
    }
  }

  /**
   * Get all agents with their commission data (admin only)
   */
  static async getAllAgentsCommissionData(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('agent_dashboard_data')
        .select('*')
        .order('total_commission', { ascending: false });

      if (error) {
        console.error('Error fetching all agents commission data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllAgentsCommissionData:', error);
      throw error;
    }
  }

  /**
   * Get commission payouts for an agent
   */
  static async getAgentPayouts(
    agentId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<AgentCommissionPayout[]> {
    try {
      const { data, error } = await supabase
        .from('agent_commission_payouts')
        .select('*')
        .eq('agent_id', agentId)
        .order('payout_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching agent payouts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAgentPayouts:', error);
      throw error;
    }
  }

  /**
   * Create a commission payout
   */
  static async createPayout(
    agentId: string,
    totalCommission: number,
    commissionCount: number,
    payoutDate: string,
    paymentMethod?: string,
    paymentReference?: string,
    notes?: string
  ): Promise<AgentCommissionPayout> {
    try {
      const { data, error } = await supabase
        .from('agent_commission_payouts')
        .insert({
          agent_id: agentId,
          total_commission: totalCommission,
          commission_count: commissionCount,
          payout_date: payoutDate,
          status: 'pending',
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          notes: notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payout:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createPayout:', error);
      throw error;
    }
  }

  /**
   * Update payout status
   */
  static async updatePayoutStatus(
    payoutId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    paymentReference?: string
  ): Promise<AgentCommissionPayout> {
    try {
      const { data, error } = await supabase
        .from('agent_commission_payouts')
        .update({
          status,
          payment_reference: paymentReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutId)
        .select()
        .single();

      if (error) {
        console.error('Error updating payout status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePayoutStatus:', error);
      throw error;
    }
  }

  /**
   * Get commission analytics for admin dashboard
   */
  static async getCommissionAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalCommissions: number;
    totalPayouts: number;
    pendingCommissions: number;
    topAgents: any[];
    monthlyTrend: any[];
  }> {
    try {
      // Get total commissions (all statuses, not just paid)
      const { data: totalCommissions, error: totalError } = await supabase
        .from('agent_commissions')
        .select('commission_amount')
        .neq('status', 'cancelled');

      if (totalError) throw totalError;

      // Get total payouts
      const { data: totalPayouts, error: payoutsError } = await supabase
        .from('agent_commission_payouts')
        .select('total_commission')
        .eq('status', 'completed');

      if (payoutsError) throw payoutsError;

      // Get pending commissions
      const { data: pendingCommissions, error: pendingError } = await supabase
        .from('agent_commissions')
        .select('commission_amount')
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get top agents
      const { data: topAgents, error: topAgentsError } = await supabase
        .from('agent_dashboard_data')
        .select('*')
        .order('total_commission', { ascending: false })
        .limit(10);

      if (topAgentsError) throw topAgentsError;

      return {
        totalCommissions: totalCommissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0,
        totalPayouts: totalPayouts?.reduce((sum, p) => sum + p.total_commission, 0) || 0,
        pendingCommissions: pendingCommissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0,
        topAgents: topAgents || [],
        monthlyTrend: [] // TODO: Implement monthly trend calculation
      };
    } catch (error) {
      console.error('Error in getCommissionAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue split summary for admin dashboard
   */
  static async getRevenueSplitSummary(filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    totalAdmin: number;
    totalOwner: number;
    totalAgent: number;
    totalAmount: number;
  }> {
    try {
      // Get all agent commissions
      let query = supabase
        .from('agent_commissions')
        .select(`
          commission_amount,
          booking_amount,
          status
        `)
        .neq('status', 'cancelled');

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data: commissions, error } = await query;

      if (error) {
        console.error('Error fetching revenue split data:', error);
        throw error;
      }

      // Calculate totals
      const totalAgent = commissions?.reduce((sum, item) => sum + item.commission_amount, 0) || 0;
      const totalAmount = commissions?.reduce((sum, item) => sum + item.booking_amount, 0) || 0;
      
      // For now, assume admin gets 10% and owner gets the rest
      // You can adjust these percentages based on your business model
      const adminPercentage = 0.10; // 10%
      const totalAdmin = totalAmount * adminPercentage;
      const totalOwner = totalAmount - totalAdmin - totalAgent;

      return {
        totalAdmin: Math.max(0, totalAdmin),
        totalOwner: Math.max(0, totalOwner),
        totalAgent,
        totalAmount
      };
    } catch (error) {
      console.error('Error in getRevenueSplitSummary:', error);
      throw error;
    }
  }

  /**
   * Get all agents commission data for admin management
   */
  static async getAllAgentsCommissionData(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          avatar_url,
          is_active,
          commission_rate,
          agent_commissions!left(
            commission_amount,
            status
          )
        `)
        .eq('role', 'agent')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agents data:', error);
        throw error;
      }

      // Process the data to calculate totals
      return data?.map(agent => {
        const commissions = agent.agent_commissions || [];
        const totalCommission = commissions.reduce((sum: number, comm: any) => sum + comm.commission_amount, 0);
        const pendingCommission = commissions
          .filter((comm: any) => comm.status === 'pending')
          .reduce((sum: number, comm: any) => sum + comm.commission_amount, 0);
        const paidCommission = commissions
          .filter((comm: any) => comm.status === 'paid')
          .reduce((sum: number, comm: any) => sum + comm.commission_amount, 0);

        return {
          agent_id: agent.id,
          full_name: agent.full_name,
          email: agent.email,
          phone: agent.phone,
          avatar_url: agent.avatar_url,
          is_active: agent.is_active,
          current_commission_rate: agent.commission_rate || 0.10,
          total_commission: totalCommission,
          pending_commission: pendingCommission,
          paid_commission: paidCommission,
          total_bookings: commissions.length,
          agent_since: agent.created_at
        };
      }) || [];
    } catch (error) {
      console.error('Error in getAllAgentsCommissionData:', error);
      throw error;
    }
  }

  /**
   * Update agent commission rate for future bookings
   */
  static async updateAgentCommissionRate(
    agentId: string,
    newRate: number,
    effectiveFrom?: string
  ): Promise<AgentCommissionSettings> {
    try {
      console.log('Updating commission rate for agent:', agentId, 'to:', newRate);
      
      // First, deactivate current active settings
      console.log('Step 1: Deactivating current settings...');
      const { error: deactivateError } = await supabase
        .from('agent_commission_settings')
        .update({ 
          is_active: false,
          effective_until: new Date().toISOString()
        })
        .eq('agent_id', agentId)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating current settings:', deactivateError);
        throw deactivateError;
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      console.log('Current user:', userData.user?.id);

      // Create new commission setting
      console.log('Step 2: Creating new commission setting...');
      const { data, error } = await supabase
        .from('agent_commission_settings')
        .insert({
          agent_id: agentId,
          commission_rate: newRate,
          is_active: true,
          effective_from: effectiveFrom || new Date().toISOString(),
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new commission setting:', error);
        throw error;
      }

      console.log('New commission setting created:', data);

      // Also update the profile table for backward compatibility
      console.log('Step 3: Updating profile table...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ commission_rate: newRate })
        .eq('id', agentId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      console.log('Commission rate update completed successfully');
      return data;
    } catch (error) {
      console.error('Error in updateAgentCommissionRate:', error);
      throw error;
    }
  }

  /**
   * Get commissions for admin dashboard with pagination and filters
   */
  static async getCommissions(filters?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<{ data: CommissionData[]; count: number }> {
    try {
      // Use a simpler approach - get basic commission data first, then fetch names separately
      let query = supabase
        .from('agent_commissions')
        .select(`
          *,
          bookings!inner(
            id,
            check_in_date,
            check_out_date,
            total_amount,
            status,
            user_id,
            property_id,
            properties(
              id,
              title,
              address,
              owner_id,
              profiles!properties_owner_id_fkey(
                id,
                full_name
              )
            )
          )
        `, { count: 'exact' });

    // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }

      if (filters?.search) {
        query = query.or(`bookings.properties.title.ilike.%${filters.search}%,profiles.full_name.ilike.%${filters.search}%`);
    }

    // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortDir = filters?.sortDir || 'desc';
    query = query.order(sortBy, { ascending: sortDir === 'asc' });

    // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

    const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching commissions:', error);
        throw error;
      }

      // Debug: Log the raw data to see what we're getting
      console.log('Raw commission data:', data);
      if (data && data.length > 0) {
        console.log('First commission sample:', data[0]);
        console.log('Booking data:', data[0]?.bookings);
      }

      // Get all unique agent IDs for fetching agent names
      const agentIds = [...new Set((data || []).map(commission => commission.agent_id).filter(Boolean))];

      // Fetch agent names
      let agentNames: { [key: string]: string } = {};
      if (agentIds.length > 0) {
        const { data: agentData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', agentIds);
        
        if (agentData) {
          agentData.forEach(agent => {
            agentNames[agent.id] = agent.full_name || 'Unknown Agent';
          });
        }
      }

      console.log('Agent names:', agentNames);
      console.log('Raw data sample:', data?.[0]);

      // Transform data to match CommissionData interface
      const transformedData: CommissionData[] = (data || []).map(commission => {
        // Get names from the fetched data
        const agentName = agentNames[commission.agent_id] || 'Unknown Agent';
        // Get property owner name from the nested query
        const ownerName = commission.bookings?.properties?.profiles?.full_name || 'Property Owner';
        
        // Format stay dates
        const checkInDate = commission.bookings?.check_in_date 
          ? new Date(commission.bookings.check_in_date).toLocaleDateString()
          : '-';
        const checkOutDate = commission.bookings?.check_out_date 
          ? new Date(commission.bookings.check_out_date).toLocaleDateString()
          : '-';
        const stayDates = `${checkInDate} to ${checkOutDate}`;

        return {
          id: commission.id,
          commission_id: commission.id,
          property_title: commission.bookings?.properties?.title || `Property ${commission.bookings?.property_id || 'Unknown'}`,
          booking_id: commission.booking_id,
          stay_dates: stayDates,
          owner_name: ownerName,
          agent_name: agentName,
          total_booking_amount: commission.booking_amount,
          admin_commission: commission.booking_amount * 0.10, // 10% admin commission
          owner_share: commission.booking_amount - (commission.booking_amount * 0.10) - commission.commission_amount,
          agent_commission: commission.commission_amount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          disbursement_status: commission.status,
          payment_details: {
            method: 'pending',
            reference: '',
            date: commission.payment_date
          },
          created_at: commission.created_at,
          updated_at: commission.updated_at
        };
      });

      return {
        data: transformedData,
        count: count || 0
      };
    } catch (error) {
      console.error('Error in getCommissions:', error);
      throw error;
    }
  }

  /**
   * Process payment for a commission
   */
  static async processPayment(
    commissionId: string,
    paymentMode: string,
    paymentReference: string,
    paymentDate: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({
          status: 'paid',
          payment_date: paymentDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (error) {
        console.error('Error processing payment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in processPayment:', error);
      throw error;
    }
  }

  /**
   * Approve a commission
   */
  static async approveCommission(commissionId: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (error) {
        console.error('Error approving commission:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in approveCommission:', error);
      throw error;
    }
  }

  /**
   * Reject a commission
   */
  static async rejectCommission(commissionId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (error) {
        console.error('Error rejecting commission:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in rejectCommission:', error);
      throw error;
    }
  }

  /**
   * Update a commission
   */
  static async updateCommission(commissionId: string, updates: Partial<CommissionData>): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({
          status: updates.disbursement_status,
          commission_amount: updates.agent_commission,
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (error) {
        console.error('Error updating commission:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateCommission:', error);
      throw error;
    }
  }

  /**
   * Bulk update commission status
   */
  static async bulkUpdateStatus(
    commissionIds: string[],
    status: string,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .in('id', commissionIds);

      if (error) {
        console.error('Error bulk updating commission status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in bulkUpdateStatus:', error);
      throw error;
    }
  }
}