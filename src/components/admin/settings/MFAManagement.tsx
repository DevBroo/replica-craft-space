
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Switch } from '@/components/admin/ui/switch';
import { Badge } from '@/components/admin/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Smartphone, Mail, Key, Users, AlertTriangle } from 'lucide-react';

interface MFAStats {
  total_users: number;
  users_with_mfa: number;
  sms_enabled: number;
  totp_enabled: number;
  email_enabled: number;
}

interface UserMFA {
  user_id: string;
  method: 'sms' | 'totp' | 'email';
  enabled: boolean;
  last_used_at: string | null;
  user_name?: string;
  user_email?: string;
}

export const MFAManagement: React.FC = () => {
  const [stats, setStats] = useState<MFAStats>({
    total_users: 0,
    users_with_mfa: 0,
    sms_enabled: 0,
    totp_enabled: 0,
    email_enabled: 0
  });
  const [userMFAs, setUserMFAs] = useState<UserMFA[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalMFARequired, setGlobalMFARequired] = useState(false);

  useEffect(() => {
    loadMFAData();
    loadGlobalSettings();
  }, []);

  const loadMFAData = async () => {
    try {
      setLoading(true);
      
      // Get MFA statistics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;

      const { data: mfaData, error: mfaError } = await supabase
        .from('user_mfa')
        .select('*')
        .eq('enabled', true);

      if (mfaError) throw mfaError;

      // Calculate statistics
      const userMFAMap = new Map();
      const methodCounts = { sms: 0, totp: 0, email: 0 };

      mfaData?.forEach(mfa => {
        userMFAMap.set(mfa.user_id, true);
        methodCounts[mfa.method]++;
      });

      setStats({
        total_users: totalUsers,
        users_with_mfa: userMFAMap.size,
        sms_enabled: methodCounts.sms,
        totp_enabled: methodCounts.totp,
        email_enabled: methodCounts.email
      });

      // Enrich MFA data with user information
      const enrichedMFAs: UserMFA[] = [];
      if (mfaData) {
        for (const mfa of mfaData) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', mfa.user_id)
            .single();

          enrichedMFAs.push({
            ...mfa,
            user_name: profile?.full_name || 'Unknown User',
            user_email: profile?.email || 'No email'
          });
        }
      }

      setUserMFAs(enrichedMFAs);
    } catch (error) {
      console.error('Error loading MFA data:', error);
      toast.error('Failed to load MFA data');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'two_factor_enabled')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setGlobalMFARequired(data?.value || false);
    } catch (error) {
      console.error('Error loading global MFA setting:', error);
    }
  };

  const toggleGlobalMFA = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'two_factor_enabled',
          category: 'security',
          value: enabled
        });

      if (error) throw error;

      setGlobalMFARequired(enabled);
      toast.success(`Global 2FA requirement ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating global MFA setting:', error);
      toast.error('Failed to update global MFA setting');
    }
  };

  const resetUserMFA = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_mfa')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User MFA reset successfully');
      loadMFAData();
    } catch (error) {
      console.error('Error resetting user MFA:', error);
      toast.error('Failed to reset user MFA');
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'totp':
        return <Key className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'sms':
        return 'SMS OTP';
      case 'totp':
        return 'Authenticator App';
      case 'email':
        return 'Email OTP';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription>Manage 2FA settings and user enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mfaAdoptionRate = stats.total_users > 0 ? (stats.users_with_mfa / stats.total_users) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Multi-Factor Authentication Management
        </CardTitle>
        <CardDescription>
          Configure 2FA policies and monitor user adoption across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Global MFA Setting */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">Require 2FA for All Users</div>
                <div className="text-sm text-gray-500">
                  Enforce two-factor authentication for all user accounts
                </div>
              </div>
              <Switch
                checked={globalMFARequired}
                onCheckedChange={toggleGlobalMFA}
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.total_users}</div>
                    <div className="text-sm text-gray-500">Total Users</div>
                  </div>
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.users_with_mfa}</div>
                    <div className="text-sm text-gray-500">With 2FA</div>
                  </div>
                  <Shield className="h-8 w-8 text-green-400" />
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">
                    {mfaAdoptionRate.toFixed(1)}% adoption rate
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.sms_enabled}</div>
                    <div className="text-sm text-gray-500">SMS Users</div>
                  </div>
                  <Smartphone className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.totp_enabled}</div>
                    <div className="text-sm text-gray-500">TOTP Users</div>
                  </div>
                  <Key className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Adoption Warning */}
            {mfaAdoptionRate < 50 && (
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Low 2FA Adoption Rate</div>
                  <div className="text-sm text-yellow-700">
                    Only {mfaAdoptionRate.toFixed(1)}% of users have enabled 2FA. Consider implementing security awareness campaigns or mandatory 2FA policies.
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Users with 2FA Enabled</h4>
              
              {userMFAs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users have enabled 2FA yet
                </div>
              ) : (
                <div className="space-y-2">
                  {userMFAs.map((userMFA) => (
                    <div key={`${userMFA.user_id}-${userMFA.method}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getMethodIcon(userMFA.method)}
                          <Badge variant="outline">
                            {getMethodName(userMFA.method)}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="font-medium">{userMFA.user_name}</div>
                          <div className="text-sm text-gray-500">{userMFA.user_email}</div>
                        </div>
                        
                        {userMFA.last_used_at && (
                          <div className="text-xs text-gray-400">
                            Last used: {new Date(userMFA.last_used_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserMFA(userMFA.user_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Reset 2FA
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">2FA Policy Configuration</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Allow SMS 2FA</div>
                    <div className="text-sm text-gray-500">Enable SMS-based OTP authentication</div>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Allow Authenticator Apps</div>
                    <div className="text-sm text-gray-500">Enable TOTP via Google Authenticator, Authy, etc.</div>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Allow Email 2FA</div>
                    <div className="text-sm text-gray-500">Enable email-based OTP as fallback</div>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Backup Codes</div>
                    <div className="text-sm text-gray-500">Generate recovery codes for account recovery</div>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
