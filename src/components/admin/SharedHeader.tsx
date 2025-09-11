import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, Home } from 'lucide-react';
import IconButton from './ui/IconButton';

interface SharedHeaderProps {
  title: string;
  breadcrumb?: string;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({ 
  title, 
  breadcrumb = title,
  searchPlaceholder = "Search...",
  children 
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Clear admin auth data
      localStorage.removeItem('isAuthenticated');
      
      // Also clear any Supabase auth data
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.auth.token') || 
        key.startsWith('sb-') ||
        key.includes('supabase')
      );
      authKeys.forEach(key => localStorage.removeItem(key));
      
      console.log('🚪 Admin logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Admin logout error:', error);
      // Force redirect even if error occurs
      navigate('/login');
    }
  };
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <div className="text-sm text-gray-500">
            <span>Super Admin Panel</span> / <span className="text-blue-600">{breadcrumb}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {children}
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <div className="relative">
            <IconButton
              icon={Bell}
              variant="ghost"
              tooltip="Notifications"
              aria-label="View notifications"
              className="relative"
              onClick={() => navigate('/admin/notifications-management')}
            >
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </IconButton>
          </div>
          <div className="flex items-center space-x-2">
            <img
              src="https://readdy.ai/api/search-image?query=professional%20business%20person%20avatar%20headshot%20with%20clean%20background%20modern%20corporate%20style&width=40&height=40&seq=admin-avatar&orientation=squarish"
              alt="Super Admin Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-700">Super Admin</span>
            <div className="relative group">
              <button 
                className="flex items-center space-x-1 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
                aria-label="Admin menu"
                title="Admin menu"
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <IconButton
                  icon={LogOut}
                  variant="ghost"
                  onClick={handleLogout}
                  aria-label="Logout from admin panel"
                  className="w-full justify-start px-4 py-2 text-sm rounded-none hover:bg-gray-50"
                >
                  Logout
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SharedHeader;