import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Button } from '@/components/owner/ui/button';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Textarea } from '@/components/owner/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/owner/ui/select';
import { Checkbox } from '@/components/owner/ui/checkbox';
import { Badge } from '@/components/owner/ui/badge';
import { Separator } from '@/components/owner/ui/separator';
import { Progress } from '@/components/owner/ui/progress';
import { toast } from '@/hooks/use-toast';
import { getAllStates, getCitiesByState, getPopularCitiesByState } from '@/data/indianLocations';

interface BookingComPropertyFormProps {
  onBack: () => void;
  editingProperty?: any;
  isEdit?: boolean;
  selectedType?: string;
  propertyName?: string;
}

interface BedConfig {
  type: string;
  count: number;
  room: string;
}

const BookingComPropertyForm: React.FC<BookingComPropertyFormProps> = ({ 
  onBack, 
  editingProperty, 
  isEdit = false,
  selectedType = '',
  propertyName = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Parse complex description to extract embedded data
  const parseDescription = (description: string) => {
    const extracted = {
      contactPhone: '',
      arrivalInstructions: '',
      mealPlans: [],
      licenseNumber: '',
      cleanDescription: description
    };

    // Extract contact phone
    const phoneMatch = description.match(/Contact:\s*([^\n]+)/);
    if (phoneMatch) {
      extracted.contactPhone = phoneMatch[1].trim();
      extracted.cleanDescription = extracted.cleanDescription.replace(/\*\*Property Details:\*\*[\s\S]*?(?=\n\n|$)/, '');
    }

    // Extract arrival instructions
    const arrivalMatch = description.match(/\*\*Arrival Instructions:\*\*\s*\n([^*]+?)(?=\n\*\*|$)/);
    if (arrivalMatch) {
      extracted.arrivalInstructions = arrivalMatch[1].trim();
    }

    // Extract meal plans
    const mealMatch = description.match(/\*\*Meal Plans:\*\*\s*([^\n]+)/);
    if (mealMatch) {
      extracted.mealPlans = mealMatch[1].split(',').map(plan => plan.trim()).filter(Boolean);
    }

    // Extract license number
    const licenseMatch = description.match(/\*\*License:\*\*\s*([^\n]+)/);
    if (licenseMatch) {
      extracted.licenseNumber = licenseMatch[1].trim();
    }

    // Clean up description by removing all metadata sections
    extracted.cleanDescription = extracted.cleanDescription
      .replace(/\*\*Property Details:\*\*[\s\S]*?(?=\n\n|$)/, '')
      .replace(/\*\*Arrival Instructions:\*\*[\s\S]*?(?=\n\n|$)/, '')
      .replace(/\*\*Meal Plans:\*\*[^\n]*\n?/, '')
      .replace(/\*\*License:\*\*[^\n]*\n?/, '')
      .trim();

    return extracted;
  };

  // Clean up scroll locks on unmount
  useEffect(() => {
    return () => {
      // Remove data-scroll-locked attribute
      document.documentElement.removeAttribute('data-scroll-locked');
      // Reset body overflow
      document.body.style.overflow = '';
    };
  }, []);

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    // Basic Information - Extended
    title: propertyName || '',
    description: '',
    property_type: selectedType || '',
    property_subtype: '',
    tagline: '',
    star_rating: '',
    license_number: '',
    
    // Location & Address - Extended
    address: '',
    state: '',
    city: '',
    area: '',
    country: 'India',
    postal_code: '',
    coordinates: { lat: '', lng: '' },
    landmarks: {
      airport_distance: '',
      train_station_distance: '',
      metro_distance: '',
      attractions: []
    },
    neighborhood_type: '',
    
    // Contact & Ownership - New section
    owner_name: '',
    manager_name: '',
    contact_phone: '',
    contact_email: '',
    emergency_contact: '',
    languages_spoken: [],
    
    // Room & Capacity Details - Extended
    max_guests: '',
    bedrooms: '',
    bathrooms: '',
    rooms_count: '',
    capacity_per_room: '',
    day_picnic_capacity: '',
    room_types: [],
    bed_configuration: { beds: [] as BedConfig[] },
    
    // Facilities & Amenities - Extended
    amenities: [],
    safety_features: [],
    accessibility_features: [],
    business_facilities: [],
    family_facilities: [],
    
    // Booking & Payment - Extended
    check_in_time: '15:00',
    check_out_time: '11:00',
    minimum_stay: 1,
    cancellation_policy: 'moderate',
    payment_methods: ['card', 'cash'],
    security_deposit: '',
    id_requirements: [],
    
    // Pricing Structure - Extended
    pricing: { 
      daily_rate: '', 
      currency: 'INR',
      weekend_rate: '',
      peak_season_rate: '',
      taxes_included: false,
      service_charges: ''
    },
    
    // House Rules & Policies - Extended
    house_rules: {
      smoking: 'not_allowed',
      pets: 'not_allowed',
      parties: 'not_allowed',
      quiet_hours: { start: '22:00', end: '08:00' },
      child_policy: '',
      additional_rules: []
    },
    
    // Services & Extras - Extended
    meal_plans: [],
    dining_options: [],
    restaurant_timings: '',
    special_diets: [],
    
    // Activities & Experiences - New section
    on_site_activities: [],
    nearby_activities: [],
    entertainment_options: [],
    
    // Business & Legal Information - Extended
    arrival_instructions: '',
    tax_information: {
      gst_number: '',
      pan_number: '',
      business_registration: ''
    },
    certificates: {
      fire_safety: false,
      government_license: '',
      local_authority_approval: ''
    },
    
    // Images & Media - Extended
    images: [],
    virtual_tour_url: '',
    video_url: ''
  });

  // Initialize form data when editing
  React.useEffect(() => {
    if (isEdit && editingProperty) {
      console.log('📝 Initializing form for editing:', editingProperty);
      
      // Parse description to extract embedded data
      const parsedDesc = parseDescription(editingProperty.description || '');
      
      setFormData({
        title: editingProperty.title || editingProperty.name || '',
        description: parsedDesc.cleanDescription,
        property_type: editingProperty.type || editingProperty.property_type || '',
        property_subtype: editingProperty.subtype || editingProperty.property_subtype || '',
        tagline: editingProperty.tagline || '',
        star_rating: editingProperty.star_rating?.toString() || '',
        license_number: parsedDesc.licenseNumber || editingProperty.license_number || '',
        
        address: editingProperty.location || editingProperty.address || '',
        state: editingProperty.state || editingProperty.location?.state || '',
        city: editingProperty.city || editingProperty.location?.city || '',
        area: editingProperty.area || '',
        country: editingProperty.country || 'India',
        postal_code: editingProperty.zip_code || editingProperty.postal_code || '',
        coordinates: { lat: editingProperty.latitude?.toString() || '', lng: editingProperty.longitude?.toString() || '' },
        landmarks: editingProperty.landmarks || {
          airport_distance: '',
          train_station_distance: '',
          metro_distance: '',
          attractions: []
        },
        neighborhood_type: editingProperty.neighborhood_type || '',
        
        owner_name: editingProperty.owner_name || '',
        manager_name: editingProperty.manager_name || '',
        contact_phone: parsedDesc.contactPhone || editingProperty.contact_phone || '',
        contact_email: editingProperty.contact_email || '',
        emergency_contact: editingProperty.emergency_contact || '',
        languages_spoken: editingProperty.languages_spoken || [],
        
        max_guests: editingProperty.capacity?.toString() || editingProperty.max_guests?.toString() || '',
        bedrooms: editingProperty.bedrooms?.toString() || '',
        bathrooms: editingProperty.bathrooms?.toString() || '',
        rooms_count: editingProperty.rooms_count?.toString() || '',
        capacity_per_room: editingProperty.capacity_per_room?.toString() || '',
        day_picnic_capacity: editingProperty.day_picnic_capacity?.toString() || '',
        room_types: editingProperty.room_types || [],
        bed_configuration: editingProperty.bed_configuration || { beds: [] },
        
        amenities: Array.isArray(editingProperty.amenities) ? editingProperty.amenities : [],
        safety_features: editingProperty.safety_features || [],
        accessibility_features: editingProperty.accessibility_features || [],
        business_facilities: editingProperty.business_facilities || [],
        family_facilities: editingProperty.family_facilities || [],
        
        check_in_time: editingProperty.check_in_time || '15:00',
        check_out_time: editingProperty.check_out_time || '11:00',
        minimum_stay: editingProperty.minimum_stay || 1,
        cancellation_policy: editingProperty.cancellation_policy || 'moderate',
        payment_methods: Array.isArray(editingProperty.payment_methods) ? editingProperty.payment_methods : ['card', 'cash'],
        security_deposit: editingProperty.security_deposit?.toString() || '',
        id_requirements: editingProperty.id_requirements || [],
        
        pricing: { 
          daily_rate: editingProperty.price?.toString() || editingProperty.pricing?.daily_rate?.toString() || '', 
          currency: editingProperty.pricing?.currency || 'INR',
          weekend_rate: editingProperty.pricing?.weekend_rate?.toString() || '',
          peak_season_rate: editingProperty.pricing?.peak_season_rate?.toString() || '',
          taxes_included: editingProperty.pricing?.taxes_included || false,
          service_charges: editingProperty.pricing?.service_charges?.toString() || ''
        },
        
        house_rules: editingProperty.house_rules || {
          smoking: 'not_allowed',
          pets: 'not_allowed', 
          parties: 'not_allowed',
          quiet_hours: { start: '22:00', end: '08:00' },
          child_policy: '',
          additional_rules: []
        },
        
        meal_plans: parsedDesc.mealPlans.length > 0 ? parsedDesc.mealPlans : (Array.isArray(editingProperty.meal_plans) ? editingProperty.meal_plans : []),
        dining_options: editingProperty.dining_options || [],
        restaurant_timings: editingProperty.restaurant_timings || '',
        special_diets: editingProperty.special_diets || [],
        
        on_site_activities: editingProperty.on_site_activities || [],
        nearby_activities: editingProperty.nearby_activities || [],
        entertainment_options: editingProperty.entertainment_options || [],
        
        arrival_instructions: parsedDesc.arrivalInstructions || editingProperty.arrival_instructions || '',
        tax_information: editingProperty.tax_information || {
          gst_number: '',
          pan_number: '',
          business_registration: ''
        },
        certificates: editingProperty.certificates || {
          fire_safety: false,
          government_license: '',
          local_authority_approval: ''
        },
        
        images: Array.isArray(editingProperty.images) ? editingProperty.images : [],
        virtual_tour_url: editingProperty.virtual_tour_url || '',
        video_url: editingProperty.video_url || ''
      });
    }
  }, [isEdit, editingProperty]);

  // Enhanced property types with subcategories (similar to Booking.com)
  const propertyTypes = {
    'hotel': {
      label: 'Hotels',
      subtypes: ['Luxury Hotel', 'Business Hotel', 'Boutique Hotel', 'Resort Hotel', 'Airport Hotel', 'Casino Hotel']
    },
    'apartment': {
      label: 'Apartments',
      subtypes: ['Studio', '1 Bedroom', '2 Bedroom', '3+ Bedroom', 'Penthouse', 'Serviced Apartment']
    },
    'villa': {
      label: 'Villas',
      subtypes: ['Luxury Villa', 'Beach Villa', 'Hill Villa', 'Private Pool Villa', 'Heritage Villa']
    },
    'vacation_home': {
      label: 'Vacation Homes',
      subtypes: ['Beach House', 'Mountain Cabin', 'Lake House', 'Country House', 'City Home']
    },
    'house': {
      label: 'Houses',
      subtypes: ['Independent House', 'Row House', 'Duplex', 'Bungalow', 'Farmhouse']
    },
    'resort': {
      label: 'Resorts',
      subtypes: ['Beach Resort', 'Hill Resort', 'Spa Resort', 'Adventure Resort', 'Golf Resort']
    },
    'homestay': {
      label: 'Homestays',
      subtypes: ['Family Homestay', 'Budget Homestay', 'Luxury Homestay', 'Heritage Homestay']
    },
    'guest_house': {
      label: 'Guest Houses',
      subtypes: ['Budget Guest House', 'Luxury Guest House', 'Heritage Guest House']
    },
    'day_picnic': {
      label: 'Day Picnic',
      subtypes: ['Garden Picnic', 'Lakeside Picnic', 'Beach Picnic', 'Farm Picnic', 'Hill Station Picnic', 'Resort Day Picnic']
    }
  };

  // Comprehensive amenities (categorized like Booking.com)
  const amenitiesCategories = {
    'Popular': {
      icon: '⭐',
      items: ['Free WiFi', 'Swimming Pool', 'Parking', 'Air Conditioning', 'Restaurant', 'Fitness Center', 'Spa', 'Pet Friendly']
    },
    'Internet': {
      icon: '📶',
      items: ['Free WiFi', 'High-Speed Internet', 'WiFi in all areas', 'Internet services', 'WiFi in public areas']
    },
    'Parking': {
      icon: '🚗',
      items: ['Free parking', 'Paid parking', 'Valet parking', 'Electric vehicle charging', 'Secure parking', 'Street parking']
    },
    'Kitchen': {
      icon: '🍳',
      items: ['Full Kitchen', 'Kitchenette', 'Microwave', 'Refrigerator', 'Coffee/Tea Maker', 'Dishwasher', 'Oven', 'Stovetop']
    },
    'Bathroom': {
      icon: '🛁',
      items: ['Hot Water', 'Bathtub', 'Shower', 'Hair Dryer', 'Toiletries', 'Towels', 'Bidet', 'Separate toilet']
    },
    'Bedroom': {
      icon: '🛏️',
      items: ['Comfortable Bedding', 'Extra Pillows', 'Blackout Curtains', 'Wardrobe', 'Iron/Ironing Board', 'Safe']
    },
    'Entertainment': {
      icon: '📺',
      items: ['Cable TV', 'Smart TV', 'Netflix', 'Amazon Prime', 'Gaming Console', 'Books/Library', 'Music System']
    },
    'Climate Control': {
      icon: '❄️',
      items: ['Air Conditioning', 'Heating', 'Fan', 'Fireplace', 'Thermostat']
    },
    'Outdoor': {
      icon: '🌳',
      items: ['Balcony', 'Terrace', 'Garden', 'Swimming Pool', 'BBQ Area', 'Outdoor Furniture', 'Sun Loungers']
    },
    'Safety & Security': {
      icon: '🔒',
      items: ['Security', 'CCTV', 'Safe', 'First Aid', 'Fire Extinguisher', 'Smoke Detector', 'Security Guard']
    },
    'Services': {
      icon: '🛎️',
      items: ['Housekeeping', 'Laundry', 'Room Service', 'Concierge', 'Airport Shuttle', 'Grocery Delivery']
    },
    'Business': {
      icon: '💼',
      items: ['Workspace', 'Printer', 'Fast WiFi', 'Meeting Room', 'Business Center', 'Fax Service']
    },
    'Family': {
      icon: '👶',
      items: ['Crib', 'High Chair', 'Child Safety', 'Toys', 'Baby Bath', 'Playground', 'Babysitting']
    },
    'Accessibility': {
      icon: '♿',
      items: ['Wheelchair Access', 'Elevator', 'Accessible Bathroom', 'Braille', 'Audio Guidance']
    }
  };

  const bedTypes = [
    { value: 'single', label: 'Single Bed', capacity: 1 },
    { value: 'double', label: 'Double Bed', capacity: 2 },
    { value: 'queen', label: 'Queen Bed', capacity: 2 },
    { value: 'king', label: 'King Bed', capacity: 2 },
    { value: 'sofa_bed', label: 'Sofa Bed', capacity: 1 },
    { value: 'bunk_bed', label: 'Bunk Bed', capacity: 2 },
    { value: 'murphy_bed', label: 'Murphy Bed', capacity: 1 },
    { value: 'futon', label: 'Futon', capacity: 1 }
  ];

  const paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'digital_wallet', label: 'Digital Wallet', icon: '📲' },
    { value: 'crypto', label: 'Cryptocurrency', icon: '₿' }
  ];

  const mealPlans = [
    { value: 'breakfast', label: 'Breakfast Included', icon: '🥞' },
    { value: 'half_board', label: 'Half Board (Breakfast + Dinner)', icon: '🍽️' },
    { value: 'full_board', label: 'Full Board (All Meals)', icon: '🍱' },
    { value: 'all_inclusive', label: 'All Inclusive', icon: '🎉' }
  ];

  const cancellationPolicies = [
    { 
      value: 'flexible', 
      label: 'Flexible', 
      description: 'Free cancellation 24 hours before check-in',
      color: 'bg-green-100 text-green-800'
    },
    { 
      value: 'moderate', 
      label: 'Moderate', 
      description: 'Free cancellation 5 days before check-in',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      value: 'strict', 
      label: 'Strict', 
      description: '50% refund up to 14 days before check-in',
      color: 'bg-orange-100 text-orange-800'
    },
    { 
      value: 'super_strict', 
      label: 'Super Strict', 
      description: 'No refund after booking',
      color: 'bg-red-100 text-red-800'
    }
  ];

  const steps = [
    { number: 1, title: 'Property Basics', description: 'Name, type, description and rating' },
    { number: 2, title: 'Location & Contact', description: 'Address, landmarks and contact details' },
    { number: 3, title: 'Rooms & Capacity', description: 'Beds, bathrooms and guest capacity' },
    { number: 4, title: 'Facilities & Amenities', description: 'All features your property offers' },
    { number: 5, title: 'Policies & Rules', description: 'Booking rules and house policies' },
    { number: 6, title: 'Pricing & Services', description: 'Rates, meals and additional services' },
    { number: 7, title: 'Activities & Experiences', description: 'Entertainment and nearby attractions' },
    { number: 8, title: 'Legal & Business Info', description: 'Certificates, tax info and documents' },
    { number: 9, title: 'Photos & Final Review', description: 'Upload images and review details' }
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleStateChange = (state: string) => {
    const cities = getCitiesByState(state);
    setAvailableCities(cities);
    setFormData(prev => ({
      ...prev,
      state,
      city: '', // Reset city when state changes
      address: generateAddress(state, '', prev.area)
    }));
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({
      ...prev,
      city,
      address: generateAddress(prev.state, city, prev.area)
    }));
  };

  const handleAreaChange = (area: string) => {
    setFormData(prev => ({
      ...prev,
      area,
      address: generateAddress(prev.state, prev.city, area)
    }));
  };

  const generateAddress = (state: string, city: string, area: string) => {
    const parts = [area, city, state, 'India'].filter(Boolean);
    return parts.join(', ');
  };

  // Initialize cities when state is set during editing
  React.useEffect(() => {
    if (formData.state && !availableCities.length) {
      const cities = getCitiesByState(formData.state);
      setAvailableCities(cities);
    }
  }, [formData.state, availableCities.length]);

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  const addBedConfiguration = () => {
    setFormData(prev => ({
      ...prev,
      bed_configuration: {
        beds: [...prev.bed_configuration.beds, { type: 'single', count: 1, room: `Room ${prev.bed_configuration.beds.length + 1}` }]
      }
    }));
  };

  const updateBedConfiguration = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      bed_configuration: {
        beds: prev.bed_configuration.beds.map((bed, i) => 
          i === index ? { ...bed, [field]: value } : bed
        )
      }
    }));
  };

  const removeBedConfiguration = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bed_configuration: {
        beds: prev.bed_configuration.beds.filter((_, i) => i !== index)
      }
    }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.title && formData.description && formData.property_type && formData.description.length >= 50);
      case 2:
        return !!(formData.state && formData.city && formData.postal_code && formData.contact_phone);
      case 3:
        return !!(formData.max_guests && formData.bedrooms && formData.bathrooms);
      case 4:
        return formData.amenities.length > 0;
      case 5:
        return !!(formData.cancellation_policy && formData.payment_methods.length > 0);
      case 6:
        return !!(formData.pricing.daily_rate && Number(formData.pricing.daily_rate) >= 500);
      case 7:
        return formData.on_site_activities.length > 0 || formData.nearby_activities.length > 0;
      case 8:
        return !!(formData.arrival_instructions);
      case 9:
        return true; // Final step, validation happens on submit
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save a property.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Transform comprehensive form data to match PropertyFormData interface
      const transformedData = {
        name: formData.title,
        type: formData.property_type,
        location: `${formData.city}, ${formData.state}`, // Generate clean location string
        city: formData.city,
        state: formData.state,
        price: Number(formData.pricing.daily_rate),
        capacity: Number(formData.max_guests),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        rooms_count: formData.rooms_count ? Number(formData.rooms_count) : null,
        capacity_per_room: formData.capacity_per_room ? Number(formData.capacity_per_room) : null,
        day_picnic_capacity: formData.day_picnic_capacity ? Number(formData.day_picnic_capacity) : null,
        description: formData.description,
        amenities: formData.amenities,
        images: formData.images,
        postal_code: formData.postal_code,
        contact_phone: formData.contact_phone,
        license_number: formData.license_number
      };

      // Store additional data in the description or as metadata
      const enhancedDescription = `${formData.description}

**Property Details:**
- Check-in: ${formData.check_in_time} | Check-out: ${formData.check_out_time}
- Minimum Stay: ${formData.minimum_stay} night(s)
- Cancellation Policy: ${formData.cancellation_policy}
- Payment Methods: ${formData.payment_methods.join(', ')}
- Contact: ${formData.contact_phone}

**Arrival Instructions:**
${formData.arrival_instructions}

${formData.meal_plans.length > 0 ? `**Meal Plans:** ${formData.meal_plans.join(', ')}` : ''}
${formData.license_number ? `**License:** ${formData.license_number}` : ''}`;

      const propertyData = {
        ...transformedData,
        description: enhancedDescription
      };

      let result;
      if (isEdit && editingProperty) {
        result = await PropertyService.updateProperty(editingProperty.id, propertyData);
      } else {
        result = await PropertyService.addProperty(propertyData, user.id);
      }

      if (result) {
        toast({
          title: "Success!",
          description: `Property ${isEdit ? 'updated' : 'added'} successfully.`,
        });
        
        // Handle Day Picnic redirect
        if (formData.property_type === 'day_picnic' && !isEdit) {
          toast({
            title: "Day Picnic Property Added!",
            description: "Your property is now visible in the Day Picnics section.",
          });
          // Add a small delay to ensure the property is saved, then redirect
          setTimeout(() => {
            window.location.href = '/properties?tab=day_picnics';
          }, 1500);
        } else {
          setTimeout(() => onBack(), 2000);
        }
      }
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: "Failed to save property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Property Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your property name (e.g., Luxury Beachfront Villa)"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_type">Property Type *</Label>
                <Select value={formData.property_type} onValueChange={(value) => handleInputChange('property_type', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(propertyTypes).map(([key, type]) => (
                      <SelectItem key={key} value={key}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.property_type && (
                <div>
                  <Label htmlFor="property_subtype">Property Subtype</Label>
                  <Select value={formData.property_subtype} onValueChange={(value) => handleInputChange('property_subtype', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select subtype" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes[formData.property_type as keyof typeof propertyTypes]?.subtypes.map((subtype) => (
                        <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description * (minimum 50 characters)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your property in detail. What makes it special? What can guests expect?"
                rows={4}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                {formData.description.length}/50 characters minimum
              </div>
            </div>

            <div>
              <Label htmlFor="tagline">Property Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="A catchy tagline for your property (e.g., 'Your Home Away From Home')"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="star_rating">Star Rating (Optional)</Label>
              <Select value={formData.star_rating} onValueChange={(value) => handleInputChange('star_rating', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select star rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="license_number">License/Registration Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                placeholder="Enter your property license or registration number"
                className="mt-2"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State/Union Territory *</Label>
                <Select value={formData.state} onValueChange={handleStateChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {getAllStates().map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={handleCityChange}
                  disabled={!formData.state}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={formData.state ? "Select your city" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {formData.state && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b">
                          Popular Cities
                        </div>
                        {getPopularCitiesByState(formData.state).map((city) => (
                          <SelectItem key={city} value={city}>
                            <span className="flex items-center gap-2">
                              ⭐ {city}
                            </span>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-t">
                          All Cities
                        </div>
                        {availableCities.filter(city => !getPopularCitiesByState(formData.state).includes(city)).map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="area">Area/Locality</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => handleAreaChange(e.target.value)}
                placeholder="Enter specific area, locality, or neighborhood"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Complete Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="This will be auto-generated from your selections above, or you can edit it manually"
                rows={3}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Address is automatically generated from your state, city, and area selections
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="Enter postal/ZIP code"
                  className="mt-2"
                />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="Enter contact phone number"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="Enter contact email"
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner_name">Owner/Manager Name</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => handleInputChange('owner_name', e.target.value)}
                    placeholder="Enter owner or manager name"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="Emergency contact number"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">🇮🇳 India</SelectItem>
                    <SelectItem value="USA">🇺🇸 United States</SelectItem>
                    <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                    <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude (Optional)</Label>
                <Input
                  id="lat"
                  value={formData.coordinates.lat}
                  onChange={(e) => handleInputChange('coordinates.lat', e.target.value)}
                  placeholder="e.g., 19.0760"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="lng">Longitude (Optional)</Label>
                <Input
                  id="lng"
                  value={formData.coordinates.lng}
                  onChange={(e) => handleInputChange('coordinates.lng', e.target.value)}
                  placeholder="e.g., 72.8777"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Capacity Configuration - Dynamic based on property type */}
            {formData.property_type === 'day_picnic' ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-3">Day Picnic Capacity</h4>
                <div>
                  <Label htmlFor="day_picnic_capacity">Maximum Day Picnic Guests *</Label>
                  <Input
                    id="day_picnic_capacity"
                    type="number"
                    min="1"
                    value={formData.day_picnic_capacity}
                    onChange={(e) => {
                      handleInputChange('day_picnic_capacity', e.target.value);
                      handleInputChange('max_guests', e.target.value); // Auto-sync max_guests
                    }}
                    placeholder="e.g., 150"
                    className="mt-2"
                  />
                  <p className="text-sm text-orange-600 mt-1">
                    Total guests allowed for day picnic events
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Stay Property Capacity</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rooms_count">Number of Rooms *</Label>
                    <Input
                      id="rooms_count"
                      type="number"
                      min="1"
                      value={formData.rooms_count}
                      onChange={(e) => {
                        handleInputChange('rooms_count', e.target.value);
                        // Auto-calculate max_guests when both fields are filled
                        if (formData.capacity_per_room) {
                          const newMaxGuests = Number(e.target.value) * Number(formData.capacity_per_room);
                          handleInputChange('max_guests', newMaxGuests.toString());
                        }
                      }}
                      placeholder="e.g., 3"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacity_per_room">Capacity per Room *</Label>
                    <Input
                      id="capacity_per_room"
                      type="number"
                      min="1"
                      value={formData.capacity_per_room}
                      onChange={(e) => {
                        handleInputChange('capacity_per_room', e.target.value);
                        // Auto-calculate max_guests when both fields are filled
                        if (formData.rooms_count) {
                          const newMaxGuests = Number(formData.rooms_count) * Number(e.target.value);
                          handleInputChange('max_guests', newMaxGuests.toString());
                        }
                      }}
                      placeholder="e.g., 4"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_guests">Total Capacity *</Label>
                    <Input
                      id="max_guests"
                      type="number"
                      min="1"
                      value={formData.max_guests}
                      onChange={(e) => handleInputChange('max_guests', e.target.value)}
                      className="mt-2 bg-gray-50"
                      readOnly
                    />
                    <p className="text-sm text-blue-600 mt-1">
                      {formData.rooms_count && formData.capacity_per_room 
                        ? `${formData.rooms_count} rooms × ${formData.capacity_per_room} guests each = ${formData.max_guests || 0} total`
                        : 'Calculated automatically'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Bed Configuration</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBedConfiguration}
                >
                  Add Bed
                </Button>
              </div>

              <div className="space-y-4">
                {formData.bed_configuration.beds.map((bed, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <Label>Room</Label>
                        <Input
                          value={bed.room}
                          onChange={(e) => updateBedConfiguration(index, 'room', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Bed Type</Label>
                        <Select
                          value={bed.type}
                          onValueChange={(value) => updateBedConfiguration(index, 'type', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {bedTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Count</Label>
                        <Input
                          type="number"
                          min="1"
                          value={bed.count}
                          onChange={(e) => updateBedConfiguration(index, 'count', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBedConfiguration(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">Select Amenities *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose all amenities that your property offers
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(amenitiesCategories).map(([category, { icon, items }]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{icon}</span>
                    <h3 className="font-semibold">{category}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onCheckedChange={() => handleArrayToggle('amenities', amenity)}
                        />
                        <Label htmlFor={`amenity-${amenity}`} className="text-sm">
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>

            {formData.amenities.length > 0 && (
              <div>
                <Label className="font-semibold">Selected Amenities ({formData.amenities.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">Booking Rules</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="check_in_time">Check-in Time</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="check_out_time">Check-out Time</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="minimum_stay">Minimum Stay (nights)</Label>
                <Input
                  id="minimum_stay"
                  type="number"
                  min="1"
                  value={formData.minimum_stay}
                  onChange={(e) => handleInputChange('minimum_stay', Number(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label className="font-semibold">Cancellation Policy *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {cancellationPolicies.map((policy) => (
                  <div
                    key={policy.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.cancellation_policy === policy.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('cancellation_policy', policy.value)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${policy.color}`}>
                        {policy.label}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="font-semibold">Payment Methods *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {paymentMethods.map((method) => (
                  <div key={method.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-${method.value}`}
                      checked={formData.payment_methods.includes(method.value)}
                      onCheckedChange={() => handleArrayToggle('payment_methods', method.value)}
                    />
                    <Label htmlFor={`payment-${method.value}`} className="text-sm flex items-center gap-2">
                      <span>{method.icon}</span>
                      {method.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="font-semibold">House Rules</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <Label htmlFor="smoking">Smoking</Label>
                  <Select value={formData.house_rules.smoking} onValueChange={(value) => handleInputChange('house_rules.smoking', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allowed">Allowed</SelectItem>
                      <SelectItem value="not_allowed">Not Allowed</SelectItem>
                      <SelectItem value="designated_areas">Designated Areas Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pets">Pets</Label>
                  <Select value={formData.house_rules.pets} onValueChange={(value) => handleInputChange('house_rules.pets', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allowed">Allowed</SelectItem>
                      <SelectItem value="not_allowed">Not Allowed</SelectItem>
                      <SelectItem value="with_approval">With Prior Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="parties">Parties/Events</Label>
                  <Select value={formData.house_rules.parties} onValueChange={(value) => handleInputChange('house_rules.parties', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allowed">Allowed</SelectItem>
                      <SelectItem value="not_allowed">Not Allowed</SelectItem>
                      <SelectItem value="with_approval">With Prior Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold">Pricing</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily_rate">Daily Rate *</Label>
                <div className="relative mt-2">
                  <Input
                    id="daily_rate"
                    type="number"
                    min="500"
                    value={formData.pricing.daily_rate}
                    onChange={(e) => handleInputChange('pricing.daily_rate', e.target.value)}
                    className="pl-8"
                    placeholder="0"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Minimum ₹500 per night</p>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.pricing.currency} onValueChange={(value) => handleInputChange('pricing.currency', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-semibold">Meal Plans (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {mealPlans.map((plan) => (
                  <div key={plan.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`meal-${plan.value}`}
                      checked={formData.meal_plans.includes(plan.value)}
                      onCheckedChange={() => handleArrayToggle('meal_plans', plan.value)}
                    />
                    <Label htmlFor={`meal-${plan.value}`} className="text-sm flex items-center gap-2">
                      <span>{plan.icon}</span>
                      {plan.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-lg mb-4">Activities & Entertainment</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>On-site Activities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {['Swimming', 'Gym', 'Spa', 'Games Room', 'Library', 'Garden Tours', 'Yoga Classes', 'Cooking Classes'].map((activity) => (
                      <div key={activity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`onsite-${activity}`}
                          checked={formData.on_site_activities.includes(activity)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange('on_site_activities', [...formData.on_site_activities, activity]);
                            } else {
                              handleInputChange('on_site_activities', formData.on_site_activities.filter(item => item !== activity));
                            }
                          }}
                        />
                        <Label htmlFor={`onsite-${activity}`} className="text-sm">{activity}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Nearby Attractions & Activities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {['Beach', 'Hiking Trails', 'Shopping Mall', 'Restaurants', 'Tourist Sites', 'Adventure Sports', 'Museums', 'Markets'].map((activity) => (
                      <div key={activity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`nearby-${activity}`}
                          checked={formData.nearby_activities.includes(activity)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange('nearby_activities', [...formData.nearby_activities, activity]);
                            } else {
                              handleInputChange('nearby_activities', formData.nearby_activities.filter(item => item !== activity));
                            }
                          }}
                        />
                        <Label htmlFor={`nearby-${activity}`} className="text-sm">{activity}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Entertainment Options</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {['Live Music', 'DJ Events', 'Cultural Shows', 'Movie Nights', 'Karaoke', 'Dance Floor', 'Game Tournaments', 'Theme Parties'].map((entertainment) => (
                      <div key={entertainment} className="flex items-center space-x-2">
                        <Checkbox
                          id={`entertainment-${entertainment}`}
                          checked={formData.entertainment_options.includes(entertainment)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange('entertainment_options', [...formData.entertainment_options, entertainment]);
                            } else {
                              handleInputChange('entertainment_options', formData.entertainment_options.filter(item => item !== entertainment));
                            }
                          }}
                        />
                        <Label htmlFor={`entertainment-${entertainment}`} className="text-sm">{entertainment}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-lg mb-4">Business & Legal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="arrival_instructions">Arrival Instructions *</Label>
                  <Textarea
                    id="arrival_instructions"
                    value={formData.arrival_instructions}
                    onChange={(e) => handleInputChange('arrival_instructions', e.target.value)}
                    placeholder="Provide detailed check-in instructions for guests..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gst_number">GST Number</Label>
                    <Input
                      id="gst_number"
                      value={formData.tax_information.gst_number}
                      onChange={(e) => handleInputChange('tax_information', { ...formData.tax_information, gst_number: e.target.value })}
                      placeholder="Enter GST number"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input
                      id="pan_number"
                      value={formData.tax_information.pan_number}
                      onChange={(e) => handleInputChange('tax_information', { ...formData.tax_information, pan_number: e.target.value })}
                      placeholder="Enter PAN number"
                      className="mt-2"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="business_registration">Business Registration Certificate</Label>
                  <Input
                    id="business_registration"
                    value={formData.tax_information.business_registration}
                    onChange={(e) => handleInputChange('tax_information', { ...formData.tax_information, business_registration: e.target.value })}
                    placeholder="Enter business registration number"
                    className="mt-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Certificates & Licenses</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fire_safety"
                        checked={formData.certificates.fire_safety}
                        onCheckedChange={(checked) => 
                          handleInputChange('certificates', { ...formData.certificates, fire_safety: !!checked })
                        }
                      />
                      <Label htmlFor="fire_safety">Fire Safety Certificate</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="government_license">Government License Number</Label>
                      <Input
                        id="government_license"
                        value={formData.certificates.government_license}
                        onChange={(e) => handleInputChange('certificates', { ...formData.certificates, government_license: e.target.value })}
                        placeholder="Enter government license number"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 9:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Property Images</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add high-quality images to showcase your property (up to 10 images)
              </p>
              
              {/* Current Images Display */}
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Current Images ({formData.images.length}/10)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KICA8L3N2Zz4K';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            handleInputChange('images', newImages);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Image URL */}
              {formData.images.length < 10 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newImageUrl">Add Image URL</Label>
                    <div className="flex gap-2">
                      <input
                        id="newImageUrl"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const url = input.value.trim();
                            if (url && formData.images.length < 10) {
                              handleInputChange('images', [...formData.images, url]);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                          const url = input.value.trim();
                          if (url && formData.images.length < 10) {
                            handleInputChange('images', [...formData.images, url]);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Press Enter or click Add to include the image
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-lg font-semibold">Contact & Instructions</Label>
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone Number *</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="Enter your contact number"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="arrival_instructions">Arrival Instructions *</Label>
              <Textarea
                id="arrival_instructions"
                value={formData.arrival_instructions}
                onChange={(e) => handleInputChange('arrival_instructions', e.target.value)}
                placeholder="Provide detailed instructions for guests on how to reach and check into your property"
                rows={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="font-semibold">Property Summary</Label>
              <div className="bg-muted/50 rounded-lg p-4 mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Property Name:</span>
                  <span className="text-sm font-medium">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="text-sm font-medium">
                    {propertyTypes[formData.property_type as keyof typeof propertyTypes]?.label}
                    {formData.property_subtype && ` - ${formData.property_subtype}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Capacity:</span>
                  <span className="text-sm font-medium">{formData.max_guests} guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bedrooms/Bathrooms:</span>
                  <span className="text-sm font-medium">{formData.bedrooms} bed / {formData.bathrooms} bath</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Rate:</span>
                  <span className="text-sm font-medium">₹{formData.pricing.daily_rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amenities:</span>
                  <span className="text-sm font-medium">{formData.amenities.length} selected</span>
                </div>
                {formData.images.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Images:</span>
                    <span className="text-sm font-medium">{formData.images.length} image(s)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mr-4"
          >
            ← Back to Properties
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {isEdit ? 'Edit Property' : 'Add New Property'}
            </h1>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-muted/20 px-6 py-4">
        <div className="container">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {currentStep}
                </span>
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !validateCurrentStep()}
                >
                  {isLoading ? 'Saving...' : isEdit ? 'Update Property' : 'Add Property'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingComPropertyForm;