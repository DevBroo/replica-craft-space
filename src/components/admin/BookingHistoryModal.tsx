import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Badge } from '@/components/admin/ui/badge';
import { ScrollArea } from '@/components/admin/ui/scroll-area';
import { History, User, Clock, FileText } from 'lucide-react';
import { EnhancedBookingService } from '@/lib/enhancedBookingService';

interface BookingHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  propertyTitle: string;
}

interface BookingHistoryEntry {
  id: string;
  action: string;
  reason?: string;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const BookingHistoryModal: React.FC<BookingHistoryModalProps> = ({
  open,
  onOpenChange,
  bookingId,
  propertyTitle
}) => {
  const [history, setHistory] = useState<BookingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && bookingId) {
      loadHistory();
    }
  }, [open, bookingId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await EnhancedBookingService.getBookingHistory(bookingId);
      setHistory(data as BookingHistoryEntry[]);
    } catch (error) {
      console.error('Error loading booking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'status_change':
        return 'default';
      case 'refund_status_change':
        return 'secondary';
      case 'manual_update':
        return 'outline';
      case 'bulk_update':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatActionText = (action: string) => {
    switch (action) {
      case 'status_change':
        return 'Status Changed';
      case 'refund_status_change':
        return 'Refund Status Changed';
      case 'manual_update':
        return 'Manual Update';
      case 'bulk_update':
        return 'Bulk Update';
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const renderMetadata = (metadata: any) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div className="mt-2 text-sm text-muted-foreground">
        {metadata.old_status && metadata.new_status && (
          <div>Status: {metadata.old_status} → {metadata.new_status}</div>
        )}
        {metadata.old_refund_status && metadata.new_refund_status && (
          <div>Refund Status: {metadata.old_refund_status} → {metadata.new_refund_status}</div>
        )}
        {metadata.changed_by && (
          <div>Changed by: {metadata.changed_by}</div>
        )}
        {metadata.affected_count && (
          <div>Affected bookings: {metadata.affected_count}</div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Booking History - {propertyTitle}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No history available</div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={getActionBadgeVariant(entry.action)}>
                        {formatActionText(entry.action)}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {entry.profiles?.full_name || 'System'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </div>

                  {entry.reason && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="text-sm">
                        <strong>Reason:</strong> {entry.reason}
                      </div>
                    </div>
                  )}

                  {renderMetadata(entry.metadata)}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BookingHistoryModal;