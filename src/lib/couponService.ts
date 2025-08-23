
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  valid_from: string | null;
  valid_to: string | null;
  status: 'active' | 'inactive';
  property_ids: string[] | null;
}

export class CouponService {
  static async validateCoupon(code: string, propertyId?: string): Promise<Coupon | null> {
    try {
      if (!code.trim()) return null;

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code.trim())
        .eq('status', 'active')
        .single();

      if (error || !data) {
        console.log('Coupon not found or inactive:', code);
        return null;
      }

      // Check if coupon is valid for this property (if property restriction exists)
      if (data.property_ids && data.property_ids.length > 0 && propertyId) {
        if (!data.property_ids.includes(propertyId)) {
          console.log('Coupon not valid for this property');
          return null;
        }
      }

      return data as Coupon;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return null;
    }
  }

  static calculateDiscount(coupon: Coupon, totalAmount: number): number {
    if (totalAmount < coupon.min_order_amount) {
      return 0;
    }

    if (coupon.discount_type === 'percentage') {
      return Math.min((totalAmount * coupon.discount_value) / 100, totalAmount);
    } else {
      return Math.min(coupon.discount_value, totalAmount);
    }
  }
}
