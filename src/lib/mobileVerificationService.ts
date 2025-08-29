
import { supabase } from '@/integrations/supabase/client';

export const mobileVerificationService = {
  /**
   * Send OTP to mobile number
   */
  async sendOTP(phone: string, userId: string): Promise<{ success: boolean; error?: string; debugOtp?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-mobile-otp', {
        body: { phone, user_id: userId }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP'
      };
    }
  },

  /**
   * Verify OTP code
   */
  async verifyOTP(phone: string, otp: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-mobile-otp', {
        body: { phone, otp, user_id: userId }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP'
      };
    }
  },

  /**
   * Get user's phone verification status
   */
  async getVerificationStatus(userId: string): Promise<{ verified: boolean; phone?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('phone_verified')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return {
        verified: data?.phone_verified || false
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return { verified: false };
    }
  },

  /**
   * Update phone verification status (admin only)
   */
  async updateVerificationStatus(userId: string, verified: boolean): Promise<{ success: boolean; error?: string }> {
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

      return { success: true };
    } catch (error) {
      console.error('Error updating verification status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update verification status'
      };
    }
  }
};
