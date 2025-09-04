import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/owner/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { Progress } from '@/components/owner/ui/progress';
import { Separator } from '@/components/owner/ui/separator';
import { ArrowLeft, ArrowRight, Save, Eye, Upload, X, Check } from 'lucide-react';

// Step Components
import BasicDetails from './wizard/BasicDetails';
import RoomsUnits from './wizard/RoomsUnits';
import PropertyAmenities from './wizard/PropertyAmenities';
import PhotosMedia from './wizard/PhotosMedia';
import PoliciesPricing from './wizard/PoliciesPricing';
import SafetySecurity from './wizard/SafetySecurity';
import LocationNearby from './wizard/LocationNearby';
import ReviewSubmit from './wizard/ReviewSubmit';

export interface PropertyFormData {
  // Basic Details
  title: string;
  property_type: string;
  property_subtype: string;
  description: string;
  address: string;
  postal_code: string;
  country: string;
  contact_phone: string;
  license_number: string;
  star_rating: number;
  languages_spoken: string[];
  
  // Location
  location: {
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Rooms & Units
  rooms_count: number;
  capacity_per_room: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  day_picnic_capacity?: number;
  rooms_details: {
    types: Array<{ type: string; count: number; size?: string }>;
    configurations: Record<string, any>;
    amenities_per_room: Record<string, string[]>;
  };
  
  // Amenities
  amenities: string[];
  amenities_details: {
    property_facilities: string[];
    room_features: string[];
    connectivity: Record<string, any>;
    recreation: string[];
    services: string[];
    accessibility: string[];
  };
  facilities: {
    parking: Record<string, any>;
    internet: Record<string, any>;
    recreation: string[];
    business: string[];
    family: string[];
  };
  
  // Pricing & Policies
  pricing: {
    currency: string;
    daily_rate: number;
  };
  seasonal_pricing: {
    seasons: Array<{ name: string; rate: number; start_date: string; end_date: string }>;
    special_rates: Record<string, number>;
    discounts: Record<string, number>;
  };
  minimum_stay: number;
  cancellation_policy: string;
  check_in_time: string;
  check_out_time: string;
  payment_methods: string[];
  policies_extended: {
    child_policy: Record<string, any>;
    pet_policy: Record<string, any>;
    smoking_policy: Record<string, any>;
    damage_policy: Record<string, any>;
    group_booking_policy: Record<string, any>;
  };
  
  // Safety & Security
  safety_security: {
    fire_safety: string[];
    security_features: string[];
    emergency_procedures: string[];
    health_safety: string[];
  };
  
  // Nearby & Transport
  nearby_attractions: {
    landmarks: Array<{ name: string; distance: string; type: string }>;
    transport: Record<string, any>;
    dining: Array<{ name: string; cuisine: string; distance: string }>;
    entertainment: Array<{ name: string; type: string; distance: string }>;
    distances: Record<string, string>;
  };
  
  // Photos & Media
  images: string[];
  photos_with_captions: Array<{
    image_url: string;
    caption: string;
    alt_text: string;
    category: string;
    display_order: number;
    is_primary: boolean;
  }>;
  
  // Extra Services
  extra_services: {
    meals: Record<string, any>;
    transportation: string[];
    activities: string[];
    spa_wellness: string[];
  };
  meal_plans: string[];
  
  // Bed Configuration
  bed_configuration: {
    beds: Record<string, number>;
  };
  
  // Day Picnic specific
  day_picnic_duration_category?: string;
}

interface PropertyWizardProps {
  onBack: () => void;
  propertyId?: string;
  initialTitle?: string;
  initialPropertyType?: string;
}

const WIZARD_STEPS = [
  { id: 'basic', title: 'Basic Details', description: 'Property name, type, and description' },
  { id: 'rooms', title: 'Rooms & Units', description: 'Room types, capacity, and configurations' },
  { id: 'amenities', title: 'Amenities & Facilities', description: 'Property and room amenities' },
  { id: 'photos', title: 'Photos & Media', description: 'Upload images with captions' },
  { id: 'policies', title: 'Pricing & Policies', description: 'Rates, rules, and payment methods' },
  { id: 'safety', title: 'Safety & Security', description: 'Safety features and procedures' },
  { id: 'location', title: 'Location & Nearby', description: 'Attractions and transport options' },
  { id: 'review', title: 'Review & Submit', description: 'Final review and submission' }
];

const PropertyWizard: React.FC<PropertyWizardProps> = ({ onBack, propertyId, initialTitle, initialPropertyType }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    // Initialize with default values
    title: '',
    property_type: '',
    property_subtype: '',
    description: '',
    address: '',
    postal_code: '',
    country: 'India',
    contact_phone: '',
    license_number: '',
    star_rating: 3,
    languages_spoken: ['English', 'Hindi'],
    location: { city: '', state: '' },
    rooms_count: 1,
    capacity_per_room: 2,
    max_guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    rooms_details: { types: [], configurations: {}, amenities_per_room: {} },
    amenities: [],
    amenities_details: {
      property_facilities: [],
      room_features: [],
      connectivity: {},
      recreation: [],
      services: [],
      accessibility: []
    },
    facilities: {
      parking: {},
      internet: {},
      recreation: [],
      business: [],
      family: []
    },
    pricing: { currency: 'INR', daily_rate: 1000 },
    seasonal_pricing: { seasons: [], special_rates: {}, discounts: {} },
    minimum_stay: 1,
    cancellation_policy: 'moderate',
    check_in_time: '15:00',
    check_out_time: '11:00',
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
    images: [],
    photos_with_captions: [],
    extra_services: {
      meals: {},
      transportation: [],
      activities: [],
      spa_wellness: []
    },
    meal_plans: [],
    bed_configuration: { beds: {} }
  });

  // Handle authentication and load saved draft
  useEffect(() => {
    // Check if we have a saved session in localStorage (for refresh scenarios)
    const savedSession = localStorage.getItem('supabase.auth.token');
    const hasSavedSession = savedSession && savedSession !== 'null';
    
    // Add a small delay to ensure auth state is fully loaded after page refresh
    const authCheckTimeout = setTimeout(() => {
      console.log('🔍 PropertyWizard: Auth check - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.email, 'role:', user?.role, 'hasSavedSession:', hasSavedSession);
      
      if (loading) {
        console.log('⏳ PropertyWizard: Auth still loading, waiting...');
        return; // Wait for auth to load
      }
      
      if (!isAuthenticated || !user) {
        console.log('❌ PropertyWizard: User not authenticated after timeout');
        
        // If we have a saved session but auth is not working, give more time
        if (hasSavedSession) {
          console.log('🔄 PropertyWizard: Found saved session, giving more time for auth to load...');
          setTimeout(() => {
            if (!isAuthenticated || !user) {
              console.log('❌ PropertyWizard: Still not authenticated after extended wait');
              toast({
                title: "Session Expired",
                description: "Please sign in again to continue creating your property.",
                variant: "destructive"
              });
              onBack();
            }
          }, 3000); // Give 3 more seconds for saved sessions
        } else {
          // No saved session, redirect immediately
          toast({
            title: "Authentication Required",
            description: "Please sign in to continue creating your property.",
            variant: "destructive"
          });
          onBack();
        }
        return;
      }
      
      // More flexible role checking - allow both property_owner and owner roles
      const validRoles = ['property_owner', 'owner', 'user', 'customer']; // Added more fallback roles
      if (!validRoles.includes(user.role)) {
        console.log('❌ PropertyWizard: User not property owner, role:', user.role);
        toast({
          title: "Access Denied",
          description: "Only property owners can create properties.",
          variant: "destructive"
        });
        onBack();
        return;
      }
      
      console.log('✅ PropertyWizard: Authentication verified, user:', user.email, 'role:', user.role);
      setAuthChecked(true);
      
      // Load saved draft
      const savedDraft = localStorage.getItem(`property_draft_${user.id}`);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData(draftData);
          console.log('📝 Loaded saved draft');
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }, 1000); // 1 second delay for stability

    return () => clearTimeout(authCheckTimeout);
  }, [user, isAuthenticated, loading, onBack, toast]);

  // Auto-save functionality
  useEffect(() => {
    if (!authChecked) return; // Don't auto-save until auth is checked
    
    const saveInterval = setInterval(() => {
      if (formData.title && formData.property_type) {
        autoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [formData, authChecked]);

  // Load existing property data if editing or initialize with props
  useEffect(() => {
    if (propertyId) {
      loadPropertyData();
    } else if (initialTitle || initialPropertyType) {
      setFormData(prev => ({
        ...prev,
        title: initialTitle || prev.title,
        property_type: initialPropertyType || prev.property_type
      }));
    }
  }, [propertyId, initialTitle, initialPropertyType]);

  const loadPropertyData = async () => {
    if (!propertyId) return;
    
    try {
      setIsLoading(true);
      const property = await PropertyService.getPropertyById(propertyId, true);
      if (property) {
        // Convert database format to wizard form data
        const wizardData = PropertyService.convertToWizardFormat(property);
        
        // Load photos with captions
        const photos = await PropertyService.getPropertyPhotos(propertyId);
        
        // If we have photos_with_captions, use them; otherwise fall back to images array
        if (photos && photos.length > 0) {
          wizardData.photos_with_captions = photos;
          wizardData.images = photos.map(photo => photo.image_url);
        } else if (property.images && property.images.length > 0) {
          // Convert existing images to photos_with_captions format
          wizardData.photos_with_captions = property.images.map((url, index) => ({
            image_url: url,
            caption: '',
            alt_text: '',
            category: 'exterior',
            display_order: index,
            is_primary: index === 0
          }));
        }
        
        setFormData(wizardData);
      }
    } catch (error) {
      console.error('Error loading property:', error);
      toast({
        title: "Error Loading Property",
        description: "Failed to load property data for editing.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const autoSave = async () => {
    if (!user || !formData.title) return;
    
    try {
      setIsSaving(true);
      // Save as draft to localStorage as backup
      localStorage.setItem(`property_draft_${user.id}`, JSON.stringify({
        ...formData,
        lastSaved: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit your property.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert form data to database format
      const propertyData = PropertyService.convertToDatabaseFormat(formData);
      
      let result;
      if (propertyId) {
        result = await PropertyService.updateProperty(propertyId, propertyData);
      } else {
        result = await PropertyService.addProperty(propertyData, user.id);
      }

      if (result) {
        toast({
          title: "Property Submitted Successfully! 🎉",
          description: "Your property has been submitted for review. You'll be notified once it's approved.",
        });
        
        // Clear draft
        localStorage.removeItem(`property_draft_${user.id}`);
        
        // Navigate back
        onBack();
      }
    } catch (error) {
      console.error('Error submitting property:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property creation form...</p>
          <p className="text-sm text-gray-500 mt-2">
            {loading ? 'Checking authentication...' : 'Verifying access permissions...'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Please wait while we ensure your session is secure
          </p>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    const stepProps = {
      formData,
      setFormData,
      onNext: handleNext,
      onPrevious: handlePrevious
    };

    switch (WIZARD_STEPS[currentStep].id) {
      case 'basic':
        return <BasicDetails {...stepProps} />;
      case 'rooms':
        return <RoomsUnits {...stepProps} />;
      case 'amenities':
        return <PropertyAmenities {...stepProps} />;
      case 'photos':
        return <PhotosMedia {...stepProps} />;
      case 'policies':
        return <PoliciesPricing {...stepProps} />;
      case 'safety':
        return <SafetySecurity {...stepProps} />;
      case 'location':
        return <LocationNearby {...stepProps} />;
      case 'review':
        return <ReviewSubmit {...stepProps} onSubmit={handleSubmit} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  if (isLoading && propertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Properties
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {propertyId ? 'Edit Property' : 'Add New Property'}
                </h1>
                <p className="text-muted-foreground">
                  Complete all steps to list your property
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 Your progress is automatically saved. You can safely refresh the page.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSaving && (
                <Badge variant="secondary" className="animate-pulse">
                  <Save className="w-3 h-3 mr-1" />
                  Auto-saving...
                </Badge>
              )}
              <Badge variant="outline">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </Badge>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {WIZARD_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : index < currentStep
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => handleStepClick(index)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === currentStep
                          ? 'bg-primary-foreground text-primary'
                          : index < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-muted-foreground/20'
                      }`}>
                        {index < currentStep ? <Check className="w-3 h-3" /> : index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs opacity-70">{step.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {WIZARD_STEPS[currentStep].title}
                </CardTitle>
                <p className="text-muted-foreground">
                  {WIZARD_STEPS[currentStep].description}
                </p>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyWizard;