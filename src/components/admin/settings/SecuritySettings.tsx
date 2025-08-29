
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Separator } from '@/components/admin/ui/separator';
import { Badge } from '@/components/admin/ui/badge';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Shield, Users, Network, Key, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface SecurityConfig {
  two_factor_required: boolean;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  password_expiry_days: number;
  session_timeout_minutes: number;
  max_login_attempts: number;
}

interface IPWhitelistEntry {
  id: string;
  cidr: string;
  description: string;
  is_active: boolean;
}

const defaultSecurityConfig: SecurityConfig = {
  two_factor_required: false,
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_symbols: false,
  password_expiry_days: 0, // 0 = never expire
  session_timeout_minutes: 480, // 8 hours
  max_login_attempts: 5
};

export const SecuritySettings: React.FC = () => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(defaultSecurityConfig);
  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelistEntry[]>([]);
  const [newIP, setNewIP] = useState({ cidr: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load security config
      const { data: securitySettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'security');

      if (securitySettings) {
        const config = { ...defaultSecurityConfig };
        securitySettings.forEach(setting => {
          if (setting.key in config) {
            (config as any)[setting.key] = setting.value;
          }
        });
        setSecurityConfig(config);
      }

      // Load IP whitelist
      const { data: ipData } = await supabase
        .from('admin_ip_whitelist')
        .select('id, cidr, description, is_active')
        .order('created_at', { ascending: false });

      if (ipData) {
        setIpWhitelist(ipData);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSecurityConfig = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.entries(securityConfig).map(([key, value]) => ({
        key,
        category: 'security',
        value: value,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;

      // Log audit
      await supabase.from('system_audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'update_setting',
        entity_type: 'app_settings',
        details: { category: 'security', updated_keys: Object.keys(securityConfig) }
      });

      toast.success('Security settings saved');
    } catch (error) {
      console.error('Error saving security config:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const addIPToWhitelist = async () => {
    if (!newIP.cidr.trim()) {
      toast.error('Please enter a valid IP address or CIDR');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .insert({
          cidr: newIP.cidr.trim(),
          description: newIP.description.trim() || 'No description',
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Log audit
      await supabase.from('system_audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'ip_whitelist_add',
        entity_type: 'admin_ip_whitelist',
        details: { cidr: newIP.cidr, description: newIP.description }
      });

      setNewIP({ cidr: '', description: '' });
      loadSettings();
      toast.success('IP address added to whitelist');
    } catch (error) {
      console.error('Error adding IP to whitelist:', error);
      toast.error('Failed to add IP to whitelist');
    }
  };

  const removeIPFromWhitelist = async (id: string, cidr: string) => {
    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log audit
      await supabase.from('system_audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'ip_whitelist_remove',
        entity_type: 'admin_ip_whitelist',
        details: { cidr }
      });

      loadSettings();
      toast.success('IP address removed from whitelist');
    } catch (error) {
      console.error('Error removing IP from whitelist:', error);
      toast.error('Failed to remove IP from whitelist');
    }
  };

  const toggleIPStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      loadSettings();
      toast.success(`IP ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling IP status:', error);
      toast.error('Failed to update IP status');
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
      {/* Authentication & Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Authentication & Access Control
          </CardTitle>
          <CardDescription>
            Configure user authentication and access policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication (2FA)</Label>
              <p className="text-sm text-gray-500">Require 2FA for all admin users</p>
            </div>
            <Switch
              checked={securityConfig.two_factor_required}
              onCheckedChange={(checked) => setSecurityConfig({ ...securityConfig, two_factor_required: checked })}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                min="30"
                max="1440"
                value={securityConfig.session_timeout_minutes}
                onChange={(e) => setSecurityConfig({ ...securityConfig, session_timeout_minutes: parseInt(e.target.value) || 480 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_attempts">Max Login Attempts</Label>
              <Input
                id="max_attempts"
                type="number"
                min="3"
                max="10"
                value={securityConfig.max_login_attempts}
                onChange={(e) => setSecurityConfig({ ...securityConfig, max_login_attempts: parseInt(e.target.value) || 5 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Password Policies
          </CardTitle>
          <CardDescription>
            Define password complexity and expiration rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_length">Minimum Length</Label>
              <Input
                id="min_length"
                type="number"
                min="6"
                max="20"
                value={securityConfig.password_min_length}
                onChange={(e) => setSecurityConfig({ ...securityConfig, password_min_length: parseInt(e.target.value) || 8 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_days">Password Expiry (days, 0 = never)</Label>
              <Input
                id="expiry_days"
                type="number"
                min="0"
                max="365"
                value={securityConfig.password_expiry_days}
                onChange={(e) => setSecurityConfig({ ...securityConfig, password_expiry_days: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Required Character Types</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Uppercase letters (A-Z)</span>
                <Switch
                  checked={securityConfig.password_require_uppercase}
                  onCheckedChange={(checked) => setSecurityConfig({ ...securityConfig, password_require_uppercase: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Lowercase letters (a-z)</span>
                <Switch
                  checked={securityConfig.password_require_lowercase}
                  onCheckedChange={(checked) => setSecurityConfig({ ...securityConfig, password_require_lowercase: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Numbers (0-9)</span>
                <Switch
                  checked={securityConfig.password_require_numbers}
                  onCheckedChange={(checked) => setSecurityConfig({ ...securityConfig, password_require_numbers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Symbols (!@#$%)</span>
                <Switch
                  checked={securityConfig.password_require_symbols}
                  onCheckedChange={(checked) => setSecurityConfig({ ...securityConfig, password_require_symbols: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelisting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="h-5 w-5 mr-2" />
            IP Whitelisting
          </CardTitle>
          <CardDescription>
            Restrict admin access to specific IP addresses or ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Be careful when adding IP restrictions. Ensure you have the correct IP address to avoid locking yourself out.
            </AlertDescription>
          </Alert>

          {/* Add New IP */}
          <div className="flex space-x-2">
            <Input
              placeholder="IP address or CIDR (e.g., 192.168.1.0/24)"
              value={newIP.cidr}
              onChange={(e) => setNewIP({ ...newIP, cidr: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newIP.description}
              onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
            />
            <Button onClick={addIPToWhitelist}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* IP List */}
          {ipWhitelist.length > 0 ? (
            <div className="space-y-2">
              {ipWhitelist.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{entry.cidr}</code>
                      <Badge variant={entry.is_active ? "default" : "secondary"}>
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{entry.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={entry.is_active}
                      onCheckedChange={() => toggleIPStatus(entry.id, entry.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeIPFromWhitelist(entry.id, entry.cidr)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No IP addresses in whitelist</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSecurityConfig} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Security Settings
        </Button>
      </div>
    </div>
  );
};
