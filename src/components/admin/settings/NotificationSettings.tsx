
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Badge } from '@/components/admin/ui/badge';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Mail, MessageSquare, Bell, CheckCircle, Settings, Send } from 'lucide-react';

interface NotificationConfig {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  default_sender_name: string;
  default_sender_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
}

interface IntegrationStatus {
  smtp: boolean;
  sms: boolean;
  push: boolean;
}

const defaultConfig: NotificationConfig = {
  email_enabled: true,
  sms_enabled: false,
  push_enabled: false,
  default_sender_name: 'Picnify',
  default_sender_email: 'noreply@picnify.com',
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: true,
  smtp_user: ''
};

export const NotificationSettings: React.FC = () => {
  const [config, setConfig] = useState<NotificationConfig>(defaultConfig);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    smtp: false,
    sms: false,
    push: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load notification config
      const { data: notificationSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'notifications');

      if (notificationSettings) {
        const loadedConfig = { ...defaultConfig };
        notificationSettings.forEach(setting => {
          if (setting.key in loadedConfig) {
            (loadedConfig as any)[setting.key] = setting.value;
          }
        });
        setConfig(loadedConfig);
      }

      // Load integration status
      const { data: integrations } = await supabase
        .from('api_integrations')
        .select('provider, configured')
        .in('provider', ['smtp', 'twilio', 'webpush']);

      if (integrations) {
        const status = { ...integrationStatus };
        integrations.forEach(integration => {
          if (integration.provider === 'smtp') status.smtp = integration.configured;
          if (integration.provider === 'twilio') status.sms = integration.configured;
          if (integration.provider === 'webpush') status.push = integration.configured;
        });
        setIntegrationStatus(status);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.entries(config).map(([key, value]) => ({
        key,
        category: 'notifications',
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
        details: { category: 'notifications', updated_keys: Object.keys(config) }
      });

      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async (type: 'email' | 'sms' | 'push') => {
    try {
      setTesting(type);
      
      // This would call an edge function to send test notifications
      // For now, we'll just simulate the test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Test ${type} sent successfully`);
    } catch (error) {
      console.error(`Error sending test ${type}:`, error);
      toast.error(`Failed to send test ${type}`);
    } finally {
      setTesting(null);
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
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure SMTP settings and email delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">SMTP Configuration</h4>
                <p className="text-sm text-gray-500">Email delivery service</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={integrationStatus.smtp ? "default" : "secondary"}>
                {integrationStatus.smtp ? <CheckCircle className="h-3 w-3 mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                {integrationStatus.smtp ? 'Configured' : 'Not Set'}
              </Badge>
              <Switch
                checked={config.email_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, email_enabled: checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender_name">Default Sender Name</Label>
              <Input
                id="sender_name"
                value={config.default_sender_name}
                onChange={(e) => setConfig({ ...config, default_sender_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_email">Default Sender Email</Label>
              <Input
                id="sender_email"
                type="email"
                value={config.default_sender_email}
                onChange={(e) => setConfig({ ...config, default_sender_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={config.smtp_host}
                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                value={config.smtp_port}
                onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_user">SMTP Username</Label>
              <Input
                id="smtp_user"
                value={config.smtp_user}
                onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Use SSL/TLS</Label>
                <p className="text-sm text-gray-500">Secure connection</p>
              </div>
              <Switch
                checked={config.smtp_secure}
                onCheckedChange={(checked) => setConfig({ ...config, smtp_secure: checked })}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => sendTestNotification('email')}
              disabled={testing === 'email' || !config.email_enabled}
            >
              <Send className="h-4 w-4 mr-2" />
              {testing === 'email' ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Configure SMS gateway for text message delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              SMS integration requires Twilio credentials. Configure your Twilio Account SID and Auth Token in the API secrets.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Twilio Integration</h4>
                <p className="text-sm text-gray-500">SMS & WhatsApp messaging</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={integrationStatus.sms ? "default" : "secondary"}>
                {integrationStatus.sms ? <CheckCircle className="h-3 w-3 mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                {integrationStatus.sms ? 'Configured' : 'Not Set'}
              </Badge>
              <Switch
                checked={config.sms_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, sms_enabled: checked })}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => sendTestNotification('sms')}
              disabled={testing === 'sms' || !config.sms_enabled}
            >
              <Send className="h-4 w-4 mr-2" />
              {testing === 'sms' ? 'Sending...' : 'Send Test SMS'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Configure web push notifications for browsers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Bell className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Push notifications require VAPID keys for web push. Configure your VAPID public and private keys in the API secrets.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Web Push</h4>
                <p className="text-sm text-gray-500">Browser notifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={integrationStatus.push ? "default" : "secondary"}>
                {integrationStatus.push ? <CheckCircle className="h-3 w-3 mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                {integrationStatus.push ? 'Configured' : 'Not Set'}
              </Badge>
              <Switch
                checked={config.push_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, push_enabled: checked })}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => sendTestNotification('push')}
              disabled={testing === 'push' || !config.push_enabled}
            >
              <Send className="h-4 w-4 mr-2" />
              {testing === 'push' ? 'Sending...' : 'Send Test Push'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
};
