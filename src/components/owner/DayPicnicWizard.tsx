import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';
import { LocationService } from '@/lib/locationService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/owner/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { Progress } from '@/components/owner/ui/progress';
import { Separator } from '@/components/owner/ui/separator';
import { ArrowLeft, ArrowRight, Save, Eye, Upload, X, Check, Clock, Users, MapPin, Camera, Star } from 'lucide-react';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Textarea } from '@/components/owner/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/owner/ui/select';
import { supabase } from '@/integrations/supabase/client';

export interface DayPicnicFormData {
  // Basic Details
  title: string;
  description: string;
  address: string;
  location: { city: string; state: string };
  contact_phone: string;
  
  // Day Picnic Specific
  day_picnic_capacity: number;
  day_picnic_duration_category: 'half_day' | 'full_day' | 'extended_day';
  
  // Pricing
  pricing: { 
    currency: string; 
    daily_rate: number;
    per_person_rate?: number;
  };
  
  // Images
  images: string[];
  photos_with_captions: Array<{
    image_url: string;
    caption?: string;
    alt_text?: string;
    category?: string;
    display_order?: number;
    is_primary?: boolean;
  }>;
  
  // Amenities & Features
  amenities: string[];
  meal_plans: string[];
  inclusions: string[];
  exclusions: string[];
  
  // Timing
  start_time: string;
  end_time: string;
  
  // Policies
  cancellation_policy: string;
  minimum_guests: number;
  maximum_guests: number;
}

interface DayPicnicWizardProps {
  onBack: () => void;
  dayPicnicId?: string;
  initialTitle?: string;
}

const DAY_PICNIC_AMENITIES = [
  'Swimming Pool', 'Garden Area', 'BBQ Facilities', 'Outdoor Games', 
  'Music System', 'Parking', 'Restrooms', 'Changing Rooms',
  'Seating Area', 'Shade/Gazebo', 'Kitchen Access', 'Power Supply',
  'Water Supply', 'First Aid', 'Security', 'Photography Area'
];

const MEAL_PLAN_OPTIONS = [
  'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages', 
  'Welcome Drink', 'BBQ', 'Traditional Meals', 'Vegetarian Options', 'Non-Vegetarian Options'
];

const DURATION_CATEGORIES = [
  { value: 'half_day', label: 'Half Day (4-6 hours)', hours: '4-6' },
  { value: 'full_day', label: 'Full Day (6-10 hours)', hours: '6-10' },
  { value: 'extended_day', label: 'Extended Day (10+ hours)', hours: '10+' }
];

const DayPicnicWizard: React.FC<DayPicnicWizardProps> = ({ 
  onBack, 
  dayPicnicId, 
  initialTitle = '' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState<DayPicnicFormData>({
    title: initialTitle,
    description: '',
    address: '',
    location: { city: '', state: '' },
    contact_phone: '',
    day_picnic_capacity: 20,
    day_picnic_duration_category: 'full_day',
    pricing: { currency: 'INR', daily_rate: 1500, per_person_rate: 1500 },
    images: [],
    photos_with_captions: [],
    amenities: [],
    meal_plans: [],
    inclusions: [],
    exclusions: [],
    start_time: '10:00',
    end_time: '18:00',
    cancellation_policy: 'moderate',
    minimum_guests: 10,
    maximum_guests: 50
  });

  const steps = [
    { id: 'basic', title: 'Basic Details', icon: 'fas fa-info-circle' },
    { id: 'location', title: 'Location & Contact', icon: 'fas fa-map-marker-alt' },
    { id: 'capacity', title: 'Capacity & Duration', icon: 'fas fa-users' },
    { id: 'amenities', title: 'Amenities & Features', icon: 'fas fa-star' },
    { id: 'meals', title: 'Meal Plans', icon: 'fas fa-utensils' },
    { id: 'photos', title: 'Photos', icon: 'fas fa-camera' },
    { id: 'pricing', title: 'Pricing & Policies', icon: 'fas fa-dollar-sign' },
    { id: 'review', title: 'Review & Submit', icon: 'fas fa-check-circle' }
  ];

  // Image upload function using the same storage as location service
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `day-picnic-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const imageUrl = await uploadImage(file);
        setUploadProgress(((index + 1) / files.length) * 100);
        
        return {
          image_url: imageUrl,
          caption: `Day picnic image ${formData.photos_with_captions.length + index + 1}`,
          alt_text: `${formData.title} - Day picnic image`,
          category: 'day_picnic',
          display_order: formData.photos_with_captions.length + index,
          is_primary: formData.photos_with_captions.length === 0 && index === 0
        };
      });

      const newPhotos = await Promise.all(uploadPromises);
      const newImageUrls = newPhotos.map(photo => photo.image_url);

      setFormData(prev => ({
        ...prev,
        photos_with_captions: [...prev.photos_with_captions, ...newPhotos],
        images: [...prev.images, ...newImageUrls]
      }));

      toast({
        title: "Images uploaded successfully!",
        description: `${files.length} image(s) added to your day picnic listing.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos_with_captions: prev.photos_with_captions.filter((_, i) => i !== index),
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a day picnic listing.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Convert day picnic form data to property format
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        location: formData.location,
        property_type: 'Day Picnic',
        contact_phone: formData.contact_phone,
        day_picnic_capacity: formData.day_picnic_capacity,
        day_picnic_duration_category: formData.day_picnic_duration_category,
        pricing: formData.pricing,
        images: formData.images,
        photos_with_captions: formData.photos_with_captions,
        amenities: formData.amenities,
        meal_plans: formData.meal_plans,
        cancellation_policy: formData.cancellation_policy,
        minimum_stay: 1,
        max_guests: formData.day_picnic_capacity,
        // Set other required fields with defaults for day picnic (temporary fix for constraint)
        bedrooms: 0,
        bathrooms: 1, // At least 1 bathroom for day picnic
        rooms_count: 1, // Temporary: Set to 1 to satisfy constraint
        capacity_per_room: formData.day_picnic_capacity, // Use day picnic capacity
        check_in_time: formData.start_time,
        check_out_time: formData.end_time,
        country: 'India',
        star_rating: 3,
        languages_spoken: ['English', 'Hindi'],
        rooms_details: { types: [], configurations: {}, amenities_per_room: {} },
        amenities_details: {
          property_facilities: formData.amenities,
          room_features: [],
          connectivity: {},
          recreation: [],
          services: [],
          accessibility: []
        },
        facilities: {
          parking: {},
          internet: {},
          recreation: formData.amenities,
          business: [],
          family: []
        },
        seasonal_pricing: { seasons: [], special_rates: {}, discounts: {} },
        payment_methods: ['card', 'cash'],
        policies_extended: {
          child_policy: {},
          pet_policy: {},
          smoking_policy: {},
          damage_policy: {},
          group_booking_policy: {}
        },
        safety_security: {
          fire_safety: [],
          security_features: [],
          emergency_procedures: [],
          health_safety: []
        },
        nearby_attractions: {
          landmarks: [],
          transport: {},
          dining: [],
          entertainment: [],
          distances: {}
        },
        extra_services: [],
        postal_code: '',
        license_number: ''
      };

      console.log('🎯 Day Picnic property data being sent:', propertyData);
      console.log('🔢 Key values:', {
        property_type: propertyData.property_type,
        day_picnic_capacity: propertyData.day_picnic_capacity,
        rooms_count: propertyData.rooms_count,
        capacity_per_room: propertyData.capacity_per_room,
        max_guests: propertyData.max_guests
      });

      const result = await PropertyService.addProperty(propertyData as any, user.id);

      if (result) {
        // Create day picnic package entry
        const packageData = {
          property_id: result.id,
          meal_plan: formData.meal_plans,
          start_time: formData.start_time,
          end_time: formData.end_time,
          duration_hours: calculateDurationHours(formData.start_time, formData.end_time),
          pricing_type: 'per_person',
          base_price: formData.pricing.per_person_rate || formData.pricing.daily_rate,
          inclusions: formData.inclusions,
          exclusions: formData.exclusions,
          add_ons: []
        };

        const { error: packageError } = await supabase
          .from('day_picnic_packages')
          .insert(packageData);

        if (packageError) {
          console.error('Error creating day picnic package:', packageError);
        }

        toast({
          title: "Day picnic created successfully!",
          description: "Your day picnic listing has been submitted for review.",
        });

        onBack();
      }
    } catch (error) {
      console.error('Error creating day picnic:', error);
      toast({
        title: "Creation failed",
        description: "Failed to create day picnic listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateDurationHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Details
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Day Picnic Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Luxury Garden Day Picnic Experience"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your day picnic experience, activities, and what makes it special..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 1: // Location & Contact
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete address with landmarks"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  placeholder="City"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.location.state}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, state: e.target.value }
                  }))}
                  placeholder="State"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="contact_phone">Contact Phone *</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+91 9876543210"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 2: // Capacity & Duration
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="day_picnic_capacity">Total Capacity *</Label>
              <Input
                id="day_picnic_capacity"
                type="number"
                value={formData.day_picnic_capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, day_picnic_capacity: parseInt(e.target.value) || 0 }))}
                placeholder="20"
                min="1"
                max="500"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="duration_category">Duration Category *</Label>
              <Select
                value={formData.day_picnic_duration_category}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, day_picnic_duration_category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_CATEGORIES.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimum_guests">Minimum Guests</Label>
                <Input
                  id="minimum_guests"
                  type="number"
                  value={formData.minimum_guests}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_guests: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="maximum_guests">Maximum Guests</Label>
                <Input
                  id="maximum_guests"
                  type="number"
                  value={formData.maximum_guests}
                  onChange={(e) => setFormData(prev => ({ ...prev, maximum_guests: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Amenities & Features
        return (
          <div className="space-y-6">
            <div>
              <Label>Available Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {DAY_PICNIC_AMENITIES.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, amenities: [...prev.amenities, amenity] }));
                        } else {
                          setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="inclusions">What's Included</Label>
              <Textarea
                id="inclusions"
                value={formData.inclusions.join('\n')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  inclusions: e.target.value.split('\n').filter(item => item.trim()) 
                }))}
                placeholder="Enter each inclusion on a new line&#10;e.g.,&#10;Welcome drink&#10;Photography area access&#10;Basic seating arrangement"
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="exclusions">What's Not Included</Label>
              <Textarea
                id="exclusions"
                value={formData.exclusions.join('\n')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  exclusions: e.target.value.split('\n').filter(item => item.trim()) 
                }))}
                placeholder="Enter each exclusion on a new line&#10;e.g.,&#10;Food and beverages&#10;Transportation&#10;Personal expenses"
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 4: // Meal Plans
        return (
          <div className="space-y-6">
            <div>
              <Label>Available Meal Options</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {MEAL_PLAN_OPTIONS.map((meal) => (
                  <label key={meal} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.meal_plans.includes(meal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, meal_plans: [...prev.meal_plans, meal] }));
                        } else {
                          setFormData(prev => ({ ...prev, meal_plans: prev.meal_plans.filter(m => m !== meal) }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{meal}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Photos
        return (
          <div className="space-y-6">
            <div>
              <Label>Upload Photos</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="mb-4"
                />
                {uploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading images...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </div>
            
            {formData.photos_with_captions.length > 0 && (
              <div>
                <Label>Uploaded Images ({formData.photos_with_captions.length})</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {formData.photos_with_captions.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.image_url}
                        alt={photo.alt_text}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {photo.is_primary && (
                        <Badge className="absolute bottom-2 left-2 bg-blue-500">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 6: // Pricing & Policies
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily_rate">Base Price (₹)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={formData.pricing.daily_rate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, daily_rate: parseFloat(e.target.value) || 0 }
                  }))}
                  min="0"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="per_person_rate">Per Person Rate (₹)</Label>
                <Input
                  id="per_person_rate"
                  type="number"
                  value={formData.pricing.per_person_rate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, per_person_rate: parseFloat(e.target.value) || 0 }
                  }))}
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
              <Select
                value={formData.cancellation_policy}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cancellation_policy: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select cancellation policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible - Full refund 1 day before</SelectItem>
                  <SelectItem value="moderate">Moderate - Full refund 5 days before</SelectItem>
                  <SelectItem value="strict">Strict - Full refund 14 days before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 7: // Review & Submit
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Review Your Day Picnic Listing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{formData.title}</h3>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Location:</span>
                    <p>{formData.location.city}, {formData.location.state}</p>
                  </div>
                  <div>
                    <span className="font-medium">Capacity:</span>
                    <p>{formData.day_picnic_capacity} guests</p>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p>{formData.start_time} - {formData.end_time}</p>
                  </div>
                  <div>
                    <span className="font-medium">Price:</span>
                    <p>₹{formData.pricing.per_person_rate || formData.pricing.daily_rate} per person</p>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Amenities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Images:</span>
                  <p className="text-sm text-gray-600">
                    {formData.photos_with_captions.length} image(s) uploaded
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title.trim() && formData.description.trim();
      case 1:
        return formData.address.trim() && formData.location.city.trim() && formData.location.state.trim() && formData.contact_phone.trim();
      case 2:
        return formData.day_picnic_capacity > 0 && formData.start_time && formData.end_time;
      case 6:
        return formData.pricing.daily_rate > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Day Picnic Experience</h1>
            <p className="text-gray-600">Step {currentStep + 1} of {steps.length}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {steps.map((step, index) => (
            <span key={step.id} className={index <= currentStep ? 'text-blue-600 font-medium' : ''}>
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className={`${steps[currentStep].icon} text-blue-600`}></i>
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !canProceed()}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Day Picnic
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DayPicnicWizard;
