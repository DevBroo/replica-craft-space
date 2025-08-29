
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Separator } from '@/components/admin/ui/separator';
import { Badge } from '@/components/admin/ui/badge';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, CreditCard, Building2, Shield, Eye, EyeOff, Settings, CheckCircle } from 'lucide-react';

interface PaymentGatewayConfig {
  stripe_enabled: boolean;
  razorpay_enabled: boolean;
  test_mode: boolean;
}

interface BankDetails {
  account_holder_name: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  pan_number: string;
  upi_id: string;
  micr_code: string;
}

export const PaymentBankSettings: React.FC = () => {
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>({
    stripe_enabled: false,
    razorpay_enabled: false,
    test_mode: true
  });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'Savings',
    pan_number: '',
    upi_id: '',
    micr_code: ''
  });
  const [integrationStatus, setIntegrationStatus] = useState({
    stripe: false,
    razorpay: false
  });
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load payment gateway config
      const { data: paymentSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('category', 'payments');

      if (paymentSettings) {
        const config = { ...paymentConfig };
        paymentSettings.forEach(setting => {
          if (setting.key in config) {
            (config as any)[setting.key] = setting.value;
          }
        });
        setPaymentConfig(config);
      }

      // Load integration status
      const { data: integrations } = await supabase
        .from('api_integrations')
        .select('provider, configured')
        .in('provider', ['stripe', 'razorpay']);

      if (integrations) {
        const status = { ...integrationStatus };
        integrations.forEach(integration => {
          if (integration.provider in status) {
            (status as any)[integration.provider] = integration.configured;
          }
        });
        setIntegrationStatus(status);
      }

      // Load bank details (masked)
      const { data: bankData, error } = await supabase.rpc('get_admin_bank_details_safe');
      if (bankData && bankData.length > 0) {
        const details = bankData[0];
        setBankDetails({
          account_holder_name: details.account_holder_name || '',
          bank_name: details.bank_name || '',
          branch_name: details.branch_name || '',
          account_number: details.account_number_masked || '',
          ifsc_code: details.ifsc_code || '',
          account_type: details.account_type || 'Savings',
          pan_number: details.pan_number_masked || '',
          upi_id: details.upi_id_masked || '',
          micr_code: details.micr_code || ''
        });
      }
    } catch (error) {
      console.error('Error loading payment/bank settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const savePaymentConfig = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.entries(paymentConfig).map(([key, value]) => ({
        key,
        category: 'payments',
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
        details: { category: 'payments', updated_keys: Object.keys(paymentConfig) }
      });

      toast.success('Payment configuration saved');
    } catch (error) {
      console.error('Error saving payment config:', error);
      toast.error('Failed to save payment configuration');
    } finally {
      setSaving(false);
    }
  };

  const saveBankDetails = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('admin_bank_details')
        .upsert({
          account_holder_name: bankDetails.account_holder_name,
          bank_name: bankDetails.bank_name,
          branch_name: bankDetails.branch_name || null,
          account_number: bankDetails.account_number,
          ifsc_code: bankDetails.ifsc_code.toUpperCase(),
          account_type: bankDetails.account_type,
          pan_number: bankDetails.pan_number?.toUpperCase() || null,
          upi_id: bankDetails.upi_id?.toLowerCase() || null,
          micr_code: bankDetails.micr_code || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Log audit
      await supabase.from('system_audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'update_bank_details',
        entity_type: 'admin_bank_details',
        details: { fields_updated: Object.keys(bankDetails) }
      });

      toast.success('Bank details saved successfully');
      loadSettings(); // Reload to get masked data
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details');
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
      {/* Payment Gateway Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Gateway Configuration
          </CardTitle>
          <CardDescription>
            Configure payment processing settings and gateway credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              API credentials are stored securely via Supabase Vault. Only configuration flags are managed here.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Stripe</h4>
                    <p className="text-sm text-gray-500">International payments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={integrationStatus.stripe ? "default" : "secondary"}>
                    {integrationStatus.stripe ? <CheckCircle className="h-3 w-3 mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                    {integrationStatus.stripe ? 'Configured' : 'Not Set'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Razorpay</h4>
                    <p className="text-sm text-gray-500">Indian payments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={integrationStatus.razorpay ? "default" : "secondary"}>
                    {integrationStatus.razorpay ? <CheckCircle className="h-3 w-3 mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                    {integrationStatus.razorpay ? 'Configured' : 'Not Set'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select 
                  value={paymentConfig.test_mode ? 'test' : 'live'} 
                  onValueChange={(value) => setPaymentConfig({ ...paymentConfig, test_mode: value === 'test' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test Mode</SelectItem>
                    <SelectItem value="live">Live Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={savePaymentConfig} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Payment Config
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Admin Bank Details
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBankDetails(!showBankDetails)}
            >
              {showBankDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showBankDetails ? 'Hide' : 'Show'} Details
            </Button>
          </CardTitle>
          <CardDescription>
            Bank account information for commission disbursements and payouts
          </CardDescription>
        </CardHeader>
        {showBankDetails && (
          <CardContent className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Sensitive bank information is encrypted and audit-logged. Some fields are masked for security.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_holder">Account Holder Name *</Label>
                <Input
                  id="account_holder"
                  value={bankDetails.account_holder_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name *</Label>
                <Input
                  id="bank_name"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_name">Branch Name</Label>
                <Input
                  id="branch_name"
                  value={bankDetails.branch_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, branch_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_type">Account Type</Label>
                <Select value={bankDetails.account_type} onValueChange={(value) => setBankDetails({ ...bankDetails, account_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                  placeholder="Account number (will be masked)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC Code *</Label>
                <Input
                  id="ifsc_code"
                  value={bankDetails.ifsc_code}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SBIN0000123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  value={bankDetails.pan_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, pan_number: e.target.value.toUpperCase() })}
                  placeholder="e.g., ABCDE1234F (will be masked)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upi_id">UPI ID (Optional)</Label>
                <Input
                  id="upi_id"
                  value={bankDetails.upi_id}
                  onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value.toLowerCase() })}
                  placeholder="e.g., admin@paytm (will be masked)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="micr_code">MICR Code (Optional)</Label>
                <Input
                  id="micr_code"
                  value={bankDetails.micr_code}
                  onChange={(e) => setBankDetails({ ...bankDetails, micr_code: e.target.value })}
                  placeholder="9-digit MICR code"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveBankDetails} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Bank Details
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
