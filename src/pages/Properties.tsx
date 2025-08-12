import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';
import ImageCarousel from '@/components/owner/ImageCarousel';

// Scroll animation hook
const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);
    const elements = document.querySelectorAll('.fade-in-up, .fade-in');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};

// Import default image for properties without uploaded images
import beachsideParadise from '@/assets/beachside-paradise.jpg';
const Properties: React.FC = () => {
  // Initialize scroll animations
  useScrollAnimation();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Dropdown states for search functionality
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowGuestsDropdown(false);
        setShowPriceDropdown(false);
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const {
    user,
    isAuthenticated,
    logout
  } = useAuth();
  const navigate = useNavigate();

  // Load properties from database with production-optimized strategy
  const [dbProperties, setDbProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheDisabled, setCacheDisabled] = useState(() => {
    try {
      return localStorage?.getItem('cache_disabled') === 'true';
    } catch {
      return false;
    }
  });

  // Background refresh function for seamless updates
  const refreshPropertiesInBackground = async () => {
    try {
      console.log('🔄 Background refresh started...');
      const activeProperties = (await PropertyService.getActiveProperties()) as any[];

      // Store only essential data to reduce storage size
      const essentialProperties = activeProperties.map((property: any) => ({
        id: property.id,
        name: property.title || 'Unnamed Property',
        location: typeof property.location === 'string' ? property.location : property.location && typeof property.location === 'object' && 'city' in property.location ? (property.location as any).city : property.address || 'Unknown Location',
        price: typeof property.pricing === 'object' && property.pricing && 'daily_rate' in property.pricing ? (property.pricing as any).daily_rate : 0,
        image: property.images && property.images.length > 0 ? property.images[0] : '',
        type: property.property_type || 'Property',
        status: property.status || 'pending',
        rating: property.rating || 0,
        guests: property.max_guests || 1,
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1
      }));
      const propertiesJson = JSON.stringify(essentialProperties);
      localStorage.setItem('properties_cache', propertiesJson);
      localStorage.setItem('properties_cache_timestamp', Date.now().toString());

      // Update state if component is still mounted
      setDbProperties(essentialProperties);
      console.log('✅ Background refresh completed:', essentialProperties.length);
    } catch (error) {
      console.warn('⚠️ Background refresh failed:', error);
    }
  };
  useEffect(() => {
    let isMounted = true;

    const loadProperties = async () => {
      try {
        console.log('🔍 Starting properties load...');
        console.log('🔧 Environment info:', {
          hostname: window.location.hostname,
          isProduction: !window.location.hostname.includes('localhost'),
          hasLocalStorage: typeof localStorage !== 'undefined'
        });
        
        setLoading(true);
        setError(null);

        // Try cache first (only if available)
        let cachedData = null;
        try {
          if (typeof localStorage !== 'undefined' && !cacheDisabled) {
            const cacheKey = 'properties_cache';
            const cacheTimestamp = localStorage.getItem('properties_cache_timestamp');
            const now = Date.now();
            const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;

            if (cacheAge < 30 * 60 * 1000) { // 30 minutes
              const cachedProperties = localStorage.getItem(cacheKey);
              if (cachedProperties) {
                cachedData = JSON.parse(cachedProperties);
                console.log('⚡ Using cached properties:', cachedData.length);
                
                if (isMounted) {
                  setDbProperties(cachedData);
                  setPropertiesLoaded(true);
                  setLoading(false);
                }
                
                // Background refresh for fresh data
                if (cacheAge > 10 * 60 * 1000) {
                  refreshPropertiesInBackground();
                }
                return;
              }
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ Cache check failed:', cacheError);
        }

        // Fetch from database with retry logic
        console.log('🔍 Fetching properties from database...');
        let attempts = 0;
        let lastError = null;
        
        while (attempts < 3 && isMounted) {
          try {
            attempts++;
            console.log(`🔄 Fetch attempt ${attempts}/3`);
            
            const activeProperties = await PropertyService.getActiveProperties();
            
            if (!isMounted) return;

            // Always convert to frontend format for consistency
            const formattedProperties = activeProperties.map(property => ({
              id: property.id,
              name: property.title || 'Unnamed Property',
              location: typeof property.location === 'string' ? property.location : 
                       property.location && typeof property.location === 'object' && 'city' in property.location ? 
                       (property.location as any).city : property.address || 'Unknown Location',
              price: typeof property.pricing === 'object' && property.pricing && 'daily_rate' in property.pricing ? 
                     (property.pricing as any).daily_rate : 0,
              image: property.images && property.images.length > 0 ? property.images[0] : '',
              type: property.property_type || 'Property',
              status: property.status || 'pending',
              rating: property.rating || 0,
              guests: property.max_guests || 1,
              bedrooms: property.bedrooms || 1,
              bathrooms: property.bathrooms || 1,
              // Keep raw data for detailed view
              rawData: property
            }));

            setDbProperties(formattedProperties);
            setPropertiesLoaded(true);
            setError(null);
            console.log('✅ Properties loaded successfully:', formattedProperties.length);

            // Cache the formatted properties (if possible)
            try {
              if (typeof localStorage !== 'undefined' && !cacheDisabled) {
                localStorage.setItem('properties_cache', JSON.stringify(formattedProperties));
                localStorage.setItem('properties_cache_timestamp', Date.now().toString());
                console.log('✅ Properties cached successfully');
              }
            } catch (cacheError) {
              console.warn('⚠️ Failed to cache properties:', cacheError);
            }
            
            break; // Success, exit retry loop
            
          } catch (fetchError: any) {
            lastError = fetchError;
            console.error(`❌ Fetch attempt ${attempts} failed:`, fetchError);
            
            if (attempts < 3) {
              console.log(`⏳ Retrying in ${attempts}s...`);
              await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
          }
        }

        // If all retries failed
        if (lastError && isMounted) {
          console.error('❌ All fetch attempts failed:', lastError);
          setError(`Failed to load properties: ${lastError.message}`);
          
          // Try to use any cached data as fallback
          if (cachedData) {
            console.log('🔄 Using stale cache as fallback');
            setDbProperties(cachedData);
            setPropertiesLoaded(true);
          } else {
            setDbProperties([]);
          }
        }

      } catch (error: any) {
        console.error('❌ Unexpected error in loadProperties:', error);
        if (isMounted) {
          setError(`Unexpected error: ${error.message}`);
          setDbProperties([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProperties();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [propertiesLoaded]);

  // Cache management functions
  const clearPropertiesCache = () => {
    localStorage.removeItem('properties_cache');
    localStorage.removeItem('properties_cache_timestamp');
    setPropertiesLoaded(false);
    console.log('🗑️ Properties cache cleared');
  };
  const clearAllCache = () => {
    try {
      const keys = Object.keys(localStorage);
      // Clear all localStorage data to free maximum space
      keys.forEach(key => localStorage.removeItem(key));
      console.log('🗑️ All localStorage cleared to free storage space');
    } catch (error) {
      console.warn('⚠️ Error clearing localStorage:', error);
    }
  };
  const reEnableCaching = () => {
    setCacheDisabled(false);
    localStorage.removeItem('cache_disabled');
    console.log('✅ Caching re-enabled');
  };
  const refreshProperties = () => {
    clearPropertiesCache();
    setLoading(true);
    setDbProperties([]);
    setPropertiesLoaded(false);
    // This will trigger the useEffect to reload properties
  };

  // Only log once when properties change to reduce console spam
  useEffect(() => {
    if (dbProperties.length > 0) {
      console.log('✅ Properties loaded successfully:', dbProperties.length);
    }
  }, [dbProperties.length]);

  // Apply filters to database properties
  const filteredProperties = dbProperties.filter((property: any) => {
    let passesFilter = true;
    const filterReasons = [];

    // Filter by location (destination)
    if (searchLocation && searchLocation.trim() !== '') {
      const propertyLocation = (property.city || property.location?.city || property.address || '').toLowerCase();
      const searchLocationLower = searchLocation.toLowerCase();
      if (!propertyLocation.includes(searchLocationLower)) {
        passesFilter = false;
        filterReasons.push(`Location mismatch: ${propertyLocation} vs ${searchLocationLower}`);
      }
    }

    // Filter by date (if implemented)
    // if (searchDate && searchDate.trim() !== '') {
    //   // Add date filtering logic here if needed
    // }

    // Filter by guests
    if (groupSize && groupSize !== '') {
      const propertyGuests = property.max_guests || property.capacity || 1;
      const requiredGuests = parseInt(groupSize);
      if (groupSize === '9+' && propertyGuests < 9) {
        passesFilter = false;
        filterReasons.push(`Guest capacity: ${propertyGuests} < 9`);
      } else if (groupSize !== '9+' && propertyGuests < requiredGuests) {
        passesFilter = false;
        filterReasons.push(`Guest capacity: ${propertyGuests} < ${requiredGuests}`);
      }
    }

    // Filter by price range
    if (priceRange && priceRange !== '') {
      const propertyPrice = property.pricing?.daily_rate || property.price || 0;
      if (priceRange === '0-2000' && propertyPrice > 2000) {
        passesFilter = false;
        filterReasons.push(`Price ${propertyPrice} > 2000`);
      } else if (priceRange === '2000-3000' && (propertyPrice < 2000 || propertyPrice > 3000)) {
        passesFilter = false;
        filterReasons.push(`Price ${propertyPrice} not in 2000-3000 range`);
      } else if (priceRange === '3000-4000' && (propertyPrice < 3000 || propertyPrice > 4000)) {
        passesFilter = false;
        filterReasons.push(`Price ${propertyPrice} not in 3000-4000 range`);
      } else if (priceRange === '4000+' && propertyPrice < 4000) {
        passesFilter = false;
        filterReasons.push(`Price ${propertyPrice} < 4000`);
      }
    }

    // Filter by property type
    if (propertyType && propertyType !== '') {
      const propertyTypeValue = property.property_type || property.type || '';
      if (propertyTypeValue.toLowerCase() !== propertyType.toLowerCase()) {
        passesFilter = false;
        filterReasons.push(`Type mismatch: ${propertyTypeValue} vs ${propertyType}`);
      }
    }

    // Filter by amenities
    if (amenities.length > 0) {
      const propertyAmenities = Array.isArray(property.amenities) ? property.amenities.map((a: string) => a.toLowerCase()) : [];

      // Check if at least one selected amenity is present
      const hasMatchingAmenity = amenities.some(amenity => propertyAmenities.includes(amenity.toLowerCase()));
      if (!hasMatchingAmenity) {
        passesFilter = false;
        filterReasons.push(`No matching amenities: ${amenities.join(', ')} vs ${propertyAmenities.join(', ')}`);
      }
    }
    if (!passesFilter && (searchLocation || groupSize || priceRange || propertyType || amenities.length > 0)) {
      console.log(`❌ Property "${property.name || property.title}" filtered out:`, filterReasons.join(', '));
    }
    return passesFilter;
  });

  // Log filtering results
  if (searchLocation || groupSize || priceRange || propertyType || amenities.length > 0) {
    console.log(`🔍 Filtering results: ${filteredProperties.length}/${dbProperties.length} properties match criteria`);
    console.log(`📍 Active filters:`, {
      location: searchLocation || 'Any',
      guests: groupSize || 'Any',
      priceRange: priceRange || 'Any',
      propertyType: propertyType || 'Any',
      amenities: amenities.length > 0 ? amenities.join(', ') : 'Any'
    });
  }

  // Apply sorting to filtered properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return (a.pricing?.daily_rate || a.price || 0) - (b.pricing?.daily_rate || b.price || 0);
      case 'price-desc':
        return (b.pricing?.daily_rate || b.price || 0) - (a.pricing?.daily_rate || a.price || 0);
      case 'rating-desc':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'popularity':
      default:
        return (b.totalBookings || b.review_count || 0) - (a.totalBookings || a.review_count || 0);
    }
  });

  // Only show filtered and sorted database properties - no dummy data
  const properties = sortedProperties.map((property: any, index: number) => {
    // Add error handling for missing properties
    const mappedProperty = {
      id: property.id || `property-${index}`,
      name: property.name || property.title || 'Unnamed Property',
      location: property.city || property.location?.city || 'Unknown Location',
      rating: property.rating || 0,
      reviews: property.totalBookings || property.review_count || 0,
      price: property.price || property.pricing?.daily_rate || 0,
      originalPrice: (property.price || property.pricing?.daily_rate || 0) * 1.1,
      // 10% markup for original price
      image: property.images && property.images.length > 0 ? property.images[0] : property.image_url || property.image || property.firstImage || (() => {
        // Provide default images based on property type
        const defaultImages = {
          'villa': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
          'cottage': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
          'resort': 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=300&fit=crop',
          'estate': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
          'heritage': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
          'retreat': 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=300&fit=crop'
        };
        const propertyType = (property.property_type || property.type || 'villa').toLowerCase();
        return defaultImages[propertyType] || defaultImages['villa'];
      })(),
      // Use uploaded image or fallback to type-specific default
      amenities: Array.isArray(property.amenities) ? property.amenities.map((a: string) => a.charAt(0).toUpperCase() + a.slice(1)) : [],
      type: property.type || property.property_type || 'Property',
      guests: property.capacity || property.max_guests || 1,
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      status: property.status || 'pending',
      // Add status for pending indicator
      featured: true,
      ownerEmail: property.ownerEmail || property.owner_id || '',
      description: property.description || ''
    };

    // Ensure type is a string and capitalize it
    if (typeof mappedProperty.type === 'string') {
      mappedProperty.type = mappedProperty.type.charAt(0).toUpperCase() + mappedProperty.type.slice(1);
    } else {
      mappedProperty.type = 'Property';
    }
    return mappedProperty;
  });
  const filterOptions = {
    priceRanges: [{
      label: 'Under ₹2,000',
      value: '0-2000'
    }, {
      label: '₹2,000 - ₹3,000',
      value: '2000-3000'
    }, {
      label: '₹3,000 - ₹4,000',
      value: '3000-4000'
    }, {
      label: 'Above ₹4,000',
      value: '4000+'
    }],
    propertyTypes: ['Villa', 'Cottage', 'Resort', 'Estate', 'Heritage', 'Retreat', 'Farm House', 'Camp', 'Bungalow', 'Loft', 'Cabin', 'Palace'],
    amenitiesList: ['Pool', 'WiFi', 'Parking', 'Kitchen', 'AC', 'Fireplace', 'Garden', 'Beach Access', 'Restaurant', 'Spa', 'Heritage', 'Lake View', 'Balcony', 'Farm', 'BBQ', 'Games', 'Nature', 'Desert View', 'Camp Fire', 'Traditional', 'Camel Safari', 'Mountain View', 'Heating', 'City View', 'Modern', 'River View', 'Yoga', 'Adventure', 'Royal'],
    sortOptions: [{
      label: 'Popularity',
      value: 'popularity'
    }, {
      label: 'Price: Low to High',
      value: 'price-asc'
    }, {
      label: 'Price: High to Low',
      value: 'price-desc'
    }, {
      label: 'Rating: High to Low',
      value: 'rating-desc'
    }, {
      label: 'Newest First',
      value: 'newest'
    }]
  };

  // Search dropdown options
  const searchOptions = {
    locations: ['Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan', 'Goa', 'Kerala', 'Himachal Pradesh', 'Uttarakhand', 'Rajasthan', 'Gujarat'],
    guests: [{
      value: '1',
      label: '1 Guest'
    }, {
      value: '2',
      label: '2 Guests'
    }, {
      value: '3',
      label: '3 Guests'
    }, {
      value: '4',
      label: '4 Guests'
    }, {
      value: '5',
      label: '5 Guests'
    }, {
      value: '6',
      label: '6 Guests'
    }, {
      value: '7',
      label: '7 Guests'
    }, {
      value: '8',
      label: '8 Guests'
    }, {
      value: '9+',
      label: '9+ Guests'
    }]
  };
  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };
  const clearAllFilters = () => {
    setPriceRange('');
    setPropertyType('');
    setAmenities([]);
  };
  const propertiesPerPage = 9;
  const totalPages = Math.ceil(properties.length / propertiesPerPage);
  const currentProperties = properties.slice((currentPage - 1) * propertiesPerPage, currentPage * propertiesPerPage);

  // Modal handlers
  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedProperty(null);
  };
  return <div className="min-h-screen bg-background font-poppins">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <img src={picnifyLogo} alt="Picnify.in Logo" className="h-12" />
              </a>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">Home</a>
              <a href="/properties" className="text-brand-red hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">Properties</a>
              <a href="/locations" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">Locations</a>
              <a href="/about" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">About</a>
              <a href="/contact" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground hidden lg:block">
                      {user.email}
                    </span>
                  </div>
                  <button onClick={() => logout()} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-6 py-3 inline-flex items-center">
                    <i className="fas fa-sign-out-alt mr-2"></i>Logout
                  </button>
                </div> : <>
                  <Link to="/login" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-6 py-3 inline-flex items-center">
                    <i className="fas fa-user mr-2"></i>Login
                  </Link>
                  <Link to="/signup" className="bg-gradient-to-r from-brand-orange to-brand-red text-white px-6 py-3 hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-medium shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center">
                    <i className="fas fa-arrow-right-to-bracket mr-2"></i>Sign Up
                  </Link>
                </>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-secondary/30 to-brand-orange/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground font-poppins mb-6 text-shadow">
              Discover Amazing <span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">Properties</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Browse through our curated collection of premium vacation rentals across India
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="bg-background rounded-3xl p-8 shadow-xl max-w-6xl mx-auto border">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end dropdown-container">
              <div className="space-y-2">
                <label className="text-foreground font-semibold text-sm uppercase tracking-wide">Destination</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-map-marker-alt text-brand-red text-lg"></i>
                  </div>
                  <input type="text" placeholder="Search destination..." value={searchLocation} onChange={e => {
                  setSearchLocation(e.target.value);
                  setShowLocationDropdown(true);
                }} onFocus={() => setShowLocationDropdown(true)} className="w-full pl-12 pr-4 py-4 text-foreground placeholder-muted-foreground border-2 border-border rounded-xl outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/20 transition-all duration-300 text-sm font-medium" />
                  {showLocationDropdown && <div className="absolute top-full left-0 right-0 mt-1 bg-background border-2 border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                      {searchOptions.locations.filter(location => location.toLowerCase().includes(searchLocation.toLowerCase())).map((location, index) => <button key={index} onClick={() => {
                    setSearchLocation(location);
                    setShowLocationDropdown(false);
                  }} className="w-full px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors duration-200 cursor-pointer">
                            {location}
                          </button>)}
                    </div>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-foreground font-semibold text-sm uppercase tracking-wide">Check-in</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-calendar-alt text-brand-orange text-lg"></i>
                  </div>
                  <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="w-full pl-12 pr-4 py-4 text-foreground border-2 border-border rounded-xl outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all duration-300 text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-foreground font-semibold text-sm uppercase tracking-wide">Guests</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-users text-blue-500 text-lg"></i>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-muted-foreground"></i>
                  </div>
                  <button onClick={() => setShowGuestsDropdown(!showGuestsDropdown)} className="w-full pl-12 pr-12 py-4 text-left text-foreground border-2 border-border rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-sm font-medium cursor-pointer">
                    {groupSize ? searchOptions.guests.find(g => g.value === groupSize)?.label || groupSize : 'Select guests'}
                  </button>
                  {showGuestsDropdown && <div className="absolute top-full left-0 right-0 mt-1 bg-background border-2 border-border rounded-xl shadow-lg z-50">
                      {searchOptions.guests.map((guest, index) => <button key={index} onClick={() => {
                    setGroupSize(guest.value);
                    setShowGuestsDropdown(false);
                  }} className="w-full px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors duration-200 cursor-pointer">
                          {guest.label}
                        </button>)}
                    </div>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-foreground font-semibold text-sm uppercase tracking-wide">Price Range</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-rupee-sign text-green-500 text-lg"></i>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-muted-foreground"></i>
                  </div>
                  <button onClick={() => setShowPriceDropdown(!showPriceDropdown)} className="w-full pl-12 pr-12 py-4 text-left text-foreground border-2 border-border rounded-xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 text-sm font-medium cursor-pointer">
                    {priceRange ? filterOptions.priceRanges.find(p => p.value === priceRange)?.label || priceRange : 'Any price'}
                  </button>
                  {showPriceDropdown && <div className="absolute top-full left-0 right-0 mt-1 bg-background border-2 border-border rounded-xl shadow-lg z-50">
                      {filterOptions.priceRanges.map((range, index) => <button key={index} onClick={() => {
                    setPriceRange(range.value);
                    setShowPriceDropdown(false);
                  }} className="w-full px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors duration-200 cursor-pointer">
                          {range.label}
                        </button>)}
                    </div>}
                </div>
              </div>

              <button onClick={() => {
              console.log('🔍 Search triggered with:', {
                location: searchLocation,
                date: searchDate,
                guests: groupSize,
                priceRange: priceRange
              });
              // Close all dropdowns
              setShowLocationDropdown(false);
              setShowGuestsDropdown(false);
              setShowPriceDropdown(false);
              // The filtering is now handled automatically by the filter logic above
              console.log('✅ Filters applied automatically');
            }} className="bg-gradient-to-r from-brand-red to-brand-orange text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3">
                <i className="fas fa-search text-xl"></i>
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Sort Section */}
      <section className="bg-background border-b border-border sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-foreground font-semibold">Sort by:</span>
                <div className="relative">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 text-foreground focus:outline-none focus:border-brand-red cursor-pointer">
                    {filterOptions.sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <i className="fas fa-chevron-down text-muted-foreground"></i>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold">View:</span>
                <button className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer ${viewMode === 'grid' ? 'bg-brand-red/10 text-brand-red' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setViewMode('grid')}>
                  <i className="fas fa-th-large"></i>
                </button>
                <button className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer ${viewMode === 'list' ? 'bg-brand-red/10 text-brand-red' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setViewMode('list')}>
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Showing {properties.length} properties</span>
                      <button onClick={refreshProperties} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-brand-red transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Refresh properties">
          <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''} text-brand-red`}></i>
          <span className="text-foreground">Refresh</span>
        </button>
        {cacheDisabled}
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-muted-foreground transition-colors duration-200 cursor-pointer lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                <i className="fas fa-filter text-muted-foreground"></i>
                <span className="text-foreground">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 relative min-h-screen">
        {/* Glassmorphic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-slate-900/30 dark:via-purple-900/20 dark:to-blue-900/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="glass-sidebar rounded-2xl p-6 sticky top-32">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Filters</h3>
                  <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setShowFilters(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {/* Price Range Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold text-foreground mb-4">Price Range</h4>
                  <div className="space-y-3">
                    {filterOptions.priceRanges.map((range, index) => <label key={index} className="flex items-center cursor-pointer">
                        <input type="radio" name="priceRange" value={range.value} checked={priceRange === range.value} onChange={e => setPriceRange(e.target.value)} className="w-4 h-4 text-brand-red border-border focus:ring-brand-red" />
                        <span className="ml-3 text-foreground">{range.label}</span>
                      </label>)}
                  </div>
                </div>

                {/* Property Type Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold text-foreground mb-4">Property Type</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {filterOptions.propertyTypes.map((type, index) => <label key={index} className="flex items-center cursor-pointer">
                        <input type="radio" name="propertyType" value={type} checked={propertyType === type} onChange={e => setPropertyType(e.target.value)} className="w-4 h-4 text-brand-red border-border focus:ring-brand-red" />
                        <span className="ml-3 text-foreground">{type}</span>
                      </label>)}
                  </div>
                </div>

                {/* Amenities Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold text-foreground mb-4">Amenities</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filterOptions.amenitiesList.map((amenity, index) => <label key={index} className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="w-4 h-4 text-brand-red border-border rounded focus:ring-brand-red" />
                        <span className="ml-3 text-foreground">{amenity}</span>
                      </label>)}
                  </div>
                </div>

                {/* Clear Filters */}
                <button onClick={clearAllFilters} className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors duration-200 cursor-pointer whitespace-nowrap rounded-button font-medium">
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="lg:col-span-3">
              
                            {loading ? <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                    <i className="fas fa-spinner text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Loading properties...</h3>
                  <p className="text-gray-600">Please wait while we fetch your properties</p>
                </div> : currentProperties.length === 0 ? <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-home text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No properties found</h3>
                  <p className="text-gray-600 mb-4">Properties array length: {properties.length}, Current properties: {currentProperties.length}</p>
                </div> : <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {currentProperties.map((property, index) => <div key={property.id} className="glass-card-property property-card-height rounded-2xl overflow-hidden">
                      {/* Image Carousel */}
                      <div className="relative">
                        <ImageCarousel images={property.image ? [property.image] : [beachsideParadise]} alt={property.name} />
                        <div className="absolute top-3 left-3">
                          <span className="bg-gradient-to-r from-brand-red to-brand-orange text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
                            {property.type || 'Villa'}
                          </span>
                        </div>
                        {property.rating > 0 && <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                            <i className="fas fa-star text-yellow-400 text-xs"></i>
                            {property.rating.toFixed(1)}
                          </div>}
                      </div>
                      
                      {/* Content Section */}
                      <div className="property-card-content p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-foreground line-clamp-2">{property.name}</h3>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground mb-3">
                          <i className="fas fa-map-marker-alt text-brand-red mr-2"></i>
                          <span className="text-sm">{property.location}</span>
                        </div>

                        {/* Property Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <i className="fas fa-users text-brand-red"></i>
                            <span>{property.guests || 1} guests</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-bed text-brand-red"></i>
                            <span>{property.bedrooms || 1} beds</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-bath text-brand-red"></i>
                            <span>{property.bathrooms || 1} baths</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold text-foreground">
                            ₹{property.price.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground">/night</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="property-card-actions flex gap-3 mt-auto">
                          <button onClick={() => handleViewProperty(property)} className="flex-1 bg-gradient-to-r from-brand-red to-brand-orange text-white py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2 backdrop-blur-sm">
                            <i className="fas fa-eye"></i>
                            View Details
                          </button>
                          <button className="px-4 py-3 border border-brand-red/30 text-brand-red rounded-lg font-semibold hover:bg-brand-red hover:text-white transition-colors duration-200 backdrop-blur-sm">
                            <i className="fas fa-heart"></i>
                          </button>
                        </div>
                      </div>
                    </div>)}
                </div>}

              {/* Pagination */}
              <div className="flex justify-center items-center mt-12 gap-4">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap rounded-button">
                  <i className="fas fa-chevron-left mr-2"></i>
                  Previous
                </button>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, index) => <button key={index} onClick={() => setCurrentPage(index + 1)} className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap rounded-button ${currentPage === index + 1 ? 'bg-brand-red text-white' : 'border border-border hover:bg-secondary'}`}>
                      {index + 1}
                    </button>)}
                </div>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap rounded-button">
                  Next
                  <i className="fas fa-chevron-right ml-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>About Picknify</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>How It Works</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Safety Guidelines</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Support & Help</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>24/7 Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Contact Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Booking Assistance</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Host Resources</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Trust & Safety</a></li>
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

      {/* View Property Modal */}
      {showViewModal && selectedProperty && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-background border-b border-border p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Property Details</h2>
              <button onClick={closeViewModal} className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <i className="fas fa-times text-muted-foreground"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Property Images */}
              <div className="mb-6">
                <ImageCarousel images={selectedProperty.image ? [selectedProperty.image] : [beachsideParadise]} alt={selectedProperty.name} />
              </div>

              {/* Property Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-3">
                      <h1 className="text-3xl font-bold text-foreground">{selectedProperty.name}</h1>
                      <span className="bg-gradient-to-r from-brand-red to-brand-orange text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {selectedProperty.type || 'Villa'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground mb-4">
                      <i className="fas fa-map-marker-alt text-brand-red mr-2"></i>
                      <span>{selectedProperty.location}</span>
                    </div>

                    {selectedProperty.rating > 0 && <div className="flex items-center gap-2 mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => <i key={i} className={`fas fa-star ${i < Math.floor(selectedProperty.rating) ? 'text-yellow-400' : 'text-gray-300'}`}></i>)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {selectedProperty.rating.toFixed(1)} ({selectedProperty.reviewCount || 0} reviews)
                        </span>
                      </div>}
                  </div>

                  {/* Property Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-brand-red mb-1">
                        {selectedProperty.guests || 1}
                      </div>
                      <div className="text-sm text-muted-foreground">Max Guests</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-brand-red mb-1">
                        {selectedProperty.bedrooms || 1}
                      </div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-brand-red mb-1">
                        {selectedProperty.bathrooms || 1}
                      </div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-brand-red mb-1">
                        ₹{selectedProperty.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Per Night</div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProperty.description && <div className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedProperty.description}
                      </p>
                    </div>}
                </div>

                {/* Right Column */}
                <div>
                  {/* Amenities */}
                  {selectedProperty.amenities && selectedProperty.amenities.length > 0 && <div className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3">Amenities</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProperty.amenities.map((amenity: string, index: number) => <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <i className="fas fa-check text-green-500"></i>
                            {amenity}
                          </div>)}
                      </div>
                    </div>}

                  {/* Pricing Details */}
                  <div className="bg-muted rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Pricing</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base price</span>
                        <span className="font-semibold">₹{selectedProperty.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Service fee</span>
                        <span>₹{Math.round(selectedProperty.price * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>₹{Math.round(selectedProperty.price * 1.1).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button className="w-full bg-gradient-to-r from-brand-red to-brand-orange text-white py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-transform duration-200">
                      Book Now
                    </button>
                    <button className="w-full border border-brand-red text-brand-red py-3 rounded-lg font-semibold hover:bg-brand-red hover:text-white transition-colors duration-200">
                      <i className="fas fa-heart mr-2"></i>
                      Add to Wishlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}
        
        {/* Production Debug Component */}
        {typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && (
          <div className="fixed bottom-4 right-4 z-50">
            <details className="bg-black/80 text-white text-xs p-2 rounded max-w-xs">
              <summary className="cursor-pointer">🔧 Debug</summary>
              <pre className="mt-2 whitespace-pre-wrap text-[10px]">
                {JSON.stringify({
                  hostname: window.location.hostname,
                  propertiesCount: dbProperties.length,
                  loading,
                  error,
                  propertiesLoaded,
                  cacheDisabled,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}
    </div>;
};
export default Properties;