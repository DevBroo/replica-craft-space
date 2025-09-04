import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/owner/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/owner/ui/tabs';
import { Badge } from '@/components/owner/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { MapPin, Users, DollarSign, Star, Clock, Utensils, Check, X, Home, Bed, Bath, Camera, Calendar, Shield, Wifi, Car } from 'lucide-react';
import { ItineraryTimeline } from '@/components/property/ItineraryTimeline';
import { MapEmbed } from '@/components/property/MapEmbed';
import { supabase } from '@/integrations/supabase/client';
import { formatPropertyType } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type FullProperty = Database['public']['Tables']['properties']['Row'];

interface PropertyQuickViewProps {
  property: { id: string; title: string; } | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'overview' | 'pricing' | 'rooms' | 'amenities' | 'policies' | 'location';
}

export const PropertyQuickView: React.FC<PropertyQuickViewProps> = ({
  property,
  isOpen,
  onClose,
  initialTab = 'overview'
}) => {
  const [fullProperty, setFullProperty] = useState<FullProperty | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (property?.id && isOpen) {
      fetchFullProperty();
    }
  }, [property?.id, isOpen]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchFullProperty = async () => {
    if (!property?.id) return;
    
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', property.id)
        .single();

      if (error) throw error;
      setFullProperty(data);

      // Fetch packages for Day Picnic properties
      if (data.property_type === 'Day Picnic') {
        fetchPackages(data.id);
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchPackages = async (propertyId: string) => {
    setLoading(true);
    try {
      const { data: packagesData, error } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', propertyId);

      if (error) throw error;
      setPackages(packagesData || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!property) return null;

  // Calculate distances from major Indian cities (mock data with realistic calculations)
  const getMajorCityDistances = () => {
    const coordinates = fullProperty?.coordinates as { lat: number; lng: number } | null;
    if (!coordinates || typeof coordinates !== 'object' || !coordinates.lat || !coordinates.lng) return [];

    // Major Indian cities with their coordinates
    const majorCities = [
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { name: 'Pune', lat: 18.5204, lng: 73.8567 },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 }
    ];

    // Haversine formula to calculate distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    return majorCities
      .map(city => ({
        name: city.name,
        distance: calculateDistance(coordinates.lat, coordinates.lng, city.lat, city.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(city => ({
        name: city.name,
        distance: `${Math.round(city.distance)} km`,
        time: `${Math.round(city.distance / 60)} hrs drive`
      }));
  };

  if (dataLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading property details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!fullProperty) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{fullProperty.title}</span>
            <Badge variant={fullProperty.status === 'approved' ? 'default' : 'secondary'}>
              {fullProperty.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Property Images */}
            {fullProperty.images && fullProperty.images.length > 0 && (
              <div className="w-full h-64 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={fullProperty.images[0]} 
                  alt={fullProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{formatPropertyType(fullProperty.property_type)}</span>
                  </div>
                  {fullProperty.property_subtype && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtype:</span>
                      <span className="font-medium">{fullProperty.property_subtype}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Guests:</span>
                    <span className="font-medium">{fullProperty.day_picnic_capacity || fullProperty.max_guests}</span>
                  </div>
                  {fullProperty.star_rating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Star Rating:</span>
                      <span className="font-medium">{fullProperty.star_rating} Star</span>
                    </div>
                  )}
                  {fullProperty.rating && fullProperty.rating > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Rating:</span>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{fullProperty.rating} ({fullProperty.review_count} reviews)</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Rate:</span>
                    <span className="font-medium text-lg">₹{(fullProperty.pricing as any)?.daily_rate || 0}/day</span>
                  </div>
                  {fullProperty.minimum_stay && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Stay:</span>
                      <span className="font-medium">{fullProperty.minimum_stay} night(s)</span>
                    </div>
                  )}
                  {fullProperty.check_in_time && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="font-medium">{fullProperty.check_in_time}</span>
                    </div>
                  )}
                  {fullProperty.check_out_time && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-out:</span>
                      <span className="font-medium">{fullProperty.check_out_time}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{fullProperty.description}</p>
              </CardContent>
            </Card>

            {/* Host Details */}
            {fullProperty.host_details && Object.keys(fullProperty.host_details as any).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Host Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(fullProperty.host_details as any).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fullProperty.pricing && (
                    <div className="space-y-3">
                      {Object.entries(fullProperty.pricing as any).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                          <span className="font-medium">
                            {typeof value === 'number' ? `₹${value}` : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {fullProperty.seasonal_pricing && Object.keys(fullProperty.seasonal_pricing as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Seasonal Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.seasonal_pricing, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {fullProperty.payment_methods && fullProperty.payment_methods.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Accepted Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {fullProperty.payment_methods.map((method, index) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    Room Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fullProperty.bedrooms !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bedrooms:</span>
                      <span className="font-medium">{fullProperty.bedrooms}</span>
                    </div>
                  )}
                  {fullProperty.bathrooms !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bathrooms:</span>
                      <span className="font-medium">{fullProperty.bathrooms}</span>
                    </div>
                  )}
                  {fullProperty.rooms_count !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Rooms:</span>
                      <span className="font-medium">{fullProperty.rooms_count}</span>
                    </div>
                  )}
                  {fullProperty.capacity_per_room !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity per Room:</span>
                      <span className="font-medium">{fullProperty.capacity_per_room} guests</span>
                    </div>
                  )}
                  {fullProperty.day_picnic_capacity !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Day Picnic Capacity:</span>
                      <span className="font-medium">{fullProperty.day_picnic_capacity} guests</span>
                    </div>
                  )}
                  {fullProperty.banquet_hall_capacity !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banquet Hall Capacity:</span>
                      <span className="font-medium">{fullProperty.banquet_hall_capacity} guests</span>
                    </div>
                  )}
                  {fullProperty.ground_lawn_capacity !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ground/Lawn Capacity:</span>
                      <span className="font-medium">{fullProperty.ground_lawn_capacity} guests</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {fullProperty.rooms_details && Object.keys(fullProperty.rooms_details as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Room Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.rooms_details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {fullProperty.bed_configuration && Object.keys(fullProperty.bed_configuration as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bed Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.bed_configuration, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-6">
            <div className="grid gap-6">
              {/* Basic Amenities */}
              {fullProperty.amenities && fullProperty.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {fullProperty.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Amenities */}
              {fullProperty.amenities_details && Object.keys(fullProperty.amenities_details as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detailed Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.amenities_details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Facilities */}
              {fullProperty.facilities && Object.keys(fullProperty.facilities as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Facilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.facilities, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Safety & Security */}
              {fullProperty.safety_security && Object.keys(fullProperty.safety_security as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Safety & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.safety_security, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Extra Services */}
              {fullProperty.extra_services && Object.keys(fullProperty.extra_services as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extra Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.extra_services, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking & Cancellation Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fullProperty.cancellation_policy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancellation Policy:</span>
                      <span className="font-medium capitalize">{fullProperty.cancellation_policy}</span>
                    </div>
                  )}
                  {fullProperty.minimum_stay && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Stay:</span>
                      <span className="font-medium">{fullProperty.minimum_stay} night(s)</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* House Rules */}
              {fullProperty.house_rules && Object.keys(fullProperty.house_rules as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">House Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.house_rules, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Booking Rules */}
              {fullProperty.booking_rules && Object.keys(fullProperty.booking_rules as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Booking Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.booking_rules, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Extended Policies */}
              {fullProperty.policies_extended && Object.keys(fullProperty.policies_extended as any).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extended Policies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(fullProperty.policies_extended, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Languages Spoken */}
              {fullProperty.languages_spoken && Array.isArray(fullProperty.languages_spoken as any) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Languages Spoken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(fullProperty.languages_spoken as any).map((language: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meal Plans */}
              {fullProperty.meal_plans && fullProperty.meal_plans.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Meal Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {fullProperty.meal_plans.map((plan, index) => (
                        <Badge key={index} variant="outline">
                          {plan}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Address:</span>
                  <span className="font-medium text-right max-w-xs">{fullProperty.address}</span>
                </div>
                {fullProperty.postal_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Postal Code:</span>
                    <span className="font-medium">{fullProperty.postal_code}</span>
                  </div>
                )}
                {fullProperty.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-medium">{fullProperty.country}</span>
                  </div>
                )}
                {fullProperty.contact_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Phone:</span>
                    <span className="font-medium">{fullProperty.contact_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <MapEmbed
              city={(fullProperty.location as any)?.city}
              state={(fullProperty.location as any)?.state}
              coordinates={fullProperty.coordinates as any}
              address={fullProperty.address}
            />

            {/* Nearby Attractions */}
            {fullProperty.nearby_attractions && Object.keys(fullProperty.nearby_attractions as any).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nearby Attractions</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(fullProperty.nearby_attractions, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Major Cities Distances */}
            {fullProperty.coordinates && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distance from Major Cities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {getMajorCityDistances().map((city, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{city.name}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{city.distance}</div>
                          <div className="text-muted-foreground">{city.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Arrival Instructions */}
            {fullProperty.arrival_instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Arrival Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{fullProperty.arrival_instructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Day Picnic Packages */}
            {fullProperty.property_type === 'Day Picnic' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Day Picnic Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Loading packages...</p>
                    </div>
                  ) : (
                    <ItineraryTimeline 
                      propertyType={fullProperty.property_type}
                      packages={packages}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};