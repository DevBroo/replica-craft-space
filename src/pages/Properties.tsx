import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatPropertyType, normalizeTypeKey } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ModernSearchFilter from '@/components/ui/ModernSearchFilter';
import SearchForm from '@/components/ui/SearchForm';
import { SearchService, type SearchFilters } from '@/lib/searchService';
import { 
  Search, 
  MapPin, 
  Star, 
  Filter, 
  SlidersHorizontal,
  Heart,
  Clock,
  Users,
  Bed,
  Bath,
  ChevronLeft,
  ChevronRight,
  Check,
  X
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  totalBookings: number;
  images: string[];
  type: string;
  capacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  rooms_count?: number;
  capacity_per_room?: number;
  day_picnic_capacity?: number;
  amenities?: string[];
}

const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // State for properties and filters
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState(searchParams.get('type') || '');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [priceRangeFilter, setPriceRangeFilter] = useState('any');
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const [sortBy, setSortBy] = useState('price-low');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 12;

  // Day Picnic state
  const [dayPicnicPackages, setDayPicnicPackages] = useState<any[]>([]);
  const [showDayPicnics, setShowDayPicnics] = useState(searchParams.get('tab') === 'day_picnics');
  const [durationFilter, setDurationFilter] = useState('');

  // Update showDayPicnics when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    setShowDayPicnics(tab === 'day_picnics');
  }, [searchParams]);

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
    fetchDayPicnicPackages();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (locationFilter) params.set('location', locationFilter);
    if (propertyTypeFilter) params.set('type', propertyTypeFilter);
    if (durationFilter) params.set('duration', durationFilter);
    if (showDayPicnics) params.set('tab', 'day_picnics');
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, locationFilter, propertyTypeFilter, durationFilter, showDayPicnics]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching properties from properties_public...');
      
      const { data, error } = await supabase
        .from('properties_public')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.warn('⚠️ No data returned from Supabase');
        setProperties([]);
        return;
      }

      console.log('✅ Properties fetched successfully:', data.length);
      
      // Convert database format to frontend format
      const formattedProperties = data.map(property => {
        const locationData = property.location as any;
        const city = locationData?.city || '';
        const state = locationData?.state || '';
        const displayLocation = city && state ? `${city}, ${state}` : 
                                city || state || property.general_location || 'Location not specified';
        
        return {
          id: property.id,
          name: property.title,
          title: property.title,
          location: displayLocation,
          price: (property.pricing as any)?.daily_rate || 0,
          rating: property.rating || 0,
          totalBookings: property.review_count || 0,
          images: property.images || [],
          type: property.property_type,
          capacity: property.max_guests,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          rooms_count: undefined, // Not available in properties_public
          capacity_per_room: undefined, // Not available in properties_public
          day_picnic_capacity: undefined, // Not available in properties_public
          amenities: property.amenities || []
        };
      });

      setProperties(formattedProperties);
    } catch (error: any) {
      console.error('❌ Failed to fetch properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive"
      });
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayPicnicPackages = async () => {
    try {
      console.log('🔍 Fetching day picnic packages...');
      
      // First, fetch day picnic packages with proper setup
      const { data: packagesData, error: packagesError } = await supabase
        .from('day_picnic_packages')
        .select(`
          *,
          properties (
            id,
            title,
            address,
            images,
            rating,
            review_count,
            status,
            admin_blocked
          )
        `)
        .eq('properties.status', 'approved')
        .or('properties.admin_blocked.is.null,properties.admin_blocked.eq.false');

      if (packagesError) {
        console.error('❌ Error fetching day picnic packages:', packagesError);
        throw packagesError;
      }
      
      console.log('✅ Day picnic packages fetched:', packagesData?.length || 0);
      
      // Fetch option prices for all packages
      let allOptionPrices = [];
      if (packagesData && packagesData.length > 0) {
        const packageIds = packagesData.map(pkg => pkg.id);
        const { data: optionPricesData, error: optionPricesError } = await supabase
          .from('day_picnic_option_prices')
          .select('*')
          .in('package_id', packageIds)
          .in('option_type', ['inclusion', 'exclusion', 'add_on']);

        if (optionPricesError) {
          console.error('❌ Error fetching option prices:', optionPricesError);
        } else {
          allOptionPrices = optionPricesData || [];
        }
      }
      
      // Filter out packages with null properties and format the data
      const formattedPackages = packagesData?.filter(pkg => pkg.properties && pkg.properties.id).map(pkg => {
        // Get option prices for this package
        const packageOptionPrices = allOptionPrices.filter(option => option.package_id === pkg.id);
        const exclusionsPriced = packageOptionPrices.filter(option => option.option_type === 'exclusion');
        const inclusionsPriced = packageOptionPrices.filter(option => option.option_type === 'inclusion');
        const addOnsPriced = packageOptionPrices.filter(option => option.option_type === 'add_on');

        return {
          id: pkg.id,
          propertyId: pkg.properties.id,
          name: `Day Picnic at ${pkg.properties.title || 'Property'}`,
          title: `Day Picnic at ${pkg.properties.title || 'Property'}`,
          location: pkg.properties.address || 'Location not specified',
          price: pkg.base_price || 0,
          pricingType: pkg.pricing_type || 'per_person',
          rating: pkg.properties.rating || 0,
          totalBookings: pkg.properties.review_count || 0,
          images: pkg.properties.images || [],
          timing: {
            start: pkg.start_time || '10:00',
            end: pkg.end_time || '18:00',
            duration: pkg.duration_hours || 8
          },
          mealPlan: pkg.meal_plan || [],
          inclusions: pkg.inclusions || [],
          exclusions: pkg.exclusions || [],
          addOns: pkg.add_ons || [],
          // Add priced options
          exclusionsPriced,
          inclusionsPriced,
          addOnsPriced,
          type: 'Day Picnic',
          hasPackage: true
        };
      }) || [];

      // Second, fetch all approved properties and filter for day picnic variants
      const { data: allApprovedProperties, error: propertiesError } = await supabase
        .from('properties_public')
        .select('*')
        .eq('status', 'approved');
      
      if (propertiesError) {
        console.error('❌ Error fetching properties:', propertiesError);
        throw propertiesError;
      }

      // Filter for day picnic properties using normalizeTypeKey to handle inconsistent types
      const dayPicnicProperties = allApprovedProperties?.filter(property => 
        property && property.property_type && normalizeTypeKey(property.property_type) === 'day_picnic'
      ) || [];

      console.log('🎯 Day Picnic properties from properties_public:', dayPicnicProperties.length);

      // Convert day picnic properties to package format
      const dayPicnicPropsAsPackages = dayPicnicProperties.filter(property => {
        // Only include properties that don't already have packages and have valid data
        return property.id && property.title && !formattedPackages.some(pkg => pkg.propertyId === property.id);
      }).map(property => {
        const locationData = property.location as any;
        const city = locationData?.city || '';
        const state = locationData?.state || '';
        const displayLocation = city && state ? `${city}, ${state}` : 
                                city || state || property.general_location || 'Location not specified';
        
        return {
          id: property.id,
          propertyId: property.id,
          name: `Day Picnic at ${property.title}`,
          title: `Day Picnic at ${property.title}`,
          location: displayLocation,
          price: (property.pricing as any)?.daily_rate || 0,
          pricingType: 'per_person',
          rating: property.rating || 0,
          totalBookings: property.review_count || 0,
          images: property.images || [],
          timing: {
            start: '10:00',
            end: '18:00',
            duration: 8
          },
          mealPlan: property.meal_plans || [],
          inclusions: [],
          exclusions: [],
          addOns: [],
          type: 'Day Picnic',
          hasPackage: false
        };
      });

      // Merge both arrays
      const allDayPicnics = [...formattedPackages, ...dayPicnicPropsAsPackages];
      
      console.log('✅ Total day picnic listings:', allDayPicnics.length);
      setDayPicnicPackages(allDayPicnics);
    } catch (error) {
      console.error('❌ Error fetching day picnic data:', error);
      setDayPicnicPackages([]);
      toast({
        title: "Error",
        description: "Failed to load day picnic packages. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter properties based on search criteria
  const filteredProperties = properties.filter(property => {
    const propertyName = property.name || '';
    const propertyLocation = property.location || '';
    
    const matchesSearch = !searchTerm || 
      propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
      propertyLocation.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesType = !propertyTypeFilter || propertyTypeFilter === 'all' ||
      normalizeTypeKey(property.type || '') === normalizeTypeKey(propertyTypeFilter);
    
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
    
    return matchesSearch && matchesLocation && matchesType && matchesPrice;
  });

  // Filter functions for day picnics
  const filteredDayPicnics = dayPicnicPackages.filter(pkg => {
    const pkgLocation = pkg.location || '';
    const matchesLocation = !locationFilter || 
      pkgLocation.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesPrice = pkg.price >= priceRange[0] && pkg.price <= priceRange[1];
    
    // Duration filter logic
    const matchesDuration = !durationFilter || durationFilter === 'all' || (() => {
      const duration = pkg.timing.duration;
      switch (durationFilter) {
        case 'half-day':
          return duration >= 4 && duration <= 5;
        case 'full-day':
          return duration >= 6 && duration <= 8;
        case 'extended-day':
          return duration >= 10;
        default:
          return true;
      }
    })();
    
    return matchesLocation && matchesPrice && matchesDuration;
  });

  // Sort day picnics
  const sortedDayPicnics = [...filteredDayPicnics].sort((a, b) => {
    // Debug logging
    if (sortBy === 'price-low' && filteredDayPicnics.length > 0) {
      console.log('🔍 Day Picnic Sorting Debug:', {
        sortBy,
        aPrice: a.price,
        bPrice: b.price,
        aPriceNum: Number(a.price),
        bPriceNum: Number(b.price),
        aTitle: a.title,
        bTitle: b.title
      });
    }
    
    switch (sortBy) {
      case 'price-low':
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      case 'price-high':
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      case 'rating':
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      case 'popular':
        return (Number(b.totalBookings) || 0) - (Number(a.totalBookings) || 0);
      default:
        return 0;
    }
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
        return b.totalBookings - a.totalBookings;
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = sortedProperties.slice(startIndex, endIndex);

  // Day Picnic pagination logic
  const dayPicnicTotalPages = Math.ceil(sortedDayPicnics.length / propertiesPerPage);
  const dayPicnicStartIndex = (currentPage - 1) * propertiesPerPage;
  const dayPicnicEndIndex = dayPicnicStartIndex + propertiesPerPage;
  const currentDayPicnics = sortedDayPicnics.slice(dayPicnicStartIndex, dayPicnicEndIndex);

  const handleViewProperty = (property: Property) => {
    navigate(`/property/${property.id}`);
  };

  const handleSearch = () => {
    // Apply price range filter
    if (priceRangeFilter !== 'any') {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      if (priceRangeFilter.includes('+')) {
        setPriceRange([parseInt(priceRangeFilter.replace('+', '')), 100000]);
      } else {
        setPriceRange([min, max]);
      }
    } else {
      setPriceRange([0, 50000]);
    }
    
    // Trigger search by updating current page
    setCurrentPage(1);
  };

  // Handle search from SearchForm component (same as home page)
  const handleSearchForm = (filters: SearchFilters) => {
    console.log('🔍 SearchForm search triggered on Properties page:', filters);
    
    // Update local state with search form filters
    if (filters.search) {
      setSearchTerm(filters.search);
    }
    if (filters.location && filters.location !== 'all') {
      setLocationFilter(filters.location);
    }
    if (filters.category && filters.category !== ('all' as any)) {
      setPropertyTypeFilter(filters.category);
    }
    if (filters.guests && filters.guests > 0) {
      setGuests(filters.guests);
    }
    
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
    if (filters.search) {
      searchParams.set('search', filters.search);
    }

    const queryString = searchParams.toString();
    navigate(`/properties${queryString ? `?${queryString}` : ''}`);
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  // Get duration-based price for display
  const getDurationBasedPrice = (pkg: any) => {
    if (!durationFilter || durationFilter === 'all') {
      return pkg.price;
    }
    
    // Apply duration-based pricing multipliers
    const multipliers = {
      'half-day': 0.6,
      'full-day': 1.0,
      'extended-day': 1.5
    };
    
    return Math.round(pkg.price * (multipliers[durationFilter as keyof typeof multipliers] || 1));
  };

  const handleViewDayPicnic = (pkg: any) => {
    try {
      if (!pkg.propertyId) {
        toast({
          title: "Error",
          description: "Property information is missing. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Navigate to day picnic booking page with duration filter
      const url = durationFilter && durationFilter !== 'all' 
        ? `/day-picnic/${pkg.propertyId}?duration=${durationFilter}`
        : `/day-picnic/${pkg.propertyId}`;
      navigate(url);
    } catch (error) {
      console.error('❌ Error navigating to day picnic:', error);
      toast({
        title: "Error",
        description: "Failed to open day picnic booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const propertyTypes = [
    'Hotels',
    'Apartments', 
    'Resorts',
    'Villas',
    'Homestays',
    'Farm Houses',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div 
              className="text-2xl font-bold text-orange-600 cursor-pointer"
              onClick={() => navigate('/')}
            >
              Picnify
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => navigate('/properties')}
                className="text-orange-600 font-medium"
              >
                Properties
              </button>
              <button 
                onClick={() => navigate('/about')}
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                Contact
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (user?.role === 'customer' || user?.role === 'user') {
                        navigate('/');
                      } else {
                        navigate('/dashboard');
                      }
                    }}
                  >
                    {user?.role === 'customer' || user?.role === 'user' ? 'Home' : 'Dashboard'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Perfect Stay
          </h1>
            <p className="text-gray-600">
              Discover amazing properties and Day Picnic experiences
            </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Toggle between Properties and Day Picnics */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <Button
              variant={!showDayPicnics ? "default" : "ghost"}
              onClick={() => {
                setShowDayPicnics(false);
                const params = new URLSearchParams(window.location.search);
                params.delete('tab');
                const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                window.history.pushState({}, '', newUrl);
              }}
              className="px-6 py-2"
            >
              Stay Properties
            </Button>
            <Button
              variant={showDayPicnics ? "default" : "ghost"}
              onClick={() => {
                setShowDayPicnics(true);
                const params = new URLSearchParams(window.location.search);
                params.set('tab', 'day_picnics');
                const newUrl = `${window.location.pathname}?${params.toString()}`;
                window.history.pushState({}, '', newUrl);
              }}
              className="px-6 py-2"
            >
              Day Picnic
            </Button>
          </div>
        </div>

        {/* Home Page Search Form */}
        <div className="mb-8" style={{ border: '2px solid red', padding: '10px', background: '#f0f0f0' }}>
          <h3 style={{ color: 'red', fontSize: '18px', fontWeight: 'bold' }}>DEBUG: SearchForm Container</h3>
          <div className="max-w-6xl mx-auto">
            <SearchForm 
              onSearch={handleSearchForm} 
              compact={false}
              key="properties-search-form"
            />
          </div>
        </div>

        {/* Modern Search Filter */}
        <div className="mb-8">
          <ModernSearchFilter
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            locationFilter={locationFilter}
            onLocationChange={setLocationFilter}
            checkInDate={checkInDate}
            onCheckInDateChange={setCheckInDate}
            guests={guests}
            onGuestsChange={setGuests}
            priceRange={priceRangeFilter}
            onPriceRangeChange={setPriceRangeFilter}
            propertyTypeFilter={propertyTypeFilter}
            onPropertyTypeChange={setPropertyTypeFilter}
            durationFilter={durationFilter}
            onDurationChange={setDurationFilter}
            showDayPicnics={showDayPicnics}
            propertyTypes={propertyTypes}
            onSearch={handleSearch}
          />
        </div>

        {/* Sort Options */}
        <div className="mb-6 flex justify-end">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Section */}
        {!showDayPicnics ? (
          // Regular Properties
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Properties ({filteredProperties.length})
              </h2>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="animate-pulse">
                      <div className="w-full h-48 bg-gray-200"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentProperties.map((property) => (
                    <Card 
                      key={property.id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleViewProperty(property)}
                    >
                      <div className="relative">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.name}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <MapPin className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Wishlist Button */}
                        <button 
                          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                          aria-label="Add to wishlist"
                        >
                          <Heart className="w-4 h-4 text-gray-600" />
                        </button>

                         {/* Property Type Badge */}
                         <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                           {formatPropertyType(property.type)}
                         </Badge>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 truncate">{property.name}</h3>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm truncate">{property.location}</span>
                        </div>

                        {/* Property Details */}
                        <div className="space-y-2 mb-3">
                          {/* Capacity Display */}
                           <div className="text-sm text-red-600 font-medium">
                             {normalizeTypeKey(property.type) === 'day_picnic' ? (
                              property.day_picnic_capacity || property.capacity ? (
                                `Max capacity: ${property.day_picnic_capacity || property.capacity} guests for day picnic`
                              ) : 'Capacity not specified'
                            ) : (
                              property.rooms_count && property.capacity_per_room ? (
                                `Max capacity: ${property.capacity || 0} guests (${property.rooms_count} rooms × ${property.capacity_per_room} each)`
                              ) : property.capacity ? (
                                `Max capacity: ${property.capacity} guests`
                              ) : 'Capacity not specified'
                            )}
                          </div>
                          
                          {/* Additional Details */}
                          <div className="flex items-center text-gray-600 text-sm space-x-4">
                            {property.bedrooms && property.bedrooms > 0 && (
                              <div className="flex items-center">
                                <Bed className="w-4 h-4 mr-1" />
                                <span>{property.bedrooms} BR</span>
                              </div>
                            )}
                            {property.bathrooms && property.bathrooms > 0 && (
                              <div className="flex items-center">
                                <Bath className="w-4 h-4 mr-1" />
                                <span>{property.bathrooms} BA</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-red-600">
                              ₹{property.price.toLocaleString()}
                            </span>
                            <span className="text-gray-600 text-sm ml-1">/night</span>
                          </div>
                          
                          {property.rating > 0 && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm font-medium">{property.rating}</span>
                              <span className="text-gray-500 text-xs ml-1">
                                ({property.totalBookings})
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="w-full mt-4 space-y-3">
                          <Button 
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProperty(property);
                            }}
                          >
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* No Results */}
                {filteredProperties.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No properties found</p>
                    <p className="text-gray-500">Try adjusting your search filters</p>
                  </div>
                )}

                {/* Pagination */}
                {(showDayPicnics ? dayPicnicTotalPages : totalPages) > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {[...Array(showDayPicnics ? dayPicnicTotalPages : totalPages)].map((_, index) => {
                      const page = index + 1;
                      const maxPages = showDayPicnics ? dayPicnicTotalPages : totalPages;
                      if (
                        page === 1 ||
                        page === maxPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className="w-10 h-10"
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, showDayPicnics ? dayPicnicTotalPages : totalPages))}
                      disabled={currentPage === (showDayPicnics ? dayPicnicTotalPages : totalPages)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Day Picnic Packages
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Day Picnic ({sortedDayPicnics.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentDayPicnics.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {pkg.images && pkg.images.length > 0 ? (
                      <img
                        src={pkg.images[0]}
                        alt={pkg.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-orange-500">
                      Day Picnic
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{pkg.name}</h3>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm truncate">{pkg.location}</span>
                    </div>

                    <div className="flex items-center text-gray-600 mb-3">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">
                        {formatTime12Hour(pkg.timing.start)} - {formatTime12Hour(pkg.timing.end)} 
                        ({pkg.timing.duration}h)
                      </span>
                    </div>

                    {pkg.mealPlan.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {pkg.mealPlan.slice(0, 3).map((meal: string) => (
                            <Badge key={meal} variant="secondary" className="text-xs">
                              {meal}
                            </Badge>
                          ))}
                          {pkg.mealPlan.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{pkg.mealPlan.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                     )}

                    <div className="text-xs text-gray-600 mb-3">
                      {/* Show inclusions with pricing if available */}
                      {pkg.inclusionsPriced && pkg.inclusionsPriced.length > 0 ? (
                        <div className="flex items-center gap-1 mb-1">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>Includes: {pkg.inclusionsPriced.slice(0, 2).map((inc: any, idx: number) => 
                            `${inc.name} (+₹${inc.price})`
                          ).join(', ')}</span>
                          {pkg.inclusionsPriced.length > 2 && <span>+{pkg.inclusionsPriced.length - 2} more</span>}
                        </div>
                      ) : pkg.inclusions && pkg.inclusions.length > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>Includes: {pkg.inclusions.slice(0, 2).join(', ')}</span>
                          {pkg.inclusions.length > 2 && <span>+{pkg.inclusions.length - 2} more</span>}
                        </div>
                      )}
                      
                      {/* Show exclusions with pricing if available */}
                      {pkg.exclusionsPriced && pkg.exclusionsPriced.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <X className="h-3 w-3 text-red-600" />
                          <span>Excludes: {pkg.exclusionsPriced.slice(0, 2).map((exc: any, idx: number) => 
                            `${exc.name} (+₹${exc.price})`
                          ).join(', ')}</span>
                          {pkg.exclusionsPriced.length > 2 && <span>+{pkg.exclusionsPriced.length - 2} more</span>}
                        </div>
                      ) : pkg.exclusions && pkg.exclusions.length > 0 && (
                        <div className="flex items-center gap-1">
                          <X className="h-3 w-3 text-red-600" />
                          <span>Excludes: {pkg.exclusions.slice(0, 2).join(', ')}</span>
                          {pkg.exclusions.length > 2 && <span>+{pkg.exclusions.length - 2} more</span>}
                        </div>
                      )}
                    </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <span className="text-xl font-bold text-green-600">
                           ₹{getDurationBasedPrice(pkg).toLocaleString()}
                         </span>
                         <span className="text-sm text-gray-600 ml-1">
                           {pkg.pricingType.replace('_', ' ')}
                         </span>
                         {durationFilter && durationFilter !== 'all' && (
                           <div className="text-xs text-orange-600 font-medium">
                             {durationFilter === 'half-day' ? 'Half Day' : 
                              durationFilter === 'full-day' ? 'Full Day' : 'Extended Day'}
                           </div>
                         )}
                       </div>
                      
                      {pkg.rating > 0 && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{pkg.rating}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleViewDayPicnic(pkg)}
                      className="w-full mt-4"
                    >
                      Book Day Picnic
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sortedDayPicnics.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No Day Picnic properties found</p>
                <p className="text-gray-500">Try adjusting your search filters</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Properties;
