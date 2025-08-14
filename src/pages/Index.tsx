import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

// Enhanced scroll animation hook with fallback visibility
const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    // Get all elements and ensure they're visible as fallback
    const elements = document.querySelectorAll('.fade-in-up, .fade-in');
    elements.forEach(el => {
      // Add fallback visibility immediately
      const htmlElement = el as HTMLElement;
      htmlElement.style.opacity = '1';
      htmlElement.style.transform = 'translateY(0)';
      observer.observe(el);
    });

    // Cleanup timeout for animations that don't trigger
    const fallbackTimeout = setTimeout(() => {
      elements.forEach(el => {
        if (!el.classList.contains('animate')) {
          el.classList.add('animate');
        }
      });
    }, 1000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, []);
};

// Import only required assets
import heroBackground from '@/assets/hero-background.jpg';
import successfulHost from '@/assets/successful-host.jpg';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';
import HeroBanner from '@/components/banners/HeroBanner';
import SecondaryBanner from '@/components/banners/SecondaryBanner';
import FooterBanner from '@/components/banners/FooterBanner';
import LocationAutocomplete from '@/components/ui/LocationAutocomplete';

const Index: React.FC = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { loading, user, isAuthenticated, logout } = useAuth();

  // Debug authentication state
  useEffect(() => {
    console.log('🔍 Index page auth state:', { 
      isAuthenticated, 
      user: user ? { email: user.email, role: user.role, id: user.id } : null 
    });
  }, [isAuthenticated, user]);

  // Initialize scroll animations
  useScrollAnimation();

  // No dummy data - will be replaced with database properties
  const topPicks: any[] = [];

  // No dummy data - will be replaced with database properties
  const featuredProperties: any[] = [];

  const categories = [
    { name: 'Farm Houses', icon: 'fas fa-tractor' },
    { name: 'Beach Properties', icon: 'fas fa-umbrella-beach' },
    { name: 'Mountain Retreats', icon: 'fas fa-mountain' },
    { name: 'Garden Venues', icon: 'fas fa-leaf' },
    { name: 'Pool Villas', icon: 'fas fa-swimming-pool' }
  ];

  return (
    <div className="min-h-screen bg-background font-poppins">
  {loading && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
          <i className="fas fa-spinner text-white text-2xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Loading Picnify...</h3>
        <p className="text-gray-600">Please wait while we set up your experience</p>
      </div>
    </div>
  )}
{/* Header */}
<header className="sticky top-0 z-50 bg-background shadow-lg">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-20">
      {/* Logo Section */}
      <div className="flex items-center min-w-[200px] lg:min-w-[250px]">
        <a href="/" className="flex items-center">
          <img src={picnifyLogo} alt="Picnify.in Logo" className="h-10 sm:h-12 w-auto" />
        </a>
      </div>

      {/* Navigation Section */}
      <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10 flex-1 justify-center">
        <a href="/" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Home</a>
        <a href="/properties" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Properties</a>
        <a href="/locations" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Locations</a>
        <a href="/about" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">About</a>
        <a href="/contact" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Contact</a>
        
        {/* Portals Dropdown */}
        <div className="relative group">
          <button className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-orange-50">
            Portals
            <i className="fas fa-chevron-down ml-1 text-xs transition-transform duration-200 group-hover:rotate-180"></i>
          </button>
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🚀 Property Owner Portal clicked');
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
                     console.log('✅ User is authenticated, navigating to dashboard');
                     console.log('🔍 User role:', user.role);
                     navigate('/host/dashboard');
                   } else {
                     console.log('❌ User not authenticated, navigating to login');
                     navigate('/host/login');
                   }
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-orange transition-colors duration-200 border-b border-gray-100"
              >
                <i className="fas fa-home mr-3 text-brand-orange"></i>
                Property Owner Portal
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🚀 Travel Agent Portal clicked');
                  console.log('🔍 Current user state:', { 
                    isAuthenticated, 
                    user: user ? { email: user.email, role: user.role } : null 
                  });
                  
                  if (isAuthenticated && user) {
                    if (user.role === 'agent') {
                      console.log('✅ User is agent, navigating to dashboard');
                      navigate('/agent/dashboard');
                    } else {
                      console.log('⚠️ User is not agent, navigating to login');
                      navigate('/agent/login');
                    }
                  } else {
                    console.log('❌ User not authenticated, navigating to login');
                    navigate('/agent/login');
                  }
                }} 
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-orange transition-colors duration-200 border-b border-gray-100"
              >
                <i className="fas fa-handshake mr-3 text-brand-orange"></i>
                Travel Agent Portal
              </button>
              <a href="/admin/login" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-orange transition-colors duration-200">
                <i className="fas fa-cog mr-3 text-brand-orange"></i>
                Admin Panel
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden flex items-center justify-center w-10 h-10 text-foreground hover:text-brand-orange transition-colors duration-200"
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
            <div className="w-8 h-8 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:scale-110 transition-transform duration-200" title={user.email}>
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
            <a href="/login" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-4 py-2 inline-flex items-center text-sm">
              <i className="fas fa-user mr-2"></i>Login
            </a>
            <Link
              to="/signup"
              className="bg-gradient-to-r from-brand-orange to-brand-red text-white px-4 py-2 hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-medium shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center text-sm"
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
              className="flex items-center justify-center w-10 h-10 text-foreground hover:text-brand-orange transition-colors duration-200 rounded-full hover:bg-gray-100"
              aria-label="Close mobile menu"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <div className="px-6 py-8 space-y-4">
            <a 
              href="/" 
              className="flex items-center text-lg font-medium text-foreground hover:text-brand-orange transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-home mr-4 text-brand-orange w-5 text-center"></i>
              Home
            </a>
            <a 
              href="/properties" 
              className="flex items-center text-lg font-medium text-foreground hover:text-brand-orange transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-building mr-4 text-brand-orange w-5 text-center"></i>
              Properties
            </a>
            <a 
              href="/locations" 
              className="flex items-center text-lg font-medium text-foreground hover:text-brand-orange transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-map-marker-alt mr-4 text-brand-orange w-5 text-center"></i>
              Locations
            </a>
            <a 
              href="/about" 
              className="flex items-center text-lg font-medium text-foreground hover:text-brand-orange transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-info-circle mr-4 text-brand-orange w-5 text-center"></i>
              About
            </a>
            <a 
              href="/contact" 
              className="flex items-center text-lg font-medium text-foreground hover:text-brand-orange transition-colors duration-200 py-4 px-3 rounded-lg hover:bg-orange-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-envelope mr-4 text-brand-orange w-5 text-center"></i>
              Contact
            </a>
            
            {/* Mobile Portals Section */}
            <div className="pt-6 border-t border-border/50">
              <div className="text-lg font-bold text-foreground mb-6 flex items-center">
                <i className="fas fa-door-open mr-4 text-brand-orange w-5 text-center"></i>
                Portals
              </div>
              <div className="space-y-4">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚀 Mobile: Property Owner Portal clicked');
                    console.log('🔍 Current user state:', { 
                      isAuthenticated, 
                      user: user ? { email: user.email, role: user.role } : null 
                    });
                    
                     if (isAuthenticated && user) {
                       console.log('✅ User is authenticated, navigating to dashboard');
                       console.log('🔍 User role:', user.role);
                       navigate('/host/dashboard');
                     } else {
                       console.log('❌ User not authenticated, navigating to login');
                       navigate('/host/login');
                     }
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full text-left text-base text-muted-foreground hover:text-brand-orange transition-colors duration-200 py-3 px-3 rounded-lg hover:bg-orange-50"
                >
                  <i className="fas fa-home mr-4 text-brand-orange w-5 text-center"></i>
                  Property Owner Portal
                </button>
                <Link 
                  to="/agent/login"
                  className="block text-base text-muted-foreground hover:text-brand-orange transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-handshake mr-3 text-brand-orange w-4"></i>
                  Travel Agent Portal
                </Link>
                <a 
                  href="/admin/login" 
                  className="block text-base text-muted-foreground hover:text-brand-orange transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-cog mr-3 text-brand-orange w-4"></i>
                  Admin Panel
                </a>
              </div>
            </div>

            {/* Mobile Auth Buttons */}
            <div className="space-y-4 pt-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center text-white font-medium" title={user.email}>
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
                  <a 
                    href="/login" 
                    className="block w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 rounded-lg px-6 py-4 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className="fas fa-user mr-2"></i>
                    Login
                  </a>
                  <Link
                    to="/signup"
                    className="block w-full bg-gradient-to-r from-brand-orange to-brand-red text-white px-6 py-4 hover:from-orange-600 hover:to-red-600 transition-all duration-300 rounded-lg font-medium shadow-lg text-center"
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

{/* Dynamic Hero Banner from CMS */}
<HeroBanner />

{/* Search Bar Section */}
<section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
  <div className="container mx-auto px-4">
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl max-w-7xl mx-auto border transform hover:scale-[1.02] transition-all duration-500">
      <div className="flex flex-wrap gap-4 mb-6 border-b border-gray-200 pb-4">
        {[
          { icon: 'fas fa-sun', label: 'Day Picnic', value: 'day-picnic' },
          { icon: 'fas fa-hotel', label: 'Resorts', value: 'resort' },
          { icon: 'fas fa-home', label: 'Villas', value: 'villa' },
          { icon: 'fas fa-warehouse', label: 'Farmhouse', value: 'farmhouse' },
          { icon: 'fas fa-house-user', label: 'Homestay', value: 'homestay' },
          { icon: 'fas fa-landmark', label: 'Heritage Palace', value: 'heritage' },
        ].map((category, index) => (
          <button
            key={index}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              category.value === 'day-picnic'
                ? 'bg-gradient-to-r from-brand-red to-brand-orange text-white shadow-lg'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className={`${category.icon} text-lg`}></i>
            <span className="font-medium whitespace-nowrap">{category.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-center">
        <div className="lg:col-span-2">
          <LocationAutocomplete
            value={searchLocation}
            onChange={setSearchLocation}
            placeholder="Where would you like to go?"
          />
        </div>
        <div className="lg:col-span-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fas fa-calendar-alt text-brand-orange text-lg"></i>
            </div>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-gray-800 border-2 border-gray-200 rounded-xl outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all duration-300 text-base"
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fas fa-users text-blue-500 text-lg"></i>
            </div>
            <select
              className="w-full pl-12 pr-12 py-4 text-gray-800 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-base appearance-none cursor-pointer"
              onChange={(e) => setGroupSize(e.target.value)}
            >
              <option value="">Select group size</option>
              {[...Array(15)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} Guest{i !== 0 ? 's' : ''}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <button 
            onClick={() => navigate('/properties')}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 cursor-pointer font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <i className="fas fa-search text-xl"></i>
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

{/* Secondary Banner */}
<SecondaryBanner />

{/* Property Owner CTA Section */}
<section className="py-16 bg-gradient-to-r from-brand-orange to-brand-red relative overflow-hidden">
<div className="absolute inset-0 bg-black/10"></div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
<div className="text-center text-white">
<div className="mb-6">
<span className="inline-block bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-sm font-bold border border-white/30 mb-4">
🏠 Property Owners
</span>
<h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 font-poppins text-shadow">
Ready to List Your Property?
</h2>
<p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
Join thousands of successful property owners earning premium income. Access your dashboard and start listing today!
</p>
</div>
<div className="flex flex-col sm:flex-row gap-4 justify-center">
<button 
  onClick={() => {
    console.log('🚀 Property Owner CTA clicked');
    if (isAuthenticated && user) {
      console.log('✅ User is authenticated, navigating to dashboard');
      console.log('🔍 User role:', user.role);
      navigate('/owner/view');
    } else {
      console.log('❌ User not authenticated, navigating to login');
      navigate('/owner/login');
    }
  }}
  className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
>
<i className="fas fa-home"></i>
Access Dashboard
</button>
<button 
  onClick={() => navigate('/owner/signup')}
  className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button flex items-center justify-center gap-3"
>
<i className="fas fa-user-plus"></i>
Sign Up as Owner
</button>
</div>
</div>
</div>
</section>

{/* Top Picks Section */}
<section className="py-32 bg-secondary/20 relative overflow-hidden">
<div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-brand-orange/20 to-brand-red/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
<div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-brand-red/20 to-pink-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
<div className="text-center mb-20 fade-in-up">
<div className="inline-block">
<span className="text-brand-orange font-bold text-lg mb-4 block uppercase tracking-wider">Handpicked Excellence</span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground font-poppins mb-6 text-shadow">
                    Top Picks for You
                  </h2>
<div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full"></div>
</div>
<p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-6 leading-relaxed">
Curated collection of the most stunning and luxurious properties that promise unforgettable experiences
</p>
</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
{topPicks.length > 0 ? topPicks.map((property, index) => (
<div key={property.id} className="group cursor-pointer fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
<div className="bg-gradient-to-br from-brand-orange to-brand-red p-0.5 rounded-2xl hover-lift">
<div className="bg-background rounded-2xl overflow-hidden">
<div className="relative">
<img
src={property.image}
alt={property.name}
className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
/>
<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
<div className="absolute top-4 left-4">
<span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-gray-800 shadow-lg">
<i className="fas fa-map-marker-alt text-brand-red mr-1"></i>
{property.location}
</span>
</div>
<div className="absolute top-4 right-4">
<div className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
<i className="fas fa-star mr-1"></i>
{property.rating}
</div>
</div>
                <div className="absolute bottom-4 left-4 right-4 transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <button 
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="w-full bg-white text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 rounded-button"
                  >
                    View Details
                  </button>
                </div>
</div>
<div className="p-6">
<h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-brand-red transition-colors duration-300">{property.name}</h3>
<div className="flex items-center justify-between">
                <div className="text-xl font-black text-foreground">
₹{property.price.toLocaleString()}
<span className="text-sm font-normal text-muted-foreground ml-1">per day</span>
</div>
<div className="flex items-center gap-1">
{[...Array(5)].map((_, i) => (
<i key={i} className={`fas fa-star text-sm ${i < Math.floor(property.rating) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
))}
</div>
</div>
</div>
</div>
</div>
</div>
)) : (
          <div className="col-span-full text-center py-16">
            <div className="bg-secondary/20 rounded-2xl p-12 max-w-md mx-auto">
              <i className="fas fa-home text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-bold text-foreground mb-2">No Properties Available</h3>
              <p className="text-muted-foreground">Check back later for amazing property listings!</p>
            </div>
          </div>
        )}
        </div>
        <div className="text-center mt-16">
          <button 
            onClick={() => navigate('/properties')}
            className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-10 py-4 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            Explore All Properties
            <i className="fas fa-arrow-right ml-3"></i>
          </button>
        </div>
</div>
</section>

{/* Categories Section */}
<section className="py-32 relative overflow-hidden bg-secondary/10">
<div className="absolute inset-0 opacity-30">
<div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-brand-red/30 to-brand-orange/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
<div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-r from-brand-orange/30 to-yellow-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-gradient-to-r from-pink-300/30 to-brand-red/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
</div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
<div className="text-center max-w-4xl mx-auto mb-20 fade-in-up">
<span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent font-bold text-lg mb-4 block uppercase tracking-wider">Find Your Perfect Match</span>
<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 font-poppins mb-6 text-shadow">
Explore by Category
</h2>
<div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full mb-6"></div>
<p className="text-lg text-muted-foreground leading-relaxed">
Choose from our meticulously curated categories to discover destinations that match your dream getaway perfectly
</p>
</div>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
{categories.map((category, index) => (
<div key={index} className="group cursor-pointer text-center fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
<div className="relative mb-6">
<div className="w-32 h-32 mx-auto bg-gradient-to-br from-background via-brand-orange/10 to-brand-red/10 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-3 border-2 border-background">
<div className="absolute inset-0 bg-gradient-to-br from-brand-red to-brand-orange rounded-3xl opacity-0 group-hover:opacity-90 transition-opacity duration-500"></div>
<i className={`${category.icon} text-4xl text-brand-red group-hover:text-white transition-colors duration-500 relative z-10`}></i>
<div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10 rounded-3xl"></div>
</div>
<div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-brand-orange rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-0 group-hover:scale-100">
<i className="fas fa-plus text-white text-xs"></i>
</div>
</div>
<h3 className="text-lg font-bold text-foreground group-hover:text-brand-red transition-colors duration-300 whitespace-nowrap">
{category.name}
</h3>
<div className="w-0 group-hover:w-16 h-0.5 bg-gradient-to-r from-brand-red to-brand-orange mx-auto mt-2 transition-all duration-500 rounded-full"></div>
</div>
))}
</div>
<div className="text-center mt-16">
<button className="bg-background text-foreground px-10 py-4 rounded-xl hover:bg-secondary/20 transition-all duration-300 cursor-pointer whitespace-nowrap font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-border">
View All Categories
<i className="fas fa-grid-3x3 ml-3"></i>
</button>
</div>
</div>
</section>

{/* Featured Properties Grid */}
<section className="py-32 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-brand-orange/10 to-transparent rounded-full filter blur-3xl opacity-50"></div>
<div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-brand-red/10 to-transparent rounded-full filter blur-3xl opacity-50"></div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
<div className="text-center mb-20 fade-in-up">
<span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent font-bold text-lg mb-4 block uppercase tracking-wider">Premium Collection</span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground font-poppins mb-6 text-shadow">
                    Featured Properties
                  </h2>
<div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full"></div>
</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
{featuredProperties.length > 0 ? featuredProperties.map((property, index) => (
<div key={property.id} className="group cursor-pointer fade-in-up" style={{animationDelay: `${index * 0.2}s`}}>
<div className="bg-background rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 hover:-rotate-1 border border-border">
<div className="relative overflow-hidden">
<img
src={property.image}
alt={property.name}
className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
/>
<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
<div className="absolute top-4 right-4">
<button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-brand-red hover:text-white transition-all duration-300 group">
<i className="fas fa-heart text-gray-600 group-hover:text-white"></i>
</button>
</div>
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                <button 
                  onClick={() => navigate(`/property/${property.id}`)}
                  className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors duration-200 rounded-button shadow-lg"
                >
                  View Details
                </button>
              </div>
</div>
<div className="p-8">
<div className="flex items-start justify-between mb-4">
<div>
<h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-brand-red transition-colors duration-300">{property.name}</h3>
<div className="flex items-center text-muted-foreground">
<i className="fas fa-map-marker-alt text-brand-red mr-2"></i>
<span className="font-medium">{property.location}</span>
</div>
</div>
<div className="text-right">
<div className="text-xl font-black text-foreground">₹{property.price.toLocaleString()}</div>
<div className="text-sm text-muted-foreground">per day</div>
</div>
</div>
<div className="flex flex-wrap gap-2 mb-6">
{property.amenities.map((amenity, amenityIndex) => (
<span key={amenityIndex} className="bg-gradient-to-r from-brand-red/10 to-brand-orange/10 text-brand-red px-4 py-2 rounded-full text-sm font-medium border border-brand-red/20">
{amenity}
</span>
))}
</div>
                  <button 
                    onClick={() => navigate('/properties')}
                    className="w-full bg-gradient-to-r from-brand-orange to-brand-red text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20"
                  >
                    Book Now
                    <i className="fas fa-arrow-right ml-2"></i>
                  </button>
</div>
</div>
</div>
)) : (
          <div className="col-span-full text-center py-16">
            <div className="bg-secondary/20 rounded-2xl p-12 max-w-md mx-auto">
              <i className="fas fa-building text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-bold text-foreground mb-2">No Featured Properties</h3>
              <p className="text-muted-foreground">Featured properties will appear here once added!</p>
            </div>
          </div>
        )}
        </div>
        <div className="text-center mt-16">
          <button 
            onClick={() => navigate('/properties')}
            className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-10 py-4 rounded-xl hover:from-gray-900 hover:to-black transition-all duration-300 cursor-pointer whitespace-nowrap font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            View All Featured Properties
            <i className="fas fa-building ml-3"></i>
          </button>
        </div>
</div>
</section>

{/* Host CTA Section */}
<section className="py-32 relative overflow-hidden bg-brand-orange">
<div className="absolute inset-0 bg-black/20"></div>
<div className="absolute top-0 left-0 w-full h-full">
<div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full filter blur-3xl animate-blob"></div>
<div className="absolute bottom-20 right-20 w-48 h-48 bg-white/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white/5 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
</div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
<div className="text-white fade-in-up">
<div className="mb-8">
<span className="inline-block bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-sm font-bold border border-white/30 mb-6">
🏡 Become a Host
</span>
<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-6 font-poppins text-shadow leading-tight">
Turn Your Property Into Gold
</h2>
<p className="text-lg opacity-90 leading-relaxed mb-8">
Join thousands of successful hosts who are earning premium income by listing their properties on India's fastest-growing vacation rental platform
</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
<div className="flex items-start gap-4">
<div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
<i className="fas fa-rocket text-xl"></i>
</div>
<div>
<h3 className="font-bold text-lg mb-2">Lightning Fast Setup</h3>
<p className="opacity-90 text-sm">Get your property listed in under 10 minutes</p>
</div>
</div>
<div className="flex items-start gap-4">
<div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
<i className="fas fa-shield-alt text-xl"></i>
</div>
<div>
<h3 className="font-bold text-lg mb-2">100% Secure</h3>
<p className="opacity-90 text-sm">Advanced payment protection & insurance</p>
</div>
</div>
<div className="flex items-start gap-4">
<div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
<i className="fas fa-chart-line text-xl"></i>
</div>
<div>
<h3 className="font-bold text-lg mb-2">Smart Analytics</h3>
<p className="opacity-90 text-sm">Real-time insights to maximize earnings</p>
</div>
</div>
<div className="flex items-start gap-4">
<div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
<i className="fas fa-headset text-xl"></i>
</div>
<div>
<h3 className="font-bold text-lg mb-2">24/7 Support</h3>
<p className="opacity-90 text-sm">Dedicated host success manager</p>
</div>
</div>
</div>
<div className="flex flex-col sm:flex-row gap-4">
<button 
  onClick={() => {
    console.log('🚀 List Your Property clicked');
    if (isAuthenticated && user) {
      console.log('✅ User is authenticated, navigating to dashboard');
      console.log('🔍 User role:', user.role);
      navigate('/owner/view');
    } else {
      console.log('❌ User not authenticated, navigating to login');
      navigate('/owner/login');
    }
  }}
  className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
>
<i className="fas fa-plus-circle"></i>
List Your Property
</button>
<button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button flex items-center justify-center gap-3">
<i className="fas fa-play-circle"></i>
Watch Demo
</button>
</div>
<div className="mt-8 flex items-center gap-8">
<div className="text-center">
<div className="text-3xl font-black">₹50K+</div>
<div className="text-sm opacity-80">Avg Monthly Earnings</div>
</div>
<div className="text-center">
<div className="text-3xl font-black">15K+</div>
<div className="text-sm opacity-80">Active Hosts</div>
</div>
<div className="text-center">
<div className="text-3xl font-black">98%</div>
<div className="text-sm opacity-80">Satisfaction Rate</div>
</div>
</div>
</div>
<div className="relative fade-in-up" style={{animationDelay: '0.3s'}}>
<div className="bg-gradient-to-br from-brand-orange to-brand-red p-0.5 rounded-2xl">
<div className="bg-white p-2 rounded-2xl">
<img
src={successfulHost}
alt="Successful Property Host"
className="w-full h-96 lg:h-[500px] object-cover object-top rounded-xl"
/>
</div>
</div>
<div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
<i className="fas fa-crown text-2xl text-white"></i>
</div>
</div>
</div>
</div>
</section>

{/* Footer Banner */}
<FooterBanner />

{/* Footer */}
<footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
<div className="absolute inset-0 opacity-10">
<div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-brand-red to-brand-orange rounded-full filter blur-3xl"></div>
<div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-brand-orange to-yellow-500 rounded-full filter blur-3xl"></div>
</div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
<div className="lg:col-span-2">
<div className="mb-6">
<img src={picnifyLogo} alt="Picnify.in Logo" className="h-12" />
</div>
<p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
Picnify is your one-stop platform to discover and book day picnic spots, villas, farmhouses, and unique getaways, making your time with loved ones hassle-free and memorable
</p>
<div className="flex flex-wrap gap-4">
<a href="https://facebook.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
<i className="fab fa-facebook-f text-xl group-hover:animate-bounce"></i>
</a>
<a href="https://instagram.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
<i className="fab fa-instagram text-xl group-hover:animate-bounce"></i>
</a>
<a href="https://twitter.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
<i className="fab fa-twitter text-xl group-hover:animate-bounce"></i>
</a>
<a href="https://youtube.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
<i className="fab fa-youtube text-xl group-hover:animate-bounce"></i>
</a>
<a href="https://linkedin.com/company/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
<i className="fab fa-linkedin-in text-xl group-hover:animate-bounce"></i>
</a>
<a href="https://wa.me/+919876543210" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
<i className="fab fa-whatsapp text-xl group-hover:animate-bounce"></i>
</a>
</div>
</div>
<div>
            <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>About Picknify</Link></li>
              <li><Link to="/how-it-works" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>How It Works</Link></li>
              <li><Link to="/safety-guidelines" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Safety Guidelines</Link></li>
              <li><Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Terms of Service</Link></li>
            </ul>
</div>
<div>
            <h3 className="text-xl font-bold mb-6 text-white">Support & Help</h3>
            <ul className="space-y-4">
              <li><Link to="/help-center" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>24/7 Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Contact Support</Link></li>
              <li><Link to="/booking-assistance" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Booking Assistance</Link></li>
              <li><Link to="/host-resources" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Host Resources</Link></li>
              <li><Link to="/trust-safety" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Trust & Safety</Link></li>
            </ul>
</div>
</div>
<div className="border-t border-gray-700 pt-12">
<div className="flex flex-col lg:flex-row justify-between items-center gap-8">
<div className="text-center lg:text-left">
<p className="text-gray-400 text-lg">
© 2025 Picnify.in - Crafted with ❤️ in India. All rights reserved.
</p>
<p className="text-gray-500 text-sm mt-2">
Connecting travelers with extraordinary experiences since 2024
</p>
</div>
<div className="flex items-center gap-8">
<div className="text-center">
<div className="text-2xl font-bold text-white">4.9★</div>
<div className="text-xs text-gray-400">App Rating</div>
</div>
</div>
</div>
</div>
</div>
</footer>
</div>
);
};

export default Index;