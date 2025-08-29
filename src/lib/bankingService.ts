import { supabase } from "@/integrations/supabase/client";

/**
 * Secure Banking Service - Handles sensitive banking information with enhanced security
 * Features:
 * - Automatic data masking for non-admin users
 * - Audit logging for all access
 * - Input validation and sanitization
 * - Secure data retrieval through database functions
 */

export interface BankDetails {
  id: string;
  account_holder_name: string;
  bank_name: string;
  branch_name: string | null;
  account_number_masked: string; // Always masked except for admins
  ifsc_code: string;
  account_type: string | null;
  pan_number_masked: string | null; // Always masked except for admins
  upi_id_masked: string | null; // Always masked except for admins
  micr_code: string | null;
}

export interface BankDetailsInput {
  account_holder_name: string;
  bank_name: string;
  branch_name?: string;
  account_number: string;
  ifsc_code: string;
  account_type?: string;
  pan_number?: string;
  upi_id?: string;
  micr_code?: string;
}

export const bankingService = {
  /**
   * Securely retrieve bank details with automatic masking and audit logging
   */
  async getBankDetails(ownerId: string): Promise<BankDetails | null> {
    try {
      const { data, error } = await supabase.rpc('get_bank_details_safe', {
        p_owner_id: ownerId
      });

      if (error) {
        console.error('Error fetching bank details:', error);
        throw new Error('Failed to fetch bank details');
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Banking service error:', error);
      throw error;
    }
  },

  /**
   * Validate and save bank details with audit logging
   */
  async saveBankDetails(ownerId: string, bankDetails: BankDetailsInput): Promise<void> {
    try {
      // Validate input
      this.validateBankDetails(bankDetails);

      // Log the update attempt
      await supabase.rpc('log_bank_details_access', {
        p_owner_id: ownerId,
        p_access_type: 'update',
        p_accessed_fields: ['account_number', 'pan_number', 'upi_id']
      });

      // Upsert bank details
      const { error } = await supabase
        .from('owner_bank_details')
        .upsert({
          owner_id: ownerId,
          account_holder_name: bankDetails.account_holder_name.trim(),
          bank_name: bankDetails.bank_name.trim(),
          branch_name: bankDetails.branch_name?.trim() || null,
          account_number: bankDetails.account_number.replace(/\s/g, ''),
          ifsc_code: bankDetails.ifsc_code.toUpperCase().replace(/\s/g, ''),
          account_type: bankDetails.account_type || 'Savings',
          pan_number: bankDetails.pan_number?.toUpperCase().replace(/\s/g, '') || null,
          upi_id: bankDetails.upi_id?.toLowerCase().trim() || null,
          micr_code: bankDetails.micr_code?.replace(/\s/g, '') || null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving bank details:', error);
        throw new Error('Failed to save bank details');
      }
    } catch (error) {
      console.error('Banking service save error:', error);
      throw error;
    }
  },

  /**
   * Validate bank details input
   */
  validateBankDetails(bankDetails: BankDetailsInput): void {
    const errors: string[] = [];

    // Account holder name validation
    if (!bankDetails.account_holder_name?.trim()) {
      errors.push('Account holder name is required');
    }

    // Bank name validation
    if (!bankDetails.bank_name?.trim()) {
      errors.push('Bank name is required');
    }

    // Account number validation
    const accountNumber = bankDetails.account_number?.replace(/\s/g, '') || '';
    if (!accountNumber) {
      errors.push('Account number is required');
    } else if (accountNumber.length < 9 || accountNumber.length > 18) {
      errors.push('Account number must be between 9 and 18 digits');
    } else if (!/^\d+$/.test(accountNumber)) {
      errors.push('Account number must contain only digits');
    }

    // IFSC code validation
    const ifscCode = bankDetails.ifsc_code?.toUpperCase().replace(/\s/g, '') || '';
    if (!ifscCode) {
      errors.push('IFSC code is required');
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      errors.push('Invalid IFSC code format (e.g., SBIN0000123)');
    }

    // PAN number validation (optional but must be valid if provided)
    if (bankDetails.pan_number) {
      const panNumber = bankDetails.pan_number.toUpperCase().replace(/\s/g, '');
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
        errors.push('Invalid PAN number format (e.g., ABCDE1234F)');
      }
    }

    // UPI ID validation (optional but must be valid if provided)
    if (bankDetails.upi_id) {
      const upiId = bankDetails.upi_id.toLowerCase().trim();
      if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId)) {
        errors.push('Invalid UPI ID format (e.g., user@paytm)');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  },

  /**
   * Check if current user can see full bank details (admin only)
   */
  async canViewFullDetails(): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      return profile?.role === 'admin';
    } catch {
      return false;
    }
  },

  /**
   * Mask sensitive data for display
   */
  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return 'XXXX';
    return 'XXXX' + accountNumber.slice(-4);
  },

  maskPanNumber(panNumber: string): string {
    if (!panNumber || panNumber.length < 5) return 'XXXXX';
    return panNumber.slice(0, 3) + 'XXXX' + panNumber.slice(-1);
  },

  maskUpiId(upiId: string): string {
    if (!upiId) return '';
    const parts = upiId.split('@');
    if (parts.length !== 2) return 'XXXX@XXXX';
    const username = parts[0];
    const domain = parts[1];
    if (username.length <= 3) return 'XXXX@' + domain;
    return username.slice(0, 3) + 'XXXX@' + domain;
  }
};