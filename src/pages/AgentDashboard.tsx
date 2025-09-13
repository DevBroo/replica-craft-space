import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Home, 
  User, 
  DollarSign, 
  TrendingUp, 
  Bell, 
  LogOut, 
  MapPin, 
  Star, 
  Edit, 
  Save, 
  X, 
  MessageCircle,
  BarChart3,
  Users,
  Building2,
  CreditCard,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AgentBookingModificationModal from '@/components/agent/AgentBookingModificationModal';
import AgentBookingCancellationModal from '@/components/agent/AgentBookingCancellationModal';

interface AgentCommission {
  id: string;
  booking_id: string;
  commission_rate: number;
  booking_amount: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date?: string;
  created_at: string;
  bookings?: {
    id: string;
    property_id: string;
    check_in_date: string;
    check_out_date: string;
    guests: number;
    total_amount: number;
    status: string;
    properties?: {
      title: string;
      address: string;
    };
  };
}

interface AgentStats {
  total_commission: number;
  pending_commission: number;
  approved_commission: number;
  paid_commission: number;
  total_bookings: number;
  current_rate: number;
}

interface AgentBooking {
  id: string;
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  status: string;
  payment_status?: string;
  created_at: string;
  properties?: {
    title: string;
    address: string;
    max_guests?: number;
    pricing?: any;
  };
}

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    total_commission: 0,
    pending_commission: 0,
    approved_commission: 0,
    paid_commission: 0,
    total_bookings: 0,
    current_rate: 5.00
  });
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    location: '',
    about: ''
  });
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AgentBooking | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/agent/login');
      return;
    }
    
    if (user.role !== 'agent') {
      navigate('/');
      return;
    }
    
    fetchAgentData();
  }, [user, navigate]);

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        location: user.location || '',
        about: user.about || ''
      });
    }
  }, [user]);

  const fetchStatsManually = async () => {
    try {
      // Get commission data directly
      const { data: commissionData, error: commissionError } = await supabase
        .from('agent_commissions')
        .select('commission_amount, status')
        .eq('agent_id', user?.id);

      if (commissionError) {
        console.error('Error fetching commission data:', commissionError);
        return;
      }

      // Get booking count
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('agent_id', user?.id);

      if (bookingError) {
        console.error('Error fetching booking data:', bookingError);
        return;
      }

      // Get current commission rate from agent_commission_settings
      const { data: rateData, error: rateError } = await supabase
        .from('agent_commission_settings')
        .select('commission_rate')
        .eq('agent_id', user?.id)
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1);

      // Calculate stats
      const totalCommission = commissionData?.reduce((sum, comm) => sum + (comm.commission_amount || 0), 0) || 0;
      const paidCommission = commissionData?.filter(comm => comm.status === 'paid').reduce((sum, comm) => sum + (comm.commission_amount || 0), 0) || 0;
      const totalBookings = bookingData?.length || 0;
      const currentRate = rateData?.[0]?.commission_rate || 5.00;

      console.log('Manual stats calculation:', {
        totalCommission,
        paidCommission,
        totalBookings,
        currentRate,
        commissionData: commissionData?.length || 0
      });

      setStats({
        total_commission: totalCommission,
        pending_commission: 0, // We removed pending card
        approved_commission: totalCommission - paidCommission,
        paid_commission: paidCommission,
        total_bookings: totalBookings,
        current_rate: currentRate
      });
    } catch (error) {
      console.error('Error in fetchStatsManually:', error);
    }
  };

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      
      // Fetch agent stats using the database function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_agent_commission_summary', { p_agent_id: user?.id });

      if (statsError) {
        console.error('Error fetching stats:', statsError);
        // Try to fetch data manually if RPC fails
        await fetchStatsManually();
      } else if (statsData && statsData.length > 0) {
        console.log('RPC stats data:', statsData[0]);
        setStats(statsData[0]);
      } else {
        console.log('No RPC data returned, fetching manually...');
        // Try to fetch data manually if no data returned
        await fetchStatsManually();
      }

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('agent_commissions')
        .select(`
          *,
          bookings (
            id,
            property_id,
            check_in_date,
            check_out_date,
            guests,
            total_amount,
            status,
            properties (
              title,
              address
            )
          )
        `)
        .eq('agent_id', user?.id)
        .order('created_at', { ascending: false });

      if (commissionsError) {
        console.error('Error fetching commissions:', commissionsError);
      } else {
        setCommissions(commissionsData || []);
      }

      // Fetch bookings made by this agent
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            address,
            max_guests,
            pricing
          )
        `)
        .eq('agent_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else {
        setBookings(bookingsData || []);
      }

    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/agent/login');
  };

  const handleEditProfile = async () => {
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          location: profileForm.location,
          about: profileForm.about,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
        variant: "default",
      });

      setShowEditProfile(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommissionStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommissionStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleModifyBooking = (booking: AgentBooking) => {
    setSelectedBooking(booking);
    setModifyModalOpen(true);
  };

  const handleCancelBooking = (booking: AgentBooking) => {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };

  const handleBookingUpdate = () => {
    fetchAgentData(); // Refresh data after modification/cancellation
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setShowEditProfile(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>
                    {user?.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.full_name}!
                  </h2>
                  <p className="text-gray-600">
                    {user?.location && (
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {user.location}
                      </span>
                    )}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Commission Rate: {stats.current_rate}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{stats.total_commission.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.total_bookings}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Out</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{stats.paid_commission.toFixed(2)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 glass-card-light h-12 p-1 gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/40 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-white/40 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
              Commissions
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-white/40 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white/40 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* How to Create Bookings Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Home className="h-5 w-5 mr-2" />
                  How to Create Bookings
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Create bookings for customers and earn commission automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Use the Main Website</p>
                      <p className="text-sm text-blue-600">Go to the main Picnify website and browse properties like a regular customer</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Book for Your Customer</p>
                      <p className="text-sm text-blue-600">Select properties and complete the booking process with your customer's details</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Earn Commission Automatically</p>
                      <p className="text-sm text-blue-600">Once the booking is confirmed, you'll automatically earn commission at your current rate</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <Button 
                    onClick={() => window.open('/', '_blank')} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Main Website
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Commissions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Recent Commissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {commissions.slice(0, 5).map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {commission.bookings?.properties?.title || 'Property'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {commission.commission_rate}% of ₹{commission.booking_amount}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ₹{commission.commission_amount.toFixed(2)}
                          </p>
                          <Badge className={getCommissionStatusColor(commission.status)}>
                            {getCommissionStatusIcon(commission.status)}
                            <span className="ml-1 capitalize">{commission.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {commissions.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No commissions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {booking.properties?.title || 'Property'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ₹{booking.total_amount.toFixed(2)}
                          </p>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No bookings yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>
                  Track all your commission earnings and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissions.map((commission) => (
                    <div key={commission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {commission.bookings?.properties?.title || 'Property'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Booking ID: {commission.booking_id}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(commission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ₹{commission.commission_amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {commission.commission_rate}% of ₹{commission.booking_amount}
                          </p>
                          <Badge className={getCommissionStatusColor(commission.status)}>
                            {getCommissionStatusIcon(commission.status)}
                            <span className="ml-1 capitalize">{commission.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {commissions.length === 0 && (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No commissions yet</p>
                      <p className="text-sm text-gray-400">Start making bookings to earn commissions!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>
                  All bookings you've facilitated for customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {booking.properties?.title || 'Property'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {booking.properties?.address}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.guests} guests
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ₹{booking.total_amount.toFixed(2)}
                          </p>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            Commission: ₹{((booking.total_amount * stats.current_rate) / 100).toFixed(2)}
                          </p>
                          {/* Action buttons for confirmed bookings */}
                          {booking.status === 'confirmed' && (
                            <div className="flex space-x-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleModifyBooking(booking)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Modify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelBooking(booking)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No bookings yet</p>
                      <p className="text-sm text-gray-400">Start helping customers find properties!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your agent profile and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm text-gray-600">{user?.full_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm text-gray-600">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm text-gray-600">{user?.location || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Commission Rate</Label>
                    <p className="text-sm text-gray-600">{stats.current_rate}%</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={user?.is_active ? "default" : "secondary"}>
                      {user?.is_active ? 'Active' : 'Pending Approval'}
                    </Badge>
                  </div>
                </div>
                {user?.about && (
                  <div>
                    <Label>About</Label>
                    <p className="text-sm text-gray-600 mt-1">{user.about}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileForm.location}
                onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                value={profileForm.about}
                onChange={(e) => setProfileForm(prev => ({ ...prev, about: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditProfile(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditProfile} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Booking Modification Modal */}
      {selectedBooking && (
        <AgentBookingModificationModal
          open={modifyModalOpen}
          onOpenChange={setModifyModalOpen}
          booking={selectedBooking}
          onUpdate={handleBookingUpdate}
        />
      )}

      {/* Agent Booking Cancellation Modal */}
      {selectedBooking && (
        <AgentBookingCancellationModal
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          booking={selectedBooking}
          onUpdate={handleBookingUpdate}
        />
      )}
    </div>
  );
}
