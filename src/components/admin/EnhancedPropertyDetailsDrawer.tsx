
import React, { useState, useEffect } from 'react';
import { X, Save, History, Calendar, ToggleLeft, ToggleRight, Video, Users, MapPin, DollarSign, Clock, Star, User, Shield, Activity, FileText, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PropertyAvailabilityCalendar from './PropertyAvailabilityCalendar';

interface PropertyWithDetails {
  id: string;
  title: string;
  description: string;
  address: string;
  property_type: string;
  status: string;
  amenities: string[];
  images: string[];
  pricing: any;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  menu_available?: boolean;
  admin_blocked?: boolean;
  host_details?: any;
  video_url?: string;
  banquet_hall_capacity?: number;
  ground_lawn_capacity?: number;
  owner?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface StatusHistoryEntry {
  id: string;
  from_status: string;
  to_status: string;
  reason: string;
  comment: string;
  actor_role: string;
  created_at: string;
}

interface EnhancedPropertyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string | null;
  onPropertyUpdate: () => void;
}

const EnhancedPropertyDetailsDrawer: React.FC<EnhancedPropertyDetailsDrawerProps> = ({
  isOpen,
  onClose,
  propertyId,
  onPropertyUpdate,
}) => {
  const [property, setProperty] = useState<PropertyWithDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [bookingSummary, setBookingSummary] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'availability'>('details');

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
      fetchStatusHistory();
      fetchOwnerProfile();
      fetchBookingSummary();
      fetchReviews();
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`*`)
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      if (data) {
        // Cast to any to handle new columns that may not be in types yet
        const propertyData = data as any;
        
        setProperty({
          ...propertyData,
          menu_available: propertyData.menu_available || false,
          admin_blocked: propertyData.admin_blocked || false,
          host_details: propertyData.host_details || {},
          video_url: propertyData.video_url || undefined,
          banquet_hall_capacity: propertyData.banquet_hall_capacity || undefined,
          ground_lawn_capacity: propertyData.ground_lawn_capacity || undefined,
        });

        // Fetch owner details
        const { data: owner } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', propertyData.owner_id)
          .single();

        if (owner) {
          setProperty(prev => prev ? { ...prev, owner } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerProfile = async () => {
    if (!propertyId) return;

    try {
      const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', propertyId)
        .single();

      if (property?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('owner_profiles')
          .select('*')
          .eq('user_id', property.owner_id)
          .single();

        setOwnerProfile(ownerProfile);
      }
    } catch (error) {
      console.log('Owner profile not available:', error);
      setOwnerProfile(null);
    }
  };

  const fetchBookingSummary = async () => {
    if (!propertyId) return;

    try {
      const { data, error } = await supabase
        .from('booking_summary_for_owners')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setBookingSummary(data);
      } else {
        setBookingSummary([]);
      }
    } catch (error) {
      console.log('Booking summary not available:', error);
      setBookingSummary([]);
    }
  };

  const fetchReviews = async () => {
    if (!propertyId) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_user_id_fkey(full_name)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setReviews(data);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.log('Reviews not available:', error);
      setReviews([]);
    }
  };

  const fetchStatusHistory = async () => {
    if (!propertyId) return;

    try {
      // Try to fetch status history, gracefully handle if table doesn't exist
      const { data, error } = await supabase
        .from('property_status_history' as any)
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Status history table not available:', error);
        setStatusHistory([]);
      } else if (data && Array.isArray(data)) {
        // Type cast to handle the new table structure
        const historyData = data.map((item: any) => ({
          id: item.id || '',
          from_status: item.from_status || '',
          to_status: item.to_status || '',
          reason: item.reason || '',
          comment: item.comment || '',
          actor_role: item.actor_role || '',
          created_at: item.created_at || '',
        })) as StatusHistoryEntry[];
        
        setStatusHistory(historyData);
      } else {
        setStatusHistory([]);
      }
    } catch (error) {
      console.log('Status history table not available:', error);
      setStatusHistory([]);
    }
  };

  const handleToggleMenuAvailable = async () => {
    if (!property) return;

    try {
      // Check if the column exists by testing with a small update first
      const { error } = await supabase
        .from('properties')
        .update({ menu_available: !property.menu_available } as any)
        .eq('id', property.id);

      if (error) {
        console.error('Error updating menu status:', error);
        toast.error('Menu toggle not available - column may not exist');
        return;
      }

      setProperty({ ...property, menu_available: !property.menu_available });
      toast.success(`Menu ${!property.menu_available ? 'enabled' : 'disabled'} for this property`);
      onPropertyUpdate();
    } catch (error) {
      console.error('Error updating menu status:', error);
      toast.error('Failed to update menu status');
    }
  };

  const handleToggleAdminBlocked = async () => {
    if (!property) return;

    try {
      // Check if the column exists by testing with a small update first
      const { error } = await supabase
        .from('properties')
        .update({ admin_blocked: !property.admin_blocked } as any)
        .eq('id', property.id);

      if (error) {
        console.error('Error updating admin block status:', error);
        toast.error('Admin block toggle not available - column may not exist');
        return;
      }

      setProperty({ ...property, admin_blocked: !property.admin_blocked });
      toast.success(`Property ${!property.admin_blocked ? 'blocked' : 'unblocked'} by admin`);
      onPropertyUpdate();
    } catch (error) {
      console.error('Error updating admin block status:', error);
      toast.error('Failed to update admin block status');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : property ? (
          <div className="flex flex-col h-full max-h-[calc(90vh-80px)]">
            {/* Tab Navigation */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <History className="w-4 h-4 mr-1" />
                History ({statusHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'availability'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Availability
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <p className="text-gray-900">{property.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Property Type</label>
                          <p className="text-gray-900">{property.property_type}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            property.status === 'approved' ? 'bg-green-100 text-green-800' :
                            property.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            Address
                          </label>
                          <p className="text-gray-900">{property.address}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Capacity & Features
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Guests</label>
                          <p className="text-gray-900">{property.max_guests}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                          <p className="text-gray-900">{property.bedrooms}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                          <p className="text-gray-900">{property.bathrooms}</p>
                        </div>
                        {property.banquet_hall_capacity && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="text-sm">Banquet Hall: {property.banquet_hall_capacity}</span>
                          </div>
                        )}
                        {property.ground_lawn_capacity && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="text-sm">Ground/Lawn: {property.ground_lawn_capacity}</span>
                          </div>
                        )}
                        {property.video_url && (
                          <div className="flex items-center">
                            <Video className="w-4 h-4 mr-2" />
                            <a href={property.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                              View Property Video
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Check-in Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Pricing Details
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {property.pricing && typeof property.pricing === 'object' ? (
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Daily Rate: </span>
                              <span className="text-gray-900">
                                {property.pricing.currency || 'INR'} {property.pricing.daily_rate || 0}
                              </span>
                            </div>
                            {property.pricing.weekend_rate && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Weekend Rate: </span>
                                <span className="text-gray-900">
                                  {property.pricing.currency || 'INR'} {property.pricing.weekend_rate}
                                </span>
                              </div>
                            )}
                            {property.pricing.cleaning_fee && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Cleaning Fee: </span>
                                <span className="text-gray-900">
                                  {property.pricing.currency || 'INR'} {property.pricing.cleaning_fee}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Pricing information not available</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Check-in/Check-out
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Check-in Time: </span>
                            <span className="text-gray-900">{(property as any).check_in_time || '15:00'}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Check-out Time: </span>
                            <span className="text-gray-900">{(property as any).check_out_time || '11:00'}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Minimum Stay: </span>
                            <span className="text-gray-900">{(property as any).minimum_stay || 1} night(s)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Host/Caretaker Details */}
                  {property.host_details && Object.keys(property.host_details).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Host/Caretaker Details
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {property.host_details.name && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Host Name</label>
                              <p className="text-gray-900">{property.host_details.name}</p>
                            </div>
                          )}
                          {property.host_details.phone && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                              <p className="text-gray-900">{property.host_details.phone}</p>
                            </div>
                          )}
                          {property.host_details.languages && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Languages</label>
                              <p className="text-gray-900">{property.host_details.languages}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activities & Facilities */}
                  {((property as any).extra_services || (property as any).nearby_attractions) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Activities & Attractions
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {(property as any).extra_services && (property as any).extra_services.activities && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Activities:</h4>
                            <div className="flex flex-wrap gap-2">
                              {(property as any).extra_services.activities.map((activity: string, index: number) => (
                                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                                  {activity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(property as any).nearby_attractions && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Nearby Attractions:</h4>
                            <div className="space-y-1">
                              {(property as any).nearby_attractions.landmarks && (property as any).nearby_attractions.landmarks.map((landmark: string, index: number) => (
                                <div key={index} className="flex items-center text-sm text-gray-600">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {landmark}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Property & Cancellation Policies */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Property Policies
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {(property as any).house_rules && Object.keys((property as any).house_rules).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries((property as any).house_rules).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}: </span>
                                <span className="text-gray-900 text-sm">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No specific policies defined</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Cancellation Policy
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Policy Type: </span>
                            <span className="text-gray-900 capitalize">{(property as any).cancellation_policy || 'Moderate'}</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {(property as any).cancellation_policy === 'flexible' && 'Full refund 1 day prior to arrival'}
                            {(property as any).cancellation_policy === 'moderate' && 'Full refund 5 days prior to arrival'}
                            {(property as any).cancellation_policy === 'strict' && 'Full refund 14 days prior to arrival'}
                            {!(property as any).cancellation_policy && 'Full refund 5 days prior to arrival (default)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Owner Information */}
                  {property.owner && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Owner Information
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="text-gray-900">{property.owner.full_name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-gray-900">{property.owner.email}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-gray-900">{property.owner.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        
                        {/* Owner Profile Details (GST/PAN) */}
                        {ownerProfile && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Business Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {ownerProfile.company_name && (
                                <div>
                                  <label className="block text-xs text-gray-500">Company Name</label>
                                  <p className="text-sm text-gray-900">{ownerProfile.company_name}</p>
                                </div>
                              )}
                              {ownerProfile.gst_number && (
                                <div>
                                  <label className="block text-xs text-gray-500">GST Number</label>
                                  <p className="text-sm text-gray-900">{ownerProfile.gst_number}</p>
                                </div>
                              )}
                              {ownerProfile.pan_number && (
                                <div>
                                  <label className="block text-xs text-gray-500">PAN Number</label>
                                  <p className="text-sm text-gray-900">{ownerProfile.pan_number}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Guest Reviews */}
                  {reviews.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Star className="w-5 h-5 mr-2" />
                        Guest Reviews ({reviews.length})
                      </h3>
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {review.profiles?.full_name || 'Guest'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Bookings Summary */}
                  {bookingSummary.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Recent Bookings ({bookingSummary.length})
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-3">
                          {bookingSummary.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {booking.guest_reference || `Booking ${booking.id?.slice(0, 8)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booking.check_in_date} - {booking.check_out_date} • {booking.guests} guests
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">₹{booking.total_amount}</p>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Controls */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Admin Controls</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Menu Available</label>
                          <p className="text-xs text-gray-500">Allow this property to show menu options</p>
                        </div>
                        <button
                          onClick={handleToggleMenuAvailable}
                          className="flex items-center"
                        >
                          {property.menu_available ? (
                            <ToggleRight className="w-8 h-8 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Admin Blocked</label>
                          <p className="text-xs text-gray-500">Block this property from appearing in searches</p>
                        </div>
                        <button
                          onClick={handleToggleAdminBlocked}
                          className="flex items-center"
                        >
                          {property.admin_blocked ? (
                            <ToggleRight className="w-8 h-8 text-red-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  {property.images && property.images.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Property Images</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {property.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Property ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
                  </div>

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status History</h3>
                  {statusHistory.length > 0 ? (
                    <div className="space-y-4">
                      {statusHistory.map((entry) => (
                        <div key={entry.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {entry.from_status ? `${entry.from_status} → ` : ''}
                                <span className={`${
                                  entry.to_status === 'approved' ? 'text-green-600' :
                                  entry.to_status === 'rejected' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>
                                  {entry.to_status}
                                </span>
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {entry.actor_role}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Reason: </span>
                              <span className="text-sm text-gray-600">{entry.reason}</span>
                            </div>
                          )}
                          {entry.comment && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Comment: </span>
                              <span className="text-sm text-gray-600">{entry.comment}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No status history available</p>
                  )}
                </div>
              )}

              {activeTab === 'availability' && (
                <PropertyAvailabilityCalendar propertyId={propertyId} />
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-gray-500">Property not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPropertyDetailsDrawer;
