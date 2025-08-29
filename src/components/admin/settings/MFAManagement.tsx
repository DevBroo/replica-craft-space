import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Switch } from '@/components/admin/ui/switch';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { Progress } from '@/components/admin/ui/progress';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/admin/ui/dialog';
import { toast } from 'sonner';
import { Shield, Smartphone, Mail, Key, Users, Download, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MFASetupModal: React.FC<MFASetupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('send-mobile-otp', {
        body: { phone, user_id: user.id }
      });

      if (error) throw error;

      toast.success('OTP sent to your phone');
      setStep('verify');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('verify-mobile-otp', {
        body: { phone, otp, user_id: user.id }
      });

      if (error) throw error;

      toast.success('Phone number verified successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Mobile 2FA</DialogTitle>
          <DialogDescription>
            {step === 'phone' 
              ? 'Enter your phone number to receive verification code'
              : 'Enter the 6-digit code sent to your phone'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {step === 'phone' ? (
            <>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button onClick={sendOTP} disabled={loading} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep('phone')} className="flex-1">
                  Back
                </Button>
                <Button onClick={verifyOTP} disabled={loading} className="flex-1">
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const MFAManagement: React.FC = () => {
  const [mfaSettings, setMfaSettings] = useState({
    smsEnabled: false,
    emailEnabled: true,
    authenticatorEnabled: false,
    enforceForAdmins: true,
    enforceForAgents: false,
    allowBackupCodes: true
  });
  const [userSecuritySettings, setUserSecuritySettings] = useState<any>(null);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSecuritySettings();
  }, []);

  const loadUserSecuritySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSecuritySettings(data);
    } catch (error) {
      console.error('Error loading security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setMfaSettings(prev => ({ ...prev, [setting]: value }));
    toast.success('MFA setting updated');
  };

  const handleMFASetupSuccess = () => {
    loadUserSecuritySettings();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Multi-Factor Authentication
        </CardTitle>
        <CardDescription>
          Configure two-factor authentication settings and manage user MFA preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MFA Methods */}
        <div className="space-y-4">
          <h4 className="font-medium">Available MFA Methods</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <div>
                  <span>SMS Authentication</span>
                  {userSecuritySettings?.phone_verified && (
                    <Badge variant="default" className="ml-2 text-xs">Verified</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!userSecuritySettings?.phone_verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMFASetup(true)}
                  >
                    Setup
                  </Button>
                )}
                <Switch
                  checked={mfaSettings.smsEnabled && userSecuritySettings?.phone_verified}
                  onCheckedChange={(checked) => handleSettingChange('smsEnabled', checked)}
                  disabled={!userSecuritySettings?.phone_verified}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Authentication</span>
              </div>
              <Switch
                checked={mfaSettings.emailEnabled}
                onCheckedChange={(checked) => handleSettingChange('emailEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>Authenticator App</span>
              </div>
              <Switch
                checked={mfaSettings.authenticatorEnabled}
                onCheckedChange={(checked) => handleSettingChange('authenticatorEnabled', checked)}
              />
            </div>
          </div>
        </div>

        {/* Enforcement Rules */}
        <div className="space-y-4">
          <h4 className="font-medium">MFA Enforcement Rules</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Require MFA for Admins</span>
                <div className="text-sm text-gray-500">Force all admin users to enable MFA</div>
              </div>
              <Switch
                checked={mfaSettings.enforceForAdmins}
                onCheckedChange={(checked) => handleSettingChange('enforceForAdmins', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Require MFA for Agents</span>
                <div className="text-sm text-gray-500">Force all agent users to enable MFA</div>
              </div>
              <Switch
                checked={mfaSettings.enforceForAgents}
                onCheckedChange={(checked) => handleSettingChange('enforceForAgents', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Backup Recovery Codes</span>
                <div className="text-sm text-gray-500">Allow users to generate backup codes</div>
              </div>
              <Switch
                checked={mfaSettings.allowBackupCodes}
                onCheckedChange={(checked) => handleSettingChange('allowBackupCodes', checked)}
              />
            </div>
          </div>
        </div>

        {/* MFA Statistics */}
        <div className="space-y-4">
          <h4 className="font-medium">MFA Usage Statistics</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-500">Users with MFA Enabled</div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-500">Pending MFA Setup</div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-gray-500">MFA Recovery Requests</div>
            </div>
          </div>
        </div>
      </CardContent>

      <MFASetupModal
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onSuccess={handleMFASetupSuccess}
      />
    </Card>
  );
};