import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Heart,
  Share2,
  Calendar,
  Users,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { PropertyService } from "@/lib/propertyService";
import { BookingService } from "@/lib/bookingService";
import { CouponService, Coupon } from "@/lib/couponService";
import { AvailabilityService, PropertyAvailability } from "@/lib/availabilityService";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import GuestSelector, { GuestBreakdown } from "@/components/ui/GuestSelector";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Import new components
import { HeroSection } from "@/components/property/HeroSection";
import { ImageLightbox } from "@/components/property/ImageLightbox";
import { ItineraryTimeline } from "@/components/property/ItineraryTimeline";
import { MapEmbed } from "@/components/property/MapEmbed";
import { PackageCard } from "@/components/property/DayPicnic/PackageCard";
import { RoomCard } from "@/components/property/Rooms/RoomCard";
import { ReviewsSection } from "@/components/property/ReviewsSection";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestBreakdown>({
    adults: 2,
    children: [],
  });
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [isBooking, setIsBooking] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [dayPicnicPackages, setDayPicnicPackages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("description");
  const [propertyAvailability, setPropertyAvailability] = useState<PropertyAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { isPropertySaved, addToWishlist, removeFromWishlist } = useWishlist();

  // Check if this is a day picnic property
  const isDayPicnic =
    property?.type?.toLowerCase() === "day picnic" ||
    property?.property_type?.toLowerCase() === "day picnic" ||
    property?.property_type === "day_picnic";

  // Restore booking data if returning from login
  useEffect(() => {
    const pendingBookingData = sessionStorage.getItem("pendingBookingData");
    if (pendingBookingData) {
      try {
        const bookingData = JSON.parse(pendingBookingData);
        if (bookingData.checkInDate)
          setCheckInDate(new Date(bookingData.checkInDate));
        if (bookingData.checkOutDate)
          setCheckOutDate(new Date(bookingData.checkOutDate));
        setGuests(bookingData.guests || { adults: 2, children: [] });

        sessionStorage.removeItem("pendingBookingData");

        if (isAuthenticated) {
          toast({
            title: "Welcome back!",
            description:
              "Your booking details have been restored. You can now complete your reservation.",
          });
        }
      } catch (error) {
        console.error("Error restoring booking data:", error);
      }
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;

      try {
        console.log("🔍 Loading property details for ID:", id);
        const propertyData = await PropertyService.getPropertyById(id);

        if (propertyData) {
          const formattedProperty = {
            id: propertyData.id,
            title: propertyData.title,
            type: propertyData.property_type,
            property_type: propertyData.property_type,
            location: `${(propertyData.location as any)?.city || ""}, ${(propertyData.location as any)?.state || ""
              }`,
            city: (propertyData.location as any)?.city || "",
            state: (propertyData.location as any)?.state || "",
            address: propertyData.address || "",
            price: (propertyData.pricing as any)?.daily_rate || 0,
            rating: propertyData.rating || 0,
            reviews: propertyData.review_count || 0,
            max_guests: propertyData.max_guests,
            rooms_count: propertyData.rooms_count,
            capacity_per_room: propertyData.capacity_per_room,
            day_picnic_capacity: propertyData.day_picnic_capacity,
            contact_phone: propertyData.contact_phone,
            images:
              propertyData.images && propertyData.images.length > 0
                ? propertyData.images
                : ["/placeholder.svg"],
            description:
              propertyData.description || "No description available.",
            amenities:
              propertyData.amenities?.map((a: string) => ({
                icon: null,
                name: a.charAt(0).toUpperCase() + a.slice(1),
              })) || [],
            roomTypes: [
              {
                id: "default",
                name: `${propertyData.property_type.charAt(0).toUpperCase() +
                  propertyData.property_type.slice(1)
                  } Room`,
                price: (propertyData.pricing as any)?.daily_rate || 0,
                max_guests: propertyData.max_guests,
                features: [
                  `${propertyData.bedrooms || 0} Bedrooms`,
                  `${propertyData.bathrooms || 0} Bathrooms`,
                  `Capacity: ${propertyData.max_guests || 0} guests`,
                ],
                images: propertyData.images?.slice(0, 3) || [
                  "/placeholder.svg",
                ],
              },
            ],
            highlights: [
              `${propertyData.bedrooms || 0} Bedrooms`,
              `${propertyData.bathrooms || 0} Bathrooms`,
              `Capacity: ${propertyData.max_guests || 0} guests`,
              `${propertyData.property_type.charAt(0).toUpperCase() +
              propertyData.property_type.slice(1)
              } Type`,
              `Status: ${propertyData.status}`,
            ],
          };
          setProperty(formattedProperty);

          // Load day picnic packages if this is a day picnic property
          if (
            formattedProperty.property_type?.toLowerCase() === "day picnic" ||
            formattedProperty.property_type === "day_picnic"
          ) {
            const packages =
              await PropertyService.getDayPicnicPackagesForProperty(id);
            setDayPicnicPackages(packages);
          }

          console.log("✅ Property details loaded successfully");
        } else {
          console.log("ℹ️ Property not found or not approved");
          setProperty(null);
        }
      } catch (error) {
        console.error("❌ Error loading property details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
    fetchPropertyAvailability();
  }, [id]);

  const fetchPropertyAvailability = async () => {
    if (!id) return;

    try {
      setAvailabilityLoading(true);
      const availability = await AvailabilityService.getPropertyAvailability(id);
      setPropertyAvailability(availability);
      console.log('✅ Property availability loaded:', availability);
    } catch (error) {
      console.error('❌ Error loading property availability:', error);
      // Continue without availability data
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Update page title and meta tags for SEO
  useEffect(() => {
    if (property) {
      document.title = `${property.title} — ${property.location} | Picnify`;

      // Update meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          `Book ${property.title} in ${property.location}. Rated ${property.rating}/5 with ${property.reviews} reviews. Perfect for ${property.max_guests} guests.`
        );
      }

      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector(
        'meta[property="og:description"]'
      );
      const ogImage = document.querySelector('meta[property="og:image"]');

      if (ogTitle)
        ogTitle.setAttribute("content", `${property.title} | Picnify`);
      if (ogDescription)
        ogDescription.setAttribute("content", property.description);
      if (ogImage && property.images[0])
        ogImage.setAttribute("content", property.images[0]);
    }
  }, [property]);

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (isDayPicnic && selectedPackage) {
      const totalGuests = guests.adults + guests.children.length;
      const basePrice =
        selectedPackage.pricing_type === "per_person"
          ? selectedPackage.base_price * totalGuests
          : selectedPackage.base_price;

      if (appliedCoupon) {
        const discount = CouponService.calculateDiscount(
          appliedCoupon,
          basePrice
        );
        return basePrice - discount;
      }
      return basePrice;
    }

    // Regular stay calculation
    const nights = calculateNights();
    const roomPrice = selectedRoom?.price || property?.price || 0;
    const basePrice = roomPrice * nights;
    const serviceFee = Math.round(basePrice * 0.1);
    const subtotal = basePrice + serviceFee;

    if (appliedCoupon) {
      const discount = CouponService.calculateDiscount(appliedCoupon, subtotal);
      return subtotal - discount;
    }

    return subtotal;
  };

  const handleCouponApply = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter Coupon Code",
        description: "Please enter a coupon code to apply.",
        variant: "destructive",
      });
      return;
    }

    setIsCouponLoading(true);
    try {
      const coupon = await CouponService.validateCoupon(
        couponCode,
        property.id
      );

      if (coupon) {
        const total = calculateTotal();

        if (total < coupon.min_order_amount) {
          toast({
            title: "Minimum Order Not Met",
            description: `This coupon requires a minimum order of ₹${coupon.min_order_amount}. Your current total is ₹${total}.`,
            variant: "destructive",
          });
          return;
        }

        setAppliedCoupon(coupon);
        toast({
          title: "Coupon Applied! 🎉",
          description: `${coupon.description || "Discount applied successfully"
            }`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description:
            "This coupon code is invalid, expired, or not applicable to this property.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate coupon code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Coupon Removed",
      description: "The coupon discount has been removed from your booking.",
    });
  };

  const handleBooking = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to your account to book this property.",
        variant: "destructive",
      });

      navigate("/login", {
        state: {
          returnTo: `/property/${property.id}`,
          bookingData: {
            checkInDate: checkInDate?.toISOString(),
            checkOutDate: checkOutDate?.toISOString(),
            guests,
          },
          message: "Please sign in to complete your booking",
        },
      });
      return;
    }

    if (user.role !== "customer") {
      toast({
        title: "Booking Restricted",
        description: "Only customers can book properties.",
        variant: "destructive",
      });
      return;
    }

    // For day picnic, redirect to day picnic booking flow
    if (isDayPicnic) {
      navigate(`/day-picnic/${property.id}`, {
        state: {
          selectedPackage,
          guests,
          selectedDate: checkInDate,
        },
      });
      return;
    }

    // Validate stay booking
    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Select Your Dates",
        description: "Please choose your check-in and check-out dates.",
        variant: "destructive",
      });
      return;
    }

    const totalGuests = guests.adults + guests.children.length;
    if (totalGuests > property.max_guests) {
      toast({
        title: "Guest Limit Exceeded",
        description: `This property accommodates up to ${property.max_guests} guests.`,
        variant: "destructive",
      });
      return;
    }

    // Check date availability before proceeding to payment
    const checkInStr = checkInDate.toISOString().split("T")[0];
    const checkOutStr = checkOutDate.toISOString().split("T")[0];

    try {
      const availabilityCheck = await AvailabilityService.checkDateRangeAvailability(
        property.id,
        checkInStr,
        checkOutStr
      );

      if (!availabilityCheck.available) {
        toast({
          title: "Dates Not Available",
          description: `Selected dates are not available. ${availabilityCheck.conflictingBookings?.length || 0} conflicting booking(s) found.`,
          variant: "destructive",
        });
        return;
      }

      // Validate booking dates
      const dateValidation = AvailabilityService.validateBookingDates(checkInDate, checkOutDate);
      if (!dateValidation.valid) {
        toast({
          title: "Invalid Dates",
          description: dateValidation.error,
          variant: "destructive",
        });
        return;
      }

      // Proceed with booking if dates are available
      const bookingData = {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyImages: property.images || [],
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        guests: totalGuests,
        totalAmount: calculateTotal(),
        bookingDetails: {
          property_location: property.location,
          nights: calculateNights(),
          guest_breakdown: guests,
          room_selection: selectedRoom,
          coupon_applied: appliedCoupon,
        }
      };

      toast({
        title: "Proceeding to Payment",
        description: "You'll be redirected to complete your booking with payment.",
      });

      // Navigate to payment flow
      navigate(`/booking/${property.id}/payment`, {
        state: { bookingData }
      });
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      toast({
        title: "Availability Check Failed",
        description: "Unable to verify date availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
    // Scroll to booking box
    document
      .getElementById("booking-box")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    document
      .getElementById("booking-box")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setLightboxOpen(true);
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
          <p className="text-muted-foreground mb-6">
            This property may not exist or is not yet approved for public
            viewing.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => navigate("/")} variant="default">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => navigate("/properties")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (isPropertySaved(property.id)) {
                    removeFromWishlist(property.id);
                  } else {
                    addToWishlist(property.id);
                  }
                }}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${isPropertySaved(property.id)
                    ? "fill-red-500 text-red-500"
                    : "text-gray-600"
                    }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <HeroSection
              images={property.images}
              title={property.title}
              locationText={property.location}
              onOpenLightbox={openLightbox}
              hasVideo={false} // Can be extended to check for video_url
            />

            {/* Title and rating */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.location}
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {property.rating} ({property.reviews} reviews)
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {isDayPicnic
                    ? `${property.day_picnic_capacity || property.max_guests
                    } guests max`
                    : `${property.max_guests} guests max`}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                {isDayPicnic && (
                  <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                )}
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="rooms">
                  {isDayPicnic ? "Packages" : "Rooms"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3">
                      About this place
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {property.description}
                    </p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3">
                      What this place offers
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {property.amenities.map((amenity: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline">{amenity.name}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Good to know */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Good to know</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Check-in: After 3:00 PM</li>
                      <li>• Check-out: Before 11:00 AM</li>
                      <li>• Suitable for families and groups</li>
                      <li>• Advance booking recommended</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {isDayPicnic && (
                <TabsContent value="itinerary" className="mt-6">
                  <ItineraryTimeline
                    propertyType={property.property_type}
                    packages={dayPicnicPackages}
                  />
                </TabsContent>
              )}

              <TabsContent value="location" className="mt-6">
                <MapEmbed
                  city={property.city}
                  state={property.state}
                  address={property.address}
                />
              </TabsContent>

              <TabsContent value="rooms" className="mt-6">
                {isDayPicnic ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">
                        Available Packages
                      </h3>
                      <p className="text-muted-foreground">
                        Choose the perfect package for your day picnic
                        experience
                      </p>
                    </div>

                    {dayPicnicPackages.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {dayPicnicPackages.map((pkg) => (
                          <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            onSelect={handlePackageSelect}
                            isSelected={selectedPackage?.id === pkg.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No packages available at the moment.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">
                        Available Rooms
                      </h3>
                      <p className="text-muted-foreground">
                        Choose your preferred room type for your stay
                      </p>
                    </div>

                    <div className="space-y-4">
                      {property.roomTypes.map((room: any) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onSelect={handleRoomSelect}
                          isSelected={selectedRoom?.id === room.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Reviews Section */}
            <ReviewsSection
              propertyId={property.id}
              rating={property.rating}
              reviewCount={property.reviews}
            />
          </div>

          {/* Booking Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card id="booking-box" className="shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold">
                      ₹{property.price}
                    </span>
                    <span className="text-muted-foreground">
                      {isDayPicnic ? "starting price" : "per night"}
                    </span>
                  </div>

                  {/* Date Selection */}
                  {!isDayPicnic && (
                    <div className="grid grid-cols-1 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !checkInDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {checkInDate
                              ? format(checkInDate, "PPP")
                              : "Check-in"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={checkInDate}
                            onSelect={setCheckInDate}
                            disabled={(date) => {
                              // Disable past dates
                              if (date < new Date()) return true;

                              // Disable unavailable dates
                              const dateStr = date.toISOString().split('T')[0];
                              if (propertyAvailability?.unavailableDates.includes(dateStr)) {
                                return true;
                              }

                              return false;
                            }}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !checkOutDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {checkOutDate
                              ? format(checkOutDate, "PPP")
                              : "Check-out"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={checkOutDate}
                            onSelect={setCheckOutDate}
                            disabled={(date) => {
                              // Disable dates before check-in
                              if (date < (checkInDate || new Date())) return true;

                              // Disable unavailable dates
                              const dateStr = date.toISOString().split('T')[0];
                              if (propertyAvailability?.unavailableDates.includes(dateStr)) {
                                return true;
                              }

                              return false;
                            }}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Day Picnic Date Selection */}
                  {isDayPicnic && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkInDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {checkInDate
                            ? format(checkInDate, "PPP")
                            : "Select Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={checkInDate}
                          onSelect={setCheckInDate}
                          disabled={(date) => {
                            // Disable past dates
                            if (date < new Date()) return true;

                            // Disable unavailable dates for day picnics too
                            const dateStr = date.toISOString().split('T')[0];
                            if (propertyAvailability?.unavailableDates.includes(dateStr)) {
                              return true;
                            }

                            return false;
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Guest Selection */}
                  <GuestSelector
                    maxGuests={property.max_guests}
                    onGuestsChange={setGuests}
                    initialGuests={guests}
                  />

                  {/* Package/Room Selection Display */}
                  {isDayPicnic ? (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-1">Package</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedPackage
                          ? `${selectedPackage.meal_plan?.join(", ") || "Package"
                          } - ₹${selectedPackage.base_price} ${selectedPackage.pricing_type === "per_person"
                            ? "per person"
                            : "per package"
                          }`
                          : "Select a package from the packages tab"}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-1">Room</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedRoom
                          ? `${selectedRoom.name} - ₹${selectedRoom.price} per night`
                          : property.roomTypes[0]?.name || "Standard Room"}
                      </div>
                    </div>
                  )}

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                      />
                      {appliedCoupon ? (
                        <Button variant="outline" onClick={handleCouponRemove}>
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleCouponApply}
                          disabled={isCouponLoading}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-sm text-green-600">
                        ✅ {appliedCoupon.description || "Coupon applied"}
                      </p>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="font-semibold">₹{calculateTotal()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Includes taxes and fees
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button
                    onClick={handleBooking}
                    disabled={
                      isBooking ||
                      (isDayPicnic && !selectedPackage) ||
                      (!isDayPicnic && (!checkInDate || !checkOutDate))
                    }
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isBooking
                      ? "Processing..."
                      : isDayPicnic
                        ? (selectedPackage ? "Book Day Picnic" : "Select Package First")
                        : (checkInDate && checkOutDate ? "Reserve Now" : "Select Dates First")}
                  </Button>

                  {/* Helper text for disabled state */}
                  {!isDayPicnic && (!checkInDate || !checkOutDate) && (
                    <p className="text-sm text-orange-600 text-center">
                      Please select check-in and check-out dates to continue booking
                    </p>
                  )}

                  {isDayPicnic && !selectedPackage && (
                    <p className="text-sm text-orange-600 text-center">
                      Please select a package from the packages tab to continue booking
                    </p>
                  )}

                  {/* Quick Contact */}
                  {property.contact_phone && (
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" className="flex-1" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">₹{calculateTotal()}</div>
            <div className="text-xs text-muted-foreground">
              {isDayPicnic ? "total price" : `${calculateNights()} nights`}
            </div>
          </div>
          <Button
            onClick={
              (checkInDate && checkOutDate) || (isDayPicnic && selectedPackage)
                ? handleBooking
                : () => document.getElementById("booking-box")?.scrollIntoView({ behavior: "smooth" })
            }
            disabled={
              isBooking ||
              (isDayPicnic && !selectedPackage) ||
              (!isDayPicnic && (!checkInDate || !checkOutDate))
            }
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
            size="lg"
          >
            {isBooking
              ? "Processing..."
              : isDayPicnic
                ? (selectedPackage ? "Book Day Picnic" : "Select Package")
                : (checkInDate && checkOutDate ? "Reserve Now" : "Select Dates")}
          </Button>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={property.images}
        open={lightboxOpen}
        startIndex={lightboxStartIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default PropertyDetails;
