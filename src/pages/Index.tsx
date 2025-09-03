import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Enhanced scroll animation hook with fallback visibility
const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
        }
      });
    }, observerOptions);

    // Get all elements and ensure they're visible as fallback
    const elements = document.querySelectorAll(".fade-in-up, .fade-in");
    elements.forEach((el) => {
      // Add fallback visibility immediately
      const htmlElement = el as HTMLElement;
      htmlElement.style.opacity = "1";
      htmlElement.style.transform = "translateY(0)";
      observer.observe(el);
    });

    // Cleanup timeout for animations that don't trigger
    const fallbackTimeout = setTimeout(() => {
      elements.forEach((el) => {
        if (!el.classList.contains("animate")) {
          el.classList.add("animate");
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
import heroBackground from "@/assets/hero-background.jpg";
import successfulHost from "@/assets/successful-host.jpg";
import picnifyLogo from "/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png";
import HeroBanner from "@/components/banners/HeroBanner";
import SecondaryBanner from "@/components/banners/SecondaryBanner";
import FooterBanner from "@/components/banners/FooterBanner";
import SearchForm from "@/components/ui/SearchForm";
import { SearchService, type SearchFilters } from "@/lib/searchService";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { loading, user, isAuthenticated } = useAuth();

  // Debug authentication state
  useEffect(() => {
    console.log("🔍 Index page auth state:", {
      isAuthenticated,
      user: user ? { email: user.email, role: user.role, id: user.id } : null,
    });
  }, [isAuthenticated, user]);

  // Initialize scroll animations
  useScrollAnimation();

  // No dummy data - will be replaced with database properties
  const topPicks: Array<{
    id: string;
    name: string;
    image: string;
    location: string;
    rating: number;
    price: number;
  }> = [];

  // No dummy data - will be replaced with database properties
  const featuredProperties: Array<{
    id: string;
    name: string;
    image: string;
    location: string;
    price: number;
    amenities: string[];
  }> = [];

  // Handle search from homepage
  const handleSearch = (filters: SearchFilters) => {
    console.log('🔍 Homepage search triggered:', filters);
    
    // Navigate to properties page with search params
    const searchParams = new URLSearchParams();
    
    if (filters.location && filters.location !== 'all') {
      searchParams.set('location', filters.location);
    }
    if (filters.category && filters.category !== 'all') {
      searchParams.set('category', filters.category);
    }
    if (filters.date) {
      searchParams.set('date', filters.date);
    }
    if (filters.guests && filters.guests > 0) {
      searchParams.set('guests', filters.guests.toString());
    }

    const queryString = searchParams.toString();
    navigate(`/properties${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <i className="fas fa-spinner text-white text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Loading Picnify...
            </h3>
            <p className="text-gray-600">
              Please wait while we set up your experience
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Hero Banner with Search Overlay */}
      <HeroBanner
        overlay={
          <div className="animate-fade-in">
            {/* Sub-heading */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                Discover your perfect getaway
              </h2>
            </div>

            {/* Search Bar */}
            <div className="max-w-6xl mx-auto">
              <SearchForm onSearch={handleSearch} />
            </div>
          </div>
        }
      />

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
                Join thousands of successful property owners earning premium
                income. Access your dashboard and start listing today!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  console.log("🚀 Property Owner CTA clicked");
                  if (isAuthenticated && user) {
                    console.log(
                      "✅ User is authenticated, navigating to dashboard"
                    );
                    console.log("🔍 User role:", user.role);
                    navigate("/owner/view");
                  } else {
                    console.log(
                      "❌ User not authenticated, navigating to login"
                    );
                    navigate("/owner/login");
                  }
                }}
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <i className="fas fa-home"></i>
                Access Dashboard
              </button>
              <button
                onClick={() => navigate("/owner/signup")}
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
              <span className="text-brand-orange font-bold text-lg mb-4 block uppercase tracking-wider">
                Handpicked Excellence
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground font-poppins mb-6 text-shadow">
                Top Picks for You
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full"></div>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-6 leading-relaxed">
              Curated collection of the most stunning and luxurious properties
              that promise unforgettable experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {topPicks.length > 0 ? (
              topPicks.map((property, index) => (
                <div
                  key={property.id}
                  className="group cursor-pointer fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
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
                        <div className="absolute bottom-4 left-4 right-4 transform md:translate-y-8 md:group-hover:translate-y-0 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500">
                          <button
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="w-full bg-white text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 rounded-button"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-brand-red transition-colors duration-300">
                          {property.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="text-xl font-black text-foreground">
                            ₹{property.price.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              per day
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`fas fa-star text-sm ${
                                  i < Math.floor(property.rating)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              ></i>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="bg-secondary/20 rounded-2xl p-12 max-w-md mx-auto">
                  <i className="fas fa-home text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No Properties Available
                  </h3>
                  <p className="text-muted-foreground">
                    Check back later for amazing property listings!
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="text-center mt-16">
            <button
              onClick={() => navigate("/properties")}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-10 py-4 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Explore All Properties
              <i className="fas fa-arrow-right ml-3"></i>
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
            <span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent font-bold text-lg mb-4 block uppercase tracking-wider">
              Premium Collection
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground font-poppins mb-6 text-shadow">
              Featured Properties
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredProperties.length > 0 ? (
              featuredProperties.map((property, index) => (
                <div
                  key={property.id}
                  className="group cursor-pointer fade-in-up"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
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
                      <div className="absolute bottom-4 left-4 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 transform md:translate-y-4 md:group-hover:translate-y-0">
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
                          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-brand-red transition-colors duration-300">
                            {property.name}
                          </h3>
                          <div className="flex items-center text-muted-foreground">
                            <i className="fas fa-map-marker-alt text-brand-red mr-2"></i>
                            <span className="font-medium">
                              {property.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-foreground">
                            ₹{property.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            per day
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {property.amenities.map((amenity, amenityIndex) => (
                          <span
                            key={amenityIndex}
                            className="bg-gradient-to-r from-brand-red/10 to-brand-orange/10 text-brand-red px-4 py-2 rounded-full text-sm font-medium border border-brand-red/20"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => navigate("/properties")}
                        className="w-full bg-gradient-to-r from-brand-orange to-brand-red text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20"
                      >
                        Book Now
                        <i className="fas fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="bg-secondary/20 rounded-2xl p-12 max-w-md mx-auto">
                  <i className="fas fa-building text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No Featured Properties
                  </h3>
                  <p className="text-muted-foreground">
                    Featured properties will appear here once added!
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="text-center mt-16">
            <button
              onClick={() => navigate("/properties")}
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
                  Join thousands of successful hosts who are earning premium
                  income by listing their properties on India's fastest-growing
                  vacation rental platform
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-rocket text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">
                      Lightning Fast Setup
                    </h3>
                    <p className="opacity-90 text-sm">
                      Get your property listed in under 10 minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-shield-alt text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">100% Secure</h3>
                    <p className="opacity-90 text-sm">
                      Advanced payment protection & insurance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-chart-line text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Smart Analytics</h3>
                    <p className="opacity-90 text-sm">
                      Real-time insights to maximize earnings
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-headset text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">24/7 Support</h3>
                    <p className="opacity-90 text-sm">
                      Dedicated host success manager
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    console.log("🚀 List Your Property clicked");
                    if (isAuthenticated && user) {
                      console.log(
                        "✅ User is authenticated, navigating to dashboard"
                      );
                      console.log("🔍 User role:", user.role);
                      navigate("/owner/view");
                    } else {
                      console.log(
                        "❌ User not authenticated, navigating to login"
                      );
                      navigate("/owner/login");
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
            <div
              className="relative fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
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
    </>
  );
};

export default Index;
