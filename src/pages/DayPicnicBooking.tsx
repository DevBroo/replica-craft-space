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
import { CouponService, Coupon } from '@/lib/couponService';
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

const DayPicnicBooking: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [package_, setPackage] = useState<any>(null);
  const [optionPrices, setOptionPrices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDuration, setSelectedDuration] = useState('');
  const [guests, setGuests] = useState<GuestBreakdown>({ adults: 2, children: [] });
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [durationPrices, setDurationPrices] = useState<{ duration_type: string; price: number }[]>([]);
  
  // Coupon related state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Time duration options
  const durationOptions = [
    { value: 'half_day', label: 'Half Day (4-5 hrs)', hours: '4-5' },
    { value: 'full_day', label: 'Full Day (6-8 hrs)', hours: '6-8' },
    { value: 'extended_day', label: 'Extended Day (10+ hrs)', hours: '10+' }
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

    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for your day picnic",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        property_id: propertyId,
        user_id: user?.id,
        check_in_date: selectedDate,
        check_out_date: selectedDate, // Same day for day picnics
        guests: guests.adults + guests.children.length,
        total_amount: calculateTotalPrice(),
        booking_details: {
          booking_type: 'day_picnic',
          package_id: package_.id,
          start_time: package_.start_time,
          end_time: package_.end_time,
          duration: selectedDuration,
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

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Successful!",
        description: "Your day picnic has been booked successfully",
      });

      // Navigate to booking confirmation page
      navigate(`/booking/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book day picnic",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
                    <p className="text-blue-600 flex items-center font-medium">
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
                <div className="flex flex-wrap gap-2">
                  {package_.meal_plan.map((meal: string) => (
                    <Badge key={meal} className="bg-green-100 text-green-800">
                      {meal}
                    </Badge>
                  ))}
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
                  <ul className="space-y-1">
                    {package_.inclusions.map((inclusion: string, index: number) => (
                      <li key={index} className="text-sm flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {inclusion}
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
                  <ul className="space-y-1">
                    {/* Show exclusions with pricing first */}
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
                    {/* Fallback to legacy exclusions if no pricing exclusions */}
                    {optionPrices.filter((option: any) => option.option_type === 'exclusion').length === 0 &&
                      package_.exclusions.map((exclusion: any, index: number) => (
                        <li key={`legacy-exclusion-${index}`} className="text-sm flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {exclusion.item} ({exclusion.reason})
                        </li>
                      ))}
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
                        <span className="font-semibold text-green-600">₹{addOn.price}</span>
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
                <div>
                  <Label htmlFor="date">Select Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {!selectedDate && (
                    <p className="text-sm text-muted-foreground mt-1">Please select a date to enable booking</p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Choose Duration</Label>
                  <div className="space-y-3">
                    {durationOptions.map((option) => {
                      const durationPrice = durationPrices.find(dp => dp.duration_type === option.value);
                      const fallbackMultipliers = {
                        'half_day': 0.6,
                        'full_day': 1.0,
                        'extended_day': 1.5
                      };
                      const fallbackPrice = package_?.base_price * (fallbackMultipliers[option.value as keyof typeof fallbackMultipliers] || 1.0);
                      const displayPrice = durationPrice?.price || fallbackPrice;
                      
                      return (
                        <div 
                          key={option.value}
                          onClick={() => setSelectedDuration(option.value)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                            selectedDuration === option.value 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-900">{option.label}</h4>
                              <p className="text-sm text-gray-600">{option.hours} hours of fun</p>
                              {durationPrice ? (
                                <p className="text-xs text-green-600 mt-1">✓ Owner-set pricing</p>
                              ) : (
                                <p className="text-xs text-blue-600 mt-1">Standard pricing with duration multiplier</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">₹{Math.round(displayPrice)}</p>
                              <p className="text-xs text-gray-500">{package_?.pricing_type?.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {selectedDuration === option.value && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-sm text-primary">✓ Selected for your day picnic</p>
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
                      <span className="text-green-600">₹{calculateTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleBooking} 
                  disabled={loading || !selectedDate}
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
