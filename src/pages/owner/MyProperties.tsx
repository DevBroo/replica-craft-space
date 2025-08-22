
import React from 'react';
import Properties from '@/components/owner/Properties';
import PropertiesNew from '@/components/owner/PropertiesNew';

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
