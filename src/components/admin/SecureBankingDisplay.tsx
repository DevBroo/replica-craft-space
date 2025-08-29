import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { bankingService, BankDetails } from '@/lib/bankingService';
import { Button } from '@/components/admin/ui/button';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';

interface SecureBankingDisplayProps {
  ownerId: string;
  mode: 'view' | 'edit';
  onEdit?: () => void;
}

export const SecureBankingDisplay: React.FC<SecureBankingDisplayProps> = ({
  ownerId,
  mode,
  onEdit
}) => {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canViewFull, setCanViewFull] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    loadBankDetails();
    checkViewPermissions();
  }, [ownerId]);

  const loadBankDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bankingService.getBankDetails(ownerId);
      setBankDetails(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkViewPermissions = async () => {
    try {
      const canView = await bankingService.canViewFullDetails();
      setCanViewFull(canView);
    } catch {
      setCanViewFull(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading banking information...</span>
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

  if (!bankDetails) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-600">
          <p className="mb-4">No banking information available</p>
          {mode === 'edit' && onEdit && (
            <Button onClick={onEdit} variant="outline">
              Add Banking Details
            </Button>
          )}
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
            <span>Sensitive banking information is encrypted and audit-logged.</span>
            {canViewFull && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSensitive(!showSensitive)}
                className="text-blue-700 hover:text-blue-900"
              >
                {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSensitive ? 'Hide' : 'Show'} Full Details
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Banking Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Holder Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Account Holder Name
            <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
          </label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            {bankDetails.account_holder_name}
          </div>
        </div>

        {/* Bank Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Bank Name
            <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
          </label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            {bankDetails.bank_name}
          </div>
        </div>

        {/* Branch Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Branch Name
          </label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            {bankDetails.branch_name || 'Not provided'}
          </div>
        </div>

        {/* Account Number - Masked */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            Account Number
            <Shield className="h-4 w-4 text-blue-600 ml-2" />
          </label>
          <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg font-mono">
            {bankDetails.account_number_masked}
            {!canViewFull && (
              <span className="text-xs text-yellow-700 ml-2">(Masked for security)</span>
            )}
          </div>
        </div>

        {/* IFSC Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            IFSC Code
          </label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg font-mono">
            {bankDetails.ifsc_code}
          </div>
        </div>

        {/* Account Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Account Type
          </label>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            {bankDetails.account_type || 'Not specified'}
          </div>
        </div>

        {/* PAN Number - Masked */}
        {bankDetails.pan_number_masked && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              PAN Number
              <Shield className="h-4 w-4 text-blue-600 ml-2" />
            </label>
            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg font-mono">
              {bankDetails.pan_number_masked}
              {!canViewFull && (
                <span className="text-xs text-yellow-700 ml-2">(Masked for security)</span>
              )}
            </div>
          </div>
        )}

        {/* UPI ID - Masked */}
        {bankDetails.upi_id_masked && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              UPI ID
              <Shield className="h-4 w-4 text-blue-600 ml-2" />
            </label>
            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg font-mono">
              {bankDetails.upi_id_masked}
              {!canViewFull && (
                <span className="text-xs text-yellow-700 ml-2">(Masked for security)</span>
              )}
            </div>
          </div>
        )}

        {/* MICR Code */}
        {bankDetails.micr_code && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              MICR Code
            </label>
            <div className="p-3 bg-white border border-gray-300 rounded-lg font-mono">
              {bankDetails.micr_code}
            </div>
          </div>
        )}
      </div>

      {/* Admin Warning */}
      {!canViewFull && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Sensitive fields are masked for security. Only admins can view full banking details.
            All access is logged for audit purposes.
          </AlertDescription>
        </Alert>
      )}

      {/* Edit Button */}
      {mode === 'edit' && onEdit && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={onEdit} variant="outline">
            Edit Banking Details
          </Button>
        </div>
      )}
    </div>
  );
};