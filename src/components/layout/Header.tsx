import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { loading, user, isAuthenticated, logout } = useAuth();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center min-w-[200px] lg:min-w-[250px]">
              <Link to="/" className="flex items-center">
                <img src={picnifyLogo} alt="Picnify.in Logo" className="h-10 sm:h-12 w-auto" />
              </Link>
            </div>

            {/* Navigation Section */}
            <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10 flex-1 justify-center">
              <Link to="/" className="text-foreground hover:text-orange-500 font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Home</Link>
              <Link to="/properties" className="text-foreground hover:text-orange-500 font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Properties</Link>
              <Link to="/locations" className="text-foreground hover:text-orange-500 font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Locations</Link>
              <Link to="/about" className="text-foreground hover:text-orange-500 font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">About</Link>
              <Link to="/contact" className="text-foreground hover:text-orange-500 font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Contact</Link>
              
              {/* Portals Dropdown */}
              <div className="relative group">
                <button className="text-foreground hover:text-orange-500 font-medium transition-colors duration-200 cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-orange-50">
                  Portals
                  <i className="fas fa-chevron-down ml-1 text-xs transition-transform duration-200 group-hover:rotate-180"></i>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🚀 Host Portal clicked');
                        console.log('🔍 Current auth state:', { 
                          loading,
                          isAuthenticated, 
                          user: user ? { email: user.email, role: user.role } : null 
                        });
                        
                        if (loading) {
                          console.log('⏳ Auth still loading, waiting...');
                          return;
                        }
                        
                         if (isAuthenticated && user) {
                           console.log('✅ User is authenticated, checking role...');
                           console.log('🔍 User role:', user.role);
                           
                          // Check if user is owner
                          if (user.role === 'owner') {
                            navigate('/owner/view');
                          } else {
                            // Non-owner authenticated user, redirect to owner login with switch option
                            navigate('/owner/login?switch=1');
                          }
                         } else {
                           console.log('❌ User not authenticated, navigating to owner login');
                           navigate('/owner/login');
                         }
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-500 transition-colors duration-200 border-b border-gray-100"
                    >
                      <i className="fas fa-home mr-3 text-orange-500"></i>
                      Host Portal
                    </button>
                    {/* Agent Portal */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🚀 Agent Portal clicked');
                        console.log('🔍 Current user state:', { 
                          isAuthenticated, 
                          user: user ? { email: user.email, role: user.role } : null 
                        });
                        
                        if (loading) {
                          console.log('⏳ Auth still loading, waiting...');
                          return;
                        }
                        
                        if (isAuthenticated && user) {
                          console.log('✅ User is authenticated, checking role...');
                          console.log('🔍 User role:', user.role);
                          
                          // Check if user is agent
                          if (user.role === 'agent') {
                            navigate('/agent/dashboard');
                          } else {
                            // Non-agent authenticated user, redirect to agent login with switch option
                            navigate('/agent/login?switch=1');
                          }
                        } else {
                          console.log('❌ User not authenticated, navigating to agent login');
                          navigate('/agent/login');
                        }
                      }} 
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-500 transition-colors duration-200 border-b border-gray-100"
                    >
                      <i className="fas fa-handshake mr-3 text-orange-500"></i>
                      Agent Portal
                    </button>
                    <Link to="/admin/login" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-500 transition-colors duration-200">
                      <i className="fas fa-cog mr-3 text-orange-500"></i>
                      Admin Panel
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 text-foreground hover:text-orange-500 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <div className="flex flex-col justify-center items-center w-6 h-6">
                <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : 'mb-1'}`}></span>
                <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'mb-1'}`}></span>
                <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center space-x-4 min-w-[200px] justify-end">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:scale-110 transition-transform duration-200" 
                    title={user.email}
                    onClick={() => {
                      if (user.role === 'customer' || user.role === 'user') {
                        navigate('/dashboard');
                      } else {
                        navigate('/dashboard');
                      }
                    }}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={() => logout()}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-4 py-2 inline-flex items-center text-sm"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-4 py-2 inline-flex items-center text-sm">
                    <i className="fas fa-user mr-2"></i>Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-medium shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center text-sm"
                  >
                    <i className="fas fa-arrow-right-to-bracket mr-2"></i>Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 right-0 bg-background shadow-xl transform transition-transform duration-300 ease-out max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center h-20 px-6 border-b border-border">
              <img src={picnifyLogo} alt="Picnify.in Logo" className="h-10" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-10 h-10 text-foreground hover:text-orange-500 transition-colors duration-200 rounded-full hover:bg-gray-100"
                aria-label="Close mobile menu"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="px-6 py-8 space-y-4">
              <Link 
                to="/" 
                className="flex items-center text-lg font-medium text-foreground hover:text-orange-500 transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-home mr-4 text-orange-500 w-5 text-center"></i>
                Home
              </Link>
              <Link 
                to="/properties" 
                className="flex items-center text-lg font-medium text-foreground hover:text-orange-500 transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-building mr-4 text-orange-500 w-5 text-center"></i>
                Properties
              </Link>
              <Link 
                to="/locations" 
                className="flex items-center text-lg font-medium text-foreground hover:text-orange-500 transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-map-marker-alt mr-4 text-orange-500 w-5 text-center"></i>
                Locations
              </Link>
              <Link 
                to="/about" 
                className="flex items-center text-lg font-medium text-foreground hover:text-orange-500 transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-info-circle mr-4 text-orange-500 w-5 text-center"></i>
                About
              </Link>
              <Link 
                to="/contact" 
                className="flex items-center text-lg font-medium text-foreground hover:text-orange-500 transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-envelope mr-4 text-orange-500 w-5 text-center"></i>
                Contact
              </Link>
              
              {/* Mobile Portals Section */}
              <div className="pt-6 border-t border-border/50">
                <div className="text-lg font-bold text-foreground mb-6 flex items-center">
                  <i className="fas fa-door-open mr-4 text-orange-500 w-5 text-center"></i>
                  Portals
                </div>
                <div className="space-y-4">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🚀 Mobile: Host Portal clicked');
                      console.log('🔍 Current user state:', { 
                        isAuthenticated, 
                        user: user ? { email: user.email, role: user.role } : null 
                      });
                      
                       if (isAuthenticated && user) {
                         console.log('✅ User is authenticated, checking role...');
                         console.log('🔍 User role:', user.role);
                         
                          // Check if user is owner
                          if (user.role === 'owner') {
                            navigate('/owner/view');
                          } else {
                            // Non-owner authenticated user, redirect to owner login with switch option
                            navigate('/owner/login?switch=1');
                          }
                       } else {
                         console.log('❌ User not authenticated, navigating to owner login');
                         navigate('/owner/login');
                       }
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left text-base text-muted-foreground hover:text-orange-500 transition-colors duration-200 py-3 px-3 rounded-lg hover:bg-orange-50"
                  >
                    <i className="fas fa-home mr-4 text-orange-500 w-5 text-center"></i>
                    Host Portal
                  </button>
                  <Link 
                    to="/agent/login"
                    className="block text-base text-muted-foreground hover:text-orange-500 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className="fas fa-handshake mr-3 text-orange-500 w-4"></i>
                    Travel Agent Portal
                  </Link>
                  <Link 
                    to="/admin/login" 
                    className="block text-base text-muted-foreground hover:text-orange-500 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className="fas fa-cog mr-3 text-orange-500 w-4"></i>
                    Admin Panel
                  </Link>
                </div>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="space-y-4 pt-4">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-3">
                      <div 
                        className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-medium cursor-pointer hover:scale-110 transition-transform duration-200" 
                        title={user.email}
                        onClick={() => {
                          if (user.role === 'customer' || user.role === 'user') {
                            navigate('/dashboard');
                          } else {
                            navigate('/dashboard');
                          }
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 rounded-lg px-6 py-4 text-center"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="block w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 rounded-lg px-6 py-4 text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <i className="fas fa-user mr-2"></i>
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 hover:from-orange-600 hover:to-red-600 transition-all duration-300 rounded-lg font-medium shadow-lg text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <i className="fas fa-arrow-right-to-bracket mr-2"></i>
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
