
import { supabase } from '@/integrations/supabase/client';

export interface CommissionData {
  id: string;
  booking_id: string;
  property_id: string;
  owner_id: string;
  agent_id: string | null;
  total_booking_amount: number;
  admin_commission: number;
  owner_share: number;
  agent_commission: number;
  disbursement_status: string;
  due_date: string | null;
  payment_mode: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  failure_reason: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  check_in_date: string;
  check_out_date: string;
  property_title: string;
  owner_name: string;
  owner_email: string;
  agent_name: string | null;
  agent_email: string | null;
}

export const commissionService = {
  async getCommissions(filters: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}) {
    const { search, status, limit = 10, offset = 0, sortBy = 'created_at', sortDir = 'desc' } = filters;
    
    let query = supabase
      .from('commission_admin_list')
      .select('*');

    // Apply filters
    if (search) {
      query = query.or(`id.ilike.%${search}%,property_title.ilike.%${search}%,owner_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('disbursement_status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortDir === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], count: count || 0 };
  },

  async approveCommission(commissionId: string, notes?: string) {
    const { data, error } = await supabase.rpc('approve_commission', {
      p_commission_id: commissionId,
      p_notes: notes || null
    });

    if (error) throw error;
    return data;
  },

  async rejectCommission(commissionId: string, reason: string) {
    const { data, error } = await supabase.rpc('reject_commission', {
      p_commission_id: commissionId,
      p_reason: reason
    });

    if (error) throw error;
    return data;
  },

  async processPayment(commissionId: string, paymentMode: string, paymentReference: string, paymentDate?: string) {
    const { data, error } = await supabase.rpc('process_commission_payment', {
      p_commission_id: commissionId,
      p_payment_mode: paymentMode,
      p_payment_reference: paymentReference,
      p_payment_date: paymentDate || new Date().toISOString()
    });

    if (error) throw error;
    return data;
  },

  async markAsFailed(commissionId: string, reason: string) {
    const { data, error } = await supabase.rpc('mark_commission_failed', {
      p_commission_id: commissionId,
      p_reason: reason
    });

    if (error) throw error;
    return data;
  },

  async bulkUpdateStatus(commissionIds: string[], newStatus: string, failureReason?: string, notes?: string) {
    const { data, error } = await supabase.rpc('bulk_update_commission_status', {
      p_ids: commissionIds,
      p_new_status: newStatus,
      p_failure_reason: failureReason || null,
      p_notes: notes || null
    });

    if (error) throw error;
    return data;
  },

  async updateCommission(commissionId: string, updates: Partial<CommissionData>) {
    const { data, error } = await supabase
      .from('commission_disbursements')
      .update(updates)
      .eq('id', commissionId)
      .select();

    if (error) throw error;
    return data;
  },

  async getRevenueSplitSummary(filters: { status?: string; dateFrom?: string; dateTo?: string } = {}) {
    let query = supabase
      .from('commission_disbursements')
      .select('admin_commission, owner_share, agent_commission, disbursement_status');

    if (filters.status && filters.status !== 'all') {
      query = query.eq('disbursement_status', filters.status);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    const summary = (data || []).reduce((acc, item) => {
      acc.totalAdmin += Number(item.admin_commission) || 0;
      acc.totalOwner += Number(item.owner_share) || 0;
      acc.totalAgent += Number(item.agent_commission) || 0;
      acc.totalAmount += (Number(item.admin_commission) + Number(item.owner_share) + Number(item.agent_commission)) || 0;
      return acc;
    }, {
      totalAdmin: 0,
      totalOwner: 0,
      totalAgent: 0,
      totalAmount: 0
    });

    return summary;
  }
};
