import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Users, Star, Calendar, Bed, Bath, Filter, Share2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { PropertyService } from '@/lib/propertyService';
import { SearchService, PROPERTY_CATEGORIES, type SearchFilters } from '@/lib/searchService';
import { getOptimizedImageUrl, getImageSizes } from '@/lib/imageOptimization';
import { useAuth } from '@/contexts/AuthContext';
import { shareUtils } from '@/lib/shareUtils';
import { ShareDropdown } from '@/components/ui/ShareDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Property {
  id: string;
  title: string;
  location: {
    city: string;
    state: string;
  };
  general_location: string;
  pricing: {
    daily_rate: number;
    currency: string;
  };
  rating: number;
  review_count: number;
  images: string[];
  property_type: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
}

interface DayPicnicPackage {
  id: string;
  property_id: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  base_price: number;
  pricing_type: string;
  property: Property;
  properties_public?: Property;
}

const ITEMS_PER_PAGE = 12;

const OptimizedProperties = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('category') || searchParams.get('type') || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || (searchParams.get('category') === 'day-picnic' ? 'day-picnics' : 'properties'));
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: searchParams.get('location') || 'all',
    category: (searchParams.get('category') || searchParams.get('type') || 'all') as any,
    date: searchParams.get('date') || '',
    guests: parseInt(searchParams.get('guests') || '0') || undefined
  });

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch properties with search filters
  const { 
    data: searchedProperties = [], 
    isLoading: isLoadingProperties,
    error: propertiesError 
  } = useQuery({
    queryKey: ['properties_search', searchFilters, priceRange, debouncedSearchTerm, selectedLocation, selectedType, currentPage],
    queryFn: () => SearchService.searchProperties({ 
      ...searchFilters, 
      priceRange,
      search: debouncedSearchTerm,
      location: selectedLocation !== 'all' ? selectedLocation : undefined,
      category: selectedType !== 'all' ? selectedType as any : undefined
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch available locations
  const { data: availableLocations = [] } = useQuery({
    queryKey: ['available-locations'],
    queryFn: SearchService.getAvailableLocations,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories with counts
  const { data: categoriesWithCounts = [] } = useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: SearchService.getCategoriesWithCounts,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch day picnic packages with filters when tab is active
  const { 
    data: dayPicnics = [], 
    isLoading: isLoadingDayPicnics 
  } = useQuery({
    queryKey: ['day_picnics', 'search', debouncedSearchTerm, selectedLocation, priceRange],
    queryFn: () => PropertyService.searchDayPicnics({
      search: debouncedSearchTerm,
      location: selectedLocation !== 'all' ? selectedLocation : undefined,
      minPrice: priceRange?.[0],
      maxPrice: priceRange?.[1]
    }),
    enabled: activeTab === 'day-picnics',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch owner's day picnic packages for preview (including unapproved)
  const { 
    data: ownerDayPicnics = [], 
    isLoading: isLoadingOwnerDayPicnics 
  } = useQuery({
    queryKey: ['day_picnics', 'owner', user?.id],
    queryFn: () => PropertyService.getOwnerDayPicnics(user?.id),
    enabled: activeTab === 'day-picnics' && !!user && dayPicnics.length === 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const properties = searchedProperties || [];
  const totalCount = properties.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Handle search filter changes
  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...searchFilters, ...newFilters };
    setSearchFilters(updatedFilters);
    setCurrentPage(1);

    // Update URL params
    const newParams = new URLSearchParams();
    if (updatedFilters.location && updatedFilters.location !== 'all') {
      newParams.set('location', updatedFilters.location);
    }
    if (updatedFilters.category && updatedFilters.category !== ('all' as any)) {
      newParams.set('category', updatedFilters.category);
    }
    if (updatedFilters.date) {
      newParams.set('date', updatedFilters.date);
    }
    if (updatedFilters.guests && updatedFilters.guests > 0) {
      newParams.set('guests', updatedFilters.guests.toString());
    }
    
    setSearchParams(newParams);
  }, [searchFilters, setSearchParams]);

  // Handle location filter change
  const handleLocationChange = useCallback((location: string) => {
    setSelectedLocation(location);
    handleFilterChange({ location });
  }, [handleFilterChange]);

  // Handle category filter change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedType(category);
    handleFilterChange({ category: category as any });
    
    // Auto-switch to day picnics tab when day-picnic category is selected
    if (category === 'day-picnic') {
      setActiveTab('day-picnics');
    } else if (activeTab === 'day-picnics') {
      // Switch back to properties tab when selecting a regular property category
      setActiveTab('properties');
    }
  }, [handleFilterChange, activeTab]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    
    // If switching away from day-picnics tab and category is day-picnic, reset category
    if (value === 'properties' && selectedType === 'day-picnic') {
      setSelectedType('all');
      handleFilterChange({ category: 'all' as any });
    }
  }, [selectedType, handleFilterChange]);

  // Handle search term change
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  // Handle price range change
  const handlePriceRangeChange = useCallback((range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1);
  }, []);

  // Prefetch next page for instant pagination
  useEffect(() => {
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['properties_public', 'paginated', currentPage + 1, ITEMS_PER_PAGE],
        queryFn: () => PropertyService.getPaginatedProperties(currentPage + 1, ITEMS_PER_PAGE),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [currentPage, totalPages, queryClient]);

  // Defer day picnic prefetch when idle
  useEffect(() => {
    if (activeTab === 'properties') {
      const prefetchDayPicnics = () => {
        queryClient.prefetchQuery({
          queryKey: ['day_picnics', 'approved'],
          queryFn: () => PropertyService.getApprovedDayPicnics(),
          staleTime: 5 * 60 * 1000,
        });
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(prefetchDayPicnics);
      } else {
        setTimeout(prefetchDayPicnics, 2000);
      }
    }
  }, [activeTab, queryClient]);

  // Properties are already filtered by SearchService, no need for additional client-side filtering
  const filteredProperties = properties;

  // Memoized sorted properties
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => ((a.pricing && typeof a.pricing === 'object' && (a.pricing as any).daily_rate) || 0) - ((b.pricing && typeof b.pricing === 'object' && (b.pricing as any).daily_rate) || 0));
      case 'price-high':
        return sorted.sort((a, b) => ((b.pricing && typeof b.pricing === 'object' && (b.pricing as any).daily_rate) || 0) - ((a.pricing && typeof a.pricing === 'object' && (a.pricing as any).daily_rate) || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'popular':
        return sorted.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [filteredProperties, sortBy]);

  // Memoized sorted day picnics
  const sortedDayPicnics = useMemo(() => {
    const sorted = [...dayPicnics];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (Number(a.base_price) || 0) - (Number(b.base_price) || 0));
      case 'price-high':
        return sorted.sort((a, b) => (Number(b.base_price) || 0) - (Number(a.base_price) || 0));
      case 'rating':
        return sorted.sort((a, b) => {
          const aRating = (a.properties_public?.rating || a.property?.rating || a.properties?.rating) || 0;
          const bRating = (b.properties_public?.rating || b.property?.rating || b.properties?.rating) || 0;
          return Number(bRating) - Number(aRating);
        });
      case 'popular':
        return sorted.sort((a, b) => {
          const aCount = (a.properties_public?.review_count || a.property?.review_count || a.properties?.review_count) || 0;
          const bCount = (b.properties_public?.review_count || b.property?.review_count || b.properties?.review_count) || 0;
          return Number(bCount) - Number(aCount);
        });
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
  }, [dayPicnics, sortBy]);

  // Navigation handlers
  const handleViewProperty = useCallback((propertyId: string) => {
    navigate(`/property/${propertyId}`);
  }, [navigate]);

  const handleViewDayPicnic = useCallback((propertyId: string, isPreview = false) => {
    if (isPreview) {
      navigate(`/owner?tab=properties&action=edit&id=${propertyId}`);
    } else {
      navigate(`/day-picnic/${propertyId}`);
    }
  }, [navigate]);

  // Day Picnic card component
  const DayPicnicCard = React.memo(({ dayPicnic, isPreview = false }: { dayPicnic: DayPicnicPackage; isPreview?: boolean }) => {
    const property = (dayPicnic as any).properties_public || (dayPicnic as any).property || (dayPicnic as any).properties;
    const primaryImage = property?.images?.[0];
    const optimizedImage = primaryImage ? getOptimizedImageUrl(primaryImage, { width: 400, height: 300 }) : null;

    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={() => handleViewDayPicnic(dayPicnic.property_id, isPreview)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {optimizedImage ? (
            <img
              src={optimizedImage}
              alt={property?.title || 'Day Picnic Property'}
              loading="lazy"
              decoding="async"
              sizes={getImageSizes('grid')}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-property.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
          
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            Day Picnic
          </Badge>
          
          {isPreview && (
            <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
              Owner Preview
            </Badge>
          )}
          
          {/* Share Button for Day Picnic */}
          {!isPreview && (
            <ShareDropdown
              property={dayPicnic}
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
            />
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {property?.title}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">
              {property?.general_location || property?.location?.city || 'Location not specified'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-sm">{property?.max_guests || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-sm">{dayPicnic.duration_hours}h</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex gap-2 items-center justify-between w-full">
            <div>
              <span className="text-2xl font-bold text-red-600">
                ₹{dayPicnic.base_price?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-sm text-muted-foreground">
                /{dayPicnic.pricing_type === 'per_person' ? 'person' : 'package'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {isPreview ? 'Click to edit setup' : 'Click to view details'}
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  });

  // Property card component with optimized images
  const PropertyCard = React.memo(({ property }: { property: Property }) => {
    const primaryImage = property.images?.[0];
    const optimizedImage = primaryImage ? getOptimizedImageUrl(primaryImage, { width: 400, height: 300 }) : null;

    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={() => handleViewProperty(property.id)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {optimizedImage ? (
            <img
              src={optimizedImage}
              alt={property.title}
              loading="lazy"
              decoding="async"
              sizes={getImageSizes('grid')}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-property.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
          
          {property.property_type && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              {property.property_type}
            </Badge>
          )}
          
          {/* Share Button */}
          <ShareDropdown
            property={property}
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
          />
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">{property.general_location}</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-sm">{property.max_guests}</span>
              </div>
              {property.bedrooms > 0 && (
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">{property.bathrooms}</span>
                </div>
              )}
            </div>
            
            {property.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm font-medium">{property.rating.toFixed(1)}</span>
                {property.review_count > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({property.review_count})
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex gap-2 items-center justify-between w-full">
            <div>
              <span className="text-2xl font-bold text-red-600">
                ₹{property.pricing?.daily_rate?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-sm text-muted-foreground">/night</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Click to view details
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  });

  // Loading skeleton
  const PropertySkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex justify-between w-full items-center">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-2">Explore Properties</h1>
          <p className="text-center text-muted-foreground">
            Discover amazing stays and day picnic spots across India
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={`${location.city}-${location.state}`} value={`${location.city}, ${location.state}`}>
                    {location.city}, {location.state} ({location.property_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="day-picnic">Day Picnic</SelectItem>
                {categoriesWithCounts
                  .filter((category) => category.category !== 'day-picnic')
                  .map((category) => (
                    <SelectItem key={category.category} value={category.category}>
                      {category.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium min-w-[100px]">Price Range:</span>
            <div className="flex-1 max-w-md">
              <Select 
                value={`${priceRange[0]}-${priceRange[1]}`} 
                onValueChange={(value) => {
                  const [min, max] = value.split('-').map(Number);
                  handlePriceRangeChange([min, max] as [number, number]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1000">Under ₹1,000</SelectItem>
                  <SelectItem value="1000-2500">₹1,000 - ₹2,500</SelectItem>
                  <SelectItem value="2500-5000">₹2,500 - ₹5,000</SelectItem>
                  <SelectItem value="5000-7500">₹5,000 - ₹7,500</SelectItem>
                  <SelectItem value="7500-10000">₹7,500 - ₹10,000</SelectItem>
                  <SelectItem value="10000-50000">₹10,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('all');
                setSelectedType('all');
                setPriceRange([0, 50000]);
                setSortBy('newest');
                setSearchFilters({
                  location: 'all',
                  category: 'all' as any,
                  date: '',
                  guests: undefined
                });
                setSearchParams(new URLSearchParams());
              }}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-between items-center mb-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList>
              {/* Only show Properties tab when NOT day-picnic category */}
              {selectedType !== 'day-picnic' && (
                <TabsTrigger value="properties">Properties ({properties.length})</TabsTrigger>
              )}
              {/* Only show Day Picnics tab when day-picnic category is selected or no specific property type is selected */}
              {(selectedType === 'day-picnic' || selectedType === 'all') && (
                <TabsTrigger value="day-picnics">
                  Day Picnics ({sortedDayPicnics.length})
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Only show Properties tab content when NOT day-picnic category */}
          {selectedType !== 'day-picnic' && (
            <TabsContent value="properties" className="mt-0">
            {/* Results count */}
            <div className="mb-6">
              <p className="text-muted-foreground">
                Showing {sortedProperties.length} of {totalCount} properties
                {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
              </p>
            </div>

            {/* Properties Grid */}
            {isLoadingProperties ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
                  <PropertySkeleton key={i} />
                ))}
              </div>
            ) : sortedProperties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {sortedProperties.map((property) => (
                    <PropertyCard key={property.id} property={{
                      ...property,
                      location: property.location && typeof property.location === 'object' ? property.location as { city: string; state: string } : { city: '', state: '' },
                      pricing: property.pricing && typeof property.pricing === 'object' ? property.pricing as { daily_rate: number; currency: string } : { daily_rate: 0, currency: 'INR' }
                    }} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="px-4 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={() => {
                  setSearchTerm('');
                  setSelectedLocation('all');
                  setSelectedType('all');
                  setPriceRange([0, 15000]);
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
          )}

          <TabsContent value="day-picnics" className="mt-0">
            {isLoadingDayPicnics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }, (_, i) => (
                  <PropertySkeleton key={i} />
                ))}
              </div>
            ) : sortedDayPicnics.length > 0 || ownerDayPicnics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Approved day picnics */}
                {sortedDayPicnics.map((picnic: DayPicnicPackage) => (
                  <DayPicnicCard key={`approved-${picnic.id}`} dayPicnic={picnic} />
                ))}
                
                {/* Owner preview day picnics (only if no approved ones) */}
                {sortedDayPicnics.length === 0 && ownerDayPicnics.map((picnic: DayPicnicPackage) => (
                  <DayPicnicCard key={`preview-${picnic.id}`} dayPicnic={picnic} isPreview={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌳</div>
                <h3 className="text-xl font-semibold mb-2">No public day picnic spots found</h3>
                <p className="text-muted-foreground mb-4">
                  {user && ownerDayPicnics.length > 0 
                    ? `You have ${ownerDayPicnics.length} packages pending approval. Approve them to make them public.`
                    : 'Try adjusting your filters or check back later for new day picnic spots.'
                  }
                </p>
                {user && (
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => navigate('/owner')}>
                      Go to Owner Dashboard
                    </Button>
                    {ownerDayPicnics.length > 0 && (
                      <Button variant="outline" onClick={() => navigate(`/owner?tab=properties&action=edit&id=${ownerDayPicnics[0].property_id}`)}>
                        Setup Day Picnic
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OptimizedProperties;