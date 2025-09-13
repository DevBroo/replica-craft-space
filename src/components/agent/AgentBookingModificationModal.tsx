import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AvailabilityService } from '@/lib/availabilityService';
import { toast } from '@/hooks/use-toast';

interface AgentBookingModificationModalProps {
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
      max_guests: number;
      pricing: any;
    };
  };
  onUpdate: () => void;
}

const AgentBookingModificationModal: React.FC<AgentBookingModificationModalProps> = ({
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
  const [availabilityCheck, setAvailabilityCheck] = useState({
    checking: false,
    available: true,
    message: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        guests: booking.guests,
      });
      setReason('');
    }
  }, [open, booking]);

  const calculateNewAmount = () => {
    if (!booking.properties?.pricing) return booking.total_amount;
    
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const basePrice = booking.properties.pricing.daily_rate || 0;
    return basePrice * nights;
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

    setLoading(true);
    try {
      const newAmount = calculateNewAmount();
      
      // Update booking using the booking service
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

      // Log the modification action
      await supabase
        .from('booking_action_logs')
        .insert({
          booking_id: booking.id,
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'agent_modification',
          reason: reason,
          metadata: {
            old_check_in: booking.check_in_date,
            old_check_out: booking.check_out_date,
            old_guests: booking.guests,
            old_amount: booking.total_amount,
            new_check_in: formData.check_in_date,
            new_check_out: formData.check_out_date,
            new_guests: formData.guests,
            new_amount: newAmount,
          }
        });

      toast({
        title: "Booking Modified Successfully",
        description: "The booking has been updated and commission will be recalculated.",
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modify Booking</DialogTitle>
          <DialogDescription>
            Update booking details for {booking.properties?.title || 'this property'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in_date">Check-in Date</Label>
              <Input
                id="check_in_date"
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                min={formData.check_in_date}
                max={getMaxDate()}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max={booking.properties?.max_guests || 10}
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              required
            />
            {booking.properties?.max_guests && (
              <p className="text-sm text-gray-500">
                Maximum {booking.properties.max_guests} guests allowed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Modification</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why this booking needs to be modified..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Original Amount:</span>
                <span>₹{booking.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>New Amount:</span>
                <span>₹{calculateNewAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Difference:</span>
                <span className={calculateNewAmount() > booking.total_amount ? 'text-red-600' : 'text-green-600'}>
                  {calculateNewAmount() > booking.total_amount ? '+' : ''}₹{(calculateNewAmount() - booking.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgentBookingModificationModal;
