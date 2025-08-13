import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Home, User, Heart, CreditCard, Bell, LogOut, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  property_id: string;
  property_title: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
}

interface Property {
  id: string;
  title: string;
  address: string;
  pricing: any;
  property_type: string;
  images: string[];
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          property_id,
          check_in_date,
          check_out_date,
          status,
          total_amount,
          properties (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else {
        const formattedBookings = bookingsData?.map(booking => ({
          id: booking.id,
          property_id: booking.property_id,
          property_title: booking.properties?.title || 'Unknown Property',
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          status: booking.status,
          total_amount: booking.total_amount
        })) || [];
        setBookings(formattedBookings);
      }

      // Fetch properties for saved properties section (mock for now)
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .limit(3);

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
      } else {
        const formattedProperties = propertiesData?.map(property => ({
          id: property.id,
          title: property.title,
          address: property.address,
          pricing: property.pricing,
          property_type: property.property_type,
          images: property.images || []
        })) || [];
        setSavedProperties(formattedProperties);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-32 w-32 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-bold text-primary">
                Picnify
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold">Customer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.full_name || 'Guest User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Traveler'}!
          </h2>
          <p className="text-muted-foreground">
            Manage your bookings, explore new destinations, and plan your next adventure.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
              <p className="text-xs text-muted-foreground">
                {bookings.filter(b => b.status === 'confirmed').length} confirmed
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Properties</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedProperties.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready to book
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Trip</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.find(b => new Date(b.check_in_date) > new Date()) ? 'Soon' : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                Upcoming bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="saved">Saved Properties</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>
                  View and manage your current and past bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start exploring amazing properties and make your first booking!
                    </p>
                    <Button asChild>
                      <Link to="/properties">Browse Properties</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{booking.property_title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium">${booking.total_amount}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/properties/${booking.property_id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Properties Tab */}
          <TabsContent value="saved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saved Properties</CardTitle>
                <CardDescription>
                  Properties you've saved for later consideration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No saved properties</h3>
                    <p className="text-muted-foreground mb-4">
                      Save properties you're interested in to easily find them later!
                    </p>
                    <Button asChild>
                      <Link to="/properties">Explore Properties</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProperties.map((property) => (
                      <Card key={property.id} className="hover-lift">
                        <div className="aspect-video bg-muted rounded-t-lg">
                          {property.images?.[0] && (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1">{property.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{property.address}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">${property.pricing?.base_price || property.pricing?.nightly_rate || 'N/A'}/night</span>
                            <Button size="sm" asChild>
                              <Link to={`/property/${property.id}`}>View</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="text-xl">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.full_name || 'User'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-sm text-muted-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Type</label>
                    <p className="text-sm text-muted-foreground capitalize">{user?.role || 'Customer'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your bookings and special offers
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Methods</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage your saved payment methods
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security</h4>
                    <p className="text-sm text-muted-foreground">
                      Change password and security settings
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild className="h-auto p-4 flex-col">
                  <Link to="/properties">
                    <Home className="h-8 w-8 mb-2" />
                    <span>Browse Properties</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4 flex-col">
                  <Link to="/help">
                    <Bell className="h-8 w-8 mb-2" />
                    <span>Get Help</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-4 flex-col">
                  <Link to="/contact">
                    <User className="h-8 w-8 mb-2" />
                    <span>Contact Support</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}