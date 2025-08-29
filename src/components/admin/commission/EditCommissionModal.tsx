
import React, { useState, useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import { CommissionData } from '@/lib/commissionService';

interface EditCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: CommissionData | null;
  onUpdate: (commissionId: string, updates: Partial<CommissionData>) => Promise<void>;
}

const EditCommissionModal: React.FC<EditCommissionModalProps> = ({
  isOpen,
  onClose,
  commission,
  onUpdate
}) => {
  const [adminCommission, setAdminCommission] = useState('');
  const [ownerShare, setOwnerShare] = useState('');
  const [agentCommission, setAgentCommission] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (commission) {
      setAdminCommission(commission.admin_commission.toString());
      setOwnerShare(commission.owner_share.toString());
      setAgentCommission(commission.agent_commission.toString());
      setNotes(commission.notes || '');
    }
  }, [commission]);

  const calculateTotal = () => {
    const admin = Number(adminCommission) || 0;
    const owner = Number(ownerShare) || 0;
    const agent = Number(agentCommission) || 0;
    return admin + owner + agent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commission) return;

    const total = calculateTotal();
    if (total !== Number(commission.total_booking_amount)) {
      alert(`Total must equal booking amount: ₹${Number(commission.total_booking_amount).toLocaleString()}`);
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdate(commission.id, {
        admin_commission: Number(adminCommission),
        owner_share: Number(ownerShare),
        agent_commission: Number(agentCommission),
        notes
      });
      onClose();
    } catch (error) {
      console.error('Error updating commission:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !commission) return null;

  const total = calculateTotal();
  const expectedTotal = Number(commission.total_booking_amount);
  const isValidTotal = total === expectedTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Commission
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
                <span className="text-gray-600">Total Booking Amount:</span>
                <span className="font-medium">₹{expectedTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Commission (₹)
              </label>
              <input
                type="number"
                value={adminCommission}
                onChange={(e) => setAdminCommission(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Share (₹)
              </label>
              <input
                type="number"
                value={ownerShare}
                onChange={(e) => setOwnerShare(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Commission (₹)
              </label>
              <input
                type="number"
                value={agentCommission}
                onChange={(e) => setAgentCommission(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={`p-3 rounded-lg ${
              isValidTotal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className={isValidTotal ? 'text-green-600' : 'text-red-600'}>
                  ₹{total.toLocaleString()}
                </span>
              </div>
              {!isValidTotal && (
                <p className="text-sm text-red-600 mt-1">
                  Must equal booking amount: ₹{expectedTotal.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add any notes about this commission..."
              />
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isProcessing || !isValidTotal}
            >
              {isProcessing ? 'Updating...' : 'Update Commission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCommissionModal;
