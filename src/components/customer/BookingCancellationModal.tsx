import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, DollarSign, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BookingCancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    status: string;
    properties?: {
      title: string;
    };
  };
  onUpdate: () => void;
}

const BookingCancellationModal: React.FC<BookingCancellationModalProps> = ({
  open,
  onOpenChange,
  booking,
  onUpdate
}) => {
  const [reason, setReason] = useState('');
  const [cancellationType, setCancellationType] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateCancellationFee = () => {
    const checkInDate = new Date(booking.check_in_date);
    const today = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilCheckIn > 48) {
      return { fee: 0, percentage: 0, message: 'Free cancellation' };
    } else if (hoursUntilCheckIn > 24) {
      return { fee: booking.total_amount * 0.25, percentage: 25, message: '25% cancellation fee' };
    } else if (hoursUntilCheckIn > 0) {
      return { fee: booking.total_amount * 0.5, percentage: 50, message: '50% cancellation fee' };
    } else {
      return { fee: booking.total_amount, percentage: 100, message: 'No refund (past check-in date)' };
    }
  };

  const getPaymentStatusAfterCancellation = () => {
    const cancellationFee = calculateCancellationFee();
    
    if (cancellationFee.fee === 0) {
      return 'refunded';
    } else if (cancellationFee.fee < booking.total_amount) {
      return 'partially_refunded';
    } else {
      return 'completed';
    }
  };

  const cancellationFee = calculateCancellationFee();
  const refundAmount = booking.total_amount - cancellationFee.fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    if (!cancellationType) {
      toast({
        title: "Cancellation Type Required",
        description: "Please select a cancellation type.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update booking status to cancelled
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Update booking details with cancellation info
          booking_details: {
            cancellation_type: cancellationType,
            cancellation_fee: cancellationFee.fee,
            refund_amount: refundAmount,
            cancellation_percentage: cancellationFee.percentage,
          }
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      // Log the cancellation action
      await supabase
        .from('booking_action_logs')
        .insert({
          booking_id: booking.id,
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'customer_cancellation',
          reason: reason,
          metadata: {
            cancellation_type: cancellationType,
            cancellation_fee: cancellationFee.fee,
            refund_amount: refundAmount,
          }
        });

      toast({
        title: "Booking Cancelled Successfully",
        description: `Your booking has been cancelled. ${refundAmount > 0 ? `Refund of ₹${refundAmount.toFixed(2)} will be processed within 5-7 business days.` : 'No refund applicable.'}`,
      });

      onUpdate();
      onOpenChange(false);
      
      // Reset form
      setReason('');
      setCancellationType('');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setCancellationType('');
      onOpenChange(false);
    }
  };

  const getDaysUntilCheckIn = () => {
    const checkInDate = new Date(booking.check_in_date);
    const today = new Date();
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilCheckIn = getDaysUntilCheckIn();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Booking
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
              <strong>Check-in:</strong> {new Date(booking.check_in_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Total Amount:</strong> ₹{booking.total_amount.toFixed(2)}
            </p>
          </div>

          {/* Cancellation Policy */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Cancellation Policy</h4>
                <p className="text-sm text-red-700 mb-2">
                  {daysUntilCheckIn > 2 ? (
                    "Free cancellation until 48 hours before check-in"
                  ) : daysUntilCheckIn > 1 ? (
                    "25% cancellation fee (within 48 hours)"
                  ) : daysUntilCheckIn > 0 ? (
                    "50% cancellation fee (within 24 hours)"
                  ) : (
                    "No refund (past check-in date)"
                  )}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Fee: ₹{cancellationFee.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Refund: ₹{refundAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-red-600">
                  Payment Status After Cancellation: <strong>{getPaymentStatusAfterCancellation().replace('_', ' ').toUpperCase()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Type */}
          <div className="space-y-2">
            <Label htmlFor="cancellation_type">Cancellation Type</Label>
            <Select
              value={cancellationType}
              onValueChange={setCancellationType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cancellation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal_reason">Personal reason</SelectItem>
                <SelectItem value="travel_restriction">Travel restriction</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="found_better_option">Found better option</SelectItem>
                <SelectItem value="property_issue">Property-related issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason for Cancellation */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details about why you need to cancel this booking..."
              rows={3}
              required
            />
          </div>

          {/* Confirmation Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Important Notice</h4>
                <p className="text-sm text-yellow-700">
                  This action cannot be undone. Once cancelled, you will need to make a new booking if you wish to stay at this property.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Keep Booking
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingCancellationModal;
