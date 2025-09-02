import React, { useState } from 'react';
import SharedSidebar from './SharedSidebar';
import SharedHeader from './SharedHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
  searchPlaceholder?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title, 
  breadcrumb = title,
  searchPlaceholder = "Search..."
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <SharedHeader 
          title={title} 
          breadcrumb={breadcrumb}
          searchPlaceholder={searchPlaceholder}
        />
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
