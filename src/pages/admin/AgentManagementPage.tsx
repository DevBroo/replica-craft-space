import React from 'react';
import AgentCommissionManagement from '@/components/admin/AgentCommissionManagement';

const AgentManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
        <p className="text-gray-600 mt-2">
          Manage agent commission rates, track earnings, and oversee agent performance
        </p>
      </div>
      
      <AgentCommissionManagement />
    </div>
  );
};

export default AgentManagementPage;
