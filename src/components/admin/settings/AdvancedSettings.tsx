import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Database, Code, AlertTriangle, Server } from 'lucide-react';

interface AdvancedConfig {
  api_rate_limit: number;
  cache_duration: number;
  log_level: 'error' | 'warn' | 'info' | 'debug';
  enable_analytics: boolean;
  enable_error_tracking: boolean;
  max_file_size: number;
  allowed_file_types: string;
  cdn_enabled: boolean;
  compression_enabled: boolean;
}

const defaultConfig: AdvancedConfig = {
  api_rate_limit: 1000,
  cache_duration: 300,
  log_level: 'info',
  enable_analytics: true,
  enable_error_tracking: true,
  max_file_size: 10,
  allowed_file_types: 'jpg,jpeg,png,gif,pdf,doc,docx',
  cdn_enabled: false,
  compression_enabled: true
};

export const AdvancedSettings: React.FC = () => {
  const [config, setConfig] = useState<AdvancedConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data: advancedSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'advanced');

      if (advancedSettings) {
        const loadedConfig = { ...defaultConfig };
        advancedSettings.forEach(setting => {
          if (setting.key in loadedConfig) {
            (loadedConfig as any)[setting.key] = setting.value;
          }
        });
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error('Error loading advanced settings:', error);
      toast.error('Failed to load advanced settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const upsertData = Object.entries(config).map(([key, value]) => ({
        key,
        category: 'advanced',
        value: value,
        updated_by: userId
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Advanced settings saved');
    } catch (error) {
      console.error('Error saving advanced settings:', error);
      toast.error('Failed to save advanced settings');
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
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Advanced settings can significantly impact system performance and security. Only modify these settings if you understand their implications.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Performance & Caching
          </CardTitle>
          <CardDescription>
            Configure system performance and caching settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_rate_limit">API Rate Limit (requests/hour)</Label>
              <Input
                id="api_rate_limit"
                type="number"
                value={config.api_rate_limit}
                onChange={(e) => setConfig({ ...config, api_rate_limit: parseInt(e.target.value) || 1000 })}
                min="100"
                max="10000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cache_duration">Cache Duration (seconds)</Label>
              <Input
                id="cache_duration"
                type="number"
                value={config.cache_duration}
                onChange={(e) => setConfig({ ...config, cache_duration: parseInt(e.target.value) || 300 })}
                min="60"
                max="3600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Compression</Label>
              <p className="text-sm text-gray-500">Compress API responses for faster loading</p>
            </div>
            <Switch
              checked={config.compression_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, compression_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>CDN Integration</Label>
              <p className="text-sm text-gray-500">Use CDN for static asset delivery</p>
            </div>
            <Switch
              checked={config.cdn_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, cdn_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Logging & Debugging
          </CardTitle>
          <CardDescription>
            Configure system logging and debugging options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log_level">Log Level</Label>
              <Select 
                value={config.log_level} 
                onValueChange={(value: 'error' | 'warn' | 'info' | 'debug') => setConfig({ ...config, log_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Analytics</Label>
              <p className="text-sm text-gray-500">Collect usage analytics and metrics</p>
            </div>
            <Switch
              checked={config.enable_analytics}
              onCheckedChange={(checked) => setConfig({ ...config, enable_analytics: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Error Tracking</Label>
              <p className="text-sm text-gray-500">Automatically track and report errors</p>
            </div>
            <Switch
              checked={config.enable_error_tracking}
              onCheckedChange={(checked) => setConfig({ ...config, enable_error_tracking: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            File Management
          </CardTitle>
          <CardDescription>
            Configure file upload and storage settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_file_size">Max File Size (MB)</Label>
              <Input
                id="max_file_size"
                type="number"
                value={config.max_file_size}
                onChange={(e) => setConfig({ ...config, max_file_size: parseInt(e.target.value) || 10 })}
                min="1"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_types">Allowed File Types</Label>
              <Input
                id="allowed_types"
                value={config.allowed_file_types}
                onChange={(e) => setConfig({ ...config, allowed_file_types: e.target.value })}
                placeholder="jpg,png,pdf,doc"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Advanced Settings
        </Button>
      </div>
    </div>
  );
};
