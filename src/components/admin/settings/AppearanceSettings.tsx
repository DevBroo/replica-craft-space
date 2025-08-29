
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Switch } from '@/components/admin/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Palette, Eye, Monitor } from 'lucide-react';

interface AppearanceConfig {
  theme: 'light' | 'dark' | 'system';
  primary_color: string;
  secondary_color: string;
  sidebar_style: 'compact' | 'expanded';
  show_breadcrumbs: boolean;
  compact_tables: boolean;
  logo_url: string;
  favicon_url: string;
}

const defaultConfig: AppearanceConfig = {
  theme: 'system',
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  sidebar_style: 'expanded',
  show_breadcrumbs: true,
  compact_tables: false,
  logo_url: '',
  favicon_url: ''
};

export const AppearanceSettings: React.FC = () => {
  const [config, setConfig] = useState<AppearanceConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data: appearanceSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'appearance');

      if (appearanceSettings) {
        const loadedConfig = { ...defaultConfig };
        appearanceSettings.forEach(setting => {
          if (setting.key in loadedConfig) {
            (loadedConfig as any)[setting.key] = setting.value;
          }
        });
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
      toast.error('Failed to load appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.entries(config).map(([key, value]) => ({
        key,
        category: 'appearance',
        value: value,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Appearance settings saved');
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast.error('Failed to save appearance settings');
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
            <Palette className="h-5 w-5 mr-2" />
            Theme & Colors
          </CardTitle>
          <CardDescription>
            Customize the visual appearance and color scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme Mode</Label>
              <Select 
                value={config.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => setConfig({ ...config, theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={config.primary_color}
                  onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={config.secondary_color}
                  onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={config.secondary_color}
                  onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Layout & Display
          </CardTitle>
          <CardDescription>
            Configure layout preferences and display options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sidebar_style">Sidebar Style</Label>
              <Select 
                value={config.sidebar_style} 
                onValueChange={(value: 'compact' | 'expanded') => setConfig({ ...config, sidebar_style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="expanded">Expanded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Breadcrumbs</Label>
              <p className="text-sm text-gray-500">Display navigation breadcrumbs</p>
            </div>
            <Switch
              checked={config.show_breadcrumbs}
              onCheckedChange={(checked) => setConfig({ ...config, show_breadcrumbs: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact Tables</Label>
              <p className="text-sm text-gray-500">Use smaller row height in tables</p>
            </div>
            <Switch
              checked={config.compact_tables}
              onCheckedChange={(checked) => setConfig({ ...config, compact_tables: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Branding
          </CardTitle>
          <CardDescription>
            Upload custom logos and branding assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={config.logo_url}
                onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <Input
                id="favicon_url"
                value={config.favicon_url}
                onChange={(e) => setConfig({ ...config, favicon_url: e.target.value })}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Appearance Settings
        </Button>
      </div>
    </div>
  );
};
