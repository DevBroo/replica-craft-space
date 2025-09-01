import { supabase } from '@/integrations/supabase/client';

// PhonePe Configuration
export const PHONEPE_CONFIG = {
    BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // Test environment
    CLIENT_ID: 'TEST-M23SH3F1QDQ88_25081',
    CLIENT_SECRET: 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx',
    SALT_KEY: '875126e4-864c-4e04-867d-d864a5f9c5c6', // Default test salt key
    SALT_INDEX: 1, // Default test salt index
    CALLBACK_URL: `${window.location.origin}/payment/callback`,
    REDIRECT_URL: `${window.location.origin}/payment/success`,
} as const;

export interface PhonePePaymentRequest {
    merchantTransactionId: string;
    merchantUserId: string;
    amount: number; // Amount in paise (1 INR = 100 paise)
    redirectUrl: string;
    redirectMode: 'REDIRECT' | 'POST';
    callbackUrl: string;
    mobileNumber?: string;
    paymentInstrument: {
        type: 'PAY_PAGE';
    };
}

export interface PhonePePaymentResponse {
    success: boolean;
    code: string;
    message: string;
    data?: {
        merchantId: string;
        merchantTransactionId: string;
        transactionId: string;
        amount: number;
        state: 'PENDING' | 'COMPLETED' | 'FAILED';
        responseCode: string;
        paymentInstrument: {
            type: string;
            pgTransactionId: string;
            pgServiceTransactionId: string;
            bankTransactionId?: string;
            arn?: string;
            bankId?: string;
            brn?: string;
        };
    };
}

export interface CreatePaymentData {
    bookingId: string;
    propertyId: string;
    userId: string;
    amount: number; // Amount in INR
    currency: string;
    description: string;
    customerEmail: string;
    customerPhone?: string;
    customerName?: string;
}

export class PhonePeService {
    private static generateTransactionId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `TXN_${timestamp}_${random}`.toUpperCase();
    }

    private static generateHash(payload: string): string {
        // In a real implementation, this should be done on the server side
        // For now, we'll use a simple base64 encoding
        return btoa(payload + '/pg/v1/pay' + PHONEPE_CONFIG.SALT_KEY);
    }

    /**
     * Create a payment request and get the payment URL
     */
    static async createPayment(paymentData: CreatePaymentData): Promise<{ paymentUrl: string; transactionId: string } | null> {
        try {
            console.log('🔄 Creating PhonePe payment request...', paymentData);

            // Generate unique transaction ID
            const transactionId = this.generateTransactionId();

            // Create payment request payload
            const paymentRequest: PhonePePaymentRequest = {
                merchantTransactionId: transactionId,
                merchantUserId: paymentData.userId,
                amount: Math.round(paymentData.amount * 100), // Convert to paise
                redirectUrl: `${PHONEPE_CONFIG.REDIRECT_URL}?transactionId=${transactionId}`,
                redirectMode: 'REDIRECT',
                callbackUrl: `${PHONEPE_CONFIG.CALLBACK_URL}?transactionId=${transactionId}`,
                mobileNumber: paymentData.customerPhone,
                paymentInstrument: {
                    type: 'PAY_PAGE'
                }
            };

            // Create base64 encoded payload
            const payload = btoa(JSON.stringify(paymentRequest));

            // Generate X-VERIFY header
            const xVerify = this.generateHash(payload);

            // Store payment record in database
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    id: transactionId,
                    booking_id: paymentData.bookingId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    payment_method: 'phonepe',
                    transaction_id: transactionId,
                    status: 'pending',
                    gateway_response: {
                        merchantTransactionId: transactionId,
                        merchantUserId: paymentData.userId,
                        paymentRequest
                    }
                });

            if (paymentError) {
                console.error('❌ Error storing payment record:', paymentError);
                throw paymentError;
            }

            // Make API call to PhonePe
            const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': xVerify,
                    'X-MERCHANT-ID': PHONEPE_CONFIG.CLIENT_ID
                },
                body: JSON.stringify({
                    request: payload
                })
            });

            const result = await response.json();
            console.log('📱 PhonePe API response:', result);

            if (result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
                console.log('✅ Payment URL generated successfully');
                return {
                    paymentUrl: result.data.instrumentResponse.redirectInfo.url,
                    transactionId
                };
            } else {
                console.error('❌ PhonePe payment creation failed:', result);

                // Update payment status to failed
                await supabase
                    .from('payments')
                    .update({
                        status: 'failed',
                        gateway_response: { ...paymentRequest, error: result }
                    })
                    .eq('transaction_id', transactionId);

                throw new Error(result.message || 'Payment creation failed');
            }
        } catch (error) {
            console.error('❌ PhonePe payment creation error:', error);
            throw error;
        }
    }

    /**
     * Check payment status
     */
    static async checkPaymentStatus(transactionId: string): Promise<PhonePePaymentResponse | null> {
        try {
            console.log('🔍 Checking payment status for:', transactionId);

            // Generate X-VERIFY header for status check
            const xVerify = this.generateHash(`/pg/v1/status/${PHONEPE_CONFIG.CLIENT_ID}/${transactionId}`);

            const response = await fetch(
                `${PHONEPE_CONFIG.BASE_URL}/pg/v1/status/${PHONEPE_CONFIG.CLIENT_ID}/${transactionId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': xVerify,
                        'X-MERCHANT-ID': PHONEPE_CONFIG.CLIENT_ID
                    }
                }
            );

            const result = await response.json();
            console.log('📊 Payment status response:', result);

            // Update payment record in database
            const paymentStatus = result.success && result.data?.state === 'COMPLETED' ? 'paid' :
                result.data?.state === 'FAILED' ? 'failed' : 'pending';

            await supabase
                .from('payments')
                .update({
                    status: paymentStatus,
                    gateway_response: result
                })
                .eq('transaction_id', transactionId);

            return result;
        } catch (error) {
            console.error('❌ Error checking payment status:', error);
            return null;
        }
    }

    /**
     * Handle payment callback/webhook
     */
    static async handlePaymentCallback(callbackData: any): Promise<boolean> {
        try {
            console.log('🔔 Processing payment callback:', callbackData);

            const { transactionId, status, response } = callbackData;

            if (!transactionId) {
                console.error('❌ No transaction ID in callback');
                return false;
            }

            // Verify the payment status with PhonePe
            const paymentStatus = await this.checkPaymentStatus(transactionId);

            if (!paymentStatus) {
                console.error('❌ Could not verify payment status');
                return false;
            }

            // Update booking status if payment is successful
            if (paymentStatus.success && paymentStatus.data?.state === 'COMPLETED') {
                console.log('✅ Payment successful, updating booking...');

                // Get payment record to find booking ID
                const { data: paymentRecord } = await supabase
                    .from('payments')
                    .select('booking_id')
                    .eq('transaction_id', transactionId)
                    .single();

                if (paymentRecord?.booking_id) {
                    // Update booking status to confirmed
                    await supabase
                        .from('bookings')
                        .update({
                            status: 'confirmed',
                            payment_status: 'paid'
                        })
                        .eq('id', paymentRecord.booking_id);

                    console.log('✅ Booking status updated to confirmed');
                }

                return true;
            } else {
                console.log('❌ Payment failed or pending');
                return false;
            }
        } catch (error) {
            console.error('❌ Error handling payment callback:', error);
            return false;
        }
    }

    /**
     * Initiate refund
     */
    static async initiateRefund(
        originalTransactionId: string,
        refundAmount: number,
        reason: string
    ): Promise<boolean> {
        try {
            console.log('💰 Initiating PhonePe refund...', { originalTransactionId, refundAmount, reason });

            const refundTransactionId = `REFUND_${this.generateTransactionId()}`;

            const refundRequest = {
                merchantTransactionId: refundTransactionId,
                originalTransactionId,
                amount: Math.round(refundAmount * 100), // Convert to paise
                callbackUrl: `${PHONEPE_CONFIG.CALLBACK_URL}?refundId=${refundTransactionId}`
            };

            const payload = btoa(JSON.stringify(refundRequest));
            const xVerify = this.generateHash(payload);

            const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': xVerify,
                    'X-MERCHANT-ID': PHONEPE_CONFIG.CLIENT_ID
                },
                body: JSON.stringify({
                    request: payload
                })
            });

            const result = await response.json();
            console.log('💸 Refund response:', result);

            if (result.success) {
                // Store refund record
                await supabase
                    .from('payments')
                    .insert({
                        id: refundTransactionId,
                        booking_id: null, // Will be linked via original transaction
                        amount: -refundAmount, // Negative amount for refund
                        currency: 'INR',
                        payment_method: 'phonepe_refund',
                        transaction_id: refundTransactionId,
                        status: 'pending',
                        gateway_response: {
                            refundRequest,
                            originalTransactionId,
                            reason
                        }
                    });

                console.log('✅ Refund initiated successfully');
                return true;
            } else {
                console.error('❌ Refund initiation failed:', result);
                return false;
            }
        } catch (error) {
            console.error('❌ Error initiating refund:', error);
            return false;
        }
    }

    /**
     * Get payment methods available
     */
    static getAvailablePaymentMethods(): string[] {
        return [
            'UPI',
            'Credit Card',
            'Debit Card',
            'Net Banking',
            'Wallet',
            'BNPL' // Buy Now Pay Later
        ];
    }

    /**
     * Validate amount for PhonePe (minimum 1 INR)
     */
    static validateAmount(amount: number): { isValid: boolean; message?: string } {
        if (amount < 1) {
            return { isValid: false, message: 'Minimum amount is ₹1' };
        }
        if (amount > 200000) {
            return { isValid: false, message: 'Maximum amount is ₹2,00,000' };
        }
        return { isValid: true };
    }

    /**
     * Format amount for display
     */
    static formatAmount(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

export default PhonePeService;
