
import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { CommissionData } from '@/lib/commissionService';

interface ProcessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: CommissionData | null;
  onProcess: (paymentMode: string, paymentReference: string, paymentDate: string) => Promise<void>;
}

const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
  isOpen,
  onClose,
  commission,
  onProcess
}) => {
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commission || !paymentReference.trim()) return;

    setIsProcessing(true);
    try {
      await onProcess(paymentMode, paymentReference, paymentDate);
      onClose();
      setPaymentReference('');
    } catch (error) {
      console.error('Error processing payment:', error);
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
            <CreditCard className="w-5 h-5 mr-2" />
            Process Payment
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
                <span className="text-gray-600">Owner Share:</span>
                <span className="font-medium text-green-600">
                  ₹{Number(commission.owner_share).toLocaleString()}
                </span>
              </div>
              {commission.agent_name && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent:</span>
                    <span className="font-medium">{commission.agent_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Commission:</span>
                    <span className="font-medium text-blue-600">
                      ₹{Number(commission.agent_commission).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference / Transaction ID
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter transaction ID or reference"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isProcessing || !paymentReference.trim()}
            >
              {isProcessing ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessPaymentModal;
