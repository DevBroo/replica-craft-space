
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Badge } from '@/components/admin/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Textarea } from '@/components/admin/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, CheckCircle, XCircle, Clock, Eye, Phone, UserCheck } from 'lucide-react';

interface KYCVerification {
  id: string;
  user_id: string;
  type: 'aadhaar' | 'pan' | 'gst' | 'business';
  status: 'pending' | 'verified' | 'rejected';
  id_number_masked: string;
  documents: string[];
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

interface UserSecuritySettings {
  user_id: string;
  phone_verified: boolean;
  require_2fa: boolean;
  preferred_mfa_method: string;
  user_name?: string;
  user_email?: string;
}

export const KYCVerificationSettings: React.FC = () => {
  const [kycVerifications, setKycVerifications] = useState<KYCVerification[]>([]);
  const [userSecuritySettings, setUserSecuritySettings] = useState<UserSecuritySettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState<KYCVerification | null>(null);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');

  useEffect(() => {
    loadKYCVerifications();
    loadUserSecuritySettings();
  }, [filter]);

  const loadKYCVerifications = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('kyc_verifications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: kycData, error: kycError } = await query;

      if (kycError) throw kycError;

      // Now get profile data separately for each KYC record
      const enrichedKycData: KYCVerification[] = [];
      
      if (kycData) {
        for (const kyc of kycData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', kyc.user_id)
            .single();

          enrichedKycData.push({
            id: kyc.id,
            user_id: kyc.user_id,
            type: kyc.type as 'aadhaar' | 'pan' | 'gst' | 'business',
            status: kyc.status as 'pending' | 'verified' | 'rejected',
            id_number_masked: kyc.id_number_masked || 'N/A',
            documents: Array.isArray(kyc.documents) ? kyc.documents as string[] : [],
            submitted_at: kyc.submitted_at,
            verified_at: kyc.verified_at,
            verified_by: kyc.verified_by,
            rejection_reason: kyc.rejection_reason,
            user_name: profileData?.full_name || 'Unknown User',
            user_email: profileData?.email || 'No email',
            user_phone: profileData?.phone || 'No phone'
          });
        }
      }

      setKycVerifications(enrichedKycData);
    } catch (error) {
      console.error('Error loading KYC verifications:', error);
      toast.error('Failed to load KYC verifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSecuritySettings = async () => {
    try {
      console.log('Loading user security settings...');
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_security_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (settingsError) {
        console.error('User security settings query error:', settingsError);
        throw settingsError;
      }

      // Get unique user IDs for batch profile fetch
      const userIds = settingsData ? [...new Set(settingsData.map(setting => setting.user_id))] : [];
      
      // Batch fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Create lookup map for profiles
      const profileLookup = new Map();
      profilesData?.forEach(profile => {
        profileLookup.set(profile.id, profile);
      });

      // Enrich with profile data
      const enrichedSettingsData: UserSecuritySettings[] = [];
      
      if (settingsData) {
        for (const setting of settingsData) {
          const profile = profileLookup.get(setting.user_id);

          enrichedSettingsData.push({
            user_id: setting.user_id,
            phone_verified: setting.phone_verified,
            require_2fa: setting.require_2fa,
            preferred_mfa_method: setting.preferred_mfa_method,
            user_name: profile?.full_name || 'Unknown User',
            user_email: profile?.email || 'No email'
          });
        }
      }

      console.log('User security settings loaded:', enrichedSettingsData.length);
      setUserSecuritySettings(enrichedSettingsData);
    } catch (error) {
      console.error('Error loading user security settings:', error);
      toast.error('Failed to load user security settings: ' + (error as Error).message);
    }
  };

  const handleKYCAction = async (kycId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const updateData: any = {
        status: action === 'approve' ? 'verified' : 'rejected'
      };

      if (action === 'approve') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = (await supabase.auth.getUser()).data.user?.id;
      } else {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('kyc_verifications')
        .update(updateData)
        .eq('id', kycId);

      if (error) throw error;

      toast.success(`KYC verification ${action === 'approve' ? 'approved' : 'rejected'}`);
      setSelectedKyc(null);
      setVerificationAction(null);
      setRejectionReason('');
      loadKYCVerifications();
    } catch (error) {
      console.error('Error updating KYC verification:', error);
      toast.error('Failed to update KYC verification');
    }
  };

  const togglePhoneVerification = async (userId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: userId,
          phone_verified: verified,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success(`Phone verification ${verified ? 'enabled' : 'disabled'}`);
      loadUserSecuritySettings();
    } catch (error) {
      console.error('Error updating phone verification:', error);
      toast.error('Failed to update phone verification');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
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
      {/* KYC Verification Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            KYC Verification Management
          </CardTitle>
          <CardDescription>
            Review and manage Aadhaar, PAN, GST, and business document verifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setFilter('pending')}
                  size="sm"
                >
                  Pending ({kycVerifications.filter(k => k.status === 'pending').length})
                </Button>
                <Button
                  variant={filter === 'verified' ? 'default' : 'outline'}
                  onClick={() => setFilter('verified')}
                  size="sm"
                >
                  Verified
                </Button>
                <Button
                  variant={filter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setFilter('rejected')}
                  size="sm"
                >
                  Rejected
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {kycVerifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No KYC verifications found for the selected filter
                </div>
              ) : (
                kycVerifications.map((kyc) => (
                  <div key={kyc.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(kyc.status)}
                          <div>
                            <div className="font-medium">{kyc.user_name}</div>
                            <div className="text-sm text-gray-500">{kyc.user_email}</div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {kyc.type}
                          </Badge>
                          {getStatusBadge(kyc.status)}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          ID Number: {kyc.id_number_masked} • 
                          Submitted: {new Date(kyc.submitted_at).toLocaleDateString()} • 
                          Documents: {kyc.documents.length}
                        </div>
                        
                        {kyc.rejection_reason && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            <strong>Rejection Reason:</strong> {kyc.rejection_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedKyc(kyc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {kyc.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleKYCAction(kyc.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedKyc(kyc);
                                setVerificationAction('reject');
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Number Verification Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Mobile Number Verification
          </CardTitle>
          <CardDescription>
            Manage user phone number verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userSecuritySettings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No user security settings found
              </div>
            ) : (
              userSecuritySettings.map((setting) => (
                <div key={setting.user_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">{setting.user_name}</div>
                    <div className="text-sm text-gray-500">{setting.user_email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={setting.phone_verified ? 'default' : 'secondary'}>
                        {setting.phone_verified ? 'Phone Verified' : 'Phone Not Verified'}
                      </Badge>
                      <Badge variant={setting.require_2fa ? 'default' : 'secondary'}>
                        {setting.require_2fa ? '2FA Required' : '2FA Optional'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={setting.phone_verified ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => togglePhoneVerification(setting.user_id, !setting.phone_verified)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      {setting.phone_verified ? 'Unverify' : 'Verify'} Phone
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {verificationAction === 'reject' && selectedKyc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject KYC Verification</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this KYC verification:
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setVerificationAction(null);
                  setSelectedKyc(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleKYCAction(selectedKyc.id, 'reject', rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
