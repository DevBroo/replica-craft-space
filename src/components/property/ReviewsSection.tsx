import React from 'react';
import { Star, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  // Mock review data (in real app, this would come from API)
  const reviews = [
    {
      id: 1,
      user: 'Sarah M.',
      rating: 5,
      date: '2024-01-15',
      comment: 'Amazing experience! The property was exactly as described and the host was very accommodating. Perfect for a day picnic with family.'
    },
    {
      id: 2,
      user: 'Raj K.',
      rating: 4,
      date: '2024-01-10',
      comment: 'Great location and facilities. The food was delicious and the activities were fun. Would definitely recommend to others.'
    },
    {
      id: 3,
      user: 'Priya S.',
      rating: 5,
      date: '2024-01-08',
      comment: 'Exceeded our expectations! Beautiful scenery, well-maintained facilities, and excellent service. Perfect for special occasions.'
    }
  ];

  // Mock rating distribution
  const ratingDistribution = [
    { stars: 5, count: 45, percentage: 60 },
    { stars: 4, count: 20, percentage: 27 },
    { stars: 3, count: 8, percentage: 11 },
    { stars: 2, count: 2, percentage: 2 },
    { stars: 1, count: 0, percentage: 0 }
  ];

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

  return (
    <div className="space-y-6">
      {/* Overall rating */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Rating summary */}
        <div className="text-center md:text-left">
          <div className="text-4xl font-bold mb-2">{rating.toFixed(1)}</div>
          <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
            {renderStars(Math.round(rating))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {reviewCount} reviews
          </div>
        </div>

        {/* Rating distribution */}
        <div className="flex-1 space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm min-w-[60px]">
                <span>{item.stars}</span>
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

      {/* Write review button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Guest Reviews</h3>
        <Button variant="outline">
          Write a Review
        </Button>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
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
                      <div className="font-medium">{review.user}</div>
                      <div className="text-sm text-muted-foreground">{review.date}</div>
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
      <div className="text-center">
        <Button variant="outline">
          Show More Reviews
        </Button>
      </div>
    </div>
  );
};