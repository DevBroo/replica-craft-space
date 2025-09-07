import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';
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
  BarChart3,
  Headphones, 
  Settings,
  MapPin,
  MessageCircle
} from 'lucide-react';
import IconButton from './ui/IconButton';

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
    { id: 'dashboard', label: 'Dashboard', icon: Gauge, path: '/admin/dashboard' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { id: 'owners', label: 'Owner Management', icon: Users, path: '/admin/owner-management' },
    // COMMENTED OUT: Agent functionality not needed - owner and agent are same
    // { id: 'agents', label: 'Agent Management', icon: User, path: '/admin/agent-management' },
    { id: 'locations', label: 'Location Management', icon: MapPin, path: '/admin/location-management' },
    { id: 'properties', label: 'Property Approval', icon: Home, path: '/admin/property-approval' },
    { id: 'bookings', label: 'Booking Management', icon: Calendar, path: '/admin/booking-management' },
    { id: 'commission', label: 'Commission & Disbursement', icon: DollarSign, path: '/admin/commission-disbursement' },
    { id: 'cms', label: 'CMS Management', icon: Edit, path: '/admin/cms-management' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications-management' },
    { id: 'support', label: 'Support Tickets', icon: Headphones, path: '/admin/support-tickets' },
    { id: 'live-chat', label: 'Live Chat', icon: MessageCircle, path: '/admin/live-chat' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`fixed left-0 top-0 h-full sidebar-modern transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center p-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <img 
              src={picnifyLogo} 
              alt="Picnify Logo" 
              className="h-7 w-auto object-contain flex-shrink-0"
            />
          </div>
        )}
        <IconButton
          icon={Menu}
          variant="ghost"
          onClick={toggleSidebar}
          tooltip={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hover:bg-sidebar-accent text-sidebar-foreground flex-shrink-0 ml-2"
        />
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
    </div>
  );
};

export default SharedSidebar;