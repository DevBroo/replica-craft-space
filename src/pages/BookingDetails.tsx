import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { shareUtils } from '@/lib/shareUtils';
import { ShareDropdown } from '@/components/ui/ShareDropdown';

interface BookingData {
  id: string;
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  status: string;
  payment_status: string;
  user_id: string;
  agent_id?: string;
  customer_email?: string;
  properties?: {
    title: string;
    address: string;
    description?: string;
    pricing?: any;
    images?: string[];
    amenities?: string[];
  };
}

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModification, setSelectedModification] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBookingDetails(id);
    }
  }, [id]);

  const handleModificationSelect = (type: string) => {
    console.log('🔘 Modification type selected:', type);
    try {
      setSelectedModification(type);
      toast({
        title: "Selection Updated",
        description: `Selected: ${type.charAt(0).toUpperCase() + type.slice(1)} modification`,
        variant: "default",
      });
    } catch (error) {
      console.error('❌ Error in handleModificationSelect:', error);
    }
  };

  const handleModifyContinue = () => {
    console.log('🚀 Continue button clicked with selection:', selectedModification);
    
    try {
      if (!selectedModification) {
        console.warn('⚠️ No modification type selected');
        toast({
          title: "Please Select an Option",
          description: "Please select what you would like to change.",
          variant: "destructive",
        });
        return;
      }

      // Close the modal and navigate to appropriate modification page
      setShowModifyModal(false);
      
      switch (selectedModification) {
        case 'dates':
          console.log('📅 Processing date modification');
          toast({
            title: "Date Modification",
            description: "Date modification feature is coming soon. Please contact support for assistance.",
          });
          break;
        case 'guests':
          console.log('👥 Processing guest modification');
          toast({
            title: "Guest Modification", 
            description: "Guest modification feature is coming soon. Please contact support for assistance.",
          });
          break;
        case 'room':
          console.log('🛏️ Processing room modification');
          toast({
            title: "Room Type Modification",
            description: "Room type modification feature is coming soon. Please contact support for assistance.",
          });
          break;
        default:
          console.warn('⚠️ Unknown modification type:', selectedModification);
          break;
      }
      
      // Reset selection
      setSelectedModification(null);
    } catch (error) {
      console.error('❌ Error in handleModifyContinue:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching booking details for ID:', bookingId);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            address,
            description,
            pricing,
            images,
            amenities
          )
        `)
        .eq('id', bookingId)
        .single();

      console.log('📊 Booking query result:', { data, error });

      if (error) {
        console.error('❌ Error fetching booking details:', error);
        
        // If booking not found, let's check what bookings exist
        if (error.code === 'PGRST116') {
          console.log('🔍 Booking not found, checking available bookings...');
          
          const { data: allBookings, error: listError } = await supabase
            .from('bookings')
            .select('id, created_at, properties(title)')
            .limit(5);
          
          if (!listError && allBookings && allBookings.length > 0) {
            console.log('📋 Available bookings:', allBookings);
            toast({
              title: "Booking Not Found",
              description: `Booking ${bookingId} doesn't exist. Found ${allBookings.length} other bookings in the database.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Booking Not Found",
              description: "This booking doesn't exist and no other bookings were found in the database.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Error",
            description: `Failed to load booking details: ${error.message}`,
            variant: "destructive",
          });
        }
        return;
      }

      if (!data) {
        console.warn('⚠️ No booking data returned');
        toast({
          title: "Error",
          description: "No booking found with this ID.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Booking data loaded successfully:', data);
      setBooking(data);
    } catch (error) {
      console.error('❌ Exception in fetchBookingDetails:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 mb-8">The booking you're looking for doesn't exist or has been removed.</p>
          <Link to="/dashboard" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/login" className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer">
              <i className="fas fa-arrow-left mr-2"></i>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Booking Details</h1>
            <ShareDropdown
              booking={booking}
              variant="ghost"
              size="default"
              className="text-gray-600 hover:text-gray-900"
              onShareSuccess={() => {
                toast({
                  title: "Booking shared successfully!",
                  description: shareUtils.isWebShareSupported() 
                    ? "Booking details shared via your device's share menu" 
                    : "Booking details copied to clipboard",
                });
              }}
              onCopySuccess={() => {
                toast({
                  title: "Link copied!",
                  description: "Booking link copied to clipboard",
                });
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-24 md:pb-20">
        {/* Property Banner */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={booking.properties?.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1440&h=256&fit=crop&crop=center"}
            alt={booking.properties?.title || 'Property'}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          {/* Property Information Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{booking.properties?.title || 'Property'}</h2>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400 mr-2">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                    <span className="text-sm text-gray-600">5.0 (2,847 reviews)</span>
                  </div>
                  <p className="text-gray-600 flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
                    {booking.properties?.address || 'Address not available'}
                  </p>
                </div>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap">
                  <i className="fas fa-hotel mr-2"></i>
                  View Property
                </button>
              </div>
            </div>
          </div>

          {/* Booking Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    <i className={`fas ${
                      booking.status === 'confirmed' ? 'fa-check-circle' :
                      booking.status === 'pending' ? 'fa-clock' :
                      booking.status === 'cancelled' ? 'fa-times-circle' :
                      'fa-info-circle'
                    } mr-2`}></i>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">Booking Reference: <span className="font-semibold text-gray-900">#{booking.id.slice(-8).toUpperCase()}</span></p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                    <i className="fas fa-qrcode text-2xl text-gray-400"></i>
                  </div>
                  <p className="text-xs text-gray-500">QR Check-in</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Stay Details</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-calendar-check text-green-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-semibold text-gray-900">{formatDate(booking.check_in_date)}</p>
                      <p className="text-sm text-gray-600">After 3:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-calendar-times text-red-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-semibold text-gray-900">{formatDate(booking.check_out_date)}</p>
                      <p className="text-sm text-gray-600">Before 11:00 AM</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-clock text-blue-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{calculateNights(booking.check_in_date, booking.check_out_date)} nights</p>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-users text-purple-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p className="font-semibold text-gray-900">{booking.guests} guests</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center">
                  <img
                    src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=80&h=80&fit=crop&crop=center"
                    alt="Deluxe Suite"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">Deluxe Suite</h4>
                    <p className="text-sm text-gray-600">King Bed • City View • 45 sqm</p>
                    <p className="text-sm text-gray-500">Non-smoking room</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Price Breakdown</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room rate ({calculateNights(booking.check_in_date, booking.check_out_date)} nights)</span>
                  <span className="text-gray-900">₹{(booking.total_amount * 0.85).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="text-gray-900">₹{(booking.total_amount * 0.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service charge</span>
                  <span className="text-gray-900">₹{(booking.total_amount * 0.03).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">₹{booking.total_amount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <i className={`fas ${booking.payment_status === 'completed' ? 'fa-check-circle text-green-500' : 'fa-clock text-yellow-500'} mr-2`}></i>
                  <span className={`text-sm font-medium ${booking.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    Payment {booking.payment_status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Room Amenities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Room Amenities</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <i className="fas fa-wifi text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Free WiFi</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-snowflake text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Air Conditioning</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-tv text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Smart TV</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-coffee text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Coffee Machine</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-bath text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Private Bathroom</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-concierge-bell text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Room Service</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-dumbbell text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Fitness Center</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-swimming-pool text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Swimming Pool</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-spa text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Spa Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Policies</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Check-in/Check-out Policy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check-in: 3:00 PM - 12:00 AM</li>
                  <li>• Check-out: 6:00 AM - 11:00 AM</li>
                  <li>• Early check-in and late check-out available upon request</li>
                  <li>• Valid photo ID required at check-in</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Free cancellation until 48 hours before check-in</li>
                  <li>• Cancellations within 48 hours: 50% charge</li>
                  <li>• No-show: Full charge</li>
                  <li>• Refunds processed within 5-7 business days</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">House Rules</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No smoking in rooms (designated areas available)</li>
                  <li>• Pets not allowed</li>
                  <li>• Quiet hours: 10:00 PM - 7:00 AM</li>
                  <li>• Maximum occupancy: 2 guests per room</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-phone text-green-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Hotel Reception</p>
                    <p className="text-sm text-gray-600">+1 (212) 555-0123</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-envelope text-blue-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email Support</p>
                    <p className="text-sm text-gray-600">reservations@grandpalacehotel.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Emergency Contact</p>
                    <p className="text-sm text-gray-600">+1 (212) 555-0199 (24/7)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔘 Modify Booking button clicked');
              try {
                setShowModifyModal(true);
                toast({
                  title: "Opening Modify Booking",
                  description: "Select what you'd like to change",
                });
              } catch (error) {
                console.error('❌ Error opening modify modal:', error);
                toast({
                  title: "Error",
                  description: "Could not open modify booking. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            className="flex-1 bg-white border-2 border-blue-500 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <i className="fas fa-edit mr-2"></i>
            Modify Booking
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔘 Cancel Booking button clicked');
              try {
                setShowCancelModal(true);
                toast({
                  title: "Opening Cancel Booking",
                  description: "Review cancellation details",
                });
              } catch (error) {
                console.error('❌ Error opening cancel modal:', error);
                toast({
                  title: "Error",
                  description: "Could not open cancel booking. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <i className="fas fa-times mr-2"></i>
            Cancel Booking
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="text-center mb-6">
              <i className="fas fa-edit text-4xl text-blue-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Modify Booking</h3>
              <p className="text-sm text-gray-600">What would you like to change?</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Date modification selected');
                  handleModificationSelect('dates');
                }}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedModification === 'dates' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <i className="fas fa-calendar mr-3 text-blue-500"></i>
                <span className="font-medium">Change Dates</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Guest modification selected');
                  handleModificationSelect('guests');
                }}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedModification === 'guests' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <i className="fas fa-users mr-3 text-blue-500"></i>
                <span className="font-medium">Change Guests</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Room modification selected');
                  handleModificationSelect('room');
                }}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedModification === 'room' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <i className="fas fa-bed mr-3 text-blue-500"></i>
                <span className="font-medium">Change Room Type</span>
              </button>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Cancel button clicked in modify modal');
                  try {
                    setShowModifyModal(false);
                    setSelectedModification(null);
                    toast({
                      title: "Cancelled",
                      description: "Booking modification cancelled",
                    });
                  } catch (error) {
                    console.error('❌ Error cancelling modification:', error);
                  }
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400"
                style={{ pointerEvents: 'auto' }}
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Continue button clicked in modify modal');
                  handleModifyContinue();
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ pointerEvents: 'auto' }}
                disabled={!selectedModification}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="text-center mb-6">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Booking</h3>
              <p className="text-sm text-gray-600">Are you sure you want to cancel this booking?</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                <i className="fas fa-info-circle mr-2"></i>
                Cancellation within 48 hours will incur a 50% charge (₹244.50)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Keep Booking button clicked');
                  try {
                    setShowCancelModal(false);
                    toast({
                      title: "Booking Kept",
                      description: "Your booking remains active",
                    });
                  } catch (error) {
                    console.error('❌ Error keeping booking:', error);
                  }
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400"
                style={{ pointerEvents: 'auto' }}
              >
                Keep Booking
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Yes, Cancel button clicked');
                  try {
                    // Here you would implement actual cancellation logic
                    toast({
                      title: "Booking Cancelled",
                      description: "Your booking has been cancelled. Refund processing may take 3-5 business days.",
                      variant: "destructive",
                    });
                    setShowCancelModal(false);
                    // Optionally redirect to bookings list or dashboard
                  } catch (error) {
                    console.error('❌ Error cancelling booking:', error);
                    toast({
                      title: "Error",
                      description: "Could not cancel booking. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ pointerEvents: 'auto' }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;