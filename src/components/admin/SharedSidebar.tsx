import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Gauge, 
  Users, 
  User, 
  Home, 
  Calendar, 
  DollarSign, 
  Edit, 
  Bell, 
  Headphones, 
  Settings
} from 'lucide-react';

interface SharedSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const SharedSidebar: React.FC<SharedSidebarProps> = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge, path: '/dashboard' },
    { id: 'owners', label: 'Owner Management', icon: Users, path: '/owner-management' },
    { id: 'agents', label: 'Agent Management', icon: User, path: '/agent-management' },
    { id: 'properties', label: 'Property Approval', icon: Home, path: '/property-approval' },
    { id: 'bookings', label: 'Booking Management', icon: Calendar, path: '/booking-management' },
    { id: 'commission', label: 'Commission & Disbursement', icon: DollarSign, path: '/commission-disbursement' },
    { id: 'cms', label: 'CMS Management', icon: Edit, path: '/cms-management' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications-management' },
    { id: 'support', label: 'Support Tickets', icon: Headphones, path: '/support-tickets' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`fixed left-0 top-0 h-full sidebar-modern transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">P</span>
            </div>
            <span className="font-bold text-sidebar-foreground">Picnify Admin</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 text-sidebar-foreground" />
        </button>
      </div>
      <nav className="mt-4 space-y-1 px-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer group ${
                active 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover-glow' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <IconComponent className={`w-5 h-5 transition-colors ${active ? 'text-sidebar-primary-foreground' : ''}`} />
              {!sidebarCollapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
              {!sidebarCollapsed && active && (
                <div className="ml-auto w-1.5 h-1.5 bg-sidebar-primary-foreground rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Modern Footer */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="glass-card p-3 rounded-lg">
            <div className="text-xs text-sidebar-foreground/70 text-center">
              <div className="font-medium">Admin Panel v2.0</div>
              <div className="opacity-60">Modern & Powerful</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedSidebar;