import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Shield, Key, Lock, Users, Phone, FileText, AlertTriangle, Eye, Plus, Trash2, UserCheck, Monitor, Globe } from 'lucide-react';

// Import the new components
import { DeviceManagement } from './DeviceManagement';
import { GeoRestrictions } from './GeoRestrictions';
import { MFAManagement } from './MFAManagement';
import { SecurityAuditLogs } from './SecurityAuditLogs';

interface SecurityConfig {
  // Basic Security
  two_factor_enabled: boolean;
  session_timeout: number;
  password_min_length: number;
  require_special_chars: boolean;
  max_login_attempts: number;
  lockout_duration: number;
  ip_whitelist_enabled: boolean;
  
  // User Management
  default_user_role: string;
  auto_activate_users: boolean;
  require_email_verification: boolean;
  allow_self_registration: boolean;
  
  // Password Policies
  force_password_expiry: boolean;
  password_expiry_days: number;
  prevent_password_reuse: boolean;
  password_history_count: number;
  
  // Two-Factor Authentication Methods
  allow_sms_2fa: boolean;
  allow_authenticator_2fa: boolean;
  allow_email_2fa: boolean;
  
  // Security Alerts
  failed_login_alerts: boolean;
  suspicious_activity_alerts: boolean;
  geo_blocking_enabled: boolean;
}

const defaultConfig: SecurityConfig = {
  two_factor_enabled: false,
  session_timeout: 24,
  password_min_length: 8,
  require_special_chars: true,
  max_login_attempts: 5,
  lockout_duration: 30,
  ip_whitelist_enabled: false,
  default_user_role: 'user',
  auto_activate_users: true,
  require_email_verification: true,
  allow_self_registration: true,
  force_password_expiry: false,
  password_expiry_days: 90,
  prevent_password_reuse: true,
  password_history_count: 5,
  allow_sms_2fa: true,
  allow_authenticator_2fa: true,
  allow_email_2fa: true,
  failed_login_alerts: true,
  suspicious_activity_alerts: true,
  geo_blocking_enabled: false
};

interface IPWhitelistEntry {
  id: string;
  cidr: string;
  description: string;
  is_active: boolean;
}

export const SecuritySettings: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // IP Whitelist
  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelistEntry[]>([]);
  const [newIpEntry, setNewIpEntry] = useState({ cidr: '', description: '' });

  useEffect(() => {
    loadSettings();
    loadIPWhitelist();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data: securitySettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'security');

      if (securitySettings) {
        const loadedConfig = { ...defaultConfig };
        securitySettings.forEach(setting => {
          if (setting.key in loadedConfig) {
            (loadedConfig as any)[setting.key] = setting.value;
          }
        });
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const loadIPWhitelist = async () => {
    try {
      const { data: whitelist } = await supabase
        .from('admin_ip_whitelist')
        .select('*')
        .order('created_at', { ascending: false });

      if (whitelist) {
        setIpWhitelist(whitelist.map(item => ({
          id: item.id,
          cidr: item.cidr,
          description: item.description || '',
          is_active: item.is_active
        })));
      }
    } catch (error) {
      console.error('Error loading IP whitelist:', error);
    }
  };

  const saveSettings = async () => {
    try {
      console.log('Saving security settings...', config);
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const upsertData = Object.entries(config).map(([key, value]) => ({
        key,
        category: 'security',
        value: value,
        updated_by: userId
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }

      console.log('Security settings saved successfully');
      toast.success('Security settings saved');
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addIPWhitelistEntry = async () => {
    if (!newIpEntry.cidr || !newIpEntry.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .insert({
          cidr: newIpEntry.cidr,
          description: newIpEntry.description
        });

      if (error) throw error;

      toast.success('IP whitelist entry added');
      setNewIpEntry({ cidr: '', description: '' });
      loadIPWhitelist();
    } catch (error) {
      console.error('Error adding IP whitelist entry:', error);
      toast.error('Failed to add IP whitelist entry');
    }
  };

  const toggleIPWhitelistEntry = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`IP whitelist entry ${isActive ? 'activated' : 'deactivated'}`);
      loadIPWhitelist();
    } catch (error) {
      console.error('Error updating IP whitelist entry:', error);
      toast.error('Failed to update IP whitelist entry');
    }
  };

  const deleteIPWhitelistEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('IP whitelist entry deleted');
      loadIPWhitelist();
    } catch (error) {
      console.error('Error deleting IP whitelist entry:', error);
      toast.error('Failed to delete IP whitelist entry');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="passwords">Passwords</TabsTrigger>
          <TabsTrigger value="2fa">2FA Management</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="geo">Geographic</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* General Security Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Authentication & Access
              </CardTitle>
              <CardDescription>
                Configure basic authentication and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (hours)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={config.session_timeout}
                    onChange={(e) => setConfig({ ...config, session_timeout: parseInt(e.target.value) || 24 })}
                    min="1"
                    max="168"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    value={config.max_login_attempts}
                    onChange={(e) => setConfig({ ...config, max_login_attempts: parseInt(e.target.value) || 5 })}
                    min="3"
                    max="20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockout_duration">Account Lockout (minutes)</Label>
                  <Input
                    id="lockout_duration"
                    type="number"
                    value={config.lockout_duration}
                    onChange={(e) => setConfig({ ...config, lockout_duration: parseInt(e.target.value) || 30 })}
                    min="5"
                    max="1440"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_role">Default User Role</Label>
                  <Select 
                    value={config.default_user_role} 
                    onValueChange={(value) => setConfig({ ...config, default_user_role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="owner">Host</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-activate Users</Label>
                    <p className="text-sm text-gray-500">Automatically activate new user accounts</p>
                  </div>
                  <Switch
                    checked={config.auto_activate_users}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_activate_users: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-gray-500">Users must verify email before activation</p>
                  </div>
                  <Switch
                    checked={config.require_email_verification}
                    onCheckedChange={(checked) => setConfig({ ...config, require_email_verification: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Self Registration</Label>
                    <p className="text-sm text-gray-500">Users can create their own accounts</p>
                  </div>
                  <Switch
                    checked={config.allow_self_registration}
                    onCheckedChange={(checked) => setConfig({ ...config, allow_self_registration: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Failed Login Alerts</Label>
                    <p className="text-sm text-gray-500">Send alerts for failed login attempts</p>
                  </div>
                  <Switch
                    checked={config.failed_login_alerts}
                    onCheckedChange={(checked) => setConfig({ ...config, failed_login_alerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Suspicious Activity Alerts</Label>
                    <p className="text-sm text-gray-500">Monitor and alert on suspicious behavior</p>
                  </div>
                  <Switch
                    checked={config.suspicious_activity_alerts}
                    onCheckedChange={(checked) => setConfig({ ...config, suspicious_activity_alerts: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Policies */}
        <TabsContent value="passwords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Password Policies
              </CardTitle>
              <CardDescription>
                Configure password requirements and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_length">Minimum Password Length</Label>
                  <Select 
                    value={config.password_min_length.toString()} 
                    onValueChange={(value) => setConfig({ ...config, password_min_length: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 characters</SelectItem>
                      <SelectItem value="8">8 characters</SelectItem>
                      <SelectItem value="10">10 characters</SelectItem>
                      <SelectItem value="12">12 characters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_days">Password Expiry (days)</Label>
                  <Input
                    id="expiry_days"
                    type="number"
                    value={config.password_expiry_days}
                    onChange={(e) => setConfig({ ...config, password_expiry_days: parseInt(e.target.value) || 90 })}
                    min="30"
                    max="365"
                    disabled={!config.force_password_expiry}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="history_count">Password History Count</Label>
                  <Input
                    id="history_count"
                    type="number"
                    value={config.password_history_count}
                    onChange={(e) => setConfig({ ...config, password_history_count: parseInt(e.target.value) || 5 })}
                    min="3"
                    max="10"
                    disabled={!config.prevent_password_reuse}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Special Characters</Label>
                    <p className="text-sm text-gray-500">Passwords must contain symbols (!@#$%^&*)</p>
                  </div>
                  <Switch
                    checked={config.require_special_chars}
                    onCheckedChange={(checked) => setConfig({ ...config, require_special_chars: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Force Password Expiry</Label>
                    <p className="text-sm text-gray-500">Require users to change passwords regularly</p>
                  </div>
                  <Switch
                    checked={config.force_password_expiry}
                    onCheckedChange={(checked) => setConfig({ ...config, force_password_expiry: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prevent Password Reuse</Label>
                    <p className="text-sm text-gray-500">Users cannot reuse recent passwords</p>
                  </div>
                  <Switch
                    checked={config.prevent_password_reuse}
                    onCheckedChange={(checked) => setConfig({ ...config, prevent_password_reuse: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA Management - New Enhanced Component */}
        <TabsContent value="2fa">
          <MFAManagement />
        </TabsContent>

        {/* Device Management - New Component */}
        <TabsContent value="devices">
          <DeviceManagement />
        </TabsContent>

        {/* Network Security */}
        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Network Security & IP Management
              </CardTitle>
              <CardDescription>
                Configure IP restrictions and network access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Address Whitelist</Label>
                  <p className="text-sm text-gray-500">Restrict admin access to specific IP addresses</p>
                </div>
                <Switch
                  checked={config.ip_whitelist_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, ip_whitelist_enabled: checked })}
                />
              </div>

              {config.ip_whitelist_enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">IP Whitelist Entries</h4>
                    <Button
                      onClick={addIPWhitelistEntry}
                      size="sm"
                      disabled={!newIpEntry.cidr || !newIpEntry.description}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="IP Address or CIDR (e.g., 192.168.1.0/24)"
                      value={newIpEntry.cidr}
                      onChange={(e) => setNewIpEntry({ ...newIpEntry, cidr: e.target.value })}
                    />
                    <Input
                      placeholder="Description"
                      value={newIpEntry.description}
                      onChange={(e) => setNewIpEntry({ ...newIpEntry, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    {ipWhitelist.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium">{entry.cidr}</div>
                          <div className="text-sm text-gray-500">{entry.description}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={entry.is_active}
                            onCheckedChange={(checked) => toggleIPWhitelistEntry(entry.id, checked)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteIPWhitelistEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Restrictions - New Component */}
        <TabsContent value="geo">
          <GeoRestrictions />
        </TabsContent>

        {/* Security Audit Logs - New Component */}
        <TabsContent value="audit">
          <SecurityAuditLogs />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} type="button">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </div>
    </div>
  );
};
