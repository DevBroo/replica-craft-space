
import React, { useState } from 'react';
import SharedSidebar from '@/components/admin/SharedSidebar';
import SharedHeader from '@/components/admin/SharedHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
import { PaymentBankSettings } from '@/components/admin/settings/PaymentBankSettings';
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings';
import { AppearanceSettings } from '@/components/admin/settings/AppearanceSettings';
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings';
import { AdvancedSettings } from '@/components/admin/settings/AdvancedSettings';
import { KYCVerificationSettings } from '@/components/admin/settings/KYCVerificationSettings';
import { ErrorBoundary } from '@/components/admin/ErrorBoundary';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Alert, AlertDescription } from '@/components/admin/ui/alert';
import { AlertTriangle } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { isAdmin, isFinanceAdmin, isNotificationsAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SharedSidebar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
        />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <SharedHeader 
            title="System Settings"
            breadcrumb="Admin > System Settings"
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/4"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SharedSidebar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
        />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <SharedHeader 
            title="System Settings"
            breadcrumb="Admin > System Settings"
          />
          <main className="flex-1 overflow-auto p-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Access denied. Admin privileges required to view system settings.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  const availableTabs = [
    { id: 'general', label: 'General', component: GeneralSettings },
    { id: 'payments', label: 'Payment & Bank', component: PaymentBankSettings, requiredRole: 'finance' },
    { id: 'security', label: 'Security & Users', component: SecuritySettings },
    { id: 'kyc', label: 'KYC & Verification', component: KYCVerificationSettings },
    { id: 'appearance', label: 'Appearance', component: AppearanceSettings },
    { id: 'notifications', label: 'Notifications', component: NotificationSettings, requiredRole: 'notifications' },
    { id: 'advanced', label: 'Advanced', component: AdvancedSettings }
  ];

  const visibleTabs = availableTabs.filter(tab => {
    if (!tab.requiredRole) return true;
    if (tab.requiredRole === 'finance') return isFinanceAdmin;
    if (tab.requiredRole === 'notifications') return isNotificationsAdmin;
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="System Settings"
          breadcrumb="Admin > System Settings"
        />
        <main className="flex-1 overflow-auto p-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Manage system-wide settings, security, integrations, and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  {visibleTabs.map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {visibleTabs.map(tab => {
                  const Component = tab.component;
                  return (
                    <TabsContent key={tab.id} value={tab.id} className="mt-6">
                      <ErrorBoundary fallbackMessage={`Failed to load ${tab.label} settings. This may be due to missing database configuration.`}>
                        <Component />
                      </ErrorBoundary>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
