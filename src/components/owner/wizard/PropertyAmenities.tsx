import React from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Label } from '@/components/owner/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { Checkbox } from '@/components/owner/ui/checkbox';
import { ArrowLeft, ArrowRight, Wifi, Car, Coffee, Utensils, Waves, Dumbbell, Shield } from 'lucide-react';

interface PropertyAmenitiesProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

const PROPERTY_FACILITIES = [
  { name: 'Free Wi-Fi', icon: Wifi, category: 'connectivity' },
  { name: 'Parking', icon: Car, category: 'transport' },
  { name: 'Swimming Pool', icon: Waves, category: 'recreation' },
  { name: 'Fitness Center', icon: Dumbbell, category: 'recreation' },
  { name: 'Restaurant', icon: Utensils, category: 'dining' },
  { name: 'Bar/Lounge', icon: Coffee, category: 'dining' },
  { name: 'Spa & Wellness', icon: Shield, category: 'wellness' },
  { name: '24-hour Reception', icon: Shield, category: 'service' },
  { name: 'Room Service', icon: Utensils, category: 'service' },
  { name: 'Laundry Service', icon: Shield, category: 'service' },
  { name: 'Airport Shuttle', icon: Car, category: 'transport' },
  { name: 'Business Center', icon: Shield, category: 'business' },
  { name: 'Meeting Rooms', icon: Shield, category: 'business' },
  { name: 'Garden/Terrace', icon: Shield, category: 'outdoor' },
  { name: 'BBQ Facilities', icon: Utensils, category: 'outdoor' },
  { name: 'Children\'s Play Area', icon: Shield, category: 'family' },
  { name: 'Pet Friendly', icon: Shield, category: 'policy' },
  { name: 'Non-smoking Property', icon: Shield, category: 'policy' }
];

const ROOM_FEATURES = [
  'Air Conditioning', 'Heating', 'Private Bathroom', 'Shared Bathroom',
  'Flat-screen TV', 'Smart TV', 'Mini-bar', 'Coffee/Tea Maker',
  'Safe', 'Hair Dryer', 'Iron & Ironing Board', 'Balcony/Terrace',
  'City View', 'Garden View', 'Mountain View', 'Sea View',
  'Desk & Chair', 'Wardrobe/Closet', 'Telephone', 'Wake-up Service'
];

const CONNECTIVITY_OPTIONS = [
  { name: 'Free Wi-Fi throughout', speed: 'High Speed' },
  { name: 'Wi-Fi in public areas only', speed: 'Standard' },
  { name: 'Paid Wi-Fi', speed: 'High Speed' },
  { name: 'Business Center Internet', speed: 'High Speed' },
  { name: 'In-room Ethernet', speed: 'High Speed' }
];

const RECREATION_FACILITIES = [
  'Indoor Pool', 'Outdoor Pool', 'Hot Tub/Jacuzzi', 'Sauna', 'Steam Room',
  'Fitness Center', 'Yoga Classes', 'Tennis Court', 'Golf Course Access',
  'Bicycle Rental', 'Hiking Trails', 'Water Sports', 'Beach Access',
  'Library', 'Game Room', 'Entertainment Program', 'Live Music'
];

const ACCESSIBILITY_FEATURES = [
  'Wheelchair Accessible', 'Elevator Access', 'Accessible Parking',
  'Accessible Bathrooms', 'Braille Signage', 'Audio Induction Loop',
  'Grab Rails', 'Step-free Access', 'Accessible Pool', 'Service Animals Allowed'
];

const PropertyAmenities: React.FC<PropertyAmenitiesProps> = ({
  formData,
  setFormData,
  onNext,
  onPrevious
}) => {
  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handlePropertyFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      amenities_details: {
        ...prev.amenities_details,
        property_facilities: prev.amenities_details.property_facilities.includes(facility)
          ? prev.amenities_details.property_facilities.filter(f => f !== facility)
          : [...prev.amenities_details.property_facilities, facility]
      }
    }));
  };

  const handleRoomFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      amenities_details: {
        ...prev.amenities_details,
        room_features: prev.amenities_details.room_features.includes(feature)
          ? prev.amenities_details.room_features.filter(f => f !== feature)
          : [...prev.amenities_details.room_features, feature]
      }
    }));
  };

  const handleRecreationToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      amenities_details: {
        ...prev.amenities_details,
        recreation: prev.amenities_details.recreation.includes(facility)
          ? prev.amenities_details.recreation.filter(f => f !== facility)
          : [...prev.amenities_details.recreation, facility]
      }
    }));
  };

  const handleAccessibilityToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      amenities_details: {
        ...prev.amenities_details,
        accessibility: prev.amenities_details.accessibility.includes(feature)
          ? prev.amenities_details.accessibility.filter(f => f !== feature)
          : [...prev.amenities_details.accessibility, feature]
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Property Facilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Facilities</CardTitle>
          <p className="text-sm text-muted-foreground">
            Main facilities and services available at your property
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PROPERTY_FACILITIES.map(facility => (
              <div key={facility.name} className="flex items-center space-x-2">
                <Checkbox
                  id={facility.name}
                  checked={formData.amenities_details.property_facilities.includes(facility.name)}
                  onCheckedChange={() => handlePropertyFacilityToggle(facility.name)}
                />
                <Label htmlFor={facility.name} className="text-sm cursor-pointer">
                  {facility.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Room Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Room Features</CardTitle>
          <p className="text-sm text-muted-foreground">
            Features and amenities available in guest rooms
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ROOM_FEATURES.map(feature => (
              <Badge
                key={feature}
                variant={formData.amenities_details.room_features.includes(feature) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleRoomFeatureToggle(feature)}
              >
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recreation & Entertainment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recreation & Entertainment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {RECREATION_FACILITIES.map(facility => (
              <Badge
                key={facility}
                variant={formData.amenities_details.recreation.includes(facility) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleRecreationToggle(facility)}
              >
                {facility}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accessibility Features</CardTitle>
          <p className="text-sm text-muted-foreground">
            Features that make your property accessible to guests with disabilities
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ACCESSIBILITY_FEATURES.map(feature => (
              <Badge
                key={feature}
                variant={formData.amenities_details.accessibility.includes(feature) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleAccessibilityToggle(feature)}
              >
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Amenities List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Amenities (Legacy)</CardTitle>
          <p className="text-sm text-muted-foreground">
            These will be combined with your detailed selections above
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['WiFi', 'Parking', 'Pool', 'Gym', 'Restaurant', 'Spa', 'AC', 'TV', 'Kitchen', 'Balcony', 'Garden', 'Security'].map(amenity => (
              <Badge
                key={amenity}
                variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleAmenityToggle(amenity)}
              >
                {amenity}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Amenities Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.amenities_details.property_facilities.length}
              </div>
              <div className="text-sm text-muted-foreground">Property Facilities</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.amenities_details.room_features.length}
              </div>
              <div className="text-sm text-muted-foreground">Room Features</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.amenities_details.recreation.length}
              </div>
              <div className="text-sm text-muted-foreground">Recreation</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.amenities_details.accessibility.length}
              </div>
              <div className="text-sm text-muted-foreground">Accessibility</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PropertyAmenities;