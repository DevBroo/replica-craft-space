
import React from 'react';

interface OwnerLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({
  children,
  sidebarCollapsed,
  toggleSidebar,
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar would go here if needed */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
