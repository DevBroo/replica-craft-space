// COMMENTED OUT: Agent functionality not needed - owner and agent are same
// Stub service to prevent build errors

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
  status?: string;
  coverage_area?: string;
  properties_count?: number;
  joining_date?: string;
}

export interface AgentFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'blocked';
  startDate?: string;
  endDate?: string;
  coverageArea?: string;
}

export interface AgentStats {
  total_agents: number;
  active_agents: number;
  inactive_agents: number;
  total_assignments: number;
  revenue_this_month: number;
  commission_paid: number;
}

export const agentService = {
  async getAgents(_filters?: AgentFilters): Promise<Agent[]> {
    return [];
  },
  async addAgent(_data?: any): Promise<void> {
    throw new Error('Agent functionality is disabled');
  },
  async updateAgentStatus(): Promise<void> {
    throw new Error('Agent functionality is disabled');
  },
  async updateAgentProfile(_agentId?: string, _data?: any): Promise<void> {
    throw new Error('Agent functionality is disabled');
  },
  async getAgentInsights(_agentId?: string): Promise<any> {
    return null;
  },
  async getAgentDetailsExtended(_agentId?: string): Promise<any> {
    return null;
  },
  async resetAgentPassword(_agentId?: string): Promise<void> {
    throw new Error('Agent functionality is disabled');
  },
  async deleteAgent(_agentId?: string): Promise<void> {
    throw new Error('Agent functionality is disabled');
  },
  async getAgentStats(): Promise<AgentStats> {
    return {
      total_agents: 0,
      active_agents: 0,
      inactive_agents: 0,
      total_assignments: 0,
      revenue_this_month: 0,
      commission_paid: 0,
    };
  }
};