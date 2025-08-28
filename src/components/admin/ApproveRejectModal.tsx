
import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApproveRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyIds: string[];
  propertyTitles: string[];
  action: 'approve' | 'reject';
  onComplete: () => void;
}

const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({
  isOpen,
  onClose,
  propertyIds,
  propertyTitles,
  action,
  onComplete,
}) => {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setLoading(true);
    
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      // Try to use the RPC function, fallback to direct update
      for (const propertyId of propertyIds) {
        try {
          // Try RPC first
          const { error: rpcError } = await supabase.rpc('log_property_status_change' as any, {
            p_property_id: propertyId,
            p_to_status: newStatus,
            p_reason: reason,
            p_comment: comment || null,
          });
          
          if (rpcError) {
            throw rpcError;
          }
        } catch (rpcError) {
          console.log('RPC not available, using direct update:', rpcError);
          // Fallback to direct update
          const { error: updateError } = await supabase
            .from('properties')
            .update({ status: newStatus })
            .eq('id', propertyId);
            
          if (updateError) throw updateError;
        }
      }
      
      toast.success(`${propertyIds.length} propert${propertyIds.length === 1 ? 'y' : 'ies'} ${action}d successfully`);
      onComplete();
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing properties:`, error);
      toast.error(`Failed to ${action} properties`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setComment('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            {action === 'approve' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
            )}
            {action === 'approve' ? 'Approve' : 'Reject'} Properties
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              You are about to {action} {propertyIds.length} propert{propertyIds.length === 1 ? 'y' : 'ies'}:
            </p>
            <ul className="text-sm text-gray-800 max-h-20 overflow-y-auto">
              {propertyTitles.map((title, index) => (
                <li key={index} className="truncate">• {title}</li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter reason for ${action}ing`}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Comments
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional additional comments"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveRejectModal;
