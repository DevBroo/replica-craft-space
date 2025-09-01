import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';
import { BookingService } from '@/lib/bookingService';
import { PhonePePayment } from '@/components/payment/PhonePePayment';
import {
    ArrowLeft,
    Calendar,
    Users,
    MapPin,
    Star,
    AlertTriangle,
    Loader2
} from 'lucide-react';

interface BookingState {
    propertyId: string;
    checkInDate: string;
    checkOutDate: string;
    guests: number;
    totalAmount: number;
    propertyTitle: string;
    propertyImages: string[];
}

const BookingPayment: React.FC = () => {
    const { propertyId } = useParams<{ propertyId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();

    const [property, setProperty] = useState<any>(null);
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creatingBooking, setCreatingBooking] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    // Get booking data from location state or URL params
    const bookingData: BookingState | null = location.state?.bookingData || null;

    useEffect(() => {
        if (!isAuthenticated) {
            toast({
                title: "Login Required",
                description: "Please login to complete your booking",
                variant: "destructive"
            });
            navigate('/login', {
                state: {
                    returnTo: `/booking/${propertyId}/payment`,
                    bookingData
                }
            });
            return;
        }

        if (!bookingData) {
            toast({
                title: "Missing Booking Data",
                description: "Please start the booking process from the property page",
                variant: "destructive"
            });
            navigate(`/property/${propertyId}`);
            return;
        }

        fetchPropertyDetails();
    }, [propertyId, isAuthenticated, bookingData]);

    const fetchPropertyDetails = async () => {
        try {
            setLoading(true);
            const propertyData = await PropertyService.getPropertyById(propertyId!);

            if (!propertyData) {
                throw new Error('Property not found');
            }

            setProperty(propertyData);
        } catch (error) {
            console.error('Error fetching property:', error);
            toast({
                title: "Property Not Found",
                description: "The property you're trying to book could not be found",
                variant: "destructive"
            });
            navigate('/properties');
        } finally {
            setLoading(false);
        }
    };

    const createBookingAndProceedToPayment = async () => {
        if (!user || !bookingData) return;

        try {
            setCreatingBooking(true);

            const bookingRequest = {
                property_id: propertyId!,
                user_id: user.id,
                check_in_date: bookingData.checkInDate,
                check_out_date: bookingData.checkOutDate,
                guests: bookingData.guests,
                total_amount: bookingData.totalAmount,
                payment_method: 'phonepe' as const,
                customer_details: {
                    name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    email: user.email!,
                    phone: user.phone || user.user_metadata?.phone
                },
                booking_details: {
                    property_title: bookingData.propertyTitle,
                    property_images: bookingData.propertyImages,
                    booking_type: 'standard'
                }
            };

            const result = await BookingService.createBookingWithPayment(bookingRequest);

            setBooking(result.booking);
            setShowPayment(true);

            toast({
                title: "Booking Created",
                description: "Your booking has been created. Complete payment to confirm.",
            });

        } catch (error) {
            console.error('Error creating booking:', error);
            toast({
                title: "Booking Failed",
                description: "Unable to create booking. Please try again.",
                variant: "destructive"
            });
        } finally {
            setCreatingBooking(false);
        }
    };

    const handlePaymentSuccess = (transactionId: string) => {
        toast({
            title: "Payment Successful!",
            description: "Your booking has been confirmed.",
        });

        navigate(`/payment/success?transactionId=${transactionId}`, {
            replace: true
        });
    };

    const handlePaymentFailure = (error: string) => {
        toast({
            title: "Payment Failed",
            description: error,
            variant: "destructive"
        });

        // Optionally update booking status to cancelled
        setShowPayment(false);
    };

    const calculateNights = () => {
        if (!bookingData) return 0;
        const checkIn = new Date(bookingData.checkInDate);
        const checkOut = new Date(bookingData.checkOutDate);
        return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!property || !bookingData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Booking Data Missing</h3>
                        <p className="text-gray-600 mb-4">
                            Unable to load booking information. Please start from the property page.
                        </p>
                        <Button onClick={() => navigate('/properties')}>
                            Browse Properties
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (showPayment && booking) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => setShowPayment(false)}
                            className="mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Booking Details
                        </Button>
                    </div>

                    <PhonePePayment
                        bookingData={{
                            id: booking.id,
                            propertyId: property.id,
                            propertyTitle: property.title,
                            totalAmount: bookingData.totalAmount,
                            checkInDate: bookingData.checkInDate,
                            checkOutDate: bookingData.checkOutDate,
                            guests: bookingData.guests
                        }}
                        customerData={{
                            userId: user!.id,
                            email: user!.email!,
                            name: user!.user_metadata?.full_name,
                            phone: user!.phone || user!.user_metadata?.phone
                        }}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentFailure={handlePaymentFailure}
                        onCancel={() => setShowPayment(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Complete Your Booking</h1>
                    <div></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Property Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-4">
                                    <img
                                        src={property.images?.[0] || '/placeholder-property.jpg'}
                                        alt={property.title}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{property.title}</h3>
                                        <div className="flex items-center text-gray-600 mt-1">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span>{property.location?.city}, {property.location?.state}</span>
                                        </div>
                                        <div className="flex items-center mt-1">
                                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                            <span className="text-sm">{property.rating || 'New'}</span>
                                            {property.review_count > 0 && (
                                                <span className="text-sm text-gray-500 ml-1">
                                                    ({property.review_count} reviews)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Information</CardTitle>
                                <CardDescription>
                                    Booking will be made under the following details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Name</span>
                                    <span className="font-medium">
                                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email</span>
                                    <span className="font-medium">{user?.email}</span>
                                </div>
                                {user?.phone && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Phone</span>
                                        <span className="font-medium">{user.phone}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Summary */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Booking Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                                        <span className="text-gray-600">Check-in</span>
                                    </div>
                                    <span className="font-medium">
                                        {new Date(bookingData.checkInDate).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                                        <span className="text-gray-600">Check-out</span>
                                    </div>
                                    <span className="font-medium">
                                        {new Date(bookingData.checkOutDate).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 mr-2 text-gray-600" />
                                        <span className="text-gray-600">Guests</span>
                                    </div>
                                    <span className="font-medium">{bookingData.guests}</span>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Nights</span>
                                        <span>{calculateNights()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-2">
                                        <span>Rate per night</span>
                                        <span>₹{(bookingData.totalAmount / calculateNights()).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-lg mt-4 pt-4 border-t">
                                        <span>Total</span>
                                        <span>₹{bookingData.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Important:</strong> Your booking will be confirmed only after successful payment.
                                You can cancel within 24 hours for a full refund.
                            </AlertDescription>
                        </Alert>

                        <Button
                            onClick={createBookingAndProceedToPayment}
                            disabled={creatingBooking}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            size="lg"
                        >
                            {creatingBooking ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating Booking...
                                </>
                            ) : (
                                'Proceed to Payment'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPayment;
