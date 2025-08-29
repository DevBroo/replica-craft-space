import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Badge } from '@/components/admin/ui/badge';
import { toast } from 'sonner';
import { 
  Search, 
  Download, 
  Shield, 
  AlertTriangle, 
  Clock, 
  User, 
  Globe,
  Eye,
  UserPlus,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  created_at: string;
  user_email?: string;
}

export const SecurityAuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTimeframe, setFilterTimeframe] = useState('7d');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [filterTimeframe]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // Calculate date range based on filter
      const now = new Date();
      const daysBack = filterTimeframe === '24h' ? 1 : 
                      filterTimeframe === '7d' ? 7 : 
                      filterTimeframe === '30d' ? 30 : 90;
      
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Load audit logs without profile join for now
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Load user profiles separately
      const userIds = [...new Set(data.map(d => d.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const logsWithUserInfo = data.map(log => ({
        ...log,
        risk_level: (log.risk_level as 'low' | 'medium' | 'high' | 'critical') || 'low',
        user_email: profilesMap.get(log.user_id!)?.email || 'System',
        details: log.details || {}
      }));

      setAuditLogs(logsWithUserInfo);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'login_success':
      case 'login_failed':
        return <User className="h-4 w-4" />;
      case 'password_change':
        return <Lock className="h-4 w-4" />;
      case 'profile_update':
        return <Settings className="h-4 w-4" />;
      case 'view_profile':
        return <Eye className="h-4 w-4" />;
      case 'create_user':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportLogs = () => {
    try {
      const csvData = filteredLogs.map(log => ({
        timestamp: log.created_at,
        action: log.action,
        user: log.user_email,
        ip_address: log.ip_address || 'N/A',
        risk_level: log.risk_level || 'low',
        details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details
      }));

      const csv = [
        'Timestamp,Action,User,IP Address,Risk Level,Details',
        ...csvData.map(row => 
          `"${row.timestamp}","${row.action}","${row.user}","${row.ip_address}","${row.risk_level}","${row.details}"`
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Security Audit Logs
        </CardTitle>
        <CardDescription>
          Monitor system-wide security events, user activities, and potential threats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search logs by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login Success</SelectItem>
                <SelectItem value="login_failed">Failed Login</SelectItem>
                <SelectItem value="password_change">Password Change</SelectItem>
                <SelectItem value="profile_update">Profile Update</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportLogs} variant="outline" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {!loading && (
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mr-2" />
                  <span>No audit logs found for the selected criteria</span>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium capitalize">
                            {log.action.replace('_', ' ')}
                          </span>
                          <Badge variant={getRiskBadgeColor(log.risk_level || 'low')} className="text-xs">
                            {log.risk_level || 'low'} risk
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{log.user_email}</span>
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center space-x-1">
                                <Globe className="h-3 w-3" />
                                <span>{log.ip_address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500">
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                        </p>
                        
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(log.created_at)}</span>
                          {log.user_agent && <span>• {log.user_agent}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredLogs.filter(l => l.action.includes('login') && !l.action.includes('failed')).length}
              </div>
              <div className="text-sm text-gray-500">Successful Logins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredLogs.filter(l => l.action.includes('failed')).length}
              </div>
              <div className="text-sm text-gray-500">Failed Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredLogs.filter(l => l.action.includes('change') || l.action.includes('update')).length}
              </div>
              <div className="text-sm text-gray-500">Settings Changes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredLogs.filter(l => l.risk_level === 'high' || l.risk_level === 'critical').length}
              </div>
              <div className="text-sm text-gray-500">High Risk Events</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};