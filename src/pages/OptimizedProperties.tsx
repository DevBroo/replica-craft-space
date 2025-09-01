import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Star, Calendar, Bed, Bath, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { PropertyService } from '@/lib/propertyService';
import { getOptimizedImageUrl, getImageSizes } from '@/lib/imageOptimization';
import { useAuth } from '@/contexts/AuthContext';
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
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('properties');

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch properties with React Query and pagination
  const { 
    data: propertiesData, 
    isLoading: isLoadingProperties,
    error: propertiesError 
  } = useQuery({
    queryKey: ['properties_public', 'paginated', currentPage, ITEMS_PER_PAGE],
    queryFn: () => PropertyService.getPaginatedProperties(currentPage, ITEMS_PER_PAGE),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch day picnic packages only when tab is active
  const { 
    data: dayPicnics = [], 
    isLoading: isLoadingDayPicnics 
  } = useQuery({
    queryKey: ['day_picnics', 'approved'],
    queryFn: () => PropertyService.getApprovedDayPicnics(),
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

  const properties = propertiesData?.properties || [];
  const totalCount = propertiesData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

  // Memoized filtered and sorted properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter - check title and location
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        (property.title && property.title.toLowerCase().includes(searchLower)) ||
        (property.general_location && property.general_location.toLowerCase().includes(searchLower)) ||
        (property.location?.city && property.location.city.toLowerCase().includes(searchLower)) ||
        (property.location?.state && property.location.state.toLowerCase().includes(searchLower));
      
      // Location filter - check general_location, city, and state
      const locationLower = selectedLocation.toLowerCase();
      const matchesLocation = selectedLocation === 'all' || 
        (property.general_location && property.general_location.toLowerCase().includes(locationLower)) ||
        (property.location?.city && property.location.city.toLowerCase().includes(locationLower)) ||
        (property.location?.state && property.location.state.toLowerCase().includes(locationLower));
      
      // Property type filter
      const matchesType = selectedType === 'all' || 
        (property.property_type && property.property_type.toLowerCase() === selectedType.toLowerCase());
      
      // Price filter - handle cases where pricing might be null
      const propertyPrice = property.pricing?.daily_rate || 0;
      const matchesPrice = propertyPrice >= priceRange[0] && propertyPrice <= priceRange[1];

      return matchesSearch && matchesLocation && matchesType && matchesPrice;
    });
  }, [properties, debouncedSearchTerm, selectedLocation, selectedType, priceRange]);

  // Memoized sorted properties
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.pricing?.daily_rate || 0) - (b.pricing?.daily_rate || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.pricing?.daily_rate || 0) - (a.pricing?.daily_rate || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'popular':
        return sorted.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [filteredProperties, sortBy]);

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
    const property = dayPicnic.properties_public || dayPicnic.property;
    const primaryImage = property?.images?.[0];
    const optimizedImage = primaryImage ? getOptimizedImageUrl(primaryImage, { width: 400, height: 300 }) : null;

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
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
          
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            Day Picnic
          </Badge>
          
          {isPreview && (
            <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
              Owner Preview
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {property?.title}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">{property?.general_location}</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
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
              <span className="text-2xl font-bold text-primary">
                ₹{dayPicnic.base_price?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-sm text-muted-foreground">
                /{dayPicnic.pricing_type === 'per_person' ? 'person' : 'package'}
              </span>
            </div>
            <Button onClick={() => handleViewDayPicnic(dayPicnic.property_id, isPreview)}>
              {isPreview ? 'Edit Setup' : 'View Details'}
            </Button>
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
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
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
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
              {property.property_type}
            </Badge>
          )}
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
              <span className="text-2xl font-bold text-primary">
                ₹{property.pricing?.daily_rate?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-sm text-muted-foreground">/night</span>
            </div>
            <Button variant='destructive' onClick={() => handleViewProperty(property.id)}>
              View Details
            </Button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Pune">Pune</SelectItem>
                <SelectItem value="Goa">Goa</SelectItem>
                <SelectItem value="Jaipur">Jaipur</SelectItem>
                <SelectItem value="Udaipur">Udaipur</SelectItem>
                <SelectItem value="Manali">Manali</SelectItem>
                <SelectItem value="Shimla">Shimla</SelectItem>
                <SelectItem value="Rishikesh">Rishikesh</SelectItem>
                <SelectItem value="Kerala">Kerala</SelectItem>
                <SelectItem value="Darjeeling">Darjeeling</SelectItem>
                <SelectItem value="Andaman">Andaman</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Farmhouse">Farmhouse</SelectItem>
                <SelectItem value="Resort">Resort</SelectItem>
                <SelectItem value="Cottage">Cottage</SelectItem>
                <SelectItem value="Bungalow">Bungalow</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Guest House">Guest House</SelectItem>
                <SelectItem value="Heritage">Heritage</SelectItem>
                <SelectItem value="Beach House">Beach House</SelectItem>
                <SelectItem value="Mountain Cabin">Mountain Cabin</SelectItem>
                <SelectItem value="Day Picnic">Day Picnic</SelectItem>
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
                  setPriceRange([min, max]);
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
                  <SelectItem value="10000-15000">₹10,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('all');
                setSelectedType('all');
                setPriceRange([0, 15000]);
                setSortBy('newest');
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="properties">Properties ({properties.length})</TabsTrigger>
              <TabsTrigger value="day-picnics">
                Day Picnics ({dayPicnics.length}{ownerDayPicnics.length > 0 && dayPicnics.length === 0 ? ` + ${ownerDayPicnics.length} preview` : ''})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                    <PropertyCard key={property.id} property={property} />
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

          <TabsContent value="day-picnics" className="mt-0">
            {isLoadingDayPicnics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }, (_, i) => (
                  <PropertySkeleton key={i} />
                ))}
              </div>
            ) : dayPicnics.length > 0 || ownerDayPicnics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Approved day picnics */}
                {dayPicnics.map((picnic: DayPicnicPackage) => (
                  <DayPicnicCard key={`approved-${picnic.id}`} dayPicnic={picnic} />
                ))}
                
                {/* Owner preview day picnics (only if no approved ones) */}
                {dayPicnics.length === 0 && ownerDayPicnics.map((picnic: DayPicnicPackage) => (
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