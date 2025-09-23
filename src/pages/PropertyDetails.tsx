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
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { PropertyService } from "@/lib/propertyService";
import { BookingService } from "@/lib/bookingService";
import { CouponService, Coupon } from "@/lib/couponService";
import {
  AvailabilityService,
  PropertyAvailability,
} from "@/lib/availabilityService";
import { MessageService } from "@/lib/messageService";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import GuestSelector, { GuestBreakdown } from "@/components/ui/GuestSelector";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn, transformRoomData } from "@/lib/utils";
import { shareUtils } from "@/lib/shareUtils";
import { ShareDropdown } from "@/components/ui/ShareDropdown";

// Import new components
import { HeroSection } from "@/components/property/HeroSection";
import { ImageLightbox } from "@/components/property/ImageLightbox";
import { ItineraryTimeline } from "@/components/property/ItineraryTimeline";
import { MapEmbed } from "@/components/property/MapEmbed";
import { PackageCard } from "@/components/property/DayPicnic/PackageCard";
import { RoomCard } from "@/components/property/Rooms/RoomCard";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestBreakdown>({
    adults: 2,
    children: 0,
  });
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState<Date>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [dayPicnicDateOpen, setDayPicnicDateOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any[]>([]);
  const [dayPicnicPackages, setDayPicnicPackages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("description");
  const [propertyAvailability, setPropertyAvailability] =
    useState<PropertyAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState(null);

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
            location: `${(propertyData.location as any)?.city || ""}, ${
              (propertyData.location as any)?.state || ""
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
            rooms_details: transformRoomData(propertyData.rooms_details),
            images:
              propertyData.images && propertyData.images.length > 0
                ? propertyData.images
                : ["/placeholder.svg"],
            description:
              propertyData.description || "No description available.",
            itinerary: propertyData.itinerary || "No itinerary available.",
            packages: propertyData.packages || [],
            amenities:
              propertyData.amenities?.map((a: string) => ({
                icon: null,
                name: a.charAt(0).toUpperCase() + a.slice(1),
              })) || [],
            inclusions: propertyData.inclusions || [],
            exclusions: propertyData.exclusions || [],
            roomTypes: [
              {
                id: "default",
                name: `${
                  propertyData.property_type.charAt(0).toUpperCase() +
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
              `${
                propertyData.property_type.charAt(0).toUpperCase() +
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
      const availability = await AvailabilityService.getPropertyAvailability(
        id
      );
      setPropertyAvailability(availability);
      console.log("✅ Property availability loaded:", availability);
    } catch (error) {
      console.error("❌ Error loading property availability:", error);
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

  const calculateDetailedBreakdown = () => {
    if (isDayPicnic && selectedPackage) {
      const totalGuests = guests.adults + guests.children;
      const basePrice =
        selectedPackage.adult_price * guests.adults +
        selectedPackage.child_price * guests.children;

      const serviceFee = Math.round(basePrice * 0.1);
      const cgst = Math.round(basePrice * 0.09);
      const sgst = Math.round(basePrice * 0.09);
      const gst = cgst + sgst;

      const breakdown = [
        {
          label:
            selectedPackage.pricing_type === "per_person"
              ? `Package rate (${totalGuests} guests)`
              : "Package rate",
          amount: basePrice,
          description:
            selectedPackage.meal_plan?.join(", ") || "Day Picnic Package",
        },
        {
          label: "Service fee",
          amount: serviceFee,
          description: "10% of room rate",
        },
        {
          label: "CGST",
          amount: cgst,
          description: "9% of room rate",
        },
        {
          label: "SGST",
          amount: sgst,
          description: "9% of room rate",
        },
        {
          label: "GST",
          amount: gst,
          description: "Total GST",
        },
      ];

      const subtotal = basePrice + serviceFee;
      let couponDiscount = 0;

      if (appliedCoupon) {
        couponDiscount = CouponService.calculateDiscount(
          appliedCoupon,
          basePrice
        );
        breakdown.push({
          label: `Coupon (${appliedCoupon.code})`,
          amount: -couponDiscount,
          description: appliedCoupon.description,
        });
      }

      const total = Math.max(0, subtotal - couponDiscount) + gst;

      return {
        basePrice,
        serviceFee,
        extraGuestCharges: 0,
        childDiscounts: 0,
        couponDiscount,
        subtotal,
        total,
        cgst,
        sgst,
        gst,
        breakdown,
      };
    }

    // Regular property booking with guest-based pricing
    const nights = calculateNights();
    if (nights === 0) return null;

    const roomPrice =
      selectedRoom?.reduce((total, room) => total + (room.price || 0), 0) ||
      property?.price ||
      0;
    const basePrice = roomPrice * nights;
    const serviceFee = Math.round(basePrice * 0.1);
    const cgst = Math.round(basePrice * 0.09);
    const sgst = Math.round(basePrice * 0.09);
    const gst = cgst + sgst;
    let extraGuestCharges = 0;
    let childDiscounts = 0;

    const breakdown = [
      {
        label: `Room rate (${nights} night${nights > 1 ? "s" : ""})`,
        amount: basePrice,
        description: `₹${roomPrice}/night`,
      },
      {
        label: "Service fee",
        amount: serviceFee,
        description: "10% of room rate",
      },
      {
        label: "CGST",
        amount: cgst,
        description: "9% of room rate",
      },
      {
        label: "SGST",
        amount: sgst,
        description: "9% of room rate",
      },
      {
        label: "GST",
        amount: gst,
        description: "Total GST",
      },
    ];

    let subtotal = basePrice + serviceFee;

    // Apply guest-based pricing if configured
    if (property?.pricing) {
      const baseGuests = property.pricing.base_guests || 2;
      const totalGuests = guests.adults + guests.children;

      if (totalGuests > baseGuests) {
        const extraGuestsNeeded = totalGuests - baseGuests;
        let extraAdultsCount = Math.max(0, guests.adults - baseGuests);
        let extraChildrenCount = Math.max(
          0,
          extraGuestsNeeded - extraAdultsCount
        );

        // Add extra adult charges
        if (extraAdultsCount > 0 && property.pricing.extra_adult_charge) {
          const extraAdultTotal =
            extraAdultsCount * property.pricing.extra_adult_charge * nights;
          extraGuestCharges += extraAdultTotal;
          breakdown.push({
            label: `Extra adults (${extraAdultsCount})`,
            amount: extraAdultTotal,
            description: `₹${property.pricing.extra_adult_charge}/adult/night`,
          });
        }

        // Add extra child charges
        if (extraChildrenCount > 0 && property.pricing.extra_child_charge) {
          const extraChildTotal =
            extraChildrenCount * property.pricing.extra_child_charge * nights;
          extraGuestCharges += extraChildTotal;
          breakdown.push({
            label: `Extra children (${extraChildrenCount})`,
            amount: extraChildTotal,
            description: `₹${property.pricing.extra_child_charge}/child/night`,
          });
        }
      }

      // Apply child pricing discounts
      if (property.pricing.child_pricing && guests.children > 0) {
        guests.children.forEach((child, index) => {
          const freeAgeLimit =
            property.pricing.child_pricing.free_age_limit || 5;
          const halfPriceAgeLimit =
            property.pricing.child_pricing.half_price_age_limit || 10;
          const halfPricePercentage =
            property.pricing.child_pricing.half_price_percentage || 50;

          if (child.age <= freeAgeLimit) {
            breakdown.push({
              label: `Child ${index + 1} (Age ${child.age})`,
              amount: 0,
              description: "Free",
            });
          } else if (child.age <= halfPriceAgeLimit) {
            const childDiscount =
              (roomPrice * nights * (100 - halfPricePercentage)) / 100;
            childDiscounts += childDiscount;
            breakdown.push({
              label: `Child ${index + 1} (Age ${child.age})`,
              amount: -childDiscount,
              description: `${halfPricePercentage}% discount`,
            });
          }
        });
      }
    }

    subtotal = subtotal + extraGuestCharges - childDiscounts;

    let couponDiscount = 0;
    if (appliedCoupon) {
      couponDiscount = CouponService.calculateDiscount(appliedCoupon, subtotal);
      breakdown.push({
        label: `Coupon (${appliedCoupon.code})`,
        amount: -couponDiscount,
        description: appliedCoupon.description,
      });
    }

    const total = Math.max(0, subtotal - couponDiscount) + gst;

    return {
      basePrice,
      nights,
      serviceFee,
      extraGuestCharges,
      childDiscounts,
      couponDiscount,
      subtotal: subtotal + couponDiscount, // Subtotal before coupon
      total,
      breakdown,
      cgst,
      sgst,
      gst,
    };
  };

  const calculateTotal = () => {
    const breakdown = calculateDetailedBreakdown();
    return breakdown?.total || 0;
  };

  useEffect(() => {
    const breakdown = calculateDetailedBreakdown();
    setPriceBreakdown(breakdown);
  }, [selectedPackage, checkInDate, checkOutDate, selectedRoom, guests]);

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
          description: `${
            coupon.description || "Discount applied successfully"
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

  const handleSendMessage = async () => {
    if (!user?.id || !property?.owner_id || !messageText.trim()) {
      toast({
        title: "Error",
        description: "Please login and enter a message to contact the owner.",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      // Send message using MessageService
      await MessageService.sendMessage({
        property_id: property.id,
        receiver_id: property.owner_id,
        message: messageText.trim(),
        message_type: "text",
      });

      setMessageText("");
      setShowMessageModal(false);

      toast({
        title: "Message Sent! 📨",
        description:
          "Your message has been sent to the host. They will respond soon.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to Send",
        description: "Unable to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    const incompleteBookingData = localStorage.getItem("incompleteBookingData");
    if (incompleteBookingData) {
      const data = JSON.parse(incompleteBookingData);
      setCheckInDate(new Date(data.checkInDate));
      setCheckOutDate(new Date(data.checkOutDate));
      setGuests(data.guests);
      setPriceBreakdown(data.priceBreakdown);
      setSelectedRoom(data.selectedRoom);
      setSelectedPackage(data.selectedPackage);
      localStorage.removeItem("incompleteBookingData");
    }
  }, []);

  const handleBooking = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to your account to book this property.",
        variant: "destructive",
      });

      // TODO: save booking data to localstorage
      const incompleteBookingData = {
        checkInDate,
        checkOutDate,
        guests,
        selectedPackage,
        selectedRoom,
        priceBreakdown,
      };
      localStorage.setItem(
        "incompleteBookingData",
        JSON.stringify(incompleteBookingData)
      );
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

    if (user.role !== "customer" && user.role !== "agent") {
      toast({
        title: "Booking Restricted",
        description: "Only customers and agents can book properties.",
        variant: "destructive",
      });
      return;
    }

    // For day picnic, redirect to day picnic booking flow
    // if (isDayPicnic) {
    //   navigate(`/day-picnic/${property.id}`, {
    //     state: {
    //       selectedPackage,
    //       guests,
    //       selectedDate: checkInDate,
    //     },
    //   });
    //   return;
    // }

    // Validate stay booking
    if (!isDayPicnic && (!checkInDate || !checkOutDate)) {
      toast({
        title: "Select Your Dates",
        description: "Please choose your check-in and check-out dates.",
        variant: "destructive",
      });
      return;
    }

    if (isDayPicnic && !checkInDate) {
      toast({
        title: "Select Your Date",
        description: "Please choose your date.",
        variant: "destructive",
      });
      return;
    }

    // Validate room selection for non-day-picnic properties
    if (!isDayPicnic && !selectedRoom) {
      toast({
        title: "Select a Room",
        description: "Please select a room to continue with your booking.",
        variant: "destructive",
      });
      return;
    }

    if (isDayPicnic && !selectedPackage) {
      toast({
        title: "Select a Package",
        description: "Please select a package to continue with your booking.",
        variant: "destructive",
      });
      return;
    }

    const totalGuests = guests.adults + guests.children;
    if (totalGuests > property.max_guests) {
      toast({
        title: "Guest Limit Exceeded",
        description: `This property accommodates up to ${property.max_guests} guests.`,
        variant: "destructive",
      });
      return;
    }

    let checkInStr: string;
    let checkOutStr: string;
    if (!isDayPicnic) {
      // Check date availability before proceeding to payment
      checkInStr = checkInDate.toISOString().split("T")[0];
      checkOutStr = checkOutDate.toISOString().split("T")[0];

      // Validate booking dates first
      const dateValidation = AvailabilityService.validateBookingDates(
        checkInDate,
        checkOutDate
      );
      if (!dateValidation.valid) {
        toast({
          title: "Invalid Dates",
          description: dateValidation.error,
          variant: "destructive",
        });
        return;
      }

      // Check date availability
      const availabilityCheck =
        await AvailabilityService.checkDateRangeAvailability(
          property.id,
          checkInStr,
          checkOutStr
        );

      if (!availabilityCheck.available) {
        toast({
          title: "Property Not Available",
          description: `This property is not available for the selected dates (${checkInStr} to ${checkOutStr}). Please choose different dates.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (isDayPicnic) {
      // Check date availability before proceeding to payment
      checkInStr = checkInDate.toISOString().split("T")[0];
      checkOutStr = checkInDate.toISOString().split("T")[0];

      // Validate booking dates first
      const dateValidation =
        AvailabilityService.validateBookingDate(checkInDate);
      if (!dateValidation.valid) {
        toast({
          title: "Invalid Dates",
          description: dateValidation.error,
          variant: "destructive",
        });
        return;
      }

      // Check date availability
      const availabilityCheck = await AvailabilityService.checkDateAvailability(
        property.id,
        checkInStr
      );

      if (!availabilityCheck.available) {
        toast({
          title: "Property Not Available",
          description: `This property is not available for the selected date (${checkInStr}). Please choose different date.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Check guest count against property limits
      const totalGuests = guests.adults + guests.children;
      if (totalGuests > property.max_guests) {
        toast({
          title: "Guest Limit Exceeded",
          description: `This property accommodates up to ${property.max_guests} guests. You have selected ${totalGuests} guests.`,
          variant: "destructive",
        });
        return;
      }

      // Check if minimum guest requirement is met
      if (totalGuests < 1) {
        toast({
          title: "Minimum Guests Required",
          description: "Please select at least 1 guest for this booking.",
          variant: "destructive",
        });
        return;
      }

      // Proceed with booking if dates are available
      const detailedBreakdown = calculateDetailedBreakdown();
      const bookingData = {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyImages: property.images || [],
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        guests: totalGuests,
        totalAmount: calculateTotal(),
        priceBreakdown: detailedBreakdown,
        bookingDetails: {
          property_location: property.location,
          nights: calculateNights(),
          guest_breakdown: guests,
          room_selection: selectedRoom,
          package_selection: selectedPackage,
          coupon_applied: appliedCoupon,
        },
      };

      toast({
        title: "Proceeding to Payment",
        description:
          "You'll be redirected to complete your booking with payment.",
      });

      // Navigate to payment flow
      navigate(`/booking/${property.id}/payment`, {
        state: { bookingData },
      });
    } catch (error) {
      console.error("❌ Error checking availability:", error);
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
    setSelectedRoom((prevSelected) => {
      const exists = prevSelected.some(
        (selected) =>
          (room.id && selected.id === room.id) ||
          (!room.id && selected.type === room.type)
      );

      if (exists) {
        // Remove only the matching room
        return prevSelected.filter(
          (selected) =>
            !(
              (room.id && selected.id === room.id) ||
              (!room.id && selected.type === room.type)
            )
        );
      } else {
        // Add the room to the selection
        return [...prevSelected, room];
      }
    });
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
              <ShareDropdown
                property={property}
                onShareSuccess={() => {
                  toast({
                    title: "Shared successfully!",
                    description: shareUtils.isWebShareSupported()
                      ? "Property shared via your device's share menu"
                      : "Property link copied to clipboard",
                  });
                }}
                onCopySuccess={() => {
                  toast({
                    title: "Link copied!",
                    description: "Property link copied to clipboard",
                  });
                }}
              />
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
                  className={`w-4 h-4 transition-colors ${
                    isPropertySaved(property.id)
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
                    ? `${
                        property.day_picnic_capacity || property.max_guests
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

                  {/* Inclusions & Exclusions */}
                  {isDayPicnic && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {property.inclusions.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center text-green-600">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Inclusions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {/* Show custom inclusions */}
                              {property.inclusions.map(
                                (inclusion: string, index: number) => (
                                  <li
                                    key={`inclusion-${index}`}
                                    className="text-sm flex items-center"
                                  >
                                    <CheckCircle className="text-green-600 w-4 h-4 mr-2" />
                                    {inclusion}
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {property.exclusions.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center text-red-600">
                              <XCircle className="w-5 h-5 mr-2" />
                              Exclusions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {property.exclusions.map(
                                (exclusion: any, index: number) => (
                                  <li
                                    key={`custom-exclusion-${index}`}
                                    className="text-sm flex items-center"
                                  >
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    {typeof exclusion === "string"
                                      ? exclusion
                                      : exclusion.item}
                                    {typeof exclusion !== "string" &&
                                      exclusion.reason && (
                                        <span className="text-gray-500 ml-1">
                                          ({exclusion.reason})
                                        </span>
                                      )}
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              {isDayPicnic && (
                <TabsContent value="itinerary" className="mt-6">
                  <ItineraryTimeline
                    itinerary={property.itinerary}
                    // propertyType={property.property_type}
                    // packages={dayPicnicPackages}
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

                    {property.packages.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {property.packages.map((pkg) => (
                          <PackageCard
                            key={pkg.name}
                            pkg={pkg}
                            onSelect={handlePackageSelect}
                            isSelected={selectedPackage?.name === pkg.name}
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
                          room_details={
                            property.property_type !== "villa"
                              ? property.rooms_details
                              : null
                          }
                          key={room.id}
                          room={room}
                          onSelect={handleRoomSelect}
                          isSelected={selectedRoom?.some(
                            (r) => r.id === room.id
                          )}
                          selectedRoom={selectedRoom}
                          isVilla={property.property_type === "villa"}
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
                  {/* {!isDayPicnic && <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold">
                      ₹{property.price}
                    </span>
                    <span className="text-muted-foreground">
                      {isDayPicnic ? "starting price" : "per night"}
                    </span>
                  </div>} */}

                  {/* Date Selection */}
                  {!isDayPicnic && (
                    <div className="grid grid-cols-1 gap-2">
                      <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
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
                            onSelect={(date) => {
                              setCheckInDate(date);
                              setCheckInOpen(false);
                              // Clear check-out date if it's now invalid
                              if (
                                checkOutDate &&
                                date &&
                                checkOutDate <= date
                              ) {
                                setCheckOutDate(undefined);
                              }
                            }}
                            disabled={(date) => {
                              // Disable past dates
                              if (date < new Date()) return true;

                              // Disable unavailable dates
                              const dateStr = date.toISOString().split("T")[0];
                              if (
                                propertyAvailability?.unavailableDates.includes(
                                  dateStr
                                )
                              ) {
                                return true;
                              }

                              return false;
                            }}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover
                        open={checkOutOpen}
                        onOpenChange={setCheckOutOpen}
                      >
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
                            onSelect={(date) => {
                              setCheckOutDate(date);
                              setCheckOutOpen(false);
                            }}
                            disabled={(date) => {
                              // Disable dates before or equal to check-in date
                              if (checkInDate) {
                                if (date <= checkInDate) return true;
                              } else {
                                // If no check-in date selected, disable today and past dates
                                if (date <= new Date()) return true;
                              }

                              // Disable unavailable dates
                              const dateStr = date.toISOString().split("T")[0];
                              if (
                                propertyAvailability?.unavailableDates.includes(
                                  dateStr
                                )
                              ) {
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
                    <Popover
                      open={dayPicnicDateOpen}
                      onOpenChange={setDayPicnicDateOpen}
                    >
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
                          onSelect={(date) => {
                            setCheckInDate(date);
                            setDayPicnicDateOpen(false);
                          }}
                          disabled={(date) => {
                            // Disable past dates
                            if (date < new Date()) return true;

                            // Disable unavailable dates for day picnics too
                            const dateStr = date.toISOString().split("T")[0];
                            if (
                              propertyAvailability?.unavailableDates.includes(
                                dateStr
                              )
                            ) {
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
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Guests</div>
                    <GuestSelector
                      maxGuests={property.max_guests}
                      onGuestsChange={setGuests}
                      initialGuests={guests}
                      pricing={{
                        baseGuests: property.pricing?.base_guests,
                        extraAdultCharge: property.pricing?.extra_adult_charge,
                        extraChildCharge: property.pricing?.extra_child_charge,
                        childPricing: property.pricing?.child_pricing
                          ? {
                              freeAgeLimit:
                                property.pricing.child_pricing.free_age_limit,
                              halfPriceAgeLimit:
                                property.pricing.child_pricing
                                  .half_price_age_limit,
                              halfPricePercentage:
                                property.pricing.child_pricing
                                  .half_price_percentage,
                            }
                          : undefined,
                      }}
                      baseRoomRate={
                        selectedRoom?.reduce(
                          (total, room) => total + (room.price || 0),
                          0
                        ) ||
                        property?.roomTypes?.[0]?.price ||
                        property?.daily_rate ||
                        0
                      }
                      showPricingFeedback={true}
                    />
                  </div>

                  {/* Package/Room Selection Display */}
                  {isDayPicnic ? (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-1">Package</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedPackage
                          ? `${selectedPackage.name || "Package"} - ₹${
                              selectedPackage.adult_price
                            } per adult 
                            `
                          : // ${
                            //   selectedPackage.pricing_type === "per_person"
                            //     ? "per person"
                            //     : "per package"
                            // }
                            "Select a package from the packages tab"}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-1">Room</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedRoom.length > 0
                          ? selectedRoom.map((room, index) => (
                              <div key={index}>
                                {room.name || room.type} - ₹{room.price || 0}{" "}
                                per night
                              </div>
                            ))
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
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">
                          ₹{calculateTotal()}
                        </span>
                        {priceBreakdown && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex flex-col">
                              <small className="text-end text-xs text-red-500 underline cursor-pointer">
                                Pricing details
                              </small>
                              <div className="text-xs text-muted-foreground">
                                Price Incl. of all taxes
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>
                                <p className="text-md font-semibold">
                                  Price Breakdown
                                </p>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <div className="w-40 flex flex-col gap-2 p-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Base Price</span>
                                  <span>{priceBreakdown.basePrice}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Service Fee</span>
                                  <span>{priceBreakdown.serviceFee}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Subtotal</span>
                                  <span>{priceBreakdown.subtotal}</span>
                                </div>
                                <DropdownMenuSeparator />
                                <div className="flex justify-between">
                                  <span>CGST (9%)</span>
                                  <span>{priceBreakdown.cgst}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>SGST (9%)</span>
                                  <span>{priceBreakdown.sgst}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total GST</span>
                                  <span>{priceBreakdown.gst}</span>
                                </div>
                                <DropdownMenuSeparator />
                                <div className="flex justify-between font-semibold">
                                  <span>Total Amount</span>
                                  <span>{priceBreakdown.total}</span>
                                </div>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button
                    onClick={handleBooking}
                    disabled={
                      isBooking ||
                      (isDayPicnic &&
                        !selectedPackage &&
                        (!checkInDate || isNaN(checkInDate.getTime()))) ||
                      (!isDayPicnic &&
                        (!checkInDate ||
                          !checkOutDate ||
                          selectedRoom.length === 0))
                    }
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    Book Now
                    {/* {isBooking
                      ? "Processing..."
                      : isDayPicnic
                      ? selectedPackage
                        ? "Book Day Picnic"
                        : "Select Package First"
                      : !checkInDate || !checkOutDate
                      ? "Select Dates First"
                      : selectedRoom.length === 0
                      ? "Select Room First"
                      : "Reserve Now"} */}
                  </Button>

                  {/* Helper text for disabled state */}
                  {!isDayPicnic && (!checkInDate || !checkOutDate) && (
                    <p className="text-sm text-orange-600 text-center">
                      Please select check-in and check-out dates to continue
                      booking
                    </p>
                  )}

                  {!isDayPicnic &&
                    checkInDate &&
                    checkOutDate &&
                    !selectedRoom && (
                      <p className="text-sm text-orange-600 text-center">
                        Please select a room from the rooms tab to continue
                        booking
                      </p>
                    )}

                  {isDayPicnic && !selectedPackage && (
                    <p className="text-sm text-orange-600 text-center">
                      Please select a package from the packages tab to continue
                      booking
                    </p>
                  )}

                  {isDayPicnic &&
                    selectedPackage &&
                    (!checkInDate || isNaN(checkInDate.getTime())) && (
                      <p className="text-sm text-orange-600 text-center">
                        Please select date to continue booking
                      </p>
                    )}

                  {/* Quick Contact */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => setShowMessageModal(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message Owner
                    </Button>
                    {property.contact_phone && (
                      <Button variant="outline" className="flex-1" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-end">
            <div>
              <div className="font-semibold">₹{calculateTotal()}</div>
              <div className="text-xs text-muted-foreground">
                {isDayPicnic ? "total price" : `${calculateNights()} nights`}
              </div>
            </div>

            {priceBreakdown && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex flex-col">
                  <small className="text-left text-xs text-red-500 underline cursor-pointer">
                    Pricing details
                  </small>
                  <div className="text-xs text-muted-foreground">
                    Incl. of all taxes
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <p className="text-md font-semibold">Price Breakdown</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="w-40 flex flex-col gap-2 p-2 text-xs">
                    <div className="flex justify-between">
                      <span>Base Price</span>
                      <span>{priceBreakdown.basePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee</span>
                      <span>{priceBreakdown.serviceFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{priceBreakdown.subtotal}</span>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="flex justify-between">
                      <span>CGST (9%)</span>
                      <span>{priceBreakdown.cgst}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (9%)</span>
                      <span>{priceBreakdown.sgst}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total GST</span>
                      <span>{priceBreakdown.gst}</span>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount</span>
                      <span>{priceBreakdown.total}</span>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <Button
            onClick={
              (checkInDate && checkOutDate && selectedRoom.length > 0) ||
              (isDayPicnic && selectedPackage)
                ? handleBooking
                : () =>
                    document
                      .getElementById("booking-box")
                      ?.scrollIntoView({ behavior: "smooth" })
            }
            disabled={
              isBooking ||
              (isDayPicnic && !selectedPackage) ||
              (!isDayPicnic &&
                (!checkInDate || !checkOutDate || selectedRoom.length === 0))
            }
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
            size="lg"
          >
            {isBooking
              ? "Processing..."
              : isDayPicnic
              ? selectedPackage
                ? "Book Day Picnic"
                : "Select Package"
              : !checkInDate || !checkOutDate
              ? "Select Dates"
              : selectedRoom.length === 0
              ? "Select Room"
              : "Reserve Now"}
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

      {/* Message Owner Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message Host
            </DialogTitle>
            <DialogDescription>
              Send a message to the host about this listing. They'll respond to
              you directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Hi! I'm interested in this property. Could you please provide more details about..."
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Be specific about your questions to get a helpful response.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowMessageModal(false);
                setMessageText("");
              }}
              disabled={sendingMessage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageText.trim()}
            >
              {sendingMessage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetails;
