import { supabase } from '@/integrations/supabase/client';

// PhonePe Configuration
export const PHONEPE_CONFIG = {
    BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // Test environment
    MERCHANT_ID: 'PGTESTPAYUAT',  // Default test merchant ID
    CLIENT_ID: 'TEST-M23SH3F1QDQ88_25081',
    CLIENT_SECRET: 'YWEzMjcyYTMtNzI4Yy00YjMwLWE1YmMtYjYzNmIxMjFjMmMx',
    SALT_KEY: '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399', // Default test salt key
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

    private static async generateHash(payload: string, endpoint: string): Promise<string> {
        // Create the string to hash: base64_payload + endpoint + salt_key
        const stringToHash = payload + endpoint + PHONEPE_CONFIG.SALT_KEY;

        // Use Web Crypto API to generate SHA256 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(stringToHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Return hash with salt index
        return hashHex + '###' + PHONEPE_CONFIG.SALT_INDEX;
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
            const xVerify = await this.generateHash(payload, '/pg/v1/pay');

            // Store payment record in database (with error handling)
            try {
                const { error: paymentError } = await (supabase as any)
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
                    console.warn('⚠️ Could not store payment record (table may not exist):', paymentError);
                    // Continue with payment creation even if storage fails
                }
            } catch (error) {
                console.warn('⚠️ Payment table not available, continuing without storage:', error);
                // Continue with payment creation
            }

            // For testing/demo purposes, create a mock payment URL
            // In production, this would make the actual API call to PhonePe
            const isTestMode = true; // Set to false for production

            if (isTestMode) {
                console.log('🧪 Test mode: Creating mock payment URL');

                // Create a test payment URL that redirects back to our success page
                const testPaymentUrl = `${window.location.origin}/payment/success?transactionId=${transactionId}&status=success&test=true`;

                console.log('✅ Mock payment URL generated successfully');
                return {
                    paymentUrl: testPaymentUrl,
                    transactionId
                };
            } else {
                // Make actual API call to PhonePe (production)
                const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': xVerify,
                        'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID
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
                    await (supabase as any)
                        .from('payments')
                        .update({
                            status: 'failed',
                            gateway_response: { ...paymentRequest, error: result }
                        })
                        .eq('transaction_id', transactionId);

                    throw new Error(result.message || 'Payment creation failed');
                }
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

            const isTestMode = true; // Same as createPayment

            if (isTestMode) {
                console.log('🧪 Test mode: Mock payment status check');

                // Mock successful payment response
                const mockResult: PhonePePaymentResponse = {
                    success: true,
                    code: 'PAYMENT_SUCCESS',
                    message: 'Payment completed successfully',
                    data: {
                        merchantId: PHONEPE_CONFIG.MERCHANT_ID,
                        merchantTransactionId: transactionId,
                        transactionId: transactionId,
                        amount: 0, // Will be updated from database
                        state: 'COMPLETED' as const,
                        responseCode: 'SUCCESS',
                        paymentInstrument: {
                            type: 'UPI',
                            pgTransactionId: 'PG' + transactionId,
                            pgServiceTransactionId: 'PGST' + transactionId,
                            bankTransactionId: 'BT' + transactionId
                        }
                    }
                };

                // Update payment record in database (with error handling)
                try {
                    await (supabase as any)
                        .from('payments')
                        .update({
                            status: 'paid',
                            gateway_response: mockResult
                        })
                        .eq('transaction_id', transactionId);
                } catch (error) {
                    console.warn('⚠️ Could not update payment record:', error);
                }

                return mockResult as PhonePePaymentResponse;
            } else {
                // Generate X-VERIFY header for status check
                const statusEndpoint = `/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${transactionId}`;
                const xVerify = await this.generateHash('', statusEndpoint);

                const response = await fetch(
                    `${PHONEPE_CONFIG.BASE_URL}${statusEndpoint}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-VERIFY': xVerify,
                            'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID
                        }
                    }
                );

                const result = await response.json();
                console.log('📊 Payment status response:', result);

                // Update payment record in database (with error handling)
                const paymentStatus = result.success && result.data?.state === 'COMPLETED' ? 'paid' :
                    result.data?.state === 'FAILED' ? 'failed' : 'pending';

                try {
                    await (supabase as any)
                        .from('payments')
                        .update({
                            status: paymentStatus,
                            gateway_response: result
                        })
                        .eq('transaction_id', transactionId);
                } catch (error) {
                    console.warn('⚠️ Could not update payment record:', error);
                }

                return result;
            }
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

                // Try to get booking ID from session storage or payment record
                const bookingId = sessionStorage.getItem('booking_id');

                if (bookingId) {
                    // Update booking status to confirmed using session storage booking ID
                    try {
                        await supabase
                            .from('bookings')
                            .update({
                                status: 'confirmed',
                                payment_status: 'paid'
                            })
                            .eq('id', bookingId);

                        console.log('✅ Booking status updated to confirmed');
                    } catch (error) {
                        console.error('❌ Error updating booking status:', error);
                    }
                } else {
                    // Fallback: Try to get payment record to find booking ID
                    try {
                        const { data: paymentRecord } = await (supabase as any)
                            .from('payments')
                            .select('booking_id')
                            .eq('transaction_id', transactionId)
                            .single();

                        if (paymentRecord?.booking_id) {
                            await supabase
                                .from('bookings')
                                .update({
                                    status: 'confirmed',
                                    payment_status: 'paid'
                                })
                                .eq('id', paymentRecord.booking_id);

                            console.log('✅ Booking status updated to confirmed via payment record');
                        } else {
                            console.warn('⚠️ No booking ID found, cannot update booking status');
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not fetch payment record:', error);
                    }
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
            const xVerify = await this.generateHash(payload, '/pg/v1/refund');

            const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': xVerify,
                    'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID
                },
                body: JSON.stringify({
                    request: payload
                })
            });

            const result = await response.json();
            console.log('💸 Refund response:', result);

            if (result.success) {
                // Store refund record
                await (supabase as any)
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
