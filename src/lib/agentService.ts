
import { supabase } from '../integrations/supabase/client';

export interface Agent {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  commission_rate?: number;
  created_by?: string;
  created_by_profile?: { full_name: string };
  // Extended agent fields
  coverage_area?: string;
  aadhar_number?: string;
  pan_number?: string;
  joining_date?: string;
  status?: string;
  notes?: string;
  documents?: any;
  commission_config?: any;
  properties_count?: number;
}

export interface AgentStats {
  total_agents: number;
  active_agents: number;
  inactive_agents: number;
  total_assignments: number;
  revenue_this_month: number;
  commission_paid: number;
}

export interface AgentFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'blocked';
  startDate?: string;
  endDate?: string;
  coverageArea?: string;
}

export const agentService = {
  // Get all agents with filters
  async getAgents(filters?: AgentFilters): Promise<Agent[]> {
    try {
      console.log('🔍 Fetching agents using edge function...', filters);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'list',
          filters: filters || {}
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error fetching agents:', error);
        throw error;
      }

      console.log('✅ Agents loaded:', data.agents?.length || 0);
      return data.agents || [];
    } catch (error) {
      console.error('💥 Error in getAgents:', error);
      throw error;
    }
  },

  // Add new agent
  async addAgent(agentData: {
    email: string;
    full_name: string;
    phone?: string;
    coverage_area?: string;
    commission_rate?: number;
  }): Promise<void> {
    try {
      console.log('👤 Adding new agent:', agentData.email);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'invite',
          ...agentData
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error adding agent:', error);
        throw error;
      }

      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to add agent');
      }

      console.log('✅ Agent added successfully:', data);
    } catch (error) {
      console.error('💥 Error in addAgent:', error);
      throw error;
    }
  },

  // Update agent status
  async updateAgentStatus(agentId: string, status: string): Promise<void> {
    try {
      console.log('🔄 Updating agent status:', { agentId, status });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'update_status',
          agent_id: agentId,
          status: status
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error updating agent status:', error);
        throw error;
      }

      console.log('✅ Agent status updated successfully');
    } catch (error) {
      console.error('💥 Error in updateAgentStatus:', error);
      throw error;
    }
  },

  // Get agent insights
  async getAgentInsights(agentId: string): Promise<any> {
    try {
      console.log('📊 Fetching agent insights:', agentId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'insights',
          agent_id: agentId
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error fetching agent insights:', error);
        throw error;
      }

      console.log('✅ Agent insights fetched successfully');
      return data.insights;
    } catch (error) {
      console.error('💥 Error in getAgentInsights:', error);
      throw error;
    }
  },

  // Get agent details with extended profile and bank details
  async getAgentDetailsExtended(agentId: string): Promise<any> {
    try {
      console.log('🔍 Fetching extended agent details:', agentId);
      
      // Get basic agent profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .eq('role', 'agent')
        .single();

      if (profileError) {
        console.error('❌ Error fetching agent profile:', profileError);
        throw profileError;
      }

      // Get extended agent profile
      const { data: agentProfile, error: agentProfileError } = await supabase
        .from('agent_profiles')
        .select('*')
        .eq('user_id', agentId)
        .single();

      // Get bank details
      const { data: bankDetails, error: bankError } = await supabase
        .from('agent_bank_details')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      // Get agent's property assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('agent_property_assignments')
        .select(`
          *,
          properties!inner(id, title, status)
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      // Get activity logs
      const { data: activityLogs, error: activityError } = await supabase
        .from('agent_activity_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(50);

      const agentDetails = {
        ...profile,
        agent_profile: agentProfile,
        bank_details: bankDetails,
        assignments: assignments || [],
        properties_count: assignments?.length || 0,
        activity_logs: activityLogs || []
      };

      console.log('✅ Extended agent details fetched:', agentDetails);
      return agentDetails;
    } catch (error) {
      console.error('💥 Error in getAgentDetailsExtended:', error);
      throw error;
    }
  },

  // Update agent profile and bank details
  async updateAgentProfile(
    agentId: string,
    profileData: {
      basic?: {
        full_name?: string;
        phone?: string;
        commission_rate?: number;
        is_active?: boolean;
      };
      extended?: {
        coverage_area?: string;
        aadhar_number?: string;
        pan_number?: string;
        joining_date?: string;
        status?: string;
        notes?: string;
        commission_config?: any;
        documents?: any;
      };
      bank?: {
        account_holder_name?: string;
        bank_name?: string;
        branch_name?: string;
        account_number?: string;
        ifsc_code?: string;
        account_type?: string;
        pan_number?: string;
        upi_id?: string;
        micr_code?: string;
      };
    }
  ): Promise<void> {
    try {
      console.log('📝 Updating agent profile:', agentId);
      
      // Update basic profile if provided
      if (profileData.basic) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            ...profileData.basic,
            updated_at: new Date().toISOString()
          })
          .eq('id', agentId);

        if (profileError) throw profileError;
      }

      // Update extended profile if provided
      if (profileData.extended) {
        const { error: extendedError } = await supabase
          .from('agent_profiles')
          .upsert({
            user_id: agentId,
            ...profileData.extended,
            updated_at: new Date().toISOString()
          });

        if (extendedError) throw extendedError;
      }

      // Update bank details if provided
      if (profileData.bank && profileData.bank.account_holder_name && profileData.bank.bank_name && profileData.bank.account_number && profileData.bank.ifsc_code) {
        const { error: bankError } = await supabase
          .from('agent_bank_details')
          .upsert({
            agent_id: agentId,
            account_holder_name: profileData.bank.account_holder_name,
            bank_name: profileData.bank.bank_name,
            branch_name: profileData.bank.branch_name || '',
            account_number: profileData.bank.account_number,
            ifsc_code: profileData.bank.ifsc_code,
            account_type: profileData.bank.account_type || 'Savings',
            pan_number: profileData.bank.pan_number || '',
            upi_id: profileData.bank.upi_id || '',
            micr_code: profileData.bank.micr_code || ''
          });

        if (bankError) throw bankError;
      }

      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.rpc('log_agent_activity_fn', {
        p_agent_id: agentId,
        p_action: 'profile_updated',
        p_actor_id: session?.user?.id,
        p_actor_type: 'admin',
        p_metadata: {
          updated_sections: Object.keys(profileData)
        }
      });

      console.log('✅ Agent profile updated successfully');
    } catch (error) {
      console.error('💥 Error in updateAgentProfile:', error);
      throw error;
    }
  },

  // Send notification to agent
  async sendNotificationToAgent(
    agentId: string, 
    notification: {
      title: string;
      message: string;
      type: 'email' | 'sms' | 'in-app';
      priority: 'low' | 'normal' | 'high';
    }
  ): Promise<void> {
    try {
      console.log('📧 Sending notification to agent:', agentId, notification.type);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      // Create notification record
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          target_user_id: agentId,
          title: notification.title,
          content: notification.message,
          type: notification.type === 'in-app' ? 'info' : notification.type,
          priority: notification.priority,
          status: 'unread',
          target_audience: null,
          related_entity_type: 'agent',
          related_entity_id: agentId
        });

      if (notificationError) throw notificationError;

      // Log activity
      await supabase.rpc('log_agent_activity_fn', {
        p_agent_id: agentId,
        p_action: 'notification_sent',
        p_actor_id: session.user?.id,
        p_actor_type: 'admin',
        p_metadata: {
          notification_type: notification.type,
          title: notification.title,
          priority: notification.priority
        }
      });

      console.log('✅ Notification sent successfully');
    } catch (error) {
      console.error('💥 Error in sendNotificationToAgent:', error);
      throw error;
    }
  },

  // Reset agent password
  async resetAgentPassword(agentId: string): Promise<void> {
    try {
      console.log('🔑 Resetting agent password:', agentId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'reset_password',
          agent_id: agentId
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error resetting agent password:', error);
        throw error;
      }

      console.log('✅ Agent password reset successfully');
    } catch (error) {
      console.error('💥 Error in resetAgentPassword:', error);
      throw error;
    }
  },

  // Get admin dashboard statistics
  async getAgentStats(): Promise<AgentStats> {
    try {
      console.log('📊 Fetching agent statistics...');
      
      // Get agent counts
      const { count: totalAgents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent');

      const { count: activeAgents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent')
        .eq('is_active', true);

      // Get assignment counts
      const { count: totalAssignments } = await supabase
        .from('agent_property_assignments')
        .select('*', { count: 'exact', head: true });

      const stats: AgentStats = {
        total_agents: totalAgents || 0,
        active_agents: activeAgents || 0,
        inactive_agents: (totalAgents || 0) - (activeAgents || 0),
        total_assignments: totalAssignments || 0,
        revenue_this_month: 0, // Can be calculated from bookings
        commission_paid: 0, // Can be calculated from payouts
      };

      console.log('✅ Agent stats:', stats);
      return stats;
    } catch (error) {
      console.error('💥 Error in getAgentStats:', error);
      throw error;
    }
  },

  // Delete agent
  async deleteAgent(agentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting agent:', agentId);
      
      // First, check if agent has active assignments
      const { count: assignmentsCount } = await supabase
        .from('agent_property_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', 'active');

      if (assignmentsCount && assignmentsCount > 0) {
        throw new Error(`Cannot delete agent with ${assignmentsCount} active property assignments. Please reassign properties first.`);
      }

      // Delete the agent profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', agentId)
        .eq('role', 'agent');

      if (error) {
        console.error('❌ Error deleting agent:', error);
        throw error;
      }

      console.log('✅ Agent deleted successfully');
    } catch (error) {
      console.error('💥 Error in deleteAgent:', error);
      throw error;
    }
  }
};
