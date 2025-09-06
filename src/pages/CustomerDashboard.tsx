import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookingService } from '@/lib/bookingService';
import { useWishlist } from '@/contexts/WishlistContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Home, User, Heart, CreditCard, Bell, LogOut, MapPin, Star, ArrowLeft, Search, Plus, TrendingUp, Award, Shield, Settings2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReviewYourStay } from '@/components/reviews/ReviewYourStay';

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
  const [loading, setLoading] = useState(true);
  
  const { savedProperties, savedCount, removeFromWishlist } = useWishlist();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      // Fetch bookings using BookingService
      if (user?.id) {
        console.log('🔍 Fetching bookings for user:', { userId: user.id, email: user.email });
        const bookingsData = await BookingService.getUserBookings(user.id, user.email);
        console.log('📋 Raw bookings data:', bookingsData);
        
        const formattedBookings = bookingsData.map(booking => ({
          id: booking.id,
          property_id: booking.property_id,
          property_title: booking.properties?.title || 'Unknown Property',
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          status: booking.status,
          total_amount: booking.total_amount
        }));
        
        console.log('✅ Formatted bookings:', formattedBookings);
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
        // Note: savedProperties are now managed by WishlistContext
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-background dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-background dark:to-gray-800">
      {/* Enhanced Header with Navigation */}
      <header className="border-b border-border/20 bg-white/30 backdrop-blur-xl glass-card-light sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="hover:bg-white/20 transition-all duration-300"
              >
                <Link to="/" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                Picnify
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" asChild className="hover:bg-white/20 transition-all duration-300">
                <Link to="/properties">
                  <Search className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Link>
              </Button>
              <div className="flex items-center space-x-3 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                <Avatar className="ring-2 ring-primary/30 h-8 w-8">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-primary/20 to-blue-600/20 text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">{user?.full_name || 'Guest User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="hover-lift glass-card bg-red-50/50 border-red-200/50 hover:bg-red-100/50 text-red-700 hover:text-red-800 transition-all duration-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Welcome Section */}
        <div className="mb-8 text-center relative">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl animate-pulse"></div>
          <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 bg-gradient-to-r from-pink-400/20 to-red-500/20 rounded-full blur-xl animate-bounce animation-delay-1000"></div>
          
          <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-white/30 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-600 to-purple-600"></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-ping"></div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="h-20 w-20 bg-gradient-to-r from-primary via-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            <h2 className="text-6xl font-black mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Welcome back,<br />
              <span className="text-4xl">{user?.full_name?.split(' ')[0] || 'Traveler'}! 👋</span>
            </h2>
            
            <div className="max-w-4xl mx-auto mb-8">
              <p className="text-2xl text-gray-700 leading-relaxed font-medium mb-4">
                Your personalized travel hub is ready.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Manage bookings, discover new destinations, and plan your next adventure with our advanced dashboard.
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-8 mt-8">
              <div className="flex items-center space-x-3 bg-green-50 px-6 py-3 rounded-full border border-green-200 shadow-sm">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-semibold">Account Active</span>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-3 rounded-full border border-yellow-200 shadow-sm">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-700 font-semibold">Premium Member</span>
              </div>
              <div className="flex items-center space-x-3 bg-blue-50 px-6 py-3 rounded-full border border-blue-200 shadow-sm">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card-light hover-lift border-0 shadow-elevated group relative overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-primary/5 rounded-full blur-xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-foreground/80">Total Bookings</CardTitle>
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500/20 to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-black text-foreground mb-2 bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">{bookings.length}</div>
              <p className="text-sm text-muted-foreground mb-3">
                {bookings.filter(b => b.status === 'confirmed').length} confirmed
              </p>
              <div className="flex items-center bg-green-50 px-3 py-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-xs text-green-600 font-semibold">+12% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-light hover-lift border-0 shadow-elevated group relative overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/5 to-red-500/5 rounded-full blur-xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-foreground/80">Saved Properties</CardTitle>
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Heart className="h-7 w-7 text-pink-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-black text-foreground mb-2 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">{savedCount}</div>
              <p className="text-sm text-muted-foreground mb-3">
                Ready to book
              </p>
              <div className="flex items-center bg-blue-50 px-3 py-2 rounded-full">
                <Plus className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-xs text-blue-600 font-semibold">Add more</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-light hover-lift border-0 shadow-elevated group relative overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-full blur-xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-foreground/80">Next Trip</CardTitle>
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MapPin className="h-7 w-7 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-black text-foreground mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {bookings.find(b => new Date(b.check_in_date) > new Date()) ? 'Soon' : 'None'}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Upcoming bookings
              </p>
              <div className="flex items-center bg-orange-50 px-3 py-2 rounded-full">
                <Calendar className="h-4 w-4 text-orange-500 mr-2" />
                <span className="text-xs text-orange-600 font-semibold">Plan ahead</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-light hover-lift border-0 shadow-elevated group relative overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-full blur-xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-foreground/80">Member Level</CardTitle>
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Award className="h-7 w-7 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-black text-foreground mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Gold</div>
              <p className="text-sm text-muted-foreground mb-3">
                Premium member
              </p>
              <div className="flex items-center bg-yellow-50 px-3 py-2 rounded-full">
                <Star className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-xs text-yellow-600 font-semibold">5.0 rating</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Dashboard Content */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 glass-card-light h-14 p-1 rounded-xl border border-white/20">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-white/50 data-[state=active]:shadow-lg data-[state=active]:text-primary font-medium transition-all duration-300 rounded-lg">
              <Calendar className="h-4 w-4 mr-2" />
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white/50 data-[state=active]:shadow-lg data-[state=active]:text-primary font-medium transition-all duration-300 rounded-lg">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-white/50 data-[state=active]:shadow-lg data-[state=active]:text-primary font-medium transition-all duration-300 rounded-lg">
              <Heart className="h-4 w-4 mr-2" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white/50 data-[state=active]:shadow-lg data-[state=active]:text-primary font-medium transition-all duration-300 rounded-lg">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/50 data-[state=active]:shadow-lg data-[state=active]:text-primary font-medium transition-all duration-300 rounded-lg">
              <Settings2 className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card className="glass-card border-0 shadow-elevated">
              <CardHeader>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">My Bookings</CardTitle>
                <CardDescription className="text-muted-foreground/80">
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
                        className="flex items-center justify-between p-6 glass-card-light rounded-xl hover-lift transition-all duration-300 border-0 shadow-elevated"
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
                            <Link to={`/booking/${booking.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <ReviewYourStay />
          </TabsContent>

          {/* Saved Properties Tab */}
          <TabsContent value="saved" className="space-y-4">
            <Card className="glass-card border-0 shadow-elevated">
              <CardHeader>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Saved Properties</CardTitle>
                <CardDescription className="text-muted-foreground/80">
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
                      <Card key={property.id} className="glass-card-property hover-lift border-0 shadow-elevated">
                        <div className="aspect-video bg-muted rounded-t-lg relative">
                          {property.images?.[0] && (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                          )}
                          <button 
                            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                            onClick={() => removeFromWishlist(property.id)}
                            title="Remove from saved properties"
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </button>
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1">{property.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{property.address}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">₹{(property.pricing as any)?.daily_rate || 'N/A'}/night</span>
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
            <Card className="glass-card border-0 shadow-elevated">
              <CardHeader>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Profile Information</CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-lg">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="text-xl bg-gradient-to-r from-primary/20 to-blue-600/20">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.full_name || 'User'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2" title="Edit your profile information">
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
            <Card className="glass-card border-0 shadow-elevated">
              <CardHeader>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Account Settings</CardTitle>
                <CardDescription className="text-muted-foreground/80">
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

        {/* Enhanced Quick Actions */}
        <div className="mt-8">
          <Card className="glass-card border-0 shadow-elevated relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5"></div>
            <CardHeader className="relative">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                Quick Actions
              </CardTitle>
              <p className="text-muted-foreground mt-2">Jump to your most used features</p>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button asChild className="h-auto p-6 flex-col glass-card hover-lift bg-gradient-to-r from-primary to-blue-600 border-0 shadow-lg group relative overflow-hidden">
                  <Link to="/properties">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Home className="h-8 w-8 mb-2 relative z-10" />
                    <span className="font-medium relative z-10">Browse Properties</span>
                    <span className="text-xs opacity-80 mt-1 relative z-10">Discover amazing stays</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-6 flex-col glass-card-light hover-lift border-0 shadow-elevated group relative overflow-hidden">
                  <Link to="/help-center">
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <User className="h-8 w-8 mb-2 text-blue-600 relative z-10" />
                    <span className="font-medium relative z-10">Get Help</span>
                    <span className="text-xs opacity-80 mt-1 relative z-10">AI-powered support</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-6 flex-col glass-card-light hover-lift border-0 shadow-elevated group relative overflow-hidden">
                  <Link to="/contact">
                    <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Bell className="h-8 w-8 mb-2 text-green-600 relative z-10" />
                    <span className="font-medium relative z-10">Contact Support</span>
                    <span className="text-xs opacity-80 mt-1 relative z-10">24/7 assistance</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto p-6 flex-col glass-card-light hover-lift border-0 shadow-elevated group relative overflow-hidden">
                  <Link to="/">
                    <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Shield className="h-8 w-8 mb-2 text-purple-600 relative z-10" />
                    <span className="font-medium relative z-10">Home</span>
                    <span className="text-xs opacity-80 mt-1 relative z-10">Back to main site</span>
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