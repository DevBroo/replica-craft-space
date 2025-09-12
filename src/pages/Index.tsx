import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch top picks from database with fallback to any available properties
  const { data: topPicksData = [], isLoading: topPicksLoading, refetch: refetchTopPicks } = useQuery({
    queryKey: ['top-picks'],
    queryFn: async () => {
      // First try to get high-rated and featured properties
      let { data, error } = await supabase
        .from('properties_public')
        .select('*')
        .eq('status', 'approved')
        .order('rating', { ascending: false })
        .order('is_featured', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Error fetching top picks:', error);
        throw error;
      }

      // If no properties found, try to get any approved properties
      if (!data || data.length === 0) {
        console.log('No top picks found, fetching any available properties as fallback');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('properties_public')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(8);

        if (fallbackError) {
          console.error('Error fetching fallback properties:', fallbackError);
          throw fallbackError;
        }

        data = fallbackData;
      }

      return data?.map(property => ({
        id: property.id,
        name: property.title,
        image: property.images?.[0] || '/placeholder.svg',
        location: property.general_location || 'Location not specified',
        rating: property.rating || 4.5,
        price: typeof property.pricing === 'object' && property.pricing && 'daily_rate' in property.pricing ? property.pricing.daily_rate : 0
      })) || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for fresher data
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const topPicks = topPicksData;

  // Fetch featured properties from database with fallback to regular properties
  const { data: featuredPropertiesData = [], isLoading: featuredLoading, refetch: refetchFeatured } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      // First try to get featured properties
      let { data: featuredData, error: featuredError } = await supabase
        .from('properties_public')
        .select('*')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(6);

      if (featuredError) {
        console.error('Error fetching featured properties:', featuredError);
        featuredData = [];
      }

      // If no featured properties, fallback to regular properties
      if (!featuredData || featuredData.length === 0) {
        console.log('No featured properties found, fetching regular properties as fallback');
        const { data: regularData, error: regularError } = await supabase
          .from('properties_public')
          .select('*')
          .eq('status', 'approved')
          .order('rating', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6);

        if (regularError) {
          console.error('Error fetching regular properties:', regularError);
          throw regularError;
        }

        featuredData = regularData;
      }

      return featuredData?.map(property => ({
        id: property.id,
        name: property.title,
        image: property.images?.[0] || '/placeholder.svg',
        location: property.general_location || 'Location not specified',
        price: typeof property.pricing === 'object' && property.pricing && 'daily_rate' in property.pricing ? property.pricing.daily_rate : 0,
        amenities: property.amenities || []
      })) || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for fresher data
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const featuredProperties = featuredPropertiesData;

  // Handle search from homepage
  const handleSearch = (filters: SearchFilters) => {
    console.log('🔍 Homepage search triggered:', filters);
    
    // Navigate to properties page with search params
    const searchParams = new URLSearchParams();
    
    if (filters.location && filters.location !== 'all') {
      searchParams.set('location', filters.location);
    }
    if (filters.category && filters.category !== ('all' as any)) {
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
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
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
              <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-white via-yellow-200 to-orange-300 bg-clip-text text-transparent drop-shadow-2xl">
                  Discover your perfect getaway
                </span>
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


      {/* Top Picks Section */}
      <section className="py-32 bg-secondary/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-red-500/20 to-pink-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 fade-in-up">
            <div className="inline-block">
              <span className="text-orange-500 font-bold text-lg mb-4 block uppercase tracking-wider">
                Handpicked Excellence
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground font-poppins mb-6 text-shadow">
                Top Picks for You
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-6 leading-relaxed">
              Curated collection of the most stunning and luxurious properties
              that promise unforgettable experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {topPicksLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="group cursor-pointer fade-in-up animate-pulse">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-0.5 rounded-2xl">
                    <div className="bg-background rounded-2xl overflow-hidden">
                      <div className="relative">
                        <div className="w-full h-64 bg-gray-300"></div>
                        <div className="absolute top-4 left-4">
                          <div className="bg-gray-300 h-8 w-24 rounded-full"></div>
                        </div>
                        <div className="absolute top-4 right-4">
                          <div className="bg-gray-300 h-6 w-16 rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="bg-gray-300 h-6 w-3/4 rounded mb-3"></div>
                        <div className="flex items-center justify-between">
                          <div className="bg-gray-300 h-6 w-20 rounded"></div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="bg-gray-300 h-4 w-4 rounded"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : topPicks.length > 0 ? (
              topPicks.map((property, index) => (
                <div
                  key={property.id}
                  className="group cursor-pointer fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-0.5 rounded-2xl hover-lift">
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
                            <i className="fas fa-map-marker-alt text-red-500 mr-1"></i>
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
                        <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-red-500 transition-colors duration-300">
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
                    No Top Picks Available
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We're working on curating amazing properties for you. In the meantime, explore all our available properties!
                  </p>
                  <button
                    onClick={() => navigate("/properties")}
                    className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-orange-600 transition-all duration-300 font-medium"
                  >
                    Explore All Properties
                  </button>
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-orange-500/10 to-transparent rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-red-500/10 to-transparent rounded-full filter blur-3xl opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 fade-in-up">
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent font-bold text-lg mb-4 block uppercase tracking-wider">
              Premium Collection
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground font-poppins mb-6 text-shadow">
              Featured Properties
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {featuredLoading ? (
              // Loading skeleton for featured properties
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="group cursor-pointer fade-in-up animate-pulse flex flex-col h-full">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 flex flex-col h-full">
                    <div className="relative">
                      <div className="w-full h-48 bg-gray-300"></div>
                      <div className="absolute top-4 left-4">
                        <div className="bg-gray-300 h-6 w-20 rounded-full"></div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <div className="bg-gray-300 h-8 w-16 rounded-full"></div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="bg-gray-300 h-5 w-3/4 rounded mb-2"></div>
                      <div className="bg-gray-300 h-4 w-1/2 rounded mb-3"></div>
                      <div className="flex gap-1 mb-3 flex-grow">
                        <div className="bg-gray-300 h-6 w-16 rounded-full"></div>
                        <div className="bg-gray-300 h-6 w-20 rounded-full"></div>
                        <div className="bg-gray-300 h-6 w-14 rounded-full"></div>
                      </div>
                      <div className="bg-gray-300 h-10 w-full rounded-lg mt-auto"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property, index) => (
                <div
                  key={property.id}
                  className="group cursor-pointer fade-in-up flex flex-col h-full"
                  style={{ animationDelay: `${index * 0.2}s` }}
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  <div className="bg-background rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 border border-border flex flex-col h-full">
                    <div className="relative overflow-hidden">
                      <img
                        src={property.image}
                        alt={property.name}
                        className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute top-4 right-4">
                        <button 
                          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all duration-300 group"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Add to wishlist"
                        >
                          <i className="fas fa-heart text-gray-600 group-hover:text-white"></i>
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 transform md:translate-y-4 md:group-hover:translate-y-0">
                        <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-6 py-2 rounded-full font-bold shadow-lg">
                          Click to view details
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-red-500 transition-colors duration-300 line-clamp-1">
                            {property.name}
                          </h3>
                          <div className="flex items-center text-muted-foreground">
                            <i className="fas fa-map-marker-alt text-red-500 mr-1 text-sm"></i>
                            <span className="font-medium text-sm">
                              {property.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-lg font-black text-red-600">
                            ₹{property.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per day
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3 flex-grow">
                        {property.amenities.slice(0, 3).map((amenity, amenityIndex) => (
                          <span
                            key={amenityIndex}
                            className="bg-gradient-to-r from-red-500/10 to-brand-orange/10 text-red-500 px-2 py-1 rounded-full text-xs font-medium border border-red-500/20"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            +{property.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate("/properties")}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20 mt-auto"
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
                    No Properties Available
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We're working on adding amazing properties. Check back later for new listings!
                  </p>
                  <button
                    onClick={() => navigate("/properties")}
                    className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-3 rounded-lg hover:from-gray-900 hover:to-black transition-all duration-300 font-medium"
                  >
                    Explore All Properties
                  </button>
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
      <section className="py-32 relative overflow-hidden bg-orange-500">
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
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-0.5 rounded-2xl">
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
