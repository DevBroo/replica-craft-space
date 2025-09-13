import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Settings, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  BarChart3
} from 'lucide-react';
import { CommissionService, AgentStats } from '@/lib/commissionService';
import { toast } from '@/hooks/use-toast';

interface AgentData {
  agent_id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  current_commission_rate: number;
  total_commission: number;
  pending_commission: number;
  approved_commission: number;
  paid_commission: number;
  total_bookings: number;
  agent_since: string;
}

const AgentCommissionManagement: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [commissionRate, setCommissionRate] = useState(5.00);
  const [analytics, setAnalytics] = useState({
    totalCommissions: 0,
    totalPayouts: 0,
    pendingCommissions: 0,
    topAgents: [] as AgentData[],
    monthlyTrend: []
  });

  useEffect(() => {
    fetchAgents();
    fetchAnalytics();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await CommissionService.getAllAgentsCommissionData();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await CommissionService.getCommissionAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleUpdateCommissionRate = async () => {
    if (!selectedAgent) return;

    try {
      await CommissionService.updateAgentCommissionRate(
        selectedAgent.agent_id,
        commissionRate,
        new Date().toISOString()
      );

      toast({
        title: "Commission Rate Updated",
        description: `Commission rate updated to ${commissionRate}% for ${selectedAgent.full_name}. This will apply to all new bookings.`,
        variant: "default",
      });

      setShowCommissionModal(false);
      fetchAgents();
    } catch (error) {
      console.error('Error updating commission rate:', error);
      toast({
        title: "Error",
        description: "Failed to update commission rate",
        variant: "destructive",
      });
    }
  };

  const handleCreatePayout = async () => {
    if (!selectedAgent) return;

    try {
      await CommissionService.createPayout(
        selectedAgent.agent_id,
        selectedAgent.pending_commission,
        1, // commission count
        new Date().toISOString(),
        'bank_transfer',
        undefined,
        'Monthly commission payout'
      );

      toast({
        title: "Payout Created",
        description: `Payout of ₹${selectedAgent.pending_commission.toFixed(2)} created for ${selectedAgent.full_name}`,
        variant: "default",
      });

      setShowPayoutModal(false);
      fetchAgents();
    } catch (error) {
      console.error('Error creating payout:', error);
      toast({
        title: "Error",
        description: "Failed to create payout",
        variant: "destructive",
      });
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && agent.is_active) ||
                         (statusFilter === 'inactive' && !agent.is_active);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{analytics.totalCommissions.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{analytics.totalPayouts.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹{analytics.pendingCommissions.toFixed(2)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-purple-600">
                  {agents.filter(a => a.is_active).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Commission Management</CardTitle>
              <CardDescription>
                Manage agent commission rates and track earnings
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agents List */}
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <div key={agent.agent_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {agent.full_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{agent.full_name}</h4>
                      <p className="text-sm text-gray-600">{agent.email}</p>
                      <p className="text-sm text-gray-600">{agent.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Commission Rate</p>
                      <p className="font-semibold">{agent.current_commission_rate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Commission</p>
                      <p className="font-semibold text-green-600">
                        ₹{agent.total_commission.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="font-semibold text-yellow-600">
                        ₹{agent.pending_commission.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Bookings</p>
                      <p className="font-semibold">{agent.total_bookings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(agent.is_active)}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setCommissionRate(agent.current_commission_rate);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Commission
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Commission Rate</DialogTitle>
                            <DialogDescription>
                              Set commission rate for {agent.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="rate">Commission Rate (%)</Label>
                              <Input
                                id="rate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={commissionRate}
                                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setShowCommissionModal(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateCommissionRate}>
                                Update Rate
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {agent.pending_commission > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedAgent(agent)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Payout
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Payout</DialogTitle>
                              <DialogDescription>
                                Create payout for {agent.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">Pending Commission</p>
                                <p className="text-2xl font-bold text-green-600">
                                  ₹{agent.pending_commission.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowPayoutModal(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleCreatePayout}>
                                  Create Payout
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAgents.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No agents found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentCommissionManagement;
