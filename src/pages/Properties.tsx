import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Load properties from database
  const [dbProperties, setDbProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadProperties = async () => {
      try {
        console.log(`🔍 Loading properties from database... (attempt ${retryCount + 1})`);
        setLoading(true);
        
        const activeProperties = await PropertyService.getActiveProperties();
        
        if (!isMounted) return; // Prevent setting state if component unmounted
        
        // Use the raw database properties directly instead of convertToFrontendFormat
        setDbProperties(activeProperties);
        console.log('✅ Properties loaded from database:', activeProperties.length);
        console.log('✅ Raw properties data:', activeProperties);
        
        // Reset retry count on success
        retryCount = 0;
      } catch (error) {
        console.error(`❌ Error loading properties from database (attempt ${retryCount + 1}):`, error);
        
        if (!isMounted) return;
        
        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying... (${retryCount}/${maxRetries})`);
          setTimeout(() => {
            if (isMounted) {
              loadProperties();
            }
          }, 1000 * retryCount); // Exponential backoff
          return;
        }
        
        // Fallback to localStorage for existing data
        try {
          const storageKey = 'properties_venteskraft@gmail.com';
          const savedProperties = localStorage.getItem(storageKey);
          if (savedProperties) {
            const parsedProperties = JSON.parse(savedProperties);
            const activeProperties = parsedProperties.filter((property: any) => property.status === 'active');
            setDbProperties(activeProperties);
            console.log('📋 Properties loaded from localStorage fallback:', activeProperties.length);
          } else {
            setDbProperties([]);
          }
        } catch (localStorageError) {
          console.error('❌ Error loading from localStorage fallback:', localStorageError);
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
  }, []);

  console.log('🔍 Database properties loaded:', dbProperties.length);
  console.log('🔍 Raw database properties:', dbProperties);
  dbProperties.forEach((prop: any) => {
    console.log(`📸 Property "${prop.name || prop.title}":`, {
      id: prop.id,
      name: prop.name || prop.title,
      images: prop.images ? prop.images.length : 0,
      firstImage: prop.images && prop.images.length > 0 ? prop.images[0].substring(0, 50) + '...' : 'No images'
    });
  });

  // Only show database properties - no dummy data
  const properties = dbProperties.map((property: any, index: number) => {
    console.log(`🔍 Mapping property ${index}:`, property);
    
    // Add error handling for missing properties
    const mappedProperty = {
      id: property.id || `property-${index}`,
      name: property.name || property.title || 'Unnamed Property',
      location: property.city || (property.location?.city) || 'Unknown Location',
      rating: property.rating || 0,
      reviews: property.totalBookings || property.review_count || 0,
      price: property.price || (property.pricing?.daily_rate) || 0,
      originalPrice: (property.price || (property.pricing?.daily_rate) || 0) * 1.1, // 10% markup for original price
      image: property.images && property.images.length > 0 ? property.images[0] : beachsideParadise, // Use uploaded image or default
      amenities: Array.isArray(property.amenities) ? property.amenities.map((a: string) => a.charAt(0).toUpperCase() + a.slice(1)) : [],
      type: property.type || property.property_type || 'Property',
      guests: property.capacity || property.max_guests || 1,
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      status: property.status || 'pending', // Add status for pending indicator
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
    
    console.log(`✅ Mapped property ${index}:`, mappedProperty);
    return mappedProperty;
  });
  
  console.log('🔍 Final mapped properties:', properties);

  const filterOptions = {
    priceRanges: [
      { label: 'Under ₹2,000', value: '0-2000' },
      { label: '₹2,000 - ₹3,000', value: '2000-3000' },
      { label: '₹3,000 - ₹4,000', value: '3000-4000' },
      { label: 'Above ₹4,000', value: '4000+' }
    ],
    propertyTypes: [
      'Villa', 'Cottage', 'Resort', 'Estate', 'Heritage', 'Retreat', 'Farm House', 'Camp', 'Bungalow', 'Loft', 'Cabin', 'Palace'
    ],
    amenitiesList: [
      'Pool', 'WiFi', 'Parking', 'Kitchen', 'AC', 'Fireplace', 'Garden', 'Beach Access', 'Restaurant', 'Spa', 'Heritage', 'Lake View', 'Balcony', 'Farm', 'BBQ', 'Games', 'Nature', 'Desert View', 'Camp Fire', 'Traditional', 'Camel Safari', 'Mountain View', 'Heating', 'City View', 'Modern', 'River View', 'Yoga', 'Adventure', 'Royal'
    ],
    sortOptions: [
      { label: 'Popularity', value: 'popularity' },
      { label: 'Price: Low to High', value: 'price-asc' },
      { label: 'Price: High to Low', value: 'price-desc' },
      { label: 'Rating: High to Low', value: 'rating-desc' },
      { label: 'Newest First', value: 'newest' }
    ]
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearAllFilters = () => {
    setPriceRange('');
    setPropertyType('');
    setAmenities([]);
  };

  const propertiesPerPage = 9;
  const totalPages = Math.ceil(properties.length / propertiesPerPage);
  const currentProperties = properties.slice(
    (currentPage - 1) * propertiesPerPage,
    currentPage * propertiesPerPage
  );
  
  console.log('🔍 Current properties to display:', currentProperties);
  console.log('🔍 Properties array length:', properties.length);
  console.log('🔍 Current page:', currentPage);
  console.log('🔍 Properties per page:', propertiesPerPage);
  console.log('🔍 Total pages:', totalPages);
  console.log('🔍 Slice start:', (currentPage - 1) * propertiesPerPage);
  console.log('🔍 Slice end:', currentPage * propertiesPerPage);

  return (
    <div className="min-h-screen bg-background font-poppins">
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
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground hidden lg:block">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-6 py-3 inline-flex items-center"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-6 py-3 inline-flex items-center"
                  >
                    <i className="fas fa-user mr-2"></i>Login
                  </Link>
                  <Link 
                    to="/signup"
                    className="bg-gradient-to-r from-brand-orange to-brand-red text-white px-6 py-3 hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-medium shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center"
                  >
                    <i className="fas fa-arrow-right-to-bracket mr-2"></i>Sign Up
                  </Link>
                </>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-foreground font-semibold text-sm uppercase tracking-wide">Destination</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-map-marker-alt text-brand-red text-lg"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Search destination..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-foreground placeholder-muted-foreground border-2 border-border rounded-xl outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/20 transition-all duration-300 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-foreground font-semibold text-sm uppercase tracking-wide">Check-in</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-calendar-alt text-brand-orange text-lg"></i>
                  </div>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-foreground border-2 border-border rounded-xl outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all duration-300 text-sm font-medium"
                  />
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
                  <button className="w-full pl-12 pr-12 py-4 text-left text-foreground border-2 border-border rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-sm font-medium cursor-pointer">
                    {groupSize || 'Select guests'}
                  </button>
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
                  <button className="w-full pl-12 pr-12 py-4 text-left text-foreground border-2 border-border rounded-xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 text-sm font-medium cursor-pointer">
                    {priceRange || 'Any price'}
                  </button>
                </div>
              </div>

              <button className="bg-gradient-to-r from-brand-red to-brand-orange text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3">
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
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 text-foreground focus:outline-none focus:border-brand-red cursor-pointer"
                  >
                    {filterOptions.sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <i className="fas fa-chevron-down text-muted-foreground"></i>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold">View:</span>
                <button
                  className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer ${viewMode === 'grid' ? 'bg-brand-red/10 text-brand-red' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer ${viewMode === 'list' ? 'bg-brand-red/10 text-brand-red' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Showing {properties.length} properties</span>
              <button
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-muted-foreground transition-colors duration-200 cursor-pointer lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fas fa-filter text-muted-foreground"></i>
                <span className="text-foreground">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-secondary/10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-background rounded-2xl shadow-lg p-6 sticky top-32">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Filters</h3>
                  <button
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                    onClick={() => setShowFilters(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {/* Price Range Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold text-foreground mb-4">Price Range</h4>
                  <div className="space-y-3">
                    {filterOptions.priceRanges.map((range, index) => (
                      <label key={index} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          value={range.value}
                          checked={priceRange === range.value}
                          onChange={(e) => setPriceRange(e.target.value)}
                          className="w-4 h-4 text-brand-red border-border focus:ring-brand-red"
                        />
                        <span className="ml-3 text-foreground">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Property Type Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold text-foreground mb-4">Property Type</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {filterOptions.propertyTypes.map((type, index) => (
                      <label key={index} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="propertyType"
                          value={type}
                          checked={propertyType === type}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className="w-4 h-4 text-brand-red border-border focus:ring-brand-red"
                        />
                        <span className="ml-3 text-foreground">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amenities Filter */}
                <div className="mb-8">
                  <h4 className="font-semibold text-foreground mb-4">Amenities</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filterOptions.amenitiesList.map((amenity, index) => (
                      <label key={index} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="w-4 h-4 text-brand-red border-border rounded focus:ring-brand-red"
                        />
                        <span className="ml-3 text-foreground">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearAllFilters}
                  className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors duration-200 cursor-pointer whitespace-nowrap rounded-button font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="lg:col-span-3">
              
                            {loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                    <i className="fas fa-spinner text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Loading properties...</h3>
                  <p className="text-gray-600">Please wait while we fetch your properties</p>
                </div>
              ) : currentProperties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-home text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No properties found</h3>
                  <p className="text-gray-600 mb-4">Properties array length: {properties.length}, Current properties: {currentProperties.length}</p>
                </div>
              ) : (
                <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {currentProperties.map((property, index) => (
                      <div key={property.id} className="bg-background rounded-2xl shadow-lg border border-border p-6">
                        <h3 className="text-lg font-bold text-foreground mb-2">{property.name}</h3>
                        <p className="text-muted-foreground mb-2">
                          <i className="fas fa-map-marker-alt text-brand-red mr-2"></i>
                          {property.location}
                        </p>
                        <p className="text-xl font-black text-foreground mb-4">₹{property.price.toLocaleString()}</p>
                        <button className="w-full bg-gradient-to-r from-brand-red to-brand-orange text-white py-2 rounded-lg font-bold">
                          Book Now
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-center items-center mt-12 gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap rounded-button"
                >
                  <i className="fas fa-chevron-left mr-2"></i>
                  Previous
                </button>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap rounded-button ${
                        currentPage === index + 1
                          ? 'bg-brand-red text-white'
                          : 'border border-border hover:bg-secondary'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap rounded-button"
                >
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
    </div>
  );
};

export default Properties;