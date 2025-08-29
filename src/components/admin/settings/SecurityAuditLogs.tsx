
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Badge } from '@/components/admin/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { toast } from 'sonner';
import { Shield, Search, Download, Filter, AlertTriangle, User, Settings, Lock } from 'lucide-react';

export const SecurityAuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTimeframe, setFilterTimeframe] = useState('7d');

  // Sample audit log data
  const [auditLogs] = useState([
    {
      id: '1',
      timestamp: new Date().toISOString(),
      action: 'login_success',
      actor: 'admin@picnify.com',
      ip_address: '192.168.1.100',
      user_agent: 'Chrome 119.0.0.0',
      details: 'Admin login from trusted location',
      risk_level: 'low'
    },
    {
      id: '2', 
      timestamp: new Date(Date.now() - 300000).toISOString(),
      action: 'password_change',
      actor: 'user@example.com',
      ip_address: '203.0.113.45',
      user_agent: 'Firefox 118.0.1',
      details: 'Password changed successfully',
      risk_level: 'medium'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      action: 'failed_login',
      actor: 'unknown@example.com',
      ip_address: '198.51.100.23',
      user_agent: 'curl/7.68.0',
      details: 'Multiple failed login attempts detected',
      risk_level: 'high'
    }
  ]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login_success':
      case 'login_failed':
        return <User className="h-4 w-4" />;
      case 'password_change':
        return <Lock className="h-4 w-4" />;
      case 'settings_change':
        return <Settings className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
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
    toast.info('Audit log export functionality will be available once the database types are updated');
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Security audit logs are being configured. Currently showing sample data for interface testing.
          </span>
        </div>

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
              <SelectItem value="login_success">Login Success</SelectItem>
              <SelectItem value="failed_login">Failed Login</SelectItem>
              <SelectItem value="password_change">Password Change</SelectItem>
              <SelectItem value="settings_change">Settings Change</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportLogs} variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Audit Log Entries */}
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs match the current filters
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium capitalize">
                          {log.action.replace('_', ' ')}
                        </span>
                        <Badge variant={getRiskBadgeColor(log.risk_level)} className="text-xs">
                          {log.risk_level.toUpperCase()} RISK
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        <div>User: <span className="font-mono">{log.actor}</span></div>
                        <div>IP: <span className="font-mono">{log.ip_address}</span></div>
                        <div>Details: {log.details}</div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        {formatTimestamp(log.timestamp)} • {log.user_agent}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">234</div>
            <div className="text-sm text-gray-500">Successful Logins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">12</div>
            <div className="text-sm text-gray-500">Failed Logins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">45</div>
            <div className="text-sm text-gray-500">Settings Changes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <div className="text-sm text-gray-500">High Risk Events</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
