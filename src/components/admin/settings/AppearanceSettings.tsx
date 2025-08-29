
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Textarea } from '@/components/admin/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Upload, Palette, Mail, Image, Eye } from 'lucide-react';

interface BrandingConfig {
  app_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  theme: string;
}

interface EmailTemplateConfig {
  header_logo: string;
  header_color: string;
  footer_text: string;
  footer_color: string;
  button_color: string;
  link_color: string;
}

const defaultBranding: BrandingConfig = {
  app_name: 'Picnify Admin',
  logo_url: '',
  favicon_url: '',
  primary_color: '#2563eb',
  secondary_color: '#64748b',
  accent_color: '#0f172a',
  theme: 'light'
};

const defaultEmailTemplate: EmailTemplateConfig = {
  header_logo: '',
  header_color: '#2563eb',
  footer_text: '© 2024 Picnify. All rights reserved.',
  footer_color: '#64748b',
  button_color: '#2563eb',
  link_color: '#2563eb'
};

export const AppearanceSettings: React.FC = () => {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplateConfig>(defaultEmailTemplate);
  const [logoFile, setLogoFile] = useState<File | null>(null);  
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load branding settings
      const { data: brandingSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'branding');

      if (brandingSettings) {
        const config = { ...defaultBranding };
        brandingSettings.forEach(setting => {
          if (setting.key in config) {
            (config as any)[setting.key] = setting.value;
          }
        });
        setBranding(config);
      }

      // Load email template settings
      const { data: emailSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'email_templates');

      if (emailSettings) {
        const config = { ...defaultEmailTemplate };
        emailSettings.forEach(setting => {
          if (setting.key in config) {
            (config as any)[setting.key] = setting.value;
          }
        });
        setEmailTemplate(config);
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
      toast.error('Failed to load appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('admin-assets')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('admin-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    try {
      setUploading(true);
      const logoUrl = await uploadFile(logoFile, 'logos');
      setBranding({ ...branding, logo_url: logoUrl });
      setLogoFile(null);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) return;

    try {
      setUploading(true);
      const faviconUrl = await uploadFile(faviconFile, 'favicons');
      setBranding({ ...branding, favicon_url: faviconUrl });
      setFaviconFile(null);
      toast.success('Favicon uploaded successfully');
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast.error('Failed to upload favicon');
    } finally {
      setUploading(false);
    }
  };

  const saveBrandingSettings = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.entries(branding).map(([key, value]) => ({
        key,
        category: 'branding',
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
        details: { category: 'branding', updated_keys: Object.keys(branding) }
      });

      toast.success('Branding settings saved');
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const saveEmailTemplateSettings = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.entries(emailTemplate).map(([key, value]) => ({
        key,
        category: 'email_templates',
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
        details: { category: 'email_templates', updated_keys: Object.keys(emailTemplate) }
      });

      toast.success('Email template settings saved');
    } catch (error) {
      console.error('Error saving email template settings:', error);
      toast.error('Failed to save email template settings');
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
      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Branding & Logo
          </CardTitle>
          <CardDescription>
            Customize your application's visual identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={branding.app_name}
                onChange={(e) => setBranding({ ...branding, app_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={branding.theme} onValueChange={(value) => setBranding({ ...branding, theme: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="logo_upload">Logo Upload</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="logo_upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleLogoUpload} disabled={!logoFile || uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
              {branding.logo_url && (
                <div className="w-16 h-16 border rounded flex items-center justify-center">
                  <img src={branding.logo_url} alt="Logo" className="max-w-full max-h-full" />
                </div>
              )}
            </div>

            {/* Favicon Upload */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="favicon_upload">Favicon Upload</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="favicon_upload"
                    type="file"
                    accept="image/x-icon,image/png"
                    onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleFaviconUpload} disabled={!faviconFile || uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
              {branding.favicon_url && (
                <div className="w-8 h-8 border rounded flex items-center justify-center">
                  <img src={branding.favicon_url} alt="Favicon" className="max-w-full max-h-full" />
                </div>
              )}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  placeholder="#64748b"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={branding.accent_color}
                  onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.accent_color}
                  onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                  placeholder="#0f172a"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveBrandingSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Customize the appearance of system emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Image className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              These settings control the styling of all system-generated emails including notifications, confirmations, and reports.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="header_logo">Header Logo URL</Label>
              <Input
                id="header_logo"
                value={emailTemplate.header_logo}
                onChange={(e) => setEmailTemplate({ ...emailTemplate, header_logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="header_color">Header Background Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={emailTemplate.header_color}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, header_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={emailTemplate.header_color}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, header_color: e.target.value })}
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="button_color">Button Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={emailTemplate.button_color}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, button_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={emailTemplate.button_color}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, button_color: e.target.value })}
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_color">Link Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={emailTemplate.link_color}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, link_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={emailTemplate.link_color}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, link_color: e.target.value })}
                  placeholder="#2563eb"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_text">Footer Text</Label>
            <Textarea
              id="footer_text"
              value={emailTemplate.footer_text}
              onChange={(e) => setEmailTemplate({ ...emailTemplate, footer_text: e.target.value })}
              placeholder="© 2024 Your Company. All rights reserved."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_color">Footer Text Color</Label>
            <div className="flex space-x-2">
              <Input
                type="color"
                value={emailTemplate.footer_color}
                onChange={(e) => setEmailTemplate({ ...emailTemplate, footer_color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={emailTemplate.footer_color}
                onChange={(e) => setEmailTemplate({ ...emailTemplate, footer_color: e.target.value })}
                placeholder="#64748b"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview Template
            </Button>
            <Button onClick={saveEmailTemplateSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Template Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
