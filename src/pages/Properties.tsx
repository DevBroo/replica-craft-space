import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b6f6-067ea4600889.png';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyCache } from '@/contexts/PropertyCacheContext';
import { PropertyService } from '@/lib/propertyService';

// Scroll animation hook
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || '');
  const [searchDate, setSearchDate] = useState(searchParams.get('date') || '');
  const [groupSize, setGroupSize] = useState(searchParams.get('guests') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
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

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    activeProperties: dbProperties, 
    isActiveLoading: loading, 
    isCacheValid, 
    refreshActiveProperties 
  } = usePropertyCache();

  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (searchDate) params.set('date', searchDate);
    if (groupSize) params.set('guests', groupSize);
    if (priceRange) params.set('price', priceRange);
    if (propertyType) params.set('type', propertyType);
    
    setSearchParams(params);
  }, [searchLocation, searchDate, groupSize, priceRange, propertyType, setSearchParams]);

  // Load properties from global cache on component mount
  useEffect(() => {
    if (dbProperties.length === 0 && !loading) {
      console.log('🔄 No cached properties found, loading from database...');
      refreshActiveProperties();
    } else if (dbProperties.length > 0) {
      console.log('⚡ Properties loaded from global cache:', dbProperties.length);
    }
  }, [dbProperties.length, loading, refreshActiveProperties]);

  // Search options for dropdowns
  const searchOptions = {
    locations: [
      'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Chennai, Tamil Nadu',
      'Kolkata, West Bengal', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
      'Jaipur, Rajasthan', 'Goa', 'Kerala', 'Himachal Pradesh', 'Uttarakhand', 'Rajasthan', 'Gujarat'
    ],
    guests: [
      { value: '1', label: '1 Guest' }, { value: '2', label: '2 Guests' },
      { value: '3', label: '3 Guests' }, { value: '4', label: '4 Guests' },
      { value: '5', label: '5 Guests' }, { value: '6', label: '6 Guests' },
      { value: '7', label: '7 Guests' }, { value: '8', label: '8 Guests' },
      { value: '9+', label: '9+ Guests' }
    ]
  };

  const filterOptions = {
    priceRanges: [
      { value: '0-2000', label: 'Below ₹2,000' },
      { value: '2000-3000', label: '₹2,000 - ₹3,000' },
      { value: '3000-4000', label: '₹3,000 - ₹4,000' },
      { value: '4000+', label: 'Above ₹4,000' }
    ],
    propertyTypes: [
      'villa', 'resort', 'farmhouse', 'homestay', 'heritage', 'day-picnic'
    ],
    amenities: [
      'WiFi', 'Pool', 'Kitchen', 'Parking', 'AC', 'Garden', 'Beach Access', 'Mountain View'
    ]
  };

  // Apply filters to properties
  const filteredProperties = dbProperties.filter((property: any) => {
    let passesFilter = true;
    const filterReasons = [];

    if (searchLocation && searchLocation.trim() !== '') {
      const propertyLocation = (property.city || property.location?.city || property.address || '').toLowerCase();
      const searchLocationLower = searchLocation.toLowerCase();
      if (!propertyLocation.includes(searchLocationLower)) {
        passesFilter = false;
        filterReasons.push(`Location mismatch: ${propertyLocation} vs ${searchLocationLower}`);
      }
    }

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

    if (propertyType && propertyType !== '') {
      const propertyTypeValue = property.property_type || property.type || '';
      if (propertyTypeValue.toLowerCase() !== propertyType.toLowerCase()) {
        passesFilter = false;
        filterReasons.push(`Type mismatch: ${propertyTypeValue} vs ${propertyType}`);
      }
    }

    if (amenities.length > 0) {
      const propertyAmenities = Array.isArray(property.amenities)
        ? property.amenities.map((a: string) => a.toLowerCase())
        : [];
      const hasMatchingAmenity = amenities.some(amenity =>
        propertyAmenities.includes(amenity.toLowerCase())
      );
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

  const properties = sortedProperties.map((property: any, index: number) => {
    // Enhanced image mapping with multiple fallbacks
    let imageUrl = '';
    if (property.image) {
      imageUrl = property.image;
    } else if (property.images && property.images.length > 0) {
      imageUrl = property.images[0];
    } else if (property.image_url) {
      imageUrl = property.image_url;
    } else if (property.firstImage) {
      imageUrl = property.firstImage;
    } else {
      // Type-specific default images
      const propertyType = property.property_type || property.type || 'villa';
      switch (propertyType.toLowerCase()) {
        case 'villa':
          imageUrl = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop';
          break;
        case 'resort':
          imageUrl = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop';
          break;
        case 'farmhouse':
          imageUrl = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop';
          break;
        case 'homestay':
          imageUrl = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop';
          break;
        case 'heritage':
          imageUrl = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop';
          break;
        default:
          imageUrl = '/placeholder.svg';
      }
    }

    return {
      id: property.id,
      name: property.title || property.name || 'Unnamed Property',
      location: typeof property.location === 'string' ? property.location : 
               (property.location && typeof property.location === 'object' && 'city' in property.location) ? 
               (property.location as any).city : property.address || 'Unknown Location',
      price: typeof property.pricing === 'object' && property.pricing && 'daily_rate' in property.pricing ? 
             (property.pricing as any).daily_rate : property.price || 0,
      image: imageUrl,
      type: property.property_type || property.type || 'Property',
      status: property.status || 'pending',
      rating: property.rating || 0,
      guests: property.max_guests || property.capacity || 1,
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      description: property.description || 'Beautiful property for your perfect getaway.',
      amenities: property.amenities || []
    };
  });

  // Pagination
  const propertiesPerPage = 12;
  const totalPages = Math.ceil(properties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = properties.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background font-poppins">
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
              <Link to="/" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Home</Link>
              <Link to="/properties" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Properties</Link>
              <Link to="/locations" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Locations</Link>
              <Link to="/about" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">About</Link>
              <Link to="/contact" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer px-2 py-1 rounded-md hover:bg-orange-50">Contact</Link>
            </nav>

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
                  <Link to="/login" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-4 py-2 inline-flex items-center text-sm">
                    <i className="fas fa-user mr-2"></i>Login
                  </Link>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="dropdown-container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-map-marker-alt text-brand-red"></i>
                </div>
                <input
                  type="text"
                  placeholder="Destination"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent"
                />
                {showLocationDropdown && searchLocation && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchOptions.locations
                      .filter(location => location.toLowerCase().includes(searchLocation.toLowerCase()))
                      .map((location, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSearchLocation(location);
                            setShowLocationDropdown(false);
                          }}
                        >
                          {location}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Guests Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
                  className="w-full text-left pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <i className="fas fa-users text-blue-500 absolute left-3"></i>
                    <span>{groupSize ? `${groupSize} Guest${groupSize === '1' ? '' : 's'}` : 'Select Guests'}</span>
                  </div>
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </button>
                {showGuestsDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {searchOptions.guests.map((guest, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setGroupSize(guest.value);
                          setShowGuestsDropdown(false);
                        }}
                      >
                        {guest.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                  className="w-full text-left pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <i className="fas fa-rupee-sign text-green-500 absolute left-3"></i>
                    <span>{priceRange ? filterOptions.priceRanges.find(p => p.value === priceRange)?.label : 'Price Range'}</span>
                  </div>
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </button>
                {showPriceDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {filterOptions.priceRanges.map((price, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setPriceRange(price.value);
                          setShowPriceDropdown(false);
                        }}
                      >
                        {price.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                onClick={() => {
                  console.log('🔍 Search with filters:', { searchLocation, groupSize, priceRange, propertyType });
                }}
                className="w-full bg-gradient-to-r from-brand-red to-brand-orange text-white py-3 px-6 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-medium"
              >
                <i className="fas fa-search mr-2"></i>
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <i className="fas fa-spinner text-white text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Loading Properties...</h3>
              <p className="text-gray-600">Please wait while we fetch the latest properties</p>
            </div>
          </div>
        ) : currentProperties.length > 0 ? (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {properties.length} Properties Found
              </h1>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                >
                  <option value="popularity">Sort by Popularity</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProperties.map((property, index) => (
                <div key={property.id || index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 fade-in-up">
                  {/* Property Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    {property.status === 'pending' && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Pending Approval
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                      <i className="fas fa-star text-yellow-400 mr-1"></i>
                      {property.rating || 4.5}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                      {property.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 flex items-center">
                      <i className="fas fa-map-marker-alt text-brand-red mr-2"></i>
                      {property.location}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span><i className="fas fa-users mr-1"></i>{property.guests}</span>
                        <span><i className="fas fa-bed mr-1"></i>{property.bedrooms}</span>
                        <span><i className="fas fa-bath mr-1"></i>{property.bathrooms}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-brand-orange">
                        ₹{property.price.toLocaleString()}
                        <span className="text-sm text-gray-600 font-normal">/night</span>
                      </div>
                      <button
                        disabled={property.status === 'pending'}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          property.status === 'pending'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-brand-orange text-white hover:bg-orange-600 hover:scale-105'
                        }`}
                      >
                        {property.status === 'pending' ? 'Coming Soon' : 'Book Now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-brand-orange text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-search text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or browse all available properties.
            </p>
            <button
              onClick={() => {
                setSearchLocation('');
                setGroupSize('');
                setPriceRange('');
                setPropertyType('');
                setAmenities([]);
              }}
              className="bg-brand-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors duration-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Properties;