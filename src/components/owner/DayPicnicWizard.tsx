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
  
  // Pricing
  pricing: { 
    currency: string; 
    daily_rate: number;
    per_person_rate?: number;
    pricing_type: 'per_person' | 'per_package';
    half_day_price?: number;
    extended_day_price?: number;
  };
  
  // Meal Pricing
  meal_prices: Array<{
    meal_plan: string;
    price_per_person: number;
    price_per_package: number;
  }>;
  
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
    pricing: { 
      currency: 'INR', 
      daily_rate: 1500, 
      per_person_rate: 1500,
      pricing_type: 'per_person',
      half_day_price: 900,
      extended_day_price: 2250
    },
    meal_prices: [],
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

  // Load existing property data if editing
  useEffect(() => {
    if (dayPicnicId) {
      loadExistingProperty();
    }
  }, [dayPicnicId]);

  const loadExistingProperty = async () => {
    if (!dayPicnicId) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Loading existing Day Picnic property:', dayPicnicId);
      
      // Load property data
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', dayPicnicId)
        .single();

      if (propertyError) throw propertyError;

      // Load day picnic package data
      const { data: packageData, error: packageError } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', dayPicnicId)
        .single();

      // Load meal pricing data (optional - may not exist)
      const { data: mealPricing } = await supabase
        .from('day_picnic_meal_prices')
        .select('*')
        .eq('package_id', packageData?.id);

      console.log('📊 Loaded property data:', { property, packageData, mealPricing });

      // Populate form with existing data
      const locationData = property.location as any;
      const pricingData = property.pricing as any;
      
      setFormData({
        title: property.title || '',
        description: property.description || '',
        address: property.address || '',
        location: {
          city: locationData?.city || '',
          state: locationData?.state || ''
        },
        contact_phone: property.contact_phone || '',
        day_picnic_capacity: property.day_picnic_capacity || 20,
        pricing: {
          currency: 'INR',
          daily_rate: packageData?.base_price || pricingData?.daily_rate || 1500,
          per_person_rate: packageData?.base_price || pricingData?.per_person_rate || 1500,
          pricing_type: (packageData?.pricing_type as 'per_person' | 'per_package') || 'per_person',
          half_day_price: Math.round((packageData?.base_price || 1500) * 0.6),
          extended_day_price: Math.round((packageData?.base_price || 1500) * 1.5)
        },
        meal_prices: mealPricing?.map((mp: any) => ({
          meal_plan: mp.meal_plan,
          price_per_person: mp.price_per_person,
          price_per_package: mp.price_per_package
        })) || [],
        images: Array.isArray(property.images) ? property.images : [],
        photos_with_captions: Array.isArray((property as any).photos_with_captions) ? (property as any).photos_with_captions : [],
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        meal_plans: Array.isArray(packageData?.meal_plan) ? packageData.meal_plan : [],
        inclusions: Array.isArray(packageData?.inclusions) ? packageData.inclusions.map(String) : [],
        exclusions: Array.isArray(packageData?.exclusions) ? packageData.exclusions.map(String) : [],
        start_time: packageData?.start_time ? String(packageData.start_time).substring(0, 5) : '10:00',
        end_time: packageData?.end_time ? String(packageData.end_time).substring(0, 5) : '18:00',
        cancellation_policy: property.cancellation_policy || 'moderate',
        minimum_guests: (property as any).minimum_guests || property.max_guests || 10,
        maximum_guests: (property as any).maximum_guests || property.max_guests || 50
      });

      toast({
        title: "Property loaded",
        description: "Existing day picnic data has been loaded for editing.",
      });

    } catch (error: any) {
      console.error('❌ Error loading property:', error);
      toast({
        title: "Error",
        description: "Failed to load existing property data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        description: `Please log in to ${dayPicnicId ? 'update' : 'create'} a day picnic listing.`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const isEditMode = !!dayPicnicId;

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
        pricing: formData.pricing,
        images: formData.images,
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

      let result;
      let propertyId;

      if (isEditMode) {
        // Update existing property
        console.log('🔄 Updating existing property:', dayPicnicId);
        const { data, error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', dayPicnicId)
          .select()
          .single();

        if (error) throw error;
        result = data;
        propertyId = dayPicnicId;
      } else {
        // Create new property
        console.log('✨ Creating new property');
        result = await PropertyService.addProperty(propertyData as any, user.id);
        propertyId = result?.id;
      }

      if (result && propertyId) {
        // Handle day picnic package (create or update)
        const calculatedDuration = calculateDurationHours(formData.start_time, formData.end_time);
        
        const packageData = {
          property_id: propertyId,
          meal_plan: Array.isArray(formData.meal_plans) ? formData.meal_plans : [],
          start_time: formData.start_time || '10:00',
          end_time: formData.end_time || '18:00',
          duration_hours: calculatedDuration,
          pricing_type: formData.pricing.pricing_type || 'per_person',
          base_price: Number(formData.pricing.daily_rate) || 0,
          inclusions: Array.isArray(formData.inclusions) ? formData.inclusions : [],
          exclusions: Array.isArray(formData.exclusions) ? formData.exclusions : [],
          add_ons: []
        };

        console.log('📦 Package data being sent:', packageData);
        console.log('🕐 Duration calculation details:', {
          start_time: formData.start_time,
          end_time: formData.end_time,
          calculated_duration: calculatedDuration
        });

        let packageResult;

        if (isEditMode) {
          // Check if package exists, update or create
          const { data: existingPackage, error: fetchError } = await supabase
            .from('day_picnic_packages')
            .select('id')
            .eq('property_id', propertyId)
            .single();

          if (existingPackage) {
            // Update existing package
            const { data, error: updateError } = await supabase
              .from('day_picnic_packages')
              .update(packageData)
              .eq('property_id', propertyId)
              .select()
              .single();

            if (updateError) throw updateError;
            packageResult = data;
          } else {
            // Create new package
            const { data, error: createError } = await supabase
              .from('day_picnic_packages')
              .insert(packageData)
              .select()
              .single();

            if (createError) throw createError;
            packageResult = data;
          }
        } else {
          // Create new package for new property
          const { data, error: packageError } = await supabase
            .from('day_picnic_packages')
            .insert(packageData)
            .select()
            .single();

          if (packageError) {
            console.error('Error creating day picnic package:', packageError);
            throw packageError;
          }
          packageResult = data;
        }

        // Handle meal pricing data
        if (formData.meal_prices.length > 0 && packageResult) {
          if (isEditMode) {
            // Delete existing meal prices and recreate
            await supabase
              .from('day_picnic_meal_prices')
              .delete()
              .eq('package_id', packageResult.id);
          }

          const mealPricingData = formData.meal_prices.map(mealPrice => ({
            package_id: packageResult.id,
            meal_plan: mealPrice.meal_plan,
            price_per_person: mealPrice.price_per_person,
            price_per_package: mealPrice.price_per_package
          }));

          const { error: mealPriceError } = await supabase
            .from('day_picnic_meal_prices')
            .insert(mealPricingData);

          if (mealPriceError) {
            console.error('Error saving meal pricing:', mealPriceError);
            // Don't throw error here - meal pricing is optional
          }
        }

        toast({
          title: isEditMode ? "Day picnic updated successfully!" : "Day picnic created successfully!",
          description: isEditMode 
            ? "Your day picnic listing has been updated." 
            : "Your day picnic listing has been submitted for review.",
        });

        onBack();
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} day picnic:`, error);
      toast({
        title: isEditMode ? "Update failed" : "Creation failed",
        description: `Failed to ${isEditMode ? 'update' : 'create'} day picnic listing. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateDurationHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) {
      console.warn('⚠️ Invalid time values:', { startTime, endTime });
      return 8; // Default to 8 hours if invalid
    }

    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    // Handle case where end time is before start time (next day)
    if (duration <= 0) {
      const adjustedDuration = duration + 24; // Add 24 hours for next day
      console.log('🕐 End time is next day, adjusted duration:', adjustedDuration);
      return adjustedDuration > 0 ? adjustedDuration : 8; // Fallback to 8 hours
    }
    
    console.log('🕐 Calculated duration:', duration, 'hours for', startTime, '-', endTime);
    return duration > 0 ? duration : 8; // Ensure positive number, fallback to 8 hours
  };

  // Meal pricing utility functions
  const updateMealPrices = () => {
    const existingMeals = new Set(formData.meal_prices.map(mp => mp.meal_plan));
    const newPrices = [...formData.meal_prices];
    
    // Add pricing for newly selected meals
    formData.meal_plans.forEach(meal => {
      if (!existingMeals.has(meal)) {
        newPrices.push({
          meal_plan: meal,
          price_per_person: 0,
          price_per_package: 0
        });
      }
    });
    
    // Remove pricing for unselected meals
    const filteredPrices = newPrices.filter(mp => 
      formData.meal_plans.includes(mp.meal_plan)
    );
    
    setFormData(prev => ({ ...prev, meal_prices: filteredPrices }));
  };

  const updateMealPrice = (mealPlan: string, field: 'price_per_person' | 'price_per_package', value: number) => {
    console.log('🍽️ Updating meal price:', { mealPlan, field, value });
    
    setFormData(prev => {
      // Ensure the meal price entry exists
      let updatedMealPrices = [...prev.meal_prices];
      const existingIndex = updatedMealPrices.findIndex(mp => mp.meal_plan === mealPlan);
      
      if (existingIndex >= 0) {
        // Update existing entry
        updatedMealPrices[existingIndex] = {
          ...updatedMealPrices[existingIndex],
          [field]: value
        };
      } else {
        // Create new entry if not exists
        updatedMealPrices.push({
          meal_plan: mealPlan,
          price_per_person: field === 'price_per_person' ? value : 0,
          price_per_package: field === 'price_per_package' ? value : 0
        });
      }
      
      console.log('🍽️ Updated meal prices:', updatedMealPrices);
      
      return {
        ...prev,
        meal_prices: updatedMealPrices
      };
    });
  };

  const getMealPriceValue = (mealPlan: string, field: 'price_per_person' | 'price_per_package') => {
    const mealPrice = formData.meal_prices.find(mp => mp.meal_plan === mealPlan);
    return mealPrice ? mealPrice[field] : 0;
  };

  // Auto-calculate duration pricing based on base rate
  const updateDurationPricing = () => {
    const baseRate = formData.pricing.daily_rate || 0;
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        half_day_price: Math.round(baseRate * 0.6), // 60% of full day
        extended_day_price: Math.round(baseRate * 1.5) // 150% of full day
      }
    }));
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
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="text-lg font-semibold text-blue-800">Duration Flexibility</Label>
              <p className="text-sm text-gray-600 mt-1">
                Your day picnic will support multiple duration options (Half Day, Full Day, Extended Day). 
                Set specific pricing for each duration in the "Pricing & Policies" step.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-white rounded border">
                  <div className="font-medium text-blue-600">Half Day</div>
                  <div className="text-gray-500">4-5 hours</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="font-medium text-green-600">Full Day</div>
                  <div className="text-gray-500">6-8 hours</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="font-medium text-purple-600">Extended</div>
                  <div className="text-gray-500">10+ hours</div>
                </div>
              </div>
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
                        const isChecked = e.target.checked;
                        setFormData(prev => {
                          let updatedMealPlans;
                          let updatedMealPrices = [...prev.meal_prices];
                          
                          if (isChecked) {
                            updatedMealPlans = [...prev.meal_plans, meal];
                            // Add new meal price entry if not exists
                            if (!updatedMealPrices.find(mp => mp.meal_plan === meal)) {
                              updatedMealPrices.push({
                                meal_plan: meal,
                                price_per_person: 0,
                                price_per_package: 0
                              });
                            }
                          } else {
                            updatedMealPlans = prev.meal_plans.filter(m => m !== meal);
                            // Remove meal price entry
                            updatedMealPrices = updatedMealPrices.filter(mp => mp.meal_plan !== meal);
                          }
                          
                          return {
                            ...prev,
                            meal_plans: updatedMealPlans,
                            meal_prices: updatedMealPrices
                          };
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{meal}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Meal Pricing Section */}
            {/* {formData.meal_plans.length > 0 && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <Label className="text-lg font-semibold">Meal Pricing</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Set individual prices for each selected meal option
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.meal_plans.map(meal => (
                    <div key={meal} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">{meal}</Badge>
                      </div>
                      
                      {formData.pricing.pricing_type === 'per_person' && (
                        <div>
                          <Label className="text-sm font-medium">Price Per Person (₹)</Label>
                          <Input
                            type="number"
                            value={getMealPriceValue(meal, 'price_per_person')}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              updateMealPrice(meal, 'price_per_person', newValue);
                            }}
                            min="0"
                            step="10"
                            placeholder="Enter price per person"
                            className="mt-1"
                          />
                        </div>
                      )}
                      
                      {formData.pricing.pricing_type === 'per_package' && (
                        <div>
                          <Label className="text-sm font-medium">Price Per Package (₹)</Label>
                          <Input
                            type="number"
                            value={getMealPriceValue(meal, 'price_per_package')}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              updateMealPrice(meal, 'price_per_package', newValue);
                            }}
                            min="0"
                            step="50"
                            placeholder="Enter price per package"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )} */}
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
            {/* Pricing Type Selection */}
            <div>
              <Label htmlFor="pricing_type">Pricing Type</Label>
              <Select
                value={formData.pricing.pricing_type}
                onValueChange={(value: 'per_person' | 'per_package') => {
                  setFormData(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, pricing_type: value }
                  }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select pricing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_person">Per Person Pricing</SelectItem>
                  <SelectItem value="per_package">Per Package Pricing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Base Pricing */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-green-800">Full Day Base Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daily_rate">Full Day Price (₹)</Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    value={formData.pricing.daily_rate}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        pricing: { ...prev.pricing, daily_rate: value }
                      }));
                      // Auto-update duration pricing
                      setTimeout(updateDurationPricing, 0);
                    }}
                    min="0"
                    step="50"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.pricing.pricing_type === 'per_person' ? 'Per person for full day (6-8 hours)' : 'Per package for full day (6-8 hours)'}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="per_person_rate">
                    {formData.pricing.pricing_type === 'per_person' ? 'Same as Full Day' : 'Per Person Rate (Optional)'}
                  </Label>
                  <Input
                    id="per_person_rate"
                    type="number"
                    value={formData.pricing.per_person_rate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      pricing: { ...prev.pricing, per_person_rate: parseFloat(e.target.value) || 0 }
                    }))}
                    min="0"
                    step="10"
                    className="mt-1"
                    disabled={formData.pricing.pricing_type === 'per_person'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.pricing.pricing_type === 'per_person' 
                      ? 'Automatically set to full day price' 
                      : 'Optional individual pricing'}
                  </p>
                </div>
              </div>
            </div>

            {/* Duration-Based Pricing */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-blue-800">Duration-Based Pricing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Automatically calculated based on your full day price. You can customize these values.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="border rounded-lg p-3">
                    <Label className="font-medium text-blue-600">Half Day (4-5h)</Label>
                    <Input
                      type="number"
                      value={formData.pricing.half_day_price}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, half_day_price: parseFloat(e.target.value) || 0 }
                      }))}
                      min="0"
                      step="50"
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Default: 60% of full day
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="border rounded-lg p-3 bg-green-50">
                    <Label className="font-medium text-green-600">Full Day (6-8h)</Label>
                    <Input
                      type="number"
                      value={formData.pricing.daily_rate}
                      disabled
                      className="mt-2 bg-gray-100"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Base price
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="border rounded-lg p-3">
                    <Label className="font-medium text-purple-600">Extended (10+h)</Label>
                    <Input
                      type="number"
                      value={formData.pricing.extended_day_price}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, extended_day_price: parseFloat(e.target.value) || 0 }
                      }))}
                      min="0"
                      step="50"
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Default: 150% of full day
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cancellation Policy */}
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
                    <span className="font-medium">Pricing Type:</span>
                    <p>{formData.pricing.pricing_type === 'per_person' ? 'Per Person' : 'Per Package'}</p>
                  </div>
                </div>
                
                {/* Duration Pricing Summary */}
                <div>
                  <span className="font-medium">Duration Pricing:</span>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <div className="border rounded p-2 text-center">
                      <div className="font-medium text-blue-600">Half Day</div>
                      <div>₹{formData.pricing.half_day_price}</div>
                    </div>
                    <div className="border rounded p-2 text-center bg-green-50">
                      <div className="font-medium text-green-600">Full Day</div>
                      <div>₹{formData.pricing.daily_rate}</div>
                    </div>
                    <div className="border rounded p-2 text-center">
                      <div className="font-medium text-purple-600">Extended Day</div>
                      <div>₹{formData.pricing.extended_day_price}</div>
                    </div>
                  </div>
                </div>
                
                {/* Meal Pricing Summary */}
                {formData.meal_plans.length > 0 && (
                  <div>
                    <span className="font-medium">Meals</span>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {formData.meal_plans.map(meal => {
                        const priceData = formData.meal_prices.find(mp => mp.meal_plan === meal);
                        const price = formData.pricing.pricing_type === 'per_person' 
                          ? priceData?.price_per_person || 0 
                          : priceData?.price_per_package || 0;
                        return (
                          <div key={meal} className="border rounded p-2">
                            <div className="font-medium text-orange-600">{meal}</div>
                            {/* <div>₹{price} {formData.pricing.pricing_type === 'per_person' ? '/person' : '/package'}</div> */}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
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
            <h1 className="text-2xl font-bold">{dayPicnicId ? 'Edit' : 'Create'} Day Picnic Experience</h1>
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
                {dayPicnicId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {dayPicnicId ? 'Update Day Picnic' : 'Create Day Picnic'}
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
