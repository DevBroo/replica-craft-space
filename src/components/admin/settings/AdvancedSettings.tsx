
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Upload, Key, Activity, Database, FileText, Eye, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  details: any;
  created_at: string;
}

export const AdvancedSettings: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [logFilter, setLogFilter] = useState('all');

  useEffect(() => {
    loadAuditLogs();
  }, [logFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logFilter !== 'all') {
        query = query.eq('entity_type', logFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: 'settings' | 'audit' | 'all') => {
    try {
      setExporting(true);
      
      let exportData: any = {};
      
      if (type === 'settings' || type === 'all') {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('*');
        exportData.settings = settings;
      }
      
      if (type === 'audit' || type === 'all') {
        const { data: audit } = await supabase
          .from('system_audit_logs')
          .select('*')
          .order('created_at', { ascending: false });
        exportData.audit_logs = audit;
      }
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `picnify-${type}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const formatLogDetails = (details: any) => {
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'default';
    if (action.includes('update') || action.includes('save')) return 'secondary';
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Data Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export and import system data for backup and migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Data exports may contain sensitive information. Handle exported files securely and follow your organization's data protection policies.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => exportData('settings')}
              disabled={exporting}
              className="flex items-center justify-center h-20"
            >
              <div className="text-center">
                <Download className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Export Settings</div>
                <div className="text-xs text-gray-500">Configuration only</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => exportData('audit')}
              disabled={exporting}
              className="flex items-center justify-center h-20"
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Export Audit Logs</div>
                <div className="text-xs text-gray-500">Activity history</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => exportData('all')}
              disabled={exporting}
              className="flex items-center justify-center h-20"
            >
              <div className="text-center">
                <Database className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Export All</div>
                <div className="text-xs text-gray-500">Complete backup</div>
              </div>
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center space-x-4">
              <Upload className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="font-medium">Data Import</h4>
                <p className="text-sm text-gray-500">Contact support for data import assistance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Key Management
          </CardTitle>
          <CardDescription>
            View the status of configured API integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Key className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              API keys are stored securely in Supabase Vault. This section shows configuration status only.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Stripe Payment Gateway', key: 'STRIPE_SECRET_KEY', status: false },
              { name: 'Razorpay Payment Gateway', key: 'RAZORPAY_SECRET_KEY', status: false },
              { name: 'SMTP Email Service', key: 'SMTP_PASSWORD', status: false },
              { name: 'Twilio SMS Service', key: 'TWILIO_AUTH_TOKEN', status: false },
              { name: 'Web Push Notifications', key: 'VAPID_PRIVATE_KEY', status: false },
              { name: 'Google Maps API', key: 'GOOGLE_MAPS_API_KEY', status: false }
            ].map((integration) => (
              <div key={integration.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{integration.name}</h4>
                  <p className="text-sm text-gray-500">{integration.key}</p>
                </div>
                <Badge variant={integration.status ? "default" : "secondary"}>
                  {integration.status ? 'Configured' : 'Not Set'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Audit Logs
            </div>
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="app_settings">Settings Changes</SelectItem>
                <SelectItem value="admin_bank_details">Bank Details</SelectItem>
                <SelectItem value="user_roles">Role Changes</SelectItem>
                <SelectItem value="admin_ip_whitelist">IP Whitelist</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>
            Track all administrative actions and system changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse p-3 border rounded-lg">
                  <div className="flex space-x-3">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : auditLogs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getActionBadgeColor(log.action)}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      {log.entity_type && (
                        <Badge variant="outline">
                          {log.entity_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        <Eye className="h-3 w-3 inline mr-1" />
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                        {formatLogDetails(log.details)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No audit logs found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
