import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarDays, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BookingService } from '@/lib/bookingService';
import { AvailabilityService } from '@/lib/availabilityService';
import { supabase } from '@/integrations/supabase/client';

interface BookingModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    property_id: string;
    check_in_date: string;
    check_out_date: string;
    guests: number;
    total_amount: number;
    status: string;
    properties?: {
      title: string;
      max_guests?: number;
      pricing?: any;
    };
  };
  onUpdate: () => void;
}

const BookingModificationModal: React.FC<BookingModificationModalProps> = ({
  open,
  onOpenChange,
  booking,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    guests: booking.guests,
  });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    checking: boolean;
    available: boolean;
    message: string;
  }>({ checking: false, available: true, message: '' });

  // Reset form when booking changes
  useEffect(() => {
    if (booking) {
      setFormData({
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        guests: booking.guests,
      });
    }
  }, [booking]);

  // Check availability when dates change
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.check_in_date && formData.check_out_date && 
          (formData.check_in_date !== booking.check_in_date || 
           formData.check_out_date !== booking.check_out_date)) {
        
        setAvailabilityCheck({ checking: true, available: false, message: 'Checking availability...' });
        
        try {
          const result = await AvailabilityService.checkDateRangeAvailabilityExcludingBooking(
            booking.property_id,
            formData.check_in_date,
            formData.check_out_date,
            booking.id
          );
          
          if (result.available) {
            setAvailabilityCheck({ 
              checking: false, 
              available: true, 
              message: 'Dates are available!' 
            });
          } else {
            setAvailabilityCheck({ 
              checking: false, 
              available: false, 
              message: 'Selected dates are not available. Please choose different dates.' 
            });
          }
        } catch (error) {
          setAvailabilityCheck({ 
            checking: false, 
            available: false, 
            message: 'Unable to check availability. Please try again.' 
          });
        }
      } else {
        setAvailabilityCheck({ checking: false, available: true, message: '' });
      }
    };

    checkAvailability();
  }, [formData.check_in_date, formData.check_out_date, booking.property_id, booking.check_in_date, booking.check_out_date, booking.id]);

  const calculateNewAmount = () => {
    if (!booking.properties?.pricing) return booking.total_amount;
    
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const dailyRate = booking.properties.pricing.daily_rate || 0;
    const baseAmount = dailyRate * nights;
    const taxRate = 0.12; // 12% tax
    const serviceCharge = 0.03; // 3% service charge
    
    return baseAmount + (baseAmount * taxRate) + (baseAmount * serviceCharge);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the modification.",
        variant: "destructive",
      });
      return;
    }

    if (!availabilityCheck.available) {
      toast({
        title: "Dates Not Available",
        description: "Please select available dates before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newAmount = calculateNewAmount();
      
      // Update booking using the enhanced booking service
      const { data, error } = await supabase
        .from('bookings')
        .update({
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          guests: formData.guests,
          total_amount: newAmount,
          modification_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        throw error;
      }

      toast({
        title: "Booking Modified Successfully",
        description: "Your booking has been updated. You will receive a confirmation email shortly.",
      });

      onUpdate();
      onOpenChange(false);
      
      // Reset form
      setReason('');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Modification Failed",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setAvailabilityCheck({ checking: false, available: true, message: '' });
      onOpenChange(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Can't book for today
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Modify Booking
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
            <p className="text-sm text-gray-600">
              <strong>Property:</strong> {booking.properties?.title || 'Unknown Property'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Current Dates:</strong> {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Current Guests:</strong> {booking.guests}
            </p>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in_date">Check-in Date</Label>
              <Input
                id="check_in_date"
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData(prev => ({ ...prev, check_in_date: e.target.value }))}
                min={getMinDate()}
                max={getMaxDate()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_date">Check-out Date</Label>
              <Input
                id="check_out_date"
                type="date"
                value={formData.check_out_date}
                onChange={(e) => setFormData(prev => ({ ...prev, check_out_date: e.target.value }))}
                min={formData.check_in_date || getMinDate()}
                max={getMaxDate()}
                required
              />
            </div>
          </div>

          {/* Availability Check */}
          {availabilityCheck.checking && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">{availabilityCheck.message}</span>
            </div>
          )}
          
          {!availabilityCheck.checking && availabilityCheck.message && (
            <div className={`flex items-center gap-2 text-sm ${
              availabilityCheck.available ? 'text-green-600' : 'text-red-600'
            }`}>
              {availabilityCheck.available ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{availabilityCheck.message}</span>
            </div>
          )}

          {/* Guest Count */}
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Select
              value={formData.guests.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, guests: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: booking.properties?.max_guests || 10 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Preview */}
          {formData.check_in_date && formData.check_out_date && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Price Preview</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <span>₹{booking.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Amount:</span>
                  <span className="font-medium">₹{calculateNewAmount().toFixed(2)}</span>
                </div>
                {calculateNewAmount() !== booking.total_amount && (
                  <div className="flex justify-between text-blue-700">
                    <span>Difference:</span>
                    <span className="font-medium">
                      {calculateNewAmount() > booking.total_amount ? '+' : ''}
                      ₹{(calculateNewAmount() - booking.total_amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason for Modification */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Modification</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to modify this booking..."
              rows={3}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !availabilityCheck.available}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModificationModal;
