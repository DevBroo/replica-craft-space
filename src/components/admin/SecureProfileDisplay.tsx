import React, { useState, useEffect } from 'react';
import { Shield, Eye, Clock, User, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { profileSecurityService, SecureProfile, FullProfileData } from '@/lib/profileSecurityService';
import { Button } from '@/components/admin/ui/button';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Badge } from '@/components/admin/ui/badge';

interface SecureProfileDisplayProps {
  profileId: string;
  mode: 'view' | 'admin_full';
  onEdit?: () => void;
  initialAccessReason?: string;
}

export const SecureProfileDisplay: React.FC<SecureProfileDisplayProps> = ({
  profileId,
  mode,
  onEdit,
  initialAccessReason = ''
}) => {
  const [profile, setProfile] = useState<SecureProfile | null>(null);
  const [fullProfile, setFullProfile] = useState<FullProfileData | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState(initialAccessReason);
  const [showFullData, setShowFullData] = useState(false);
  const [canAccessFull, setCanAccessFull] = useState(false);

  useEffect(() => {
    loadProfile();
    checkFullAccess();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profileData = await profileSecurityService.getProfile(
        profileId,
        mode === 'admin_full' ? 'Admin profile review' : 'Profile view'
      );
      
      setProfile(profileData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFullAccess = async () => {
    try {
      const canAccess = await profileSecurityService.canAccessFullProfiles();
      setCanAccessFull(canAccess);
    } catch {
      setCanAccessFull(false);
    }
  };

  const loadFullProfile = async () => {
    if (!accessReason.trim() || accessReason.trim().length < 10) {
      setError('Please provide a valid access reason (minimum 10 characters)');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      profileSecurityService.validateAccessReason(accessReason);
      
      const fullData = await profileSecurityService.getFullProfileForAdmin(
        profileId,
        accessReason
      );
      
      setFullProfile(fullData);
      setShowFullData(true);
      
      // Load audit logs
      const logs = await profileSecurityService.getProfileAuditLogs(profileId, 10);
      setAuditLogs(logs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading profile information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-600">
          <p>Profile not found or access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span>Personal information is protected with audit logging and data masking.</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Lock className="h-3 w-3 mr-1" />
              Secured Access
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Basic Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            Full Name
            <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
          </Label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            {profile.full_name}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            Email Address
            <Shield className="h-4 w-4 text-blue-600 ml-2" />
          </Label>
          <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg font-mono">
            {profile.email_masked}
            <span className="text-xs text-yellow-700 ml-2">(Masked for security)</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            Phone Number
            <Shield className="h-4 w-4 text-blue-600 ml-2" />
          </Label>
          <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg font-mono">
            {profile.phone_masked || 'Not provided'}
            {profile.phone_masked && (
              <span className="text-xs text-yellow-700 ml-2">(Masked for security)</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Role</Label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <Badge variant={profile.role === 'admin' ? 'destructive' : 'secondary'}>
              {profile.role}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Status</Label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <Badge variant={profile.is_active ? 'default' : 'secondary'}>
              {profile.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Member Since</Label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            {new Date(profile.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Admin Full Access Section */}
      {canAccessFull && mode === 'admin_full' && !showFullData && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-4">
              <p><strong>Admin Full Access:</strong> To view complete profile details, provide a business justification:</p>
              
              <div className="space-y-2">
                <Label htmlFor="access-reason">Access Reason (required, minimum 10 characters)</Label>
                <Input
                  id="access-reason"
                  type="text"
                  value={accessReason}
                  onChange={(e) => setAccessReason(e.target.value)}
                  placeholder="e.g., User support for account verification issue"
                  className="bg-white"
                />
                <p className="text-xs text-amber-700">
                  Valid reasons include: user support, account verification, security investigation, 
                  data correction, compliance audit, business verification
                </p>
              </div>
              
              <Button 
                onClick={loadFullProfile}
                disabled={isLoading || accessReason.trim().length < 10}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Access Full Profile'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Full Profile Data (Admin Only) */}
      {showFullData && fullProfile && (
        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>SENSITIVE DATA ACCESS:</strong> Full profile details are visible. 
              This access is logged and monitored. Reason: "{accessReason}"
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-700">Full Email Address</Label>
              <div className="p-3 bg-white border border-red-300 rounded-lg font-mono text-red-900">
                {fullProfile.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-700">Full Phone Number</Label>
              <div className="p-3 bg-white border border-red-300 rounded-lg font-mono text-red-900">
                {fullProfile.phone || 'Not provided'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-700">Commission Rate</Label>
              <div className="p-3 bg-white border border-red-300 rounded-lg">
                {(fullProfile.commission_rate * 100).toFixed(2)}%
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-700">Created By</Label>
              <div className="p-3 bg-white border border-red-300 rounded-lg">
                {fullProfile.created_by || 'System'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {auditLogs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Access Log
          </h3>
          
          <div className="space-y-2">
            {auditLogs.slice(0, 5).map((log, index) => (
              <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{log.access_type}</span>
                    {log.access_reason && (
                      <span className="text-gray-600"> - {log.access_reason}</span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                
                {log.accessed_fields && (
                  <div className="mt-1 text-gray-600">
                    Fields: {log.accessed_fields.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Button */}
      {onEdit && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={onEdit} variant="outline">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  );
};