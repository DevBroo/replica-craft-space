import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  User, 
  Phone, 
  Mail,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { BookingService } from '@/lib/bookingService';
import { AvailabilityService } from '@/lib/availabilityService';
import { toast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  address: string;
  property_type: string;
  max_guests: number;
  pricing: any;
  images: string[];
  amenities: string[];
}

interface AgentBookingFormData {
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  // Customer details
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_date_of_birth: string;
  // Additional details
  special_requests?: string;
}

const AgentBookingForm: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [formData, setFormData] = useState<AgentBookingFormData>({
    property_id: '',
    check_in_date: '',
    check_out_date: '',
    guests: 1,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_date_of_birth: '',
    special_requests: ''
  });
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (formData.property_id) {
      const property = properties.find(p => p.id === formData.property_id);
      setSelectedProperty(property || null);
    }
  }, [formData.property_id, properties]);

  useEffect(() => {
    if (selectedProperty && formData.check_in_date && formData.check_out_date && formData.guests) {
      calculateAmount();
      checkAvailability();
    }
  }, [selectedProperty, formData.check_in_date, formData.check_out_date, formData.guests]);

  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('title');

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setPropertiesLoading(false);
    }
  };

  const calculateAmount = () => {
    if (!selectedProperty || !formData.check_in_date || !formData.check_out_date) return;

    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const dailyRate = selectedProperty.pricing?.daily_rate || 0;
    const totalAmount = dailyRate * nights;

    setCalculatedAmount(totalAmount);
    
    // Calculate commission (assuming 5% default rate)
    const commissionRate = 5.00; // This should come from agent settings
    setCommissionAmount((totalAmount * commissionRate) / 100);
  };

  const checkAvailability = async () => {
    if (!formData.property_id || !formData.check_in_date || !formData.check_out_date) return;

    try {
      const availability = await AvailabilityService.checkDateRangeAvailability(
        formData.property_id,
        formData.check_in_date,
        formData.check_out_date
      );

      setIsAvailable(availability.available);
      setAvailabilityChecked(true);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(false);
      setAvailabilityChecked(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.property_id) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.check_in_date) {
      toast({
        title: "Error",
        description: "Please select check-in date",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.check_out_date) {
      toast({
        title: "Error",
        description: "Please select check-out date",
        variant: "destructive",
      });
      return false;
    }
    if (formData.guests < 1) {
      toast({
        title: "Error",
        description: "Number of guests must be at least 1",
        variant: "destructive",
      });
      return false;
    }
    if (selectedProperty && formData.guests > selectedProperty.max_guests) {
      toast({
        title: "Error",
        description: `Maximum ${selectedProperty.max_guests} guests allowed for this property`,
        variant: "destructive",
      });
      return false;
    }
    if (!formData.customer_name.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.customer_email.trim()) {
      toast({
        title: "Error",
        description: "Customer email is required",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.customer_phone.trim()) {
      toast({
        title: "Error",
        description: "Customer phone is required",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.customer_date_of_birth) {
      toast({
        title: "Error",
        description: "Customer date of birth is required",
        variant: "destructive",
      });
      return false;
    }
    if (!isAvailable) {
      toast({
        title: "Error",
        description: "Property is not available for the selected dates",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create booking with agent tracking
      const bookingData = {
        property_id: formData.property_id,
        user_id: user?.id || '', // This should be the customer's ID, but for now using agent's ID
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        guests: formData.guests,
        total_amount: calculatedAmount,
        guest_name: formData.customer_name,
        guest_phone: formData.customer_phone,
        guest_date_of_birth: formData.customer_date_of_birth,
        booking_details: {
          special_requests: formData.special_requests,
          booked_by_agent: true,
          agent_id: user?.id,
          customer_email: formData.customer_email
        },
        status: 'confirmed', // Agent bookings are typically confirmed
        payment_status: 'pending',
        agent_id: user?.id // Track which agent made this booking
      };

      const booking = await BookingService.createBooking(bookingData);

      toast({
        title: "Booking Created Successfully!",
        description: `Booking created for ${formData.customer_name}. Commission: ₹${commissionAmount.toFixed(2)}`,
        variant: "default",
      });

      // Reset form
      setFormData({
        property_id: '',
        check_in_date: '',
        check_out_date: '',
        guests: 1,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_date_of_birth: '',
        special_requests: ''
      });
      setSelectedProperty(null);
      setCalculatedAmount(0);
      setCommissionAmount(0);
      setAvailabilityChecked(false);
      setIsAvailable(false);

    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Create Booking for Customer
          </CardTitle>
          <CardDescription>
            Book a property on behalf of a customer and earn commission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Selection</h3>
              
              <div>
                <Label htmlFor="property_id">Select Property *</Label>
                <Select value={formData.property_id} onValueChange={(value) => handleSelectChange('property_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{property.title}</span>
                          <Badge variant="outline" className="ml-2">
                            ₹{property.pricing?.daily_rate || 0}/night
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProperty && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold">{selectedProperty.title}</h4>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedProperty.address}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Max {selectedProperty.max_guests} guests
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    ₹{selectedProperty.pricing?.daily_rate || 0} per night
                  </p>
                </div>
              )}
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="check_in_date">Check-in Date *</Label>
                  <Input
                    id="check_in_date"
                    name="check_in_date"
                    type="date"
                    value={formData.check_in_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="check_out_date">Check-out Date *</Label>
                  <Input
                    id="check_out_date"
                    name="check_out_date"
                    type="date"
                    value={formData.check_out_date}
                    onChange={handleInputChange}
                    min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="guests">Number of Guests *</Label>
                  <Input
                    id="guests"
                    name="guests"
                    type="number"
                    min="1"
                    max={selectedProperty?.max_guests || 10}
                    value={formData.guests}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {availabilityChecked && (
                <Alert className={isAvailable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {isAvailable ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={isAvailable ? "text-green-800" : "text-red-800"}>
                    {isAvailable ? "Property is available for the selected dates" : "Property is not available for the selected dates"}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer_name"
                      name="customer_name"
                      type="text"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter customer's full name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_email">Customer Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter customer's email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_phone">Customer Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer_phone"
                      name="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter customer's phone number"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_date_of_birth">Date of Birth *</Label>
                  <Input
                    id="customer_date_of_birth"
                    name="customer_date_of_birth"
                    type="date"
                    value={formData.customer_date_of_birth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special_requests">Special Requests</Label>
                <Textarea
                  id="special_requests"
                  name="special_requests"
                  value={formData.special_requests}
                  onChange={handleInputChange}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>
            </div>

            {/* Booking Summary */}
            {calculatedAmount > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">₹{calculatedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Your Commission (5%):</span>
                    <span className="font-semibold">₹{commissionAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isAvailable}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentBookingForm;
