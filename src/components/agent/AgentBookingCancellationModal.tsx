import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AgentBookingCancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    check_in_date: string;
    total_amount: number;
    status: string;
    properties?: {
      title: string;
    };
  };
  onUpdate: () => void;
}

const AgentBookingCancellationModal: React.FC<AgentBookingCancellationModalProps> = ({
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
          action: 'agent_cancellation',
          reason: reason,
          metadata: {
            cancellation_type: cancellationType,
            cancellation_fee: cancellationFee.fee,
            refund_amount: refundAmount,
          }
        });

      toast({
        title: "Booking Cancelled Successfully",
        description: "The booking has been cancelled and commission will be updated accordingly.",
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Cancel booking for {booking.properties?.title || 'this property'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Cancellation Policy</h4>
            <p className="text-sm text-yellow-700">
              {cancellationFee.message}
            </p>
            <div className="mt-2 text-sm text-yellow-700">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span>₹{booking.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cancellation Fee:</span>
                <span>₹{cancellationFee.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Refund Amount:</span>
                <span>₹{refundAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation_type">Cancellation Type</Label>
            <Select value={cancellationType} onValueChange={setCancellationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select cancellation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="property_unavailable">Property Unavailable</SelectItem>
                <SelectItem value="agent_error">Agent Error</SelectItem>
                <SelectItem value="payment_issue">Payment Issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for cancelling this booking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
            />
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
            <Button 
              type="submit" 
              variant="destructive"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgentBookingCancellationModal;
