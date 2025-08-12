import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  email: string;
  role: string;
  name: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => boolean;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check for existing admin session on mount
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuthenticated');
    const adminUserData = localStorage.getItem('adminUser');
    
    if (adminAuth === 'true' && adminUserData) {
      try {
        const user = JSON.parse(adminUserData);
        setAdminUser(user);
        setIsAdminAuthenticated(true);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        adminLogout();
      }
    }
  }, []);

  const adminLogin = (email: string, password: string): boolean => {
    // Check against hardcoded admin credentials
    if (email === 'admin@picnify.in' && password === 'Alliance@8') {
      const user: AdminUser = {
        email: 'admin@picnify.in',
        role: 'admin',
        name: 'Picnify Admin'
      };
      
      setAdminUser(user);
      setIsAdminAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminUser', JSON.stringify(user));
      
      return true;
    }
    
    return false;
  };

  const adminLogout = () => {
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminUser');
  };

  const value: AdminAuthContextType = {
    adminUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
