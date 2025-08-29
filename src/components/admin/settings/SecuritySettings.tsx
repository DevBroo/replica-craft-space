
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Shield, Key, Lock } from 'lucide-react';

interface SecurityConfig {
  two_factor_enabled: boolean;
  session_timeout: number;
  password_min_length: number;
  require_special_chars: boolean;
  max_login_attempts: number;
  lockout_duration: number;
  ip_whitelist_enabled: boolean;
}

const defaultConfig: SecurityConfig = {
  two_factor_enabled: false,
  session_timeout: 24,
  password_min_length: 8,
  require_special_chars: true,
  max_login_attempts: 5,
  lockout_duration: 30,
  ip_whitelist_enabled: false
};

export const SecuritySettings: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
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

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.entries(config).map(([key, value]) => ({
        key,
        category: 'security',
        value: value,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Security settings saved');
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Authentication & Access
          </CardTitle>
          <CardDescription>
            Configure user authentication and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
            </div>
            <Switch
              checked={config.two_factor_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, two_factor_enabled: checked })}
            />
          </div>

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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Set password requirements and complexity rules
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
          </div>

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Network Security
          </CardTitle>
          <CardDescription>
            Configure IP restrictions and network access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Security Settings
        </Button>
      </div>
    </div>
  );
};
