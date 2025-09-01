import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PhonePeService } from '@/lib/phonePeService';
import { Loader2 } from 'lucide-react';

const PaymentCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const processCallback = async () => {
            try {
                console.log('🔔 Processing PhonePe payment callback...');

                const transactionId = searchParams.get('transactionId');
                const status = searchParams.get('status');
                const code = searchParams.get('code');

                if (!transactionId) {
                    console.error('❌ No transaction ID in callback');
                    navigate('/payment/success?error=no_transaction_id');
                    return;
                }

                console.log('📊 Callback data:', { transactionId, status, code });

                // Process the callback with PhonePe service
                const callbackData = {
                    transactionId,
                    status,
                    code,
                    response: Object.fromEntries(searchParams.entries())
                };

                const success = await PhonePeService.handlePaymentCallback(callbackData);

                if (success) {
                    console.log('✅ Payment callback processed successfully');
                    navigate(`/payment/success?transactionId=${transactionId}&status=success`);
                } else {
                    console.log('❌ Payment callback processing failed');
                    navigate(`/payment/success?transactionId=${transactionId}&status=failed`);
                }

            } catch (error) {
                console.error('❌ Error processing payment callback:', error);
                navigate('/payment/success?error=callback_processing_failed');
            } finally {
                setProcessing(false);
            }
        };

        processCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto" />
                        <h3 className="text-lg font-semibold">Processing Payment</h3>
                        <p className="text-gray-600">
                            Please wait while we confirm your payment with PhonePe...
                        </p>
                        <div className="text-xs text-gray-500">
                            Do not close this window or refresh the page.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentCallback;
