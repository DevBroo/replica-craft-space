
import React from 'react';
import Properties from '@/components/owner/Properties';
import PropertiesNew from '@/components/owner/PropertiesNew';
import OwnerLayout from '@/components/owner/OwnerLayout';

interface MyPropertiesProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const MyProperties: React.FC<MyPropertiesProps> = ({
  sidebarCollapsed = false,
  toggleSidebar = () => {},
  activeTab = 'properties',
  setActiveTab = () => {}
}) => {
  const handleCloseFullForm = () => {
    setActiveTab('properties');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNew 
        onBack={handleCloseFullForm}
        editProperty={null}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default MyProperties;
