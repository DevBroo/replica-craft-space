import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Star, Calendar, Bed, Bath, Filter, Grid3X3, List } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { PropertyService } from '@/lib/propertyService';
import { getOptimizedImageUrl, getImageSizes } from '@/lib/imageOptimization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
}

const ITEMS_PER_PAGE = 12;

const OptimizedProperties = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('properties');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      const matchesSearch = !debouncedSearchTerm || 
        property.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        property.general_location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesLocation = !selectedLocation || 
        property.general_location?.includes(selectedLocation);
      
      const matchesType = !selectedType || 
        property.property_type === selectedType;
      
      const matchesPrice = property.pricing?.daily_rate >= priceRange[0] && 
        property.pricing?.daily_rate <= priceRange[1];

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

  const handleViewDayPicnic = useCallback((propertyId: string) => {
    navigate(`/day-picnic/${propertyId}`);
  }, [navigate]);

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
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-2xl font-bold text-primary">
                ₹{property.pricing?.daily_rate?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-sm text-muted-foreground">/night</span>
            </div>
            <Button onClick={() => handleViewProperty(property.id)}>
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
                <SelectItem value="">All Locations</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Pune">Pune</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Farmhouse">Farmhouse</SelectItem>
                <SelectItem value="Resort">Resort</SelectItem>
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
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={10000}
                min={0}
                step={500}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="properties">Properties ({properties.length})</TabsTrigger>
              <TabsTrigger value="day-picnics">Day Picnics ({dayPicnics.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
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
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                {Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
                  <PropertySkeleton key={i} />
                ))}
              </div>
            ) : sortedProperties.length > 0 ? (
              <>
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6 mb-8`}>
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
                  setSelectedLocation('');
                  setSelectedType('');
                  setPriceRange([0, 10000]);
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
            ) : dayPicnics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {dayPicnics.map((picnic: any) => {
                  const property = picnic.properties;
                  const primaryImage = property?.images?.[0];
                  const optimizedImage = primaryImage ? getOptimizedImageUrl(primaryImage, { width: 400, height: 300 }) : null;
                  
                  return (
                    <Card key={picnic.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
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
                        <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                          Day Picnic
                        </Badge>
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
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">{picnic.duration_hours}h</span>
                            </div>
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
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="text-2xl font-bold text-primary">
                              ₹{picnic.base_price?.toLocaleString() || 'N/A'}
                            </span>
                            <span className="text-sm text-muted-foreground">/{picnic.pricing_type === 'per_person' ? 'person' : 'package'}</span>
                          </div>
                          <Button onClick={() => handleViewDayPicnic(property.id)}>
                            Book Now
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌳</div>
                <h3 className="text-xl font-semibold mb-2">No day picnic spots found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OptimizedProperties;