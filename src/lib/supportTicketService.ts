
import { supabase } from '@/integrations/supabase/client';

export interface SupportTicket {
  id: string;
  created_by: string;
  customer_email?: string;
  customer_phone?: string;
  subject: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: 'Payment' | 'Booking' | 'Property' | 'Technical' | 'Other';
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  resolved_at?: string;
  reopened_count: number;
  merged_into_ticket_id?: string;
  sla_due_at?: string;
  escalation_level: number;
  escalated: boolean;
  last_message_at?: string;
  satisfaction_rating?: number;
  satisfaction_comment?: string;
  satisfaction_submitted_at?: string;
  status_change_reason?: string;
}

export interface DatabaseTicket {
  id: string;
  created_by: string;
  customer_email?: string;
  customer_phone?: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  category: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  resolved_at?: string;
  reopened_count: number;
  merged_into_ticket_id?: string;
  sla_due_at?: string;
  escalation_level: number;
  escalated: boolean;
  last_message_at?: string;
  satisfaction_rating?: number;
  satisfaction_comment?: string;
  satisfaction_submitted_at?: string;
  status_change_reason?: string;
  assigned_agent_profile?: any;
  created_by_profile?: any;
}

export interface CreateTicketData {
  created_by: string;
  subject: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'Payment' | 'Booking' | 'Property' | 'Technical' | 'Other';
  customer_email?: string;
  customer_phone?: string;
  assigned_agent?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id?: string;
  author_role: string;
  content?: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id?: string;
  storage_path: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_internal: boolean;
  created_at: string;
}

export interface TicketAnalytics {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  avg_resolution_hours: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    tickets: number;
    avg_resolution_hours: number;
  }>;
  tickets_trend: Array<{
    date: string;
    tickets: number;
  }>;
}

class SupportTicketService {
  async getTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    assigned_agent?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DatabaseTicket[]> {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        assigned_agent_profile:profiles!support_tickets_assigned_agent_fkey(full_name, email),
        created_by_profile:profiles!support_tickets_created_by_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    
    if (params?.priority && params.priority !== 'all') {
      query = query.eq('priority', params.priority);
    }
    
    if (params?.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    
    if (params?.assigned_agent) {
      query = query.eq('assigned_agent', params.assigned_agent);
    }
    
    if (params?.search) {
      query = query.or(`subject.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as DatabaseTicket[];
  }

  async getTicketById(ticketId: string): Promise<DatabaseTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        assigned_agent_profile:profiles!support_tickets_assigned_agent_fkey(full_name, email),
        created_by_profile:profiles!support_tickets_created_by_fkey(full_name, email)
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data as DatabaseTicket;
  }

  async createTicket(ticket: CreateTicketData) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async assignAgent(ticketId: string, agentId: string) {
    return this.updateTicket(ticketId, { assigned_agent: agentId });
  }

  async updateStatus(ticketId: string, status: string, reason?: string) {
    return this.updateTicket(ticketId, { 
      status: status as any, 
      status_change_reason: reason 
    });
  }

  async escalateTicket(ticketId: string, reason: string) {
    const { data: escalation, error } = await supabase
      .from('support_ticket_escalations')
      .insert([{
        ticket_id: ticketId,
        to_level: 1,
        reason,
        escalated_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;

    // Update ticket escalation status
    await this.updateTicket(ticketId, {
      escalated: true,
      escalation_level: 1
    });

    return escalation;
  }

  async mergeTickets(sourceTicketId: string, targetTicketId: string, reason: string) {
    const { data, error } = await supabase
      .from('support_ticket_merges')
      .insert([{
        source_ticket_id: sourceTicketId,
        target_ticket_id: targetTicketId,
        reason,
        merged_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;

    // Update source ticket to show it's merged
    await this.updateTicket(sourceTicketId, {
      merged_into_ticket_id: targetTicketId,
      status: 'closed'
    });

    return data;
  }

  async getTicketMessages(ticketId: string) {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select(`
        *,
        author_profile:profiles!support_ticket_messages_author_id_fkey(full_name, email, role)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async addMessage(ticketId: string, content: string, isInternal: boolean = false) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('support_ticket_messages')
      .insert([{
        ticket_id: ticketId,
        author_id: user.id,
        author_role: profile?.role || 'user',
        content,
        is_internal: isInternal
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTicketAttachments(ticketId: string) {
    const { data, error } = await supabase
      .from('support_ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async uploadAttachment(ticketId: string, file: File, messageId?: string, isInternal: boolean = false) {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `tickets/${ticketId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('support-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Save metadata
    const { data, error } = await supabase
      .from('support_ticket_attachments')
      .insert([{
        ticket_id: ticketId,
        message_id: messageId,
        storage_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        is_internal: isInternal
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTicketAnalytics(startDate?: string, endDate?: string): Promise<TicketAnalytics> {
    const { data, error } = await supabase.rpc('get_ticket_analytics', {
      start_date: startDate,
      end_date: endDate
    });

    if (error) throw error;
    
    // Handle the response data and convert to proper types
    const result = data[0];
    return {
      total_tickets: result.total_tickets || 0,
      open_tickets: result.open_tickets || 0,
      resolved_tickets: result.resolved_tickets || 0,
      avg_resolution_hours: result.avg_resolution_hours || 0,
      by_category: (result.by_category && typeof result.by_category === 'object') ? result.by_category as Record<string, number> : {},
      by_status: (result.by_status && typeof result.by_status === 'object') ? result.by_status as Record<string, number> : {},
      by_agent: Array.isArray(result.by_agent) ? result.by_agent.map((agent: any) => ({
        agent_id: agent.agent_id || '',
        agent_name: agent.agent_name || '',
        tickets: agent.tickets || 0,
        avg_resolution_hours: agent.avg_resolution_hours || 0
      })) : [],
      tickets_trend: Array.isArray(result.tickets_trend) ? result.tickets_trend.map((trend: any) => ({
        date: trend.date || '',
        tickets: trend.tickets || 0
      })) : []
    };
  }

  async bulkUpdateStatus(ticketIds: string[], status: string, reason?: string) {
    // Use individual updates instead of upsert for better type safety
    const promises = ticketIds.map(id => 
      supabase
        .from('support_tickets')
        .update({
          status,
          status_change_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
    );

    const results = await Promise.all(promises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw errors[0].error;
    }

    return results.map(result => result.data).flat();
  }

  async submitSatisfactionRating(ticketId: string, rating: number, comment?: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        satisfaction_rating: rating,
        satisfaction_comment: comment,
        satisfaction_submitted_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAvailableAgents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'agent')
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }
}

export const supportTicketService = new SupportTicketService();
