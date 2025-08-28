import React, { useState, useEffect } from 'react';
import { X, Eye, DollarSign, Star, Calendar, Phone, Mail, MapPin, Users, Bed, Bath, Wifi, Car, Coffee, Dumbbell, Monitor, BarChart3, TrendingUp, PieChart, Home } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from './ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { supabase } from '../../integrations/supabase/client';

interface PropertyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string | null;
}

interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  property_type: string;
  address: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  pricing: any;
  images: string[];
  amenities: string[];
  status: string;
  created_at: string;
  owner_id: string;
  contact_phone?: string;
  rating: number;
  review_count: number;
  owner?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface PropertyInsights {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  occupancyRate: number;
  recentBookings: Array<{
    id: string;
    check_in_date: string;
    guests: number;
    total_amount: number;
    status: string;
  }>;
}

const PropertyDetailsDrawer: React.FC<PropertyDetailsDrawerProps> = ({
  isOpen,
  onClose,
  propertyId
}) => {
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [insights, setInsights] = useState<PropertyInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
      fetchPropertyInsights();
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_owner_id_fkey (
            full_name,
            email,
            phone
          )
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;

      setProperty({
        ...propertyData,
        owner: propertyData.profiles
      });
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyInsights = async () => {
    if (!propertyId) return;
    
    try {
      // Fetch bookings for this property
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Calculate insights
      const totalRevenue = bookings?.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0) || 0;
      const totalBookings = bookings?.length || 0;
      const recentBookings = bookings?.slice(0, 5) || [];

      // Fetch reviews for average rating
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId);

      if (reviewsError) throw reviewsError;

      const averageRating = reviews?.length 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Calculate occupancy rate (simplified)
      const approvedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const occupancyRate = totalBookings > 0 ? (approvedBookings / totalBookings) * 100 : 0;

      setInsights({
        totalRevenue,
        totalBookings,
        averageRating,
        occupancyRate,
        recentBookings
      });
    } catch (err) {
      console.error('Error fetching property insights:', err);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'wifi': <Wifi className="w-4 h-4" />,
      'parking': <Car className="w-4 h-4" />,
      'breakfast': <Coffee className="w-4 h-4" />,
      'gym': <Dumbbell className="w-4 h-4" />,
      'tv': <Monitor className="w-4 h-4" />,
      'ac': <Home className="w-4 h-4" />,
    };
    return iconMap[amenity.toLowerCase()] || <Home className="w-4 h-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh] max-w-4xl mx-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-semibold">
            {property?.title || 'Property Details'}
          </DrawerTitle>
          <DrawerClose asChild>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading property details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchPropertyDetails}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : property ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-600">Property Type:</span>
                        <p>{property.property_type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Address:</span>
                        <p className="flex items-start gap-1">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                          {property.address}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <Badge 
                          variant={property.status === 'approved' ? 'default' : 
                                  property.status === 'pending' ? 'secondary' : 'destructive'}
                          className="ml-2"
                        >
                          {property.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Created:</span>
                        <p>{new Date(property.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Capacity & Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{property.max_guests} guests</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4 text-gray-400" />
                          <span>{property.bedrooms} bedrooms</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4 text-gray-400" />
                          <span>{property.bathrooms} bathrooms</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{property.rating.toFixed(1)} ({property.review_count} reviews)</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Daily Rate:</span>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(property.pricing?.daily_rate || 0)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {property.description || 'No description available.'}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <div className="grid grid-cols-3 gap-4">
                  {property.images?.length > 0 ? (
                    property.images.map((image, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={image} 
                          alt={`Property image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">
                      No photos available
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Pricing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-600">Daily Rate:</span>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(property.pricing?.daily_rate || 0)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Currency:</span>
                        <p>{property.pricing?.currency || 'INR'}</p>
                      </div>
                    </div>
                    <Separator />
                    <p className="text-sm text-gray-500">
                      Additional pricing details and seasonal rates can be configured in the property settings.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amenities" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {property.amenities?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {property.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            {getAmenityIcon(amenity)}
                            <span className="capitalize">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No amenities listed</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="font-medium text-gray-600">Owner:</span>
                      <p>{property.owner?.full_name || 'Unknown'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{property.owner?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{property.contact_phone || property.owner?.phone || 'No phone'}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="mt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Key Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(insights?.totalRevenue || 0)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                            <p className="text-sm text-gray-600">Total Bookings</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {insights?.totalBookings || 0}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <Star className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                            <p className="text-sm text-gray-600">Avg Rating</p>
                            <p className="text-lg font-semibold text-yellow-600">
                              {insights?.averageRating.toFixed(1) || '0.0'}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <PieChart className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                            <p className="text-sm text-gray-600">Occupancy</p>
                            <p className="text-lg font-semibold text-purple-600">
                              {insights?.occupancyRate.toFixed(1) || '0'}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {insights?.recentBookings?.length > 0 ? (
                        <div className="space-y-3">
                          {insights.recentBookings.map((booking, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{new Date(booking.check_in_date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-600">{booking.guests} guests</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(booking.total_amount)}
                                </p>
                                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                  {booking.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-6">No recent bookings</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PropertyDetailsDrawer;