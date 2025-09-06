import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  redirectTo = '/login',
  fallback,
}) => {
  const { user, session, loading, profileLoading, isAuthenticated, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication or loading profile
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute: User not authenticated, redirecting to:', redirectTo);
    console.log('🔍 ProtectedRoute: User:', user, 'Session:', session, 'Loading:', loading);
    // Redirect to login with return URL
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    console.log('🔒 ProtectedRoute: User role mismatch. Required:', requiredRole, 'User role:', user?.role);
    // Redirect to unauthorized page or dashboard based on user role
    const userRole = user?.role;
    let unauthorizedRedirect = '/unauthorized';
    
    switch (userRole) {
      case 'admin':
        unauthorizedRedirect = '/admin/dashboard';
        break;
      case 'owner':
        unauthorizedRedirect = '/owner';
        break;
      case 'agent':
        unauthorizedRedirect = '/agent/dashboard';
        break;
      case 'customer':
        unauthorizedRedirect = '/';
        break;
      default:
        unauthorizedRedirect = '/';
    }

    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // Check multiple role requirements
  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    console.log('🔒 ProtectedRoute: User role mismatch. Required roles:', requiredRoles, 'User role:', user?.role);
    // Redirect to unauthorized page or dashboard based on user role
    const userRole = user?.role;
    
    // If this is an owner-protected route and user is not an owner, add switch=1
    if (requiredRoles.includes('owner') && userRole && userRole !== 'owner') {
      return <Navigate to="/owner/login?switch=1" replace />;
    }
    
    let unauthorizedRedirect = '/unauthorized';
    
    switch (userRole) {
      case 'admin':
        unauthorizedRedirect = '/admin/dashboard';
        break;
      case 'owner':
        unauthorizedRedirect = '/owner/view';
        break;
      case 'agent':
        unauthorizedRedirect = '/agent/dashboard';
        break;
      case 'customer':
        unauthorizedRedirect = '/';
        break;
      default:
        unauthorizedRedirect = '/';
    }

    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Render protected content
  return <>{children}</>;
};

// Specific protected route components for different roles
export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
    {children}
  </ProtectedRoute>
);

export const OwnerRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute 
    requiredRoles={["owner"]} 
    redirectTo="/owner/login"
  >
    {children}
  </ProtectedRoute>
);

export const AgentRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="agent" redirectTo="/agent/login">
    {children}
  </ProtectedRoute>
);

export const CustomerRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="customer" redirectTo="/login">
    {children}
  </ProtectedRoute>
);

export const StaffRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute 
    requiredRoles={['admin', 'owner', 'agent']} 
    redirectTo="/login"
  >
    {children}
  </ProtectedRoute>
);

// Route that requires authentication but no specific role
export const AuthenticatedRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute redirectTo="/login">
    {children}
  </ProtectedRoute>
);
