
import React from 'react';
import { TrendingUp, Users, Building, UserCheck } from 'lucide-react';

interface RevenueSplitSummaryProps {
  summary: {
    totalAdmin: number;
    totalOwner: number;
    totalAgent: number;
    totalAmount: number;
  };
}

const RevenueSplitSummary: React.FC<RevenueSplitSummaryProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPercentage = (amount: number) => {
    if (summary.totalAmount === 0) return 0;
    return ((amount / summary.totalAmount) * 100).toFixed(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2" />
        Revenue Split Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Admin Commission</p>
              <p className="text-2xl font-semibold text-blue-900">
                {formatCurrency(summary.totalAdmin)}
              </p>
              <p className="text-sm text-blue-600">{getPercentage(summary.totalAdmin)}% of total</p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Owner Share</p>
              <p className="text-2xl font-semibold text-green-900">
                {formatCurrency(summary.totalOwner)}
              </p>
              <p className="text-sm text-green-600">{getPercentage(summary.totalOwner)}% of total</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Agent Commission</p>
              <p className="text-2xl font-semibold text-purple-900">
                {formatCurrency(summary.totalAgent)}
              </p>
              <p className="text-sm text-purple-600">{getPercentage(summary.totalAgent)}% of total</p>
            </div>
            <UserCheck className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary.totalAmount)}
              </p>
              <p className="text-sm text-gray-600">100% distributed</p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueSplitSummary;
