import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { PhonePeService } from '@/lib/phonePeService';
import { BookingService } from '@/lib/bookingService';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import {
    CheckCircle,
    XCircle,
    Loader2,
    Download,
    Calendar,
    Home,
    Clock,
    AlertTriangle
} from 'lucide-react';

interface PaymentStatus {
    success: boolean;
    transactionId: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    bookingId?: string;
    propertyTitle?: string;
    message: string;
}

const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();

    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const transactionId = searchParams.get('transactionId') ||
        sessionStorage.getItem('phonepe_transaction_id');
    const bookingId = sessionStorage.getItem('booking_id');

    useEffect(() => {
        if (transactionId) {
            verifyPayment();
        } else {
            setLoading(false);
            setPaymentStatus({
                success: false,
                transactionId: '',
                amount: 0,
                status: 'failed',
                message: 'No transaction ID found'
            });
        }
    }, [transactionId]);

    const verifyPayment = async () => {
        try {
            setLoading(true);
            console.log('🔍 Verifying payment status for:', transactionId);

            // Check payment status with PhonePe
            const paymentResponse = await PhonePeService.checkPaymentStatus(transactionId!);

            if (!paymentResponse) {
                throw new Error('Unable to verify payment status');
            }

            // Get booking details or create if missing
            let booking = null;
            if (bookingId) {
                const { data: bookingData, error: bookingError } = await supabase
                    .from('bookings')
                    .select(`
            *,
            properties (
              title,
              images
            )
          `)
                    .eq('id', bookingId)
                    .single();

                if (!bookingError && bookingData) {
                    booking = bookingData;
                    setBookingDetails(booking);
                }
            } else if (paymentResponse.success && paymentResponse.data?.state === 'COMPLETED') {
                // Fallback: Create booking if payment is successful but no booking ID found
                const pendingBookingData = sessionStorage.getItem('pending_booking_data');
                if (pendingBookingData) {
                    try {
                        const bookingRequest = JSON.parse(pendingBookingData);
                        console.log('📝 Creating missing booking after successful payment...');

                        // Use BookingService to create booking with proper validation
                        const bookingData = {
                            ...bookingRequest,
                            status: 'confirmed',
                            payment_status: 'paid',
                            // Ensure required guest fields are present
                            guest_name: bookingRequest.guest_name || 'Guest',
                            guest_phone: bookingRequest.guest_phone || '0000000000',
                            guest_date_of_birth: bookingRequest.guest_date_of_birth || '1990-01-01',
                            booking_details: {
                                ...bookingRequest.booking_details,
                                payment_transaction_id: transactionId,
                                payment_completed_at: new Date().toISOString()
                            }
                        };

                        const newBooking = await BookingService.createBooking(bookingData);
                        
                        if (newBooking) {
                            // Fetch complete booking details with property info
                            const { data: fullBooking, error: fetchError } = await supabase
                                .from('bookings')
                                .select(`
                                    *,
                                    properties (
                                      title,
                                      images
                                    )
                                  `)
                                .eq('id', newBooking.id)
                                .single();

                            if (!fetchError && fullBooking) {
                                booking = fullBooking;
                                setBookingDetails(booking);
                                sessionStorage.setItem('booking_id', newBooking.id);
                                sessionStorage.removeItem('pending_booking_data');
                                console.log('✅ Booking created successfully:', newBooking.id);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error creating fallback booking:', error);
                        // Show user-friendly error message
                        setError('Failed to create booking after payment. Please contact support with your transaction ID: ' + transactionId);
                    }
                }
            }

            // Determine payment status
            const isSuccess = paymentResponse.success && paymentResponse.data?.state === 'COMPLETED';
            let amount = paymentResponse.data?.amount ? paymentResponse.data.amount / 100 : 0; // Convert from paise
            
            // Fallback: If amount is still 0, try to get from booking or session storage
            if (amount === 0) {
                if (booking?.total_amount) {
                    amount = booking.total_amount;
                    console.log('💰 Using booking total_amount as fallback:', amount);
                } else {
                    // Try session storage fallback
                    try {
                        const pendingBookingData = sessionStorage.getItem('pending_booking_data');
                        if (pendingBookingData) {
                            const bookingRequest = JSON.parse(pendingBookingData);
                            if (bookingRequest.total_amount) {
                                amount = bookingRequest.total_amount;
                                console.log('💰 Using session storage amount as fallback:', amount);
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not parse session storage booking data:', error);
                    }
                }
            }

            setPaymentStatus({
                success: isSuccess,
                transactionId: transactionId!,
                amount: amount,
                status: isSuccess ? 'success' : paymentResponse.data?.state === 'FAILED' ? 'failed' : 'pending',
                bookingId: booking?.id,
                propertyTitle: booking?.properties?.title,
                message: isSuccess
                    ? 'Payment completed successfully!'
                    : paymentResponse.data?.state === 'FAILED'
                        ? 'Payment failed. Please try again.'
                        : 'Payment is being processed.'
            });

            // Clear session storage on success
            if (isSuccess) {
                sessionStorage.removeItem('phonepe_transaction_id');
                sessionStorage.removeItem('booking_id');

                toast({
                    title: "Payment Successful!",
                    description: "Your booking has been confirmed.",
                });
            } else {
                toast({
                    title: "Payment Status",
                    description: paymentResponse.data?.state === 'FAILED'
                        ? "Payment failed. Please contact support if amount was debited."
                        : "Payment is being processed. You will receive confirmation shortly.",
                    variant: paymentResponse.data?.state === 'FAILED' ? "destructive" : "default"
                });
            }

        } catch (error) {
            console.error('❌ Error verifying payment:', error);

            setPaymentStatus({
                success: false,
                transactionId: transactionId || 'unknown',
                amount: 0,
                status: 'failed',
                message: 'Unable to verify payment status. Please contact support.'
            });

            toast({
                title: "Verification Error",
                description: "Unable to verify payment. Please contact support.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = async () => {
        if (!paymentStatus) return;

        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('Payment Receipt', 20, 30);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
            
            // Payment Details Section
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Payment Details', 20, 60);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            let yPos = 75;
            
            doc.text(`Transaction ID: ${paymentStatus.transactionId}`, 20, yPos);
            yPos += 10;
            doc.text(`Amount: ${PhonePeService.formatAmount(paymentStatus.amount)}`, 20, yPos);
            yPos += 10;
            doc.text(`Payment Method: PhonePe`, 20, yPos);
            yPos += 10;
            doc.text(`Status: ${paymentStatus.status.toUpperCase()}`, 20, yPos);
            yPos += 20;
            
            // Booking Details Section (if available)
            if (bookingDetails && paymentStatus.status === 'success') {
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('Booking Details', 20, yPos);
                yPos += 15;
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                
                if (paymentStatus.bookingId) {
                    doc.text(`Booking ID: ${paymentStatus.bookingId}`, 20, yPos);
                    yPos += 10;
                }
                
                if (bookingDetails.properties?.title) {
                    doc.text(`Property: ${bookingDetails.properties.title}`, 20, yPos);
                    yPos += 10;
                }
                
                if (bookingDetails.check_in_date) {
                    doc.text(`Check-in: ${new Date(bookingDetails.check_in_date).toLocaleDateString()}`, 20, yPos);
                    yPos += 10;
                }
                
                if (bookingDetails.check_out_date) {
                    doc.text(`Check-out: ${new Date(bookingDetails.check_out_date).toLocaleDateString()}`, 20, yPos);
                    yPos += 10;
                }
                
                if (bookingDetails.guests) {
                    doc.text(`Guests: ${bookingDetails.guests}`, 20, yPos);
                    yPos += 10;
                }
                
                if (bookingDetails.booking_details?.customer_details?.email) {
                    doc.text(`Email: ${bookingDetails.booking_details.customer_details.email}`, 20, yPos);
                    yPos += 20;
                }
            }
            
            // Footer
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            doc.text('Thank you for your booking!', 20, yPos + 10);
            doc.text('For support, please contact us with your transaction ID.', 20, yPos + 20);
            
            // Save the PDF
            const fileName = `receipt_${paymentStatus.transactionId}.pdf`;
            doc.save(fileName);

            toast({
                title: "Receipt Downloaded",
                description: "Your payment receipt has been downloaded successfully.",
            });

        } catch (error) {
            console.error('Error downloading receipt:', error);
            toast({
                title: "Download Failed",
                description: "Unable to download receipt. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto" />
                            <h3 className="text-lg font-semibold">Verifying Payment</h3>
                            <p className="text-gray-600">Please wait while we confirm your payment...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!paymentStatus) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto" />
                            <h3 className="text-lg font-semibold">Unable to Load Payment Status</h3>
                            <p className="text-gray-600">No payment information found.</p>
                            <Button onClick={() => navigate('/')} className="w-full">
                                Go Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 space-y-6">
                {/* Status Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            {paymentStatus.status === 'success' ? (
                                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                            ) : paymentStatus.status === 'failed' ? (
                                <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                            ) : (
                                <Clock className="w-20 h-20 text-orange-500 mx-auto" />
                            )}

                            <div>
                                <h1 className="text-2xl font-bold mb-2">
                                    {paymentStatus.status === 'success' ? 'Payment Successful!' :
                                        paymentStatus.status === 'failed' ? 'Payment Failed' :
                                            'Payment Processing'}
                                </h1>
                                <p className="text-gray-600">{paymentStatus.message}</p>
                            </div>

                            {paymentStatus.status === 'success' && paymentStatus.propertyTitle && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-green-800 font-medium">
                                        Your booking for "{paymentStatus.propertyTitle}" has been confirmed!
                                    </p>
                                </div>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Transaction ID</p>
                                <p className="font-mono text-sm break-all">{paymentStatus.transactionId}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">Amount</p>
                                <p className="font-semibold text-lg">
                                    {PhonePeService.formatAmount(paymentStatus.amount)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">Payment Method</p>
                                <p className="font-medium">PhonePe</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">Date & Time</p>
                                <p className="font-medium">{new Date().toLocaleString()}</p>
                            </div>

                            {paymentStatus.bookingId && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600">Booking ID</p>
                                    <p className="font-mono text-sm">{paymentStatus.bookingId}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Booking Details */}
                {bookingDetails && paymentStatus.status === 'success' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Property</span>
                                <span className="font-medium">{bookingDetails.properties?.title}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Check-in</span>
                                <span className="font-medium">{new Date(bookingDetails.check_in_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Check-out</span>
                                <span className="font-medium">{new Date(bookingDetails.check_out_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Guests</span>
                                <span className="font-medium">{bookingDetails.guests}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Booking Status</span>
                                <span className="font-medium text-green-600">Confirmed</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="space-y-4">
                    {paymentStatus.status === 'success' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button onClick={downloadReceipt} variant="outline" className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Download Receipt
                            </Button>

                            <Button
                                onClick={() => {
                                  if (user?.role === 'customer' || user?.role === 'user') {
                                    navigate('/');
                                  } else {
                                    navigate('/dashboard');
                                  }
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                {user?.role === 'customer' || user?.role === 'user' ? 'Go to Home' : 'View My Bookings'}
                            </Button>
                        </div>
                    )}

                    {paymentStatus.status === 'failed' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={() => navigate(-1)}
                                variant="outline"
                                className="w-full"
                            >
                                Try Again
                            </Button>

                            <Button
                                onClick={() => navigate('/')}
                                className="w-full"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </div>
                    )}

                    {paymentStatus.status === 'pending' && (
                        <div className="text-center">
                            <Button
                                onClick={verifyPayment}
                                variant="outline"
                                className="mr-4"
                            >
                                <Loader2 className="w-4 h-4 mr-2" />
                                Check Status Again
                            </Button>

                            <Button onClick={() => navigate('/')}>
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </div>
                    )}
                </div>

                {/* Support Information */}
                <Card>
                    <CardContent className="pt-6">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Need Help?</strong> If you have any issues with your payment or booking,
                                please contact our support team with your transaction ID: {paymentStatus.transactionId}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PaymentSuccess;
