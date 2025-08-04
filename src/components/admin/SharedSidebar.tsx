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
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <img
              src="/lovable-uploads/7777450f-e840-48c6-999b-89029812533f.png"
              alt="Picnify Logo"
              className="h-8 w-auto"
            />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                active ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SharedSidebar;