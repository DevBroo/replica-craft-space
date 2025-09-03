// COMMENTED OUT: Agent functionality not needed - owner and agent are same
// import { supabase } from '../integrations/supabase/client';

/*
// COMMENTED OUT: Agent functionality not needed - owner and agent are same
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
  properties_count?: number;
  // Agent profile fields nested for compatibility
  agent_profile?: {
    coverage_area?: string;
    aadhar_number?: string;
    pan_number?: string;
    joining_date?: string;
    status?: string;
    notes?: string;
    documents?: any;
    commission_config?: any;
  };
  // Also flat properties for direct access
  coverage_area?: string;
  aadhar_number?: string;
  pan_number?: string;
  joining_date?: string;
  status?: string;
  notes?: string;
  documents?: any;
  commission_config?: any;
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
  // Get all agents with filters using edge function
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

  // Get agent details with extended profile and bank details using edge function
  async getAgentDetailsExtended(agentId: string): Promise<any> {
    try {
      console.log('🔍 Fetching extended agent details:', agentId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'get_details',
          agent_id: agentId
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error fetching agent details:', error);
        throw error;
      }

      console.log('✅ Extended agent details fetched:', data);
      return data.agent;
    } catch (error) {
      console.error('💥 Error in getAgentDetailsExtended:', error);
      throw error;
    }
  },

  // Update agent profile and bank details using edge function
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'update_profile',
          agent_id: agentId,
          profile_data: profileData
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ Error updating agent profile:', error);
        throw error;
      }

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
      
      // Get agent counts from profiles table
      const { count: totalAgents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent');

      const { count: activeAgents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent')
        .eq('is_active', true);

      const stats: AgentStats = {
        total_agents: totalAgents || 0,
        active_agents: activeAgents || 0,
        inactive_agents: (totalAgents || 0) - (activeAgents || 0),
        total_assignments: 0, // Will be calculated via edge function when assignments table is available
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in as an admin.');
      }

      const { data, error } = await supabase.functions.invoke('admin-agents', {
        body: { 
          action: 'delete',
          agent_id: agentId
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

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
*/
