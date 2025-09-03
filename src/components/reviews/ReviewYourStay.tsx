import React, { useState, useEffect } from 'react';
import { Star, Calendar, Users, MapPin, Image, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewService } from '@/lib/reviewService';
import { ReviewModal } from './ReviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EligibleBooking {
  id: string;
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
  guests: number;
  properties: {
    title: string;
    images: string[];
    property_type: string;
    address: string;
  };
}

export const ReviewYourStay: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<EligibleBooking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadEligibleBookings();
    }
  }, [user?.id]);

  const loadEligibleBookings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const bookings = await ReviewService.getEligibleBookingsForReview(user.id);
      setEligibleBookings(bookings);
    } catch (error) {
      console.error('Error loading eligible bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings eligible for review.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (booking: EligibleBooking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh the list to remove the reviewed booking
    loadEligibleBookings();
    toast({
      title: "Thank you!",
      description: "Your review has been submitted and will help other guests.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const checkoutDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - checkoutDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Review Your Stays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (eligibleBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Review Your Stays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stays to review</h3>
            <p className="text-gray-600">
              Complete a stay to share your experience and help other guests.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Review Your Stays
          </CardTitle>
          <p className="text-sm text-gray-600">
            Share your experience to help other guests make informed decisions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eligibleBookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Property Image */}
                  <div className="flex-shrink-0">
                    {booking.properties.images && booking.properties.images.length > 0 ? (
                      <img
                        src={booking.properties.images[0]}
                        alt={booking.properties.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {booking.properties.title}
                        </h3>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{booking.properties.address}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Completed
                            </span>
                            <span className="text-xs text-gray-500">
                              • {getDaysAgo(booking.check_out_date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Review Button */}
                      <Button
                        onClick={() => handleReviewClick(booking)}
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Write Review
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
};


