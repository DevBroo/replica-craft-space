
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { Input } from '@/components/admin/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, AlertTriangle, Shield, Clock, Search, Filter } from 'lucide-react';

interface LoginAttempt {
  id: string;
  user_id: string | null;
  email: string | null;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  country: string | null;
  created_at: string;
}

interface SecurityAlert {
  id: string;
  user_id: string | null;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  status: 'open' | 'resolved';
  escalated: boolean;
  metadata: any;
  created_at: string;
  resolved_at: string | null;
}

export const SecurityAuditLogs: React.FC = () => {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeRange: '24h',
    severity: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    loadAuditData();
  }, [filters]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const timeRanges = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      };
      
      const startDate = timeRanges[filters.timeRange as keyof typeof timeRanges] || timeRanges['24h'];

      // Load login attempts
      let loginQuery = supabase
        .from('login_audit')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.search) {
        loginQuery = loginQuery.or(`email.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%`);
      }

      const { data: loginData, error: loginError } = await loginQuery;
      if (loginError) throw loginError;

      // Load security alerts
      let alertsQuery = supabase
        .from('security_alerts')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters.severity !== 'all') {
        alertsQuery = alertsQuery.eq('severity', filters.severity);
      }

      if (filters.status !== 'all') {
        alertsQuery = alertsQuery.eq('status', filters.status);
      }

      if (filters.search) {
        alertsQuery = alertsQuery.ilike('message', `%${filters.search}%`);
      }

      const { data: alertsData, error: alertsError } = await alertsQuery;
      if (alertsError) throw alertsError;

      setLoginAttempts(loginData || []);
      setSecurityAlerts(alertsData || []);
    } catch (error) {
      console.error('Error loading audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert resolved');
      loadAuditData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive'
    };
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'secondary'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'resolved' ? 'secondary' : 'destructive'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Security Audit Logs
          </CardTitle>
          <CardDescription>Monitor security events and suspicious activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Security Audit Logs & Monitoring
        </CardTitle>
        <CardDescription>
          Monitor login attempts, security alerts, and suspicious activities across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-48"
            />
          </div>

          <Select
            value={filters.timeRange}
            onValueChange={(value) => setFilters({ ...filters, timeRange: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.severity}
            onValueChange={(value) => setFilters({ ...filters, severity: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="logins">Login Attempts</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {securityAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No security alerts found for the selected filters
              </div>
            ) : (
              <div className="space-y-2">
                {securityAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                          {alert.escalated && (
                            <Badge variant="outline" className="text-orange-600">
                              ESCALATED
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Type: {alert.type} • {formatTimestamp(alert.created_at)}
                          </div>
                        </div>

                        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                          <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                            <pre>{JSON.stringify(alert.metadata, null, 2)}</pre>
                          </div>
                        )}
                      </div>

                      {alert.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logins" className="space-y-4">
            {loginAttempts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No login attempts found for the selected filters
              </div>
            ) : (
              <div className="space-y-2">
                {loginAttempts.map((attempt) => (
                  <div key={attempt.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          {attempt.success ? (
                            <Shield className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={attempt.success ? 'default' : 'destructive'}>
                              {attempt.success ? 'SUCCESS' : 'FAILED'}
                            </Badge>
                            <span className="font-medium">
                              {attempt.email || 'Unknown User'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-500 mt-1">
                            IP: {attempt.ip_address || 'Unknown'} • 
                            Country: {attempt.country || 'Unknown'} • 
                            {formatTimestamp(attempt.created_at)}
                          </div>
                          
                          {attempt.failure_reason && (
                            <div className="text-xs text-red-600 mt-1">
                              Reason: {attempt.failure_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
