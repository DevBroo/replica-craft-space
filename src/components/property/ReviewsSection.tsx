import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReviewService, type GuestReview } from '@/lib/reviewService';

interface ReviewsSectionProps {
  propertyId: string;
  rating?: number;
  reviewCount?: number;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  propertyId,
  rating = 0,
  reviewCount = 0
}) => {
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: rating,
    totalReviews: reviewCount,
    ratingDistribution: [] as { rating: number; count: number; percentage: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [propertyId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        ReviewService.getPropertyReviews(propertyId),
        ReviewService.getPropertyReviewStats(propertyId)
      ]);
      
      setReviews(reviewsData);
      setReviewStats(statsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="flex items-start gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded mb-2"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex-1 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (reviewStats.totalReviews === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600">
            Be the first to share your experience at this property!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall rating */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Rating summary */}
        <div className="text-center md:text-left">
          <div className="text-4xl font-bold mb-2">
            {reviewStats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
            {renderStars(Math.round(reviewStats.averageRating))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Rating distribution */}
        <div className="flex-1 space-y-2">
          {reviewStats.ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm min-w-[60px]">
                <span>{item.rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={item.percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground min-w-[40px]">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Guest Reviews</h3>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Review content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">
                        {review.reviewer?.full_name || 'Guest'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more reviews */}
      {reviews.length > 3 && (
        <div className="text-center">
          <Button 
            variant="outline"
            onClick={() => setShowAllReviews(!showAllReviews)}
          >
            {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
          </Button>
        </div>
      )}
    </div>
  );
};