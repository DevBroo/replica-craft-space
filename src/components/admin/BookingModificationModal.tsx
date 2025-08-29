import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Textarea } from '@/components/admin/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Calendar, CalendarDays, Users, DollarSign, CreditCard, FileText } from 'lucide-react';
import { EnhancedBookingData, BookingUpdateData } from '@/lib/enhancedBookingService';

interface BookingModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: EnhancedBookingData;
  onUpdate: (bookingId: string, updateData: BookingUpdateData, reason: string) => Promise<void>;
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
    total_amount: booking.total_amount,
    status: booking.status,
    payment_status: booking.payment_status,
    refund_status: booking.refund_status,
    payment_mode: booking.payment_mode || '',
    transaction_id: booking.transaction_id || '',
    refund_amount: booking.refund_amount || 0
  });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the modification');
      return;
    }

    setLoading(true);
    try {
      const updateData: BookingUpdateData = {};
      
      // Only include changed fields
      if (formData.check_in_date !== booking.check_in_date) {
        updateData.check_in_date = formData.check_in_date;
      }
      if (formData.check_out_date !== booking.check_out_date) {
        updateData.check_out_date = formData.check_out_date;
      }
      if (formData.guests !== booking.guests) {
        updateData.guests = formData.guests;
      }
      if (formData.total_amount !== booking.total_amount) {
        updateData.total_amount = formData.total_amount;
      }
      if (formData.status !== booking.status) {
        updateData.status = formData.status;
      }
      if (formData.payment_status !== booking.payment_status) {
        updateData.payment_status = formData.payment_status;
      }
      if (formData.refund_status !== booking.refund_status) {
        updateData.refund_status = formData.refund_status;
      }
      if (formData.payment_mode !== (booking.payment_mode || '')) {
        updateData.payment_mode = formData.payment_mode;
      }
      if (formData.transaction_id !== (booking.transaction_id || '')) {
        updateData.transaction_id = formData.transaction_id;
      }
      if (formData.refund_amount !== (booking.refund_amount || 0)) {
        updateData.refund_amount = formData.refund_amount;
      }

      await onUpdate(booking.id, updateData, reason);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Modify Booking - {booking.property_title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Check-in Date
              </Label>
              <Input
                id="check_in_date"
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_date" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Check-out Date
              </Label>
              <Input
                id="check_out_date"
                type="date"
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Guests
              </Label>
              <Input
                id="guests"
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Amount
              </Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Status Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Booking Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund_status">Refund Status</Label>
              <Select value={formData.refund_status} onValueChange={(value) => setFormData({ ...formData, refund_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_mode" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Mode
              </Label>
              <Select value={formData.payment_mode} onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction_id">Transaction ID</Label>
              <Input
                id="transaction_id"
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                placeholder="Enter transaction ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund_amount">Refund Amount</Label>
              <Input
                id="refund_amount"
                type="number"
                step="0.01"
                value={formData.refund_amount}
                onChange={(e) => setFormData({ ...formData, refund_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Modification *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for this modification..."
              rows={3}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !reason.trim()}>
              {loading ? 'Updating...' : 'Update Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModificationModal;