
import React, { useState } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { CommissionData } from '@/lib/commissionService';

interface ApproveRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: CommissionData | null;
  action: 'approve' | 'reject';
  onApprove: (commissionId: string, notes?: string) => Promise<void>;
  onReject: (commissionId: string, reason: string) => Promise<void>;
}

const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({
  isOpen,
  onClose,
  commission,
  action,
  onApprove,
  onReject
}) => {
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commission) return;

    if (action === 'reject' && !reason.trim()) return;

    setIsProcessing(true);
    try {
      if (action === 'approve') {
        await onApprove(commission.id, notes);
      } else {
        await onReject(commission.id, reason);
      }
      onClose();
      setNotes('');
      setReason('');
    } catch (error) {
      console.error(`Error ${action}ing commission:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !commission) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            {action === 'approve' ? (
              <>
                <Check className="w-5 h-5 mr-2 text-green-600" />
                Approve Commission
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 mr-2 text-red-600" />
                Reject Commission
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Commission Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Commission ID:</span>
                <span className="font-medium">{commission.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium">{commission.property_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Owner:</span>
                <span className="font-medium">{commission.owner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">₹{Number(commission.total_booking_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Owner Share:</span>
                <span className="font-medium text-green-600">
                  ₹{Number(commission.owner_share).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {action === 'approve' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any notes about this approval..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={isProcessing || (action === 'reject' && !reason.trim())}
            >
              {isProcessing ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveRejectModal;
