import React from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { Separator } from '@/components/owner/ui/separator';
import { ArrowLeft, Send, Star, MapPin, Users, Bed, Bath, Wifi, DollarSign, Shield, Camera } from 'lucide-react';

interface ReviewSubmitProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const ReviewSubmit: React.FC<ReviewSubmitProps> = ({
  formData,
  onPrevious,
  onSubmit,
  isLoading
}) => {
  const completionPercentage = calculateCompletionPercentage(formData);
  
  return (
    <div className="space-y-6">
      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            Profile Completion: {completionPercentage}%
            <div className="ml-auto">
              {completionPercentage >= 80 ? (
                <Badge variant="default" className="bg-green-600">Excellent</Badge>
              ) : completionPercentage >= 60 ? (
                <Badge variant="secondary">Good</Badge>
              ) : (
                <Badge variant="outline">Needs Improvement</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Properties with higher completion rates rank better and attract more bookings
          </p>
        </CardContent>
      </Card>

      {/* Property Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{formData.title}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">{formData.property_type}</Badge>
                  {formData.property_subtype && (
                    <Badge variant="outline">{formData.property_subtype}</Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {formData.location.city}, {formData.location.state}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Up to {formData.max_guests} guests
                  </div>
                  {formData.property_type !== 'Day Picnic' && (
                    <>
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        {formData.bedrooms} bedrooms
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        {formData.bathrooms} bathrooms
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < formData.star_rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    Self-rated {formData.star_rating} stars
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ₹{(formData.pricing.daily_rate || 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">per night</div>
              </div>
            </div>

            <p className="text-muted-foreground mt-4">{formData.description}</p>
          </div>

          <Separator />

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Amenities */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Wifi className="w-4 h-4 mr-2" />
                Amenities ({formData.amenities.length})
              </h3>
              <div className="space-y-1">
                {formData.amenities.slice(0, 5).map(amenity => (
                  <div key={amenity} className="text-sm text-muted-foreground">• {amenity}</div>
                ))}
                {formData.amenities.length > 5 && (
                  <div className="text-sm text-primary">+ {formData.amenities.length - 5} more</div>
                )}
              </div>
            </div>

            {/* Safety Features */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Safety Features
              </h3>
              <div className="space-y-1">
                {formData.safety_security.fire_safety.slice(0, 3).map(feature => (
                  <div key={feature} className="text-sm text-muted-foreground">• {feature}</div>
                ))}
                {formData.safety_security.security_features.slice(0, 2).map(feature => (
                  <div key={feature} className="text-sm text-muted-foreground">• {feature}</div>
                ))}
                {(formData.safety_security.fire_safety.length + formData.safety_security.security_features.length) > 5 && (
                  <div className="text-sm text-primary">+ More safety features</div>
                )}
              </div>
            </div>

            {/* Photos */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Photos ({formData.photos_with_captions.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {formData.photos_with_captions.slice(0, 4).map((photo, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-md overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Languages & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Languages Spoken</h3>
              <div className="flex flex-wrap gap-2">
                {formData.languages_spoken.map(language => (
                  <Badge key={language} variant="outline">{language}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Payment Methods</h3>
              <div className="flex flex-wrap gap-2">
                {formData.payment_methods.map(method => (
                  <Badge key={method} variant="outline" className="capitalize">{method}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Before You Submit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-900">Review Process</div>
              <div className="text-sm text-blue-700">
                Your property will be reviewed by our team within 24-48 hours. You'll receive an email notification once approved.
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-900">Ranking Factors</div>
              <div className="text-sm text-green-700">
                Complete profiles with high-quality photos and detailed amenities rank higher in search results.
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
            <div>
              <div className="font-medium text-yellow-900">Edit Anytime</div>
              <div className="text-sm text-yellow-700">
                You can edit your property details anytime from your dashboard, even after approval.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Property
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

function calculateCompletionPercentage(formData: PropertyFormData): number {
  let score = 0;
  const maxScore = 100;
  
  // Basic details (30 points)
  if (formData.title) score += 5;
  if (formData.property_type) score += 5;
  if (formData.description && formData.description.length > 100) score += 10;
  if (formData.address) score += 5;
  if (formData.contact_phone) score += 5;
  
  // Room details (20 points)
  if (formData.max_guests > 0) score += 5;
  if (formData.bedrooms > 0 || formData.property_type === 'Day Picnic') score += 5;
  if (formData.bathrooms > 0 || formData.property_type === 'Day Picnic') score += 5;
  if (formData.rooms_details.types.length > 0) score += 5;
  
  // Amenities (15 points)
  if (formData.amenities.length >= 5) score += 10;
  if (formData.amenities.length >= 10) score += 5;
  
  // Photos (20 points)
  if (formData.photos_with_captions.length >= 1) score += 5;
  if (formData.photos_with_captions.length >= 5) score += 10;
  if (formData.photos_with_captions.length >= 10) score += 5;
  
  // Pricing (10 points)
  if (formData.pricing.daily_rate > 0) score += 5;
  if (formData.payment_methods.length > 1) score += 5;
  
  // Safety & extras (5 points)
  if (formData.safety_security.fire_safety.length > 0) score += 3;
  if (formData.languages_spoken.length > 1) score += 2;
  
  return Math.min(score, maxScore);
}

export default ReviewSubmit;