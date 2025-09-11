import React from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Textarea } from '@/components/owner/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/owner/ui/select';
import { Badge } from '@/components/owner/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Separator } from '@/components/owner/ui/separator';
import { ArrowRight, Star, X } from 'lucide-react';

interface BasicDetailsProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

import { PROPERTY_CATEGORIES } from '@/lib/searchService';

// Exclude Day Picnic from regular property wizard since it has its own dedicated wizard
const PROPERTY_TYPES = PROPERTY_CATEGORIES
  .filter(cat => cat.value !== 'day-picnic')
  .map(cat => ({
    value: cat.value,
    label: cat.label,
    icon: cat.icon
  }));

const PROPERTY_SUBTYPES = {
  'hotel': ['Luxury Hotel', 'Business Hotel', 'Budget Hotel', 'Boutique Hotel', 'Airport Hotel'],
  'villa': ['Luxury Villa', 'Beach Villa', 'Hill Station Villa', 'Private Villa', 'Shared Villa'],
  'apartment': ['Studio', '1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Penthouse'],
  'guesthouse': ['Traditional Guesthouse', 'Modern Guesthouse', 'Family Guesthouse'],
  'resort': ['Beach Resort', 'Hill Resort', 'Wellness Resort', 'Adventure Resort'],
  'hostel': ['Backpacker Hostel', 'Luxury Hostel', 'Female Only', 'Mixed Dorm'],
  'day-picnic': ['Family Picnic', 'Corporate Outing', 'Birthday Party', 'Group Gathering'],
  'farmhouse': ['Traditional Farmhouse', 'Modern Farmhouse', 'Heritage Farmhouse'],
  'home-stays': ['Family Homestay', 'Budget Homestay', 'Luxury Homestay'],
  'heritage-place': ['Royal Palace', 'Heritage Hotel', 'Historic Mansion'],
  'banquet-hall': ['Wedding Hall', 'Conference Hall', 'Event Space'],
  'wedding-venue': ['Garden Wedding', 'Beach Wedding', 'Palace Wedding']
};

const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu',
  'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili', 'Sanskrit',
  'French', 'German', 'Spanish', 'Chinese', 'Japanese', 'Korean', 'Arabic'
];

const BasicDetails: React.FC<BasicDetailsProps> = ({
  formData,
  setFormData,
  onNext
}) => {
  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => {
      const currentLanguages = prev.languages_spoken || [];
      return {
        ...prev,
        languages_spoken: currentLanguages.includes(language)
          ? currentLanguages.filter(l => l !== language)
          : [...currentLanguages, language]
      };
    });
  };

  const canProceed = formData.title && formData.property_type && formData.description && 
                   formData.address && formData.location.city && formData.location.state;

  return (
    <div className="space-y-6">
      {/* Property Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Property Name *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a unique, descriptive property name"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="property_type">Property Type *</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) => {
                  handleInputChange('property_type', value);
                  handleInputChange('property_subtype', ''); // Reset subtype
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <i className={`${type.icon} mr-2`}></i>
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.property_type && PROPERTY_SUBTYPES[formData.property_type as keyof typeof PROPERTY_SUBTYPES] && (
              <div>
                <Label htmlFor="property_subtype">Property Subtype</Label>
                <Select
                  value={formData.property_subtype}
                  onValueChange={(value) => handleInputChange('property_subtype', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select subtype (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_SUBTYPES[formData.property_type as keyof typeof PROPERTY_SUBTYPES]?.map(subtype => (
                      <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Property Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your property in detail - highlight unique features, amenities, and what makes it special"
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="star_rating">Star Rating (Self-Assessment)</Label>
              <div className="flex items-center space-x-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleInputChange('star_rating', star)}
                    className={`p-1 transition-colors ${
                      star <= formData.star_rating 
                        ? 'text-yellow-400' 
                        : 'text-muted-foreground hover:text-yellow-300'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {formData.star_rating} star{formData.star_rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="license_number">License/Registration Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                placeholder="Tourism license or registration number"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Complete Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter complete address with landmarks"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                placeholder="City name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.location.state}
                onChange={(e) => handleLocationChange('state', e.target.value)}
                placeholder="State name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="PIN/ZIP code"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact & Communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Languages Spoken by Staff</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map(language => {
                const languagesSpoken = formData.languages_spoken || [];
                const isSelected = languagesSpoken.includes(language);
                return (
                  <Badge
                    key={language}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                    onClick={() => handleLanguageToggle(language)}
                  >
                    {language}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="min-w-32"
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default BasicDetails;