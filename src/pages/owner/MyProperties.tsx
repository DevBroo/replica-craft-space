import React from 'react';
import { Properties } from '@/components/owner/Properties';
import { PropertiesNew } from '@/components/owner/PropertiesNew';
import OwnerLayout from '@/components/owner/OwnerLayout';

const MyProperties: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('properties');

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleCloseFullForm = () => {
    setActiveTab('properties');
  };

  return (
    <OwnerLayout
      sidebarCollapsed={sidebarCollapsed}
      toggleSidebar={toggleSidebar}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
        <PropertiesNew 
          onBack={handleCloseFullForm}
          editProperty={null}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
    </OwnerLayout>
  );
};

export default MyProperties;
