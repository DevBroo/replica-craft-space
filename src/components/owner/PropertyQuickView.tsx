import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/owner/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/owner/ui/tabs';
import { Badge } from '@/components/owner/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { MapPin, Users, DollarSign, Star, Clock, Utensils, Check, X } from 'lucide-react';
import { ItineraryTimeline } from '@/components/property/ItineraryTimeline';
import { MapEmbed } from '@/components/property/MapEmbed';
import { supabase } from '@/integrations/supabase/client';
import { formatPropertyType } from '@/lib/utils';

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: string;
  address: string;
  location: any;
  coordinates: any;
  pricing: any;
  max_guests: number;
  day_picnic_capacity?: number;
  images: string[];
  amenities: string[];
  rating: number;
  review_count: number;
  status: string;
  created_at: string;
}

interface PropertyQuickViewProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyQuickView: React.FC<PropertyQuickViewProps> = ({
  property,
  isOpen,
  onClose
}) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (property && property.property_type === 'Day Picnic') {
      fetchPackages();
    }
  }, [property]);

  const fetchPackages = async () => {
    if (!property) return;
    
    setLoading(true);
    try {
      const { data: packagesData, error } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', property.id);

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
    const coordinates = property.coordinates;
    if (!coordinates) return [];

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{property.title}</span>
            <Badge variant={property.status === 'approved' ? 'default' : 'secondary'}>
              {property.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Property Image */}
            {property.images && property.images.length > 0 && (
              <div className="w-full h-48 rounded-lg overflow-hidden">
                <img 
                  src={property.images[0]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Type:</span>
                    <span>{formatPropertyType(property.property_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Max Guests: {property.day_picnic_capacity || property.max_guests}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>₹{property.pricing?.daily_rate || 0}/day</span>
                  </div>
                  {property.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{property.rating} ({property.review_count} reviews)</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{property.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading itinerary...</p>
              </div>
            ) : (
              <ItineraryTimeline 
                propertyType={property.property_type}
                packages={packages}
              />
            )}
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <MapEmbed
              city={property.location?.city}
              state={property.location?.state}
              coordinates={property.coordinates}
              address={property.address}
            />

            {/* Major Cities Distances */}
            {property.coordinates && (
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};