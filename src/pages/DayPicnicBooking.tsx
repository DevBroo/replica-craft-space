import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GuestSelector, { GuestBreakdown } from '@/components/ui/GuestSelector';
import GuestInformationForm, { GuestInfo } from '@/components/ui/GuestInformationForm';
import { CouponService, Coupon } from '@/lib/couponService';
import { AvailabilityService } from '@/lib/availabilityService';
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  CreditCard,
  Tag,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const DayPicnicBooking: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [package_, setPackage] = useState<any>(null);
  const [optionPrices, setOptionPrices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [guests, setGuests] = useState<GuestBreakdown>({ adults: 2, children: [] });
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [durationPrices, setDurationPrices] = useState<{ duration_type: string; price: number }[]>([]);
  const [customHours, setCustomHours] = useState(4);
  const [hourlyRates, setHourlyRates] = useState<any[]>([]);
  const [mealPrices, setMealPrices] = useState<any[]>([]);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    name: '',
    phone: '',
    dateOfBirth: ''
  });

  // Coupon related state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Time duration options
  const durationOptions = [
    { value: 'half_day', label: 'Half Day (4-5 hrs)', hours: '4-5' },
    { value: 'full_day', label: 'Full Day (6-8 hrs)', hours: '6-8' },
    { value: 'extended_day', label: 'Extended Day (10+ hrs)', hours: '10+' },
    { value: 'custom', label: 'Custom Hours', hours: 'Custom' }
  ];

  useEffect(() => {
    if (propertyId) {
      fetchPropertyAndPackage();
    }
  }, [propertyId]);

  // Initialize duration from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const durationParam = params.get('duration');
    if (durationParam) {
      setSelectedDuration(durationParam.replace('-', '_'));
    }
  }, []);

  // Set initial duration based on package duration_hours
  useEffect(() => {
    if (package_?.duration_hours && !selectedDuration) {
      const hours = package_.duration_hours;
      if (hours >= 10) {
        setSelectedDuration('extended_day');
      } else if (hours >= 6) {
        setSelectedDuration('full_day');
      } else {
        setSelectedDuration('half_day');
      }
    }
  }, [package_, selectedDuration]);

  const fetchPropertyAndPackage = async () => {
    try {
      // Fetch property details from properties_public first
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties_public')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle();

      if (propertyError) throw propertyError;
      if (!propertyData) {
        toast({
          title: "Property Not Found",
          description: "The requested property could not be found",
          variant: "destructive"
        });
        navigate('/properties');
        return;
      }
      setProperty(propertyData);

      // Fetch day picnic package - use maybeSingle to handle missing packages
      const { data: packageData, error: packageError } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', propertyId)
        .limit(1)
        .maybeSingle();

      if (packageError) throw packageError;

      // Create virtual package if none exists
      if (!packageData) {
        const virtualPackage = {
          id: null,
          property_id: propertyId,
          meal_plan: ["Lunch", "Snacks"],
          start_time: "09:00:00",
          end_time: "18:00:00",
          duration_hours: 9,
          pricing_type: "per_person",
          base_price: (propertyData.pricing as any)?.daily_rate || 1500,
          inclusions: ["Basic facilities", "Parking", "Common areas access"],
          exclusions: [
            { item: "Food & beverages", reason: "Available separately" },
            { item: "Transportation", reason: "Not included" }
          ],
          add_ons: [],
          min_hours: 4
        };
        setPackage(virtualPackage);
        setDurationPrices([]); // No explicit duration prices for virtual packages
      } else {
        setPackage(packageData);

        // Fetch duration prices and option prices only if real package exists
        const { data: durationData, error: durationError } = await supabase
          .from('day_picnic_option_prices')
          .select('*')
          .eq('package_id', packageData.id)
          .eq('option_type', 'duration');

        if (durationError) throw durationError;
        if (durationData) {
          setDurationPrices(durationData.map(dur => ({
            duration_type: dur.name,
            price: dur.price
          })));
        }

        // Fetch hourly rates for custom hours pricing
        const { data: hourlyData, error: hourlyError } = await supabase
          .from('day_picnic_hourly_rates')
          .select('*')
          .eq('package_id', packageData.id);

        if (hourlyError) throw hourlyError;
        if (hourlyData) {
          setHourlyRates(hourlyData);
        }

        // Fetch meal prices
        const { data: mealPriceData, error: mealPriceError } = await supabase
          .from('day_picnic_meal_prices')
          .select('*')
          .eq('package_id', packageData.id);

        if (mealPriceError) throw mealPriceError;
        if (mealPriceData) {
          setMealPrices(mealPriceData);
        }

        // Fetch all option prices (inclusions, exclusions, add_ons)
        const { data: optionData, error: optionError } = await supabase
          .from('day_picnic_option_prices')
          .select('*')
          .eq('package_id', packageData.id)
          .in('option_type', ['inclusion', 'exclusion', 'add_on']);

        if (optionError) throw optionError;
        if (optionData) {
          setOptionPrices(optionData);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load day picnic details",
        variant: "destructive"
      });
      navigate('/properties');
    }
  };

  const handleAddOnChange = (addOnName: string, checked: boolean) => {
    setSelectedAddOns(prev =>
      checked
        ? [...prev, addOnName]
        : prev.filter(name => name !== addOnName)
    );
  };

  const handleCouponApply = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const coupon = await CouponService.validateCoupon(couponCode, propertyId);

      if (!coupon) {
        setCouponError('Invalid or expired coupon code');
        return;
      }

      const subtotal = calculateSubtotal();
      if (subtotal < coupon.min_order_amount) {
        setCouponError(`Minimum order amount is ₹${coupon.min_order_amount}`);
        return;
      }

      setAppliedCoupon(coupon);
      toast({
        title: "Coupon Applied!",
        description: `${coupon.description || `${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ''} discount applied`}`,
      });
    } catch (error) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your booking",
    });
  };

  const calculateSubtotal = () => {
    if (!package_) return 0;

    let basePrice = 0;

    // Handle custom hours pricing
    if (selectedDuration === 'custom' && hourlyRates.length > 0) {
      // Calculate price based on selected custom hours using hourly rates
      for (let hour = 1; hour <= customHours; hour++) {
        const hourlyRate = hourlyRates.find(rate => 
          rate.meal_plan === 'ALL' && rate.hour_number === hour
        );
        
        if (hourlyRate) {
          if (package_.pricing_type === 'per_person') {
            // Calculate price for adults
            basePrice += hourlyRate.price_per_person * guests.adults;
            
            // Calculate price for children based on age
            guests.children.forEach(child => {
              if (child.priceCategory === 'free') {
                basePrice += 0;
              } else if (child.priceCategory === 'half') {
                basePrice += hourlyRate.price_per_person * 0.5;
              } else {
                basePrice += hourlyRate.price_per_person;
              }
            });
          } else {
            // Fixed package price per hour
            basePrice += hourlyRate.price_per_package;
          }
        }
      }
    } else {
      // Original logic for predefined durations
      // Check if owner has set explicit duration prices
      const durationPrice = durationPrices.find(dp => dp.duration_type === selectedDuration);

      if (durationPrice) {
        // Use explicit duration price set by owner
        if (package_.pricing_type === 'per_person') {
          // Calculate price for adults
          basePrice += durationPrice.price * guests.adults;

          // Calculate price for children based on age
          guests.children.forEach(child => {
            if (child.priceCategory === 'free') {
              basePrice += 0;
            } else if (child.priceCategory === 'half') {
              basePrice += durationPrice.price * 0.5;
            } else {
              basePrice += durationPrice.price;
            }
          });
        } else {
          // Fixed price regardless of guest count
          basePrice = durationPrice.price;
        }
      } else {
        // Fall back to multiplier-based pricing
        const durationMultipliers = {
          'half_day': 0.6,
          'full_day': 1.0,
          'extended_day': 1.5
        };

        const multiplier = durationMultipliers[selectedDuration as keyof typeof durationMultipliers] || 1.0;
        const adjustedBasePrice = package_.base_price * multiplier;

        if (package_.pricing_type === 'per_person') {
          // Calculate price for adults
          basePrice += adjustedBasePrice * guests.adults;

          // Calculate price for children based on age
          guests.children.forEach(child => {
            if (child.priceCategory === 'free') {
              basePrice += 0;
            } else if (child.priceCategory === 'half') {
              basePrice += adjustedBasePrice * 0.5;
            } else {
              basePrice += adjustedBasePrice;
            }
          });
        } else {
          // Fixed price regardless of guest count
          basePrice = adjustedBasePrice;
        }
      }
    }

    const addOnPrice = selectedAddOns.reduce((total, addOnName) => {
      const addOn = package_.add_ons.find((ao: any) => ao.name === addOnName);
      return total + (addOn ? addOn.price : 0);
    }, 0);

    return basePrice + addOnPrice;
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return CouponService.calculateDiscount(appliedCoupon, calculateSubtotal());
  };

  const calculateTotalPrice = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
  };

  const calculateDetailedBreakdown = () => {
    if (!package_) return null;

    const breakdown = [];
    let basePrice = 0;

    // Handle custom hours pricing
    if (selectedDuration === 'custom' && hourlyRates.length > 0) {
      for (let hour = 1; hour <= customHours; hour++) {
        const hourlyRate = hourlyRates.find(rate => 
          rate.meal_plan === 'ALL' && rate.hour_number === hour
        );
        
        if (hourlyRate) {
          if (package_.pricing_type === 'per_person') {
            const hourPrice = hourlyRate.price_per_person * (guests.adults + guests.children.length);
            basePrice += hourPrice;
          } else {
            basePrice += hourlyRate.price_per_package;
          }
        }
      }
      breakdown.push({
        label: `Custom hours (${customHours} hrs)`,
        amount: basePrice,
        description: package_.pricing_type === 'per_person' 
          ? `₹${Math.round(basePrice / (guests.adults + guests.children.length))}/person` 
          : 'Package rate'
      });
    } else {
      // Original logic for predefined durations
      const durationPrice = durationPrices.find(dp => dp.duration_type === selectedDuration);
      
      if (durationPrice) {
        if (package_.pricing_type === 'per_person') {
          basePrice += durationPrice.price * guests.adults;
          breakdown.push({
            label: `Adults (${guests.adults})`,
            amount: durationPrice.price * guests.adults,
            description: `₹${durationPrice.price}/adult`
          });

          guests.children.forEach((child, index) => {
            let childPrice = 0;
            let childDescription = '';
            
            if (child.priceCategory === 'free') {
              childPrice = 0;
              childDescription = 'Free';
            } else if (child.priceCategory === 'half') {
              childPrice = durationPrice.price * 0.5;
              childDescription = '50% discount';
            } else {
              childPrice = durationPrice.price;
              childDescription = 'Full price';
            }
            
            basePrice += childPrice;
            breakdown.push({
              label: `Child ${index + 1} (Age ${child.age})`,
              amount: childPrice,
              description: childDescription
            });
          });
        } else {
          basePrice = durationPrice.price;
          breakdown.push({
            label: `Package rate (${selectedDuration.replace('_', ' ')})`,
            amount: basePrice,
            description: 'Fixed package price'
          });
        }
      } else {
        // Fall back to multiplier-based pricing
        const durationMultipliers = {
          'half_day': 0.6,
          'full_day': 1.0,
          'extended_day': 1.5
        };
        const multiplier = durationMultipliers[selectedDuration as keyof typeof durationMultipliers] || 1.0;
        const adjustedBasePrice = package_.base_price * multiplier;

        if (package_.pricing_type === 'per_person') {
          basePrice += adjustedBasePrice * guests.adults;
          breakdown.push({
            label: `Adults (${guests.adults})`,
            amount: adjustedBasePrice * guests.adults,
            description: `₹${adjustedBasePrice}/adult`
          });

          guests.children.forEach((child, index) => {
            let childPrice = 0;
            let childDescription = '';
            
            if (child.priceCategory === 'free') {
              childPrice = 0;
              childDescription = 'Free';
            } else if (child.priceCategory === 'half') {
              childPrice = adjustedBasePrice * 0.5;
              childDescription = '50% discount';
            } else {
              childPrice = adjustedBasePrice;
              childDescription = 'Full price';
            }
            
            basePrice += childPrice;
            breakdown.push({
              label: `Child ${index + 1} (Age ${child.age})`,
              amount: childPrice,
              description: childDescription
            });
          });
        } else {
          basePrice = adjustedBasePrice;
          breakdown.push({
            label: `Package rate (${selectedDuration.replace('_', ' ')})`,
            amount: basePrice,
            description: 'Fixed package price'
          });
        }
      }
    }

    // Add selected add-ons
    selectedAddOns.forEach(addOnName => {
      const addOn = package_.add_ons.find((ao: any) => ao.name === addOnName);
      if (addOn) {
        breakdown.push({
          label: `Add-on: ${addOn.name}`,
          amount: addOn.price,
          description: addOn.description || 'Additional service'
        });
      }
    });

    const addOnPrice = selectedAddOns.reduce((total, addOnName) => {
      const addOn = package_.add_ons.find((ao: any) => ao.name === addOnName);
      return total + (addOn ? addOn.price : 0);
    }, 0);

    let subtotal = basePrice + addOnPrice;
    let couponDiscount = 0;

    if (appliedCoupon) {
      couponDiscount = CouponService.calculateDiscount(appliedCoupon, subtotal);
      breakdown.push({
        label: `Coupon (${appliedCoupon.code})`,
        amount: -couponDiscount,
        description: appliedCoupon.description
      });
    }

    const total = Math.max(0, subtotal - couponDiscount);

    return {
      basePrice,
      serviceFee: 0,
      extraGuestCharges: 0,
      childDiscounts: 0,
      couponDiscount,
      subtotal,
      total,
      breakdown
    };
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book this day picnic",
        variant: "destructive"
      });
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    if (!selectedDate || selectedDate.trim() === '') {
      toast({
        title: "Start Date Required",
        description: "Please select a start date for your day picnic",
        variant: "destructive"
      });
      return;
    }


    // Validate guest information
    if (!guestInfo.name.trim()) {
      toast({
        title: "Guest Name Required",
        description: "Please enter the guest's full name",
        variant: "destructive"
      });
      return;
    }

    if (!guestInfo.phone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter the guest's phone number",
        variant: "destructive"
      });
      return;
    }

    if (!guestInfo.dateOfBirth) {
      toast({
        title: "Date of Birth Required",
        description: "Please enter the guest's date of birth",
        variant: "destructive"
      });
      return;
    }

    // Check guest count against package limits
    const totalGuests = guests.adults + guests.children.length;
    if (package_.max_guests && totalGuests > package_.max_guests) {
      toast({
        title: "Guest Limit Exceeded",
        description: `This package accommodates up to ${package_.max_guests} guests. You have selected ${totalGuests} guests.`,
        variant: "destructive",
      });
      return;
    }

    if (package_.min_guests && totalGuests < package_.min_guests) {
      toast({
        title: "Minimum Guests Required",
        description: `This package requires at least ${package_.min_guests} guests. You have selected ${totalGuests} guests.`,
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

    // Check date availability for day picnic
    try {
      const dateStr = selectedDate;
      const availabilityCheck = await AvailabilityService.checkDateRangeAvailability(
        propertyId!,
        dateStr,
        dateStr
      );

      if (!availabilityCheck.available) {
        toast({
          title: "Property Not Available",
          description: `This property is not available for day picnic on ${new Date(selectedDate).toLocaleDateString()}. Please choose a different date.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error checking day picnic availability:', error);
      toast({
        title: "Availability Check Failed",
        description: "Unable to verify property availability. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to payment flow for day picnic booking
    const detailedBreakdown = calculateDetailedBreakdown();
    const bookingData = {
      propertyId: propertyId,
      propertyTitle: property?.title || 'Day Picnic',
      propertyImages: property?.images || [],
      checkInDate: selectedDate,
      guests: guests.adults + guests.children.length,
      totalAmount: calculateTotalPrice(),
      priceBreakdown: detailedBreakdown,
      // Add mandatory guest information
      guestName: guestInfo.name.trim(),
      guestPhone: guestInfo.phone.trim(),
      guestDateOfBirth: guestInfo.dateOfBirth,
      bookingDetails: {
        booking_type: 'day_picnic',
        package_id: package_.id,
        package_title: package_.meal_plan?.join(", ") || "Day Picnic Package",
        start_time: package_.start_time,
        end_time: package_.end_time,
        duration: selectedDuration,
        custom_hours: selectedDuration === 'custom' ? customHours : undefined,
        meal_plan: package_.meal_plan,
        selected_add_ons: selectedAddOns,
        pricing_type: package_.pricing_type,
        guest_breakdown: JSON.parse(JSON.stringify(guests)),
        coupon_details: appliedCoupon ? {
          code: appliedCoupon.code,
          discount_type: appliedCoupon.discount_type,
          discount_value: appliedCoupon.discount_value,
          discount_amount: calculateDiscount()
        } : null
      }
    };

    toast({
      title: "Proceeding to Payment",
      description: "You'll be redirected to complete your day picnic booking with payment.",
    });

    // Navigate to payment flow
    navigate(`/booking/${propertyId}/payment`, {
      state: { bookingData }
    });
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  if (!property || !package_) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading day picnic details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/properties')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Day Picnic Booking</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">Day Picnic at {property.title}</h2>
                    <p className="text-gray-600 flex items-center mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.address}
                    </p>
                    <p className="text-gray-600 flex items-center mb-2">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime12Hour(package_.start_time)} - {formatTime12Hour(package_.end_time)} ({package_.duration_hours}h)
                    </p>
                    <p className="text-red-600 flex items-center font-medium">
                      <Users className="w-4 h-4 mr-1" />
                      Max capacity: {property.day_picnic_capacity || property.max_guests || 0} guests for day picnic
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meal Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Meal Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {package_.meal_plan.map((meal: string) => {
                    const mealPrice = mealPrices.find(mp => mp.meal_plan === meal);
                    const price = package_.pricing_type === 'per_person' 
                      ? mealPrice?.price_per_person 
                      : mealPrice?.price_per_package;
                    
                    return (
                      <div key={meal} className="border rounded-lg p-3 bg-green-50">
                        <div className="flex items-center justify-between">
                          {/* <Badge className="bg-green-100 text-green-800 border-green-200"> */}
                            {meal}
                          {/* </Badge> */}
                        </div>
                        {/* {price && price > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="font-semibold text-green-700">
                              ₹{price} {package_.pricing_type === 'per_person' ? '/person' : '/package'}
                            </span>
                          </div>
                        )} */}
                        {/* {(!price || price === 0) && (
                          <div className="mt-2 text-sm text-gray-500">
                            Included in base price
                          </div>
                        )} */}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Inclusions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {/* Show selected amenities */}
                    {property?.amenities?.map((amenity: string, index: number) => (
                      <li key={`amenity-${index}`} className="text-sm flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {amenity}
                      </li>
                    ))}
                    {/* Show custom inclusions */}
                    {package_.inclusions.map((inclusion: string, index: number) => (
                      <li key={`inclusion-${index}`} className="text-sm flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {inclusion}
                      </li>
                    ))}
                    {/* Show meal plans as inclusions */}
                    {package_.meal_plan.map((meal: string, index: number) => (
                      <li key={`meal-${index}`} className="text-sm flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {meal} available
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <XCircle className="w-5 h-5 mr-2" />
                    Exclusions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(() => {
                      // All available amenities
                      const allAmenities = [
                        'Swimming Pool', 'Garden Area', 'BBQ Facilities', 'Outdoor Games', 
                        'Music System', 'Parking', 'Restrooms', 'Changing Rooms',
                        'Seating Area', 'Shade/Gazebo', 'Kitchen Access', 'Power Supply',
                        'Water Supply', 'First Aid', 'Security', 'Photography Area'
                      ];
                      
                      // All available meal options
                      const allMealOptions = [
                        'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages', 
                        'Welcome Drink', 'BBQ', 'Traditional Meals', 'Vegetarian Options', 'Non-Vegetarian Options'
                      ];
                      
                      const selectedAmenities = property?.amenities || [];
                      const selectedMeals = package_.meal_plan || [];
                      
                      // Find unselected amenities and meals
                      const unselectedAmenities = allAmenities.filter(amenity => !selectedAmenities.includes(amenity));
                      const unselectedMeals = allMealOptions.filter(meal => !selectedMeals.includes(meal));
                      
                      return (
                        <>
                          {/* Show unselected amenities */}
                          {unselectedAmenities.slice(0, 8).map((amenity: string, index: number) => (
                            <li key={`excluded-amenity-${index}`} className="text-sm flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                              {amenity}
                            </li>
                          ))}
                          {/* Show unselected meal options */}
                          {unselectedMeals.slice(0, 5).map((meal: string, index: number) => (
                            <li key={`excluded-meal-${index}`} className="text-sm flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                              {meal}
                            </li>
                          ))}
                          {/* Show custom exclusions */}
                          {package_.exclusions.map((exclusion: any, index: number) => (
                            <li key={`custom-exclusion-${index}`} className="text-sm flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                              {typeof exclusion === 'string' ? exclusion : exclusion.item}
                              {typeof exclusion !== 'string' && exclusion.reason && (
                                <span className="text-gray-500 ml-1">({exclusion.reason})</span>
                              )}
                            </li>
                          ))}
                          {/* Show exclusions with pricing */}
                          {optionPrices
                            .filter((option: any) => option.option_type === 'exclusion')
                            .map((exclusion: any, index: number) => (
                              <li key={`pricing-exclusion-${index}`} className="text-sm flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                  {exclusion.name}
                                </div>
                                <span className="text-red-600 font-medium">+₹{exclusion.price}</span>
                              </li>
                            ))}
                        </>
                      );
                    })()}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Add-ons */}
            {package_.add_ons && package_.add_ons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Add-ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {package_.add_ons.map((addOn: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`addon-${index}`}
                            checked={selectedAddOns.includes(addOn.name)}
                            onCheckedChange={(checked) => handleAddOnChange(addOn.name, checked as boolean)}
                          />
                          <Label htmlFor={`addon-${index}`} className="font-medium">
                            {addOn.name}
                          </Label>
                        </div>
                        <span className="font-semibold text-red-600">₹{addOn.price}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Book Your Day Picnic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`border-2 rounded-lg p-3 ${!selectedDate ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                    <Label htmlFor="date" className={`${!selectedDate ? 'text-red-700 font-semibold' : 'text-gray-700 font-semibold'}`}>
                      Start Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className={`mt-2 ${!selectedDate ? 'border-red-300 focus:border-red-500' : ''}`}
                      placeholder="Please select a start date"
                    />
                    {!selectedDate && (
                      <p className="text-sm text-red-600 mt-1 font-medium">⚠️ Start date is required</p>
                    )}
                  </div>

                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Choose Duration</Label>
                  <div className="space-y-3">
                    {durationOptions.map((option) => {
                      let displayPrice = 0;
                      let priceDescription = '';

                      if (option.value === 'custom') {
                        // Calculate custom hours price
                        if (hourlyRates.length > 0) {
                          for (let hour = 1; hour <= customHours; hour++) {
                            const hourlyRate = hourlyRates.find(rate => 
                              rate.meal_plan === 'ALL' && rate.hour_number === hour
                            );
                            if (hourlyRate) {
                              if (package_?.pricing_type === 'per_person') {
                                displayPrice += hourlyRate.price_per_person;
                              } else {
                                displayPrice += hourlyRate.price_per_package;
                              }
                            }
                          }
                          priceDescription = 'Hourly pricing';
                        } else {
                          displayPrice = package_?.base_price * customHours || 0;
                          priceDescription = 'Standard hourly rate';
                        }
                      } else {
                        // Original logic for predefined durations
                        const durationPrice = durationPrices.find(dp => dp.duration_type === option.value);
                        const fallbackMultipliers = {
                          'half_day': 0.6,
                          'full_day': 1.0,
                          'extended_day': 1.5
                        };
                        const fallbackPrice = package_?.base_price * (fallbackMultipliers[option.value as keyof typeof fallbackMultipliers] || 1.0);
                        displayPrice = durationPrice?.price || fallbackPrice;
                        priceDescription = durationPrice ? 'Owner-set pricing' : 'Standard pricing with duration multiplier';
                      }

                      return (
                        <div
                          key={option.value}
                          onClick={() => setSelectedDuration(option.value)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 ${selectedDuration === option.value
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-900">{option.label}</h4>
                              <p className="text-sm text-gray-600">
                                {option.value === 'custom' ? `${customHours} hours selected` : `${option.hours} hours of fun`}
                              </p>
                              <p className="text-xs text-red-600 mt-1">✓ {priceDescription}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-600">₹{Math.round(displayPrice)}</p>
                              <p className="text-xs text-gray-500">{package_?.pricing_type?.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {selectedDuration === option.value && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-sm text-primary">✓ Selected for your day picnic</p>
                              {option.value === 'custom' && (
                                <div className="mt-3">
                                  <Label className="text-sm text-gray-600 mb-2 block">Select Hours (1-{package_?.duration_hours || 12})</Label>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="range"
                                      min="1"
                                      max={package_?.duration_hours || 12}
                                      value={customHours}
                                      onChange={(e) => setCustomHours(parseInt(e.target.value))}
                                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                      style={{
                                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(customHours - 1) / ((package_?.duration_hours || 12) - 1) * 100}%, #e5e7eb ${(customHours - 1) / ((package_?.duration_hours || 12) - 1) * 100}%, #e5e7eb 100%)`
                                      }}
                                      aria-label="Select custom hours"
                                    />
                                    <Input
                                      type="number"
                                      min="1"
                                      max={package_?.duration_hours || 12}
                                      value={customHours}
                                      onChange={(e) => setCustomHours(Math.min(Math.max(1, parseInt(e.target.value) || 1), package_?.duration_hours || 12))}
                                      className="w-20 h-8 text-center"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {hourlyRates.length > 0 ? 'Price calculated using owner-set hourly rates' : 'Using standard hourly calculation'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Select Guests</Label>
                  <GuestSelector
                    maxGuests={property.max_guests}
                    onGuestsChange={setGuests}
                    initialGuests={guests}
                    pricing={{
                      baseGuests: property.pricing?.base_guests,
                      extraAdultCharge: property.pricing?.extra_adult_charge,
                      extraChildCharge: property.pricing?.extra_child_charge,
                      childPricing: property.pricing?.child_pricing ? {
                        freeAgeLimit: property.pricing.child_pricing.free_age_limit,
                        halfPriceAgeLimit: property.pricing.child_pricing.half_price_age_limit,
                        halfPricePercentage: property.pricing.child_pricing.half_price_percentage
                      } : undefined
                    }}
                    baseRoomRate={package_?.base_price || 0}
                    showPricingFeedback={true}
                  />
                </div>

                {/* Guest Information Form */}
                <div>
                  <GuestInformationForm
                    onGuestInfoChange={setGuestInfo}
                    initialData={guestInfo}
                    showTitle={true}
                    required={true}
                  />
                </div>

                {/* Coupon Code Section */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-3 block">Coupon Code</Label>
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleCouponApply}
                          disabled={couponLoading || !couponCode.trim()}
                          variant="outline"
                          size="sm"
                        >
                          {couponLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Tag className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-600">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                          <p className="text-sm text-green-600">
                            {appliedCoupon.description || `${appliedCoupon.discount_value}${appliedCoupon.discount_type === 'percentage' ? '%' : ''} discount`}
                          </p>
                        </div>
                        <Button
                          onClick={handleCouponRemove}
                          variant="ghost"
                          size="sm"
                          className="text-green-700 hover:text-green-800"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Price Breakdown</h4>
                  <div className="space-y-2">
                    {package_.pricing_type === 'per_person' ? (
                      <>
                        <div className="flex justify-between">
                          <span>Adults ({guests.adults})</span>
                          <span>₹{(package_.base_price * guests.adults).toLocaleString()}</span>
                        </div>
                        {guests.children.map((child, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>Child {index + 1} (Age {child.age})</span>
                            <span>
                              {child.priceCategory === 'free' && '₹0 (Free)'}
                              {child.priceCategory === 'half' && `₹${(package_.base_price * 0.5).toLocaleString()} (Half)`}
                              {child.priceCategory === 'full' && `₹${package_.base_price.toLocaleString()} (Full)`}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>Base Price (Fixed)</span>
                        <span>₹{package_.base_price.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedAddOns.map(addOnName => {
                      const addOn = package_.add_ons.find((ao: any) => ao.name === addOnName);
                      return (
                        <div key={addOnName} className="flex justify-between text-sm">
                          <span>{addOnName}</span>
                          <span>₹{addOn?.price || 0}</span>
                        </div>
                      );
                    })}

                    {appliedCoupon && (
                      <>
                        <div className="flex justify-between border-t pt-2">
                          <span>Subtotal</span>
                          <span>₹{calculateSubtotal().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({appliedCoupon.code})</span>
                          <span>-₹{calculateDiscount().toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-red-600">₹{calculateTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={loading || !selectedDate || selectedDate.trim() === '' || !guestInfo.name.trim() || !guestInfo.phone.trim() || !guestInfo.dateOfBirth}
                  className="w-full"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Book Now - ₹{calculateTotalPrice().toLocaleString()}
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-600 text-center">
                    You'll need to login to complete booking
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayPicnicBooking;
