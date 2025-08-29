
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Switch } from '@/components/admin/ui/switch';
import { Label } from '@/components/admin/ui/label';
import { Badge } from '@/components/admin/ui/badge';
import { toast } from 'sonner';
import { Shield, Smartphone, Mail, Key, AlertTriangle } from 'lucide-react';

export const MFAManagement: React.FC = () => {
  const [mfaSettings, setMfaSettings] = useState({
    sms_enabled: true,
    email_enabled: true,
    app_enabled: false,
    enforce_for_admins: true,
    enforce_for_agents: false,
    backup_codes_enabled: true
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setMfaSettings(prev => ({ ...prev, [key]: value }));
    toast.info('MFA settings will be saved once the database types are updated');
  };

  const generateBackupCodes = () => {
    toast.info('Backup code generation will be available once MFA system is fully configured');
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
        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            MFA system is being configured. Settings interface ready for testing.
          </span>
        </div>

        {/* MFA Methods */}
        <div className="space-y-4">
          <h4 className="font-medium">Available MFA Methods</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">SMS Authentication</div>
                  <div className="text-sm text-gray-500">Send OTP via SMS</div>
                </div>
              </div>
              <Switch
                checked={mfaSettings.sms_enabled}
                onCheckedChange={(checked) => handleSettingChange('sms_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Email Authentication</div>
                  <div className="text-sm text-gray-500">Send OTP via Email</div>
                </div>
              </div>
              <Switch
                checked={mfaSettings.email_enabled}
                onCheckedChange={(checked) => handleSettingChange('email_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Authenticator App</div>
                  <div className="text-sm text-gray-500">Google Authenticator, Authy, etc.</div>
                </div>
              </div>
              <Switch
                checked={mfaSettings.app_enabled}
                onCheckedChange={(checked) => handleSettingChange('app_enabled', checked)}
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
                <Label htmlFor="enforce-admins" className="font-medium">
                  Require MFA for Admins
                </Label>
                <div className="text-sm text-gray-500">Force all admin users to enable MFA</div>
              </div>
              <Switch
                id="enforce-admins"
                checked={mfaSettings.enforce_for_admins}
                onCheckedChange={(checked) => handleSettingChange('enforce_for_admins', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enforce-agents" className="font-medium">
                  Require MFA for Agents
                </Label>
                <div className="text-sm text-gray-500">Force all agent users to enable MFA</div>
              </div>
              <Switch
                id="enforce-agents"
                checked={mfaSettings.enforce_for_agents}
                onCheckedChange={(checked) => handleSettingChange('enforce_for_agents', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="backup-codes" className="font-medium">
                  Backup Recovery Codes
                </Label>
                <div className="text-sm text-gray-500">Allow users to generate backup codes</div>
              </div>
              <Switch
                id="backup-codes"
                checked={mfaSettings.backup_codes_enabled}
                onCheckedChange={(checked) => handleSettingChange('backup_codes_enabled', checked)}
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

        {/* Actions */}
        <div className="space-y-4">
          <h4 className="font-medium">Management Actions</h4>
          
          <div className="flex space-x-4">
            <Button onClick={generateBackupCodes} variant="outline">
              Generate System Backup Codes
            </Button>
            <Button variant="outline">
              Export MFA Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
