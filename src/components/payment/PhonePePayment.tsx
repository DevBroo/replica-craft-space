import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SavedPaymentMethods } from './SavedPaymentMethods';
import { PhonePeService, CreatePaymentData, PHONEPE_CONFIG } from '@/lib/phonePeService';
import {
    CreditCard,
    Smartphone,
    Shield,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Phone,
    Mail,
    User
} from 'lucide-react';

interface PhonePePaymentProps {
    bookingData: {
        id: string;
        propertyId: string;
        propertyTitle: string;
        totalAmount: number;
        checkInDate: string;
        checkOutDate: string;
        guests: number;
    };
    customerData: {
        userId: string;
        email: string;
        name?: string;
        phone?: string;
    };
    onPaymentSuccess?: (transactionId: string) => void;
    onPaymentFailure?: (error: string) => void;
    onCancel?: () => void;
}

export const PhonePePayment: React.FC<PhonePePaymentProps> = ({
    bookingData,
    customerData,
    onPaymentSuccess,
    onPaymentFailure,
    onCancel
}) => {
    const [loading, setLoading] = useState(false);
    const [customerPhone, setCustomerPhone] = useState(customerData.phone || '');
    const [customerName, setCustomerName] = useState(customerData.name || '');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
    const [showSavedMethods, setShowSavedMethods] = useState(true);
    const { toast } = useToast();

    // Validate amount
    const amountValidation = PhonePeService.validateAmount(bookingData.totalAmount);

    const handlePayment = async () => {
        try {
            if (!amountValidation.isValid) {
                toast({
                    title: "Invalid Amount",
                    description: amountValidation.message,
                    variant: "destructive"
                });
                return;
            }

            if (!termsAccepted) {
                toast({
                    title: "Terms Required",
                    description: "Please accept the terms and conditions to proceed",
                    variant: "destructive"
                });
                return;
            }

            if (!customerPhone || customerPhone.length < 10) {
                toast({
                    title: "Phone Required",
                    description: "Please provide a valid phone number",
                    variant: "destructive"
                });
                return;
            }

            // Show payment method information in console
            if (selectedPaymentMethod && selectedPaymentMethod !== 'new') {
                console.log('🎯 Using saved payment method:', selectedPaymentMethod);
                toast({
                    title: "Using Saved Method",
                    description: `Processing payment with your saved ${selectedPaymentMethod.type} method`,
                });
            } else {
                console.log('🎯 Using new payment method');
            }

            setLoading(true);

            const paymentData: CreatePaymentData = {
                bookingId: bookingData.id,
                propertyId: bookingData.propertyId,
                userId: customerData.userId,
                amount: bookingData.totalAmount,
                currency: 'INR',
                description: `Booking for ${bookingData.propertyTitle}`,
                customerEmail: customerData.email,
                customerPhone: customerPhone,
                customerName: customerName
            };

            console.log('🚀 Initiating PhonePe payment...', paymentData);

            const result = await PhonePeService.createPayment(paymentData);

            if (result?.paymentUrl) {
                console.log('✅ Payment URL received, redirecting...');

                toast({
                    title: "Redirecting to Payment",
                    description: "You will be redirected to PhonePe payment page",
                });

                // Store transaction ID for later reference
                sessionStorage.setItem('phonepe_transaction_id', result.transactionId);
                // Note: Don't store booking_id here as it's temporary - real booking created after payment

                // Redirect to PhonePe payment page
                window.location.href = result.paymentUrl;
            } else {
                throw new Error('Failed to generate payment URL');
            }
        } catch (error) {
            console.error('❌ Payment initiation failed:', error);

            const errorMessage = error instanceof Error ? error.message : 'Payment failed to initialize';

            toast({
                title: "Payment Failed",
                description: errorMessage,
                variant: "destructive"
            });

            onPaymentFailure?.(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const paymentMethods = PhonePeService.getAvailablePaymentMethods();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Payment Header */}
            <Card>
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                            <Smartphone className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Secure Payment with PhonePe</CardTitle>
                    <CardDescription>
                        Complete your booking payment securely through PhonePe
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Booking Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Property</span>
                        <span className="font-medium">{bookingData.propertyTitle}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Check-in</span>
                        <span className="font-medium">{new Date(bookingData.checkInDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Check-out</span>
                        <span className="font-medium">{new Date(bookingData.checkOutDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Guests</span>
                        <span className="font-medium">{bookingData.guests}</span>
                    </div>
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="text-purple-600">
                                {PhonePeService.formatAmount(bookingData.totalAmount)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Saved Payment Methods */}
            {showSavedMethods && (
                <SavedPaymentMethods
                    onPaymentMethodSelect={(method) => {
                        setSelectedPaymentMethod(method);
                        if (method === 'new') {
                            setShowSavedMethods(false);
                        }
                    }}
                    onAddNewMethod={() => setShowSavedMethods(false)}
                />
            )}

            {!showSavedMethods && (
                <div className="mb-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowSavedMethods(true)}
                        size="sm"
                    >
                        ← Back to Saved Methods
                    </Button>
                </div>
            )}

            {/* Customer Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="customer_name"
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer_email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="customer_email"
                                    type="email"
                                    value={customerData.email}
                                    disabled
                                    className="pl-10 bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="customer_phone">Phone Number *</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="customer_phone"
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter 10-digit mobile number"
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-sm text-gray-500">
                                Required for PhonePe payment and booking confirmations
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Available Payment Methods</CardTitle>
                    <CardDescription>
                        PhonePe supports multiple payment options for your convenience
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {paymentMethods.map((method) => (
                            <div key={method} className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">{method}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Security Information */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-green-800">Secure Payment</h4>
                            <p className="text-sm text-green-600">
                                Your payment is secured by PhonePe's industry-standard encryption.
                                We do not store your payment information.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Amount Validation Error */}
            {!amountValidation.isValid && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {amountValidation.message}
                    </AlertDescription>
                </Alert>
            )}

            {/* Terms and Conditions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600">
                            I agree to the{' '}
                            <a href="/terms-of-service" target="_blank" className="text-purple-600 underline">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy-policy" target="_blank" className="text-purple-600 underline">
                                Privacy Policy
                            </a>
                            . I authorize the payment to be processed through PhonePe.
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1"
                >
                    Cancel
                </Button>

                <Button
                    onClick={handlePayment}
                    disabled={loading || !amountValidation.isValid || !termsAccepted}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay {PhonePeService.formatAmount(bookingData.totalAmount)}
                        </>
                    )}
                </Button>
            </div>

            {/* Test Environment Notice */}
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Test Environment:</strong> This is using PhonePe's test environment.
                    No real money will be charged. Use test cards for payment.
                </AlertDescription>
            </Alert>
        </div>
    );
};
