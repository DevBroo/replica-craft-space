import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Wifi, Car, Utensils, Waves, Heart, Share2, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { PropertyService } from "@/lib/propertyService";
import { BookingService } from "@/lib/bookingService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// No dummy data - load from database using PropertyService

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [guests, setGuests] = useState(2);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Restore booking data if returning from login
  useEffect(() => {
    const pendingBookingData = sessionStorage.getItem('pendingBookingData');
    if (pendingBookingData) {
      try {
        const bookingData = JSON.parse(pendingBookingData);
        setCheckInDate(bookingData.checkInDate || '');
        setCheckOutDate(bookingData.checkOutDate || '');
        setGuests(bookingData.guests || 2);
        
        // Clear the stored data
        sessionStorage.removeItem('pendingBookingData');
        
        if (isAuthenticated) {
          toast({
            title: "Welcome back!",
            description: "Your booking details have been restored. You can now complete your reservation.",
          });
        }
      } catch (error) {
        console.error('Error restoring booking data:', error);
      }
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;
      
      try {
        console.log('🔍 Loading property details for ID:', id);
        const propertyData = await PropertyService.getPropertyById(id);
        
        if (propertyData) {
          const formattedProperty = {
            id: propertyData.id,
            title: propertyData.title,
            location: `${(propertyData.location as any)?.city || ''}, ${(propertyData.location as any)?.state || ''}`,
            price: (propertyData.pricing as any)?.daily_rate || 0,
            rating: propertyData.rating || 0,
            reviews: propertyData.review_count || 0,
            images: propertyData.images && propertyData.images.length > 0 
              ? propertyData.images 
              : ['/placeholder.svg'],
            description: propertyData.description || 'No description available.',
            amenities: propertyData.amenities?.map((a: string) => ({ 
              icon: Wifi, 
              name: a.charAt(0).toUpperCase() + a.slice(1) 
            })) || [],
            roomTypes: [
              {
                name: `${propertyData.property_type.charAt(0).toUpperCase() + propertyData.property_type.slice(1)} Room`,
                price: (propertyData.pricing as any)?.daily_rate || 0,
                features: [
                  `${propertyData.bedrooms || 0} Bedrooms`, 
                  `${propertyData.bathrooms || 0} Bathrooms`, 
                  `Capacity: ${propertyData.max_guests || 0} guests`
                ]
              }
            ],
            highlights: [
              `${propertyData.bedrooms || 0} Bedrooms`,
              `${propertyData.bathrooms || 0} Bathrooms`,
              `Capacity: ${propertyData.max_guests || 0} guests`,
              `${propertyData.property_type.charAt(0).toUpperCase() + propertyData.property_type.slice(1)} Type`,
              `Status: ${propertyData.status}`
            ]
          };
          setProperty(formattedProperty);
          console.log('✅ Property details loaded successfully');
        } else {
          // Fallback to localStorage for testing
          console.log('📋 Property not found in database, checking localStorage...');
          const storageKey = 'properties_venteskraft@gmail.com';
          const savedProperties = localStorage.getItem(storageKey);
          if (savedProperties) {
            const parsedProperties = JSON.parse(savedProperties);
            const localProperty = parsedProperties.find((p: any) => p.id === id && p.status === 'active');
            if (localProperty) {
              const formattedProperty = {
                id: localProperty.id,
                title: localProperty.name,
                location: `${localProperty.city}, ${localProperty.state}`,
                price: localProperty.price,
                rating: localProperty.rating,
                reviews: localProperty.totalBookings,
                images: localProperty.images && localProperty.images.length > 0 
                  ? localProperty.images 
                  : ['/placeholder.svg'],
                description: localProperty.description || 'No description available.',
                amenities: localProperty.amenities?.map((a: string) => ({ 
                  icon: Wifi, 
                  name: a.charAt(0).toUpperCase() + a.slice(1) 
                })) || [],
                roomTypes: [
                  {
                    name: `${localProperty.type.charAt(0).toUpperCase() + localProperty.type.slice(1)} Room`,
                    price: localProperty.price,
                    features: [`${localProperty.bedrooms} Bedrooms`, `${localProperty.bathrooms} Bathrooms`, `Capacity: ${localProperty.capacity} guests`]
                  }
                ],
                highlights: [
                  `${localProperty.bedrooms} Bedrooms`,
                  `${localProperty.bathrooms} Bathrooms`,
                  `Capacity: ${localProperty.capacity} guests`,
                  `${localProperty.type.charAt(0).toUpperCase() + localProperty.type.slice(1)} Type`,
                  'Active Property'
                ]
              };
              setProperty(formattedProperty);
              console.log('✅ Property details loaded from localStorage');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading property details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const basePrice = property.price * nights;
    const serviceFee = Math.round(basePrice * 0.1);
    return basePrice + serviceFee;
  };

  const handleBooking = async () => {
    // Pre-validate authentication
    if (!isAuthenticated || !user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to your account to book this property. We'll save your selection.",
        variant: "destructive"
      });
      
      // Navigate to login with booking context
      navigate('/customer-login', { 
        state: { 
          returnTo: `/property/${property.id}`,
          bookingData: { checkInDate, checkOutDate, guests },
          message: "Please sign in to complete your booking"
        }
      });
      return;
    }

    // Validate dates
    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Select Your Dates",
        description: "Please choose your check-in and check-out dates to proceed with booking.",
        variant: "destructive"
      });
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn >= checkOut) {
      toast({
        title: "Invalid Date Selection",
        description: "Your check-out date must be after your check-in date. Please adjust your dates.",
        variant: "destructive"
      });
      return;
    }

    // Check if booking is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      toast({
        title: "Past Date Selected",
        description: "Check-in date cannot be in the past. Please select a future date.",
        variant: "destructive"
      });
      return;
    }

    // Validate guest count
    if (guests > property.max_guests) {
      toast({
        title: "Guest Limit Exceeded",
        description: `This property accommodates up to ${property.max_guests} guests. Please adjust your guest count.`,
        variant: "destructive"
      });
      return;
    }

    if (guests < 1) {
      toast({
        title: "Invalid Guest Count",
        description: "At least one guest is required for booking.",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);
    
    try {
      console.log('📝 Creating booking with data:', {
        property_id: property.id,
        user_id: user.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests,
        total_amount: calculateTotal()
      });

      const booking = await BookingService.createBooking({
        property_id: property.id,
        user_id: user.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests,
        total_amount: calculateTotal(),
        booking_details: {
          property_title: property.title,
          property_location: property.location,
          nights: calculateNights()
        }
      });

      console.log('✅ Booking created successfully:', booking);
      
      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your reservation for ${property.title} has been confirmed. Check your dashboard for details.`,
      });
      
      // Navigate to customer dashboard to see the booking
      navigate('/customer-dashboard');
      
    } catch (error: any) {
      console.error('❌ Error creating booking:', error);
      
      // More specific error messages
      let errorMessage = "We couldn't complete your booking. Please try again.";
      
      if (error?.message?.includes('auth')) {
        errorMessage = "Authentication expired. Please sign in again to continue.";
      } else if (error?.message?.includes('availability')) {
        errorMessage = "This property is not available for your selected dates. Please choose different dates.";
      } else if (error?.message?.includes('payment')) {
        errorMessage = "Payment processing failed. Please check your payment details and try again.";
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{property.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.location}
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {property.rating} ({property.reviews} reviews)
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative h-96 rounded-lg overflow-hidden mb-4">
                <img 
                  src={property.images[currentImageIndex]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {property.images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-20 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About this place</h2>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </div>

            {/* Highlights */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">What this place offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                    <amenity.icon className="w-5 h-5 mr-2 text-primary" />
                    <span className="text-sm">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Types */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Room Options</h2>
              <div className="space-y-4">
                {property.roomTypes.map((room, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold">{room.name}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">${room.price}</div>
                          <div className="text-sm text-muted-foreground">per night</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {room.features.map((feature, featureIndex) => (
                          <Badge key={featureIndex} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-primary mb-1">
                    ${property.price}
                  </div>
                  <div className="text-sm text-muted-foreground">per night</div>
                </div>

                {/* Authentication Status */}
                {isAuthenticated ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Signed in as {user?.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-orange-700 mb-2">
                      <span className="text-sm font-medium">Sign in required to book</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/customer-login', { 
                        state: { 
                          returnTo: `/property/${property.id}`,
                          bookingData: { checkInDate, checkOutDate, guests }
                        }
                      })}
                      className="w-full"
                    >
                      Sign In to Continue
                    </Button>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-in</label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-out</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Guests</label>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{guests} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                        >
                          -
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setGuests(guests + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mb-4" 
                  onClick={handleBooking}
                  disabled={isBooking || !checkInDate || !checkOutDate || !isAuthenticated}
                >
                  {isBooking ? 'Creating Booking...' : 
                   !isAuthenticated ? 'Sign In to Book' : 'Reserve Now'}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  You won't be charged yet
                </div>

                {checkInDate && checkOutDate && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span>${property.price} × {calculateNights()} nights</span>
                      <span>${property.price * calculateNights()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span>Service fee</span>
                      <span>${Math.round(property.price * calculateNights() * 0.1)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total</span>
                        <span>${calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;