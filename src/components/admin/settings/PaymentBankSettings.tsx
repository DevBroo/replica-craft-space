import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, CreditCard, Building2, AlertTriangle } from 'lucide-react';

interface PaymentBankConfig {
  stripe_enabled: boolean;
  razorpay_enabled: boolean;
  phonepe_enabled: boolean;
  phonepe_client_id: string;
  phonepe_client_secret: string;
  phonepe_environment: 'sandbox' | 'production';
  bank_account_number: string;
  bank_name: string;
  account_holder: string;
  ifsc_code: string;
  branch_name: string;
  upi_id: string;
}

const defaultConfig: PaymentBankConfig = {
  stripe_enabled: false,
  razorpay_enabled: false,
  phonepe_enabled: true,
  phonepe_client_id: 'TEST-M23SH3F1QDQ88_25081',
  phonepe_client_secret: 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx',
  phonepe_environment: 'sandbox',
  bank_account_number: '',
  bank_name: '',
  account_holder: '',
  ifsc_code: '',
  branch_name: '',
  upi_id: ''
};

export const PaymentBankSettings: React.FC = () => {
  const [config, setConfig] = useState<PaymentBankConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data: paymentSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'payment_banking');

      if (paymentSettings) {
        const loadedConfig = { ...defaultConfig };
        paymentSettings.forEach(setting => {
          if (setting.key in loadedConfig) {
            (loadedConfig as any)[setting.key] = setting.value;
          }
        });
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      console.log('Saving payment & bank settings...', config);
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const upsertData = Object.entries(config).map(([key, value]) => ({
        key,
        category: 'payment_banking',
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

      console.log('Payment & bank settings saved successfully');
      toast.success('Payment & bank settings saved');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings: ' + (error as Error).message);
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
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Gateway Settings
          </CardTitle>
          <CardDescription>
            Configure payment processing and gateway integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Stripe Integration</h4>
                <p className="text-sm text-gray-500">Global payment processing</p>
              </div>
            </div>
            <Switch
              checked={config.stripe_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, stripe_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Razorpay Integration</h4>
                <p className="text-sm text-gray-500">India-focused payment gateway</p>
              </div>
            </div>
            <Switch
              checked={config.razorpay_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, razorpay_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">PhonePe Integration</h4>
                <p className="text-sm text-gray-500">Leading Indian digital payments platform</p>
              </div>
            </div>
            <Switch
              checked={config.phonepe_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, phonepe_enabled: checked })}
            />
          </div>

          {config.phonepe_enabled && (
            <div className="ml-12 space-y-4 p-4 border rounded-lg bg-purple-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phonepe_client_id">Client ID</Label>
                  <Input
                    id="phonepe_client_id"
                    value={config.phonepe_client_id}
                    onChange={(e) => setConfig({ ...config, phonepe_client_id: e.target.value })}
                    placeholder="TEST-M23SH3F1QDQ88_25081"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phonepe_client_secret">Client Secret</Label>
                  <Input
                    id="phonepe_client_secret"
                    type="password"
                    value={config.phonepe_client_secret}
                    onChange={(e) => setConfig({ ...config, phonepe_client_secret: e.target.value })}
                    placeholder="Enter client secret"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phonepe_environment">Environment</Label>
                  <select
                    id="phonepe_environment"
                    value={config.phonepe_environment}
                    onChange={(e) => setConfig({ ...config, phonepe_environment: e.target.value as 'sandbox' | 'production' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="sandbox">Sandbox (Test)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Bank Account Details
          </CardTitle>
          <CardDescription>
            Configure banking information for settlements and payouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Bank account information is sensitive. This data is encrypted and only accessible to authorized personnel.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_holder">Account Holder Name *</Label>
              <Input
                id="account_holder"
                value={config.account_holder}
                onChange={(e) => setConfig({ ...config, account_holder: e.target.value })}
                placeholder="Account holder name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                value={config.bank_name}
                onChange={(e) => setConfig({ ...config, bank_name: e.target.value })}
                placeholder="Bank name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                value={config.bank_account_number}
                onChange={(e) => setConfig({ ...config, bank_account_number: e.target.value })}
                placeholder="Bank account number"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifsc_code">IFSC Code *</Label>
              <Input
                id="ifsc_code"
                value={config.ifsc_code}
                onChange={(e) => setConfig({ ...config, ifsc_code: e.target.value.toUpperCase() })}
                placeholder="IFSC code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_name">Branch Name</Label>
              <Input
                id="branch_name"
                value={config.branch_name}
                onChange={(e) => setConfig({ ...config, branch_name: e.target.value })}
                placeholder="Branch name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                value={config.upi_id}
                onChange={(e) => setConfig({ ...config, upi_id: e.target.value })}
                placeholder="your-upi@provider"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} type="button">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </div>
    </div>
  );
};
