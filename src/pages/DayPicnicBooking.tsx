
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
import { 
  Clock, 
  MapPin, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  CreditCard
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
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [guests, setGuests] = useState<GuestBreakdown>({ adults: 2, children: [] });
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

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
      // Fetch property details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Fetch day picnic package
      const { data: packageData, error: packageError } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (packageError) throw packageError;
      setPackage(packageData);
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

  const calculateTotalPrice = () => {
    if (!package_) return 0;
    
    let basePrice = 0;
    
    if (package_.pricing_type === 'per_person') {
      // Calculate price for adults
      basePrice += package_.base_price * guests.adults;
      
      // Calculate price for children based on age
      guests.children.forEach(child => {
        if (child.priceCategory === 'free') {
          basePrice += 0;
        } else if (child.priceCategory === 'half') {
          basePrice += package_.base_price * 0.5;
        } else {
          basePrice += package_.base_price;
        }
      });
    } else {
      // Fixed price regardless of guest count
      basePrice = package_.base_price;
    }
    
    const addOnPrice = selectedAddOns.reduce((total, addOnName) => {
      const addOn = package_.add_ons.find((ao: any) => ao.name === addOnName);
      return total + (addOn ? addOn.price : 0);
    }, 0);

    return basePrice + addOnPrice;
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book this day picnic",
        variant: "destructive"
      });
      navigate('/login');
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
          guest_breakdown: JSON.parse(JSON.stringify(guests))
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

      // Navigate to booking confirmation or user dashboard
      navigate(`/booking-details/${data.id}`);
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
                    {package_.exclusions.map((exclusion: any, index: number) => (
                      <li key={index} className="text-sm flex items-center">
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
                </div>

                <div>
                  <Label htmlFor="duration">Time Duration</Label>
                  <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Select Guests</Label>
                  <GuestSelector
                    maxGuests={property.max_guests}
                    onGuestsChange={setGuests}
                    initialGuests={guests}
                  />
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
