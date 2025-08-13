import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/lib/propertyService';

interface AddPropertyProps {
  onBack: () => void;
}

interface BedConfig {
  type: string;
  count: number;
  room: string;
}

const EnhancedAddProperty: React.FC<AddPropertyProps> = ({ onBack }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    propertyType: '',
    propertySubtype: '',
    
    // Location
    location: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    coordinates: { lat: '', lng: '' },
    
    // Pricing & Capacity
    pricing: { daily_rate: '', currency: 'INR' },
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
    
    // Enhanced Bed Configuration
    bedConfiguration: {
      beds: [] as BedConfig[]
    },
    
    // Business Requirements
    cancellationPolicy: 'moderate',
    arrivalInstructions: '',
    paymentMethods: ['card'] as string[],
    contactPhone: '',
    licenseNumber: '',
    
    // Booking Rules
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minimumStay: 1,
    
    // Optional Features
    mealPlans: [] as string[],
    houseRules: {
      smoking: 'not_allowed',
      pets: 'not_allowed',
      parties: 'not_allowed',
      quietHours: { start: '22:00', end: '08:00' }
    },
    
    // Enhanced Amenities
    amenities: [] as string[],
    images: [] as File[]
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Enhanced property types with subcategories
  const propertyTypes = [
    { value: 'hotel', label: 'Hotel', subtypes: ['Luxury Hotel', 'Business Hotel', 'Boutique Hotel', 'Resort Hotel'] },
    { value: 'apartment', label: 'Apartment', subtypes: ['Studio', '1 BHK', '2 BHK', '3 BHK', 'Penthouse'] },
    { value: 'villa', label: 'Villa', subtypes: ['Luxury Villa', 'Beach Villa', 'Hill Station Villa', 'Garden Villa'] },
    { value: 'vacation_home', label: 'Vacation Home', subtypes: ['Beach House', 'Mountain Cabin', 'Lake House', 'City Home'] },
    { value: 'house', label: 'House', subtypes: ['Independent House', 'Row House', 'Duplex', 'Bungalow'] },
    { value: 'cottage', label: 'Cottage', subtypes: ['Hill Cottage', 'Garden Cottage', 'Heritage Cottage'] },
    { value: 'resort', label: 'Resort', subtypes: ['Beach Resort', 'Hill Resort', 'Spa Resort', 'Adventure Resort'] },
    { value: 'farmhouse', label: 'Farmhouse', subtypes: ['Traditional Farmhouse', 'Modern Farmhouse', 'Heritage Farmhouse'] },
    { value: 'homestay', label: 'Homestay', subtypes: ['Family Homestay', 'Budget Homestay', 'Luxury Homestay'] }
  ];

  // Categorized amenities
  const amenitiesCategories = {
    connectivity: ['WiFi', 'High-Speed Internet', 'Cable TV', 'Smart TV', 'Netflix'],
    kitchen: ['Full Kitchen', 'Kitchenette', 'Microwave', 'Refrigerator', 'Coffee Maker', 'Dishwasher'],
    bathroom: ['Hot Water', 'Bathtub', 'Shower', 'Hair Dryer', 'Toiletries', 'Towels'],
    comfort: ['Air Conditioning', 'Heating', 'Fan', 'Fireplace', 'Comfortable Bedding'],
    outdoor: ['Balcony', 'Terrace', 'Garden', 'Swimming Pool', 'BBQ Area', 'Parking'],
    safety: ['Security', 'CCTV', 'Safe', 'First Aid', 'Fire Extinguisher'],
    entertainment: ['Games Room', 'Library', 'Music System', 'Indoor Games'],
    business: ['Workspace', 'Printer', 'Fast WiFi', 'Meeting Room'],
    family: ['Crib', 'High Chair', 'Child Safety', 'Toys', 'Baby Bath']
  };

  const bedTypes = [
    { value: 'single', label: 'Single Bed', capacity: 1 },
    { value: 'double', label: 'Double Bed', capacity: 2 },
    { value: 'queen', label: 'Queen Bed', capacity: 2 },
    { value: 'king', label: 'King Bed', capacity: 2 },
    { value: 'sofa_bed', label: 'Sofa Bed', capacity: 1 },
    { value: 'bunk_bed', label: 'Bunk Bed', capacity: 2 }
  ];

  const paymentMethodOptions = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'digital_wallet', label: 'Digital Wallet' }
  ];

  const mealPlanOptions = [
    { value: 'breakfast', label: 'Breakfast Included' },
    { value: 'half_board', label: 'Half Board (Breakfast + Dinner)' },
    { value: 'full_board', label: 'Full Board (All Meals)' },
    { value: 'all_inclusive', label: 'All Inclusive' }
  ];

  const cancellationPolicyOptions = [
    { value: 'flexible', label: 'Flexible - Free cancellation 24 hours before check-in' },
    { value: 'moderate', label: 'Moderate - Free cancellation 5 days before check-in' },
    { value: 'strict', label: 'Strict - 50% refund up to 14 days before check-in' },
    { value: 'super_strict', label: 'Super Strict - No refund after booking' }
  ];

  const validateForm = (): string | null => {
    // Property name validation - must contain at least one lowercase letter and avoid special characters
    const nameRegex = /^(?=.*[a-z])[\w\s-]+$/;
    if (!formData.name.trim()) return 'Property name is required';
    if (!nameRegex.test(formData.name)) return 'Property name must include at least one lowercase letter and avoid special characters';
    
    // Required basic fields
    if (!formData.location.trim()) return 'Full address is required';
    if (!formData.city.trim()) return 'City is required';
    if (!formData.state.trim()) return 'State is required';
    if (!formData.postalCode.trim()) return 'Postal code is required';
    if (!formData.propertyType) return 'Property type is required';
    if (!formData.description.trim()) return 'Description is required (minimum 50 characters)';
    if (formData.description.length < 50) return 'Description must be at least 50 characters long';
    
    // Pricing and capacity
    if (!formData.pricing.daily_rate) return 'Daily rate is required';
    if (Number(formData.pricing.daily_rate) < 500) return 'Daily rate must be at least ₹500';
    if (!formData.maxGuests) return 'Maximum guests is required';
    if (Number(formData.maxGuests) < 1) return 'At least 1 guest must be allowed';
    if (!formData.bedrooms) return 'Number of bedrooms is required';
    if (!formData.bathrooms) return 'Number of bathrooms is required';
    
    // Business requirements
    if (!formData.contactPhone.trim()) return 'Contact phone number is required';
    if (!formData.arrivalInstructions.trim()) return 'Arrival instructions are required';
    if (formData.paymentMethods.length === 0) return 'At least one payment method is required';
    
    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.contactPhone.replace(/\s+/g, ''))) {
      return 'Please enter a valid Indian mobile number (10 digits starting with 6-9)';
    }
    
    // Bed configuration validation
    const totalBedCapacity = formData.bedConfiguration.beds.reduce((total, bed) => {
      const bedType = bedTypes.find(bt => bt.value === bed.type);
      return total + (bed.count * (bedType?.capacity || 1));
    }, 0);
    
    if (totalBedCapacity < Number(formData.maxGuests)) {
      return 'Bed configuration capacity must accommodate the maximum number of guests';
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
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
        [name]: value
      }));
    }
  };

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[name as keyof typeof prev] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [name]: newArray
      };
    });
  };

  const addBedConfiguration = () => {
    setFormData(prev => ({
      ...prev,
      bedConfiguration: {
        beds: [...prev.bedConfiguration.beds, { type: 'single', count: 1, room: 'Room 1' }]
      }
    }));
  };

  const updateBedConfiguration = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      bedConfiguration: {
        beds: prev.bedConfiguration.beds.map((bed, i) => 
          i === index ? { ...bed, [field]: value } : bed
        )
      }
    }));
  };

  const removeBedConfiguration = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bedConfiguration: {
        beds: prev.bedConfiguration.beds.filter((_, i) => i !== index)
      }
    }));
  };

  const handleFileUpload = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const newImages = imageFiles.map((file, index) => 
      `https://readdy.ai/api/search-image?query=modern%20luxury%20property%20interior%20design%20with%20contemporary%20furniture%20and%20elegant%20decor%20bright%20natural%20lighting%20clean%20minimalist%20background&width=300&height=200&seq=upload-${Date.now()}-${index}&orientation=landscape`
    );
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setSuccessMessage(null);

    if (!isAuthenticated || !user) {
      setError('You must be logged in to add a property');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const propertyData = {
        name: formData.name,
        type: formData.propertyType,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        price: Number(formData.pricing.daily_rate),
        capacity: Number(formData.maxGuests),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        description: formData.description,
        amenities: formData.amenities,
        images: uploadedImages
      };

      const savedProperty = await PropertyService.addProperty(propertyData, user.id);
      
      if (savedProperty) {
        setSuccessMessage('Property added successfully!');
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    } catch (err) {
      console.error('Error saving property:', err);
      setError('Failed to save property. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedPropertyType = () => {
    return propertyTypes.find(type => type.value === formData.propertyType);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            
            {/* Property Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Property Name <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(Must include at least one lowercase letter)</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter property name (e.g., cozy Beach Villa)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Property Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select property type</option>
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Property Subtype */}
              {formData.propertyType && (
                <div>
                  <label htmlFor="propertySubtype" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Subtype
                  </label>
                  <select
                    id="propertySubtype"
                    name="propertySubtype"
                    value={formData.propertySubtype}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select subtype</option>
                    {getSelectedPropertyType()?.subtypes.map((subtype) => (
                      <option key={subtype} value={subtype}>{subtype}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(Minimum 50 characters)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide a detailed description of your property..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                required
              />
              <div className="text-xs text-gray-500 mt-1">{formData.description.length}/50 characters minimum</div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Details</h3>
            
            {/* Full Address */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Full Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter complete street address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Enter state"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Enter postal code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Country and Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="India">India</option>
                </select>
              </div>
              <div>
                <label htmlFor="coordinates.lat" className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  id="coordinates.lat"
                  name="coordinates.lat"
                  value={formData.coordinates.lat}
                  onChange={handleInputChange}
                  placeholder="e.g., 19.0760"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="coordinates.lng" className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  id="coordinates.lng"
                  name="coordinates.lng"
                  value={formData.coordinates.lng}
                  onChange={handleInputChange}
                  placeholder="e.g., 72.8777"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Capacity & Pricing</h3>
            
            {/* Pricing and Basic Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pricing.daily_rate" className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Rate (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="pricing.daily_rate"
                  name="pricing.daily_rate"
                  value={formData.pricing.daily_rate}
                  onChange={handleInputChange}
                  placeholder="Minimum ₹500"
                  min="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="maxGuests"
                  name="maxGuests"
                  value={formData.maxGuests}
                  onChange={handleInputChange}
                  placeholder="Enter max guests"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Room Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  placeholder="Number of bedrooms"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  placeholder="Number of bathrooms"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Detailed Bed Configuration */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Bed Configuration <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addBedConfiguration}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Add Bed
                </button>
              </div>
              {formData.bedConfiguration.beds.map((bed, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                      <input
                        type="text"
                        value={bed.room}
                        onChange={(e) => updateBedConfiguration(index, 'room', e.target.value)}
                        placeholder="Room 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                      <select
                        value={bed.type}
                        onChange={(e) => updateBedConfiguration(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {bedTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
                      <input
                        type="number"
                        value={bed.count}
                        onChange={(e) => updateBedConfiguration(index, 'count', Number(e.target.value))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeBedConfiguration(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {formData.bedConfiguration.beds.length === 0 && (
                <p className="text-gray-500 text-sm">No bed configurations added. Click "Add Bed" to start.</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Requirements</h3>
            
            {/* Contact Information */}
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone Number <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(Indian mobile number)</span>
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Arrival Instructions */}
            <div>
              <label htmlFor="arrivalInstructions" className="block text-sm font-medium text-gray-700 mb-2">
                Arrival Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                id="arrivalInstructions"
                name="arrivalInstructions"
                value={formData.arrivalInstructions}
                onChange={handleInputChange}
                placeholder="Provide detailed instructions for guest arrival (how to reach, check-in process, key collection, etc.)"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                required
              />
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Methods <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethodOptions.map((method) => (
                  <label key={method.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.includes(method.value)}
                      onChange={() => handleMultiSelectChange('paymentMethods', method.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cancellation Policy */}
            <div>
              <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Policy <span className="text-red-500">*</span>
              </label>
              <select
                id="cancellationPolicy"
                name="cancellationPolicy"
                value={formData.cancellationPolicy}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {cancellationPolicyOptions.map((policy) => (
                  <option key={policy.value} value={policy.value}>{policy.label}</option>
                ))}
              </select>
            </div>

            {/* Booking Rules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Time
                </label>
                <input
                  type="time"
                  id="checkInTime"
                  name="checkInTime"
                  value={formData.checkInTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="checkOutTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Time
                </label>
                <input
                  type="time"
                  id="checkOutTime"
                  name="checkOutTime"
                  value={formData.checkOutTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="minimumStay" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stay (nights)
                </label>
                <input
                  type="number"
                  id="minimumStay"
                  name="minimumStay"
                  value={formData.minimumStay}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* License Number */}
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                License/Permit Number (if required)
                <span className="text-xs text-gray-500 ml-2">(Required in some regions)</span>
              </label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                placeholder="Enter license or permit number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Amenities & Features</h3>
            
            {/* Amenities by Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Amenities (Select all that apply)
              </label>
              {Object.entries(amenitiesCategories).map(([category, amenities]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-800 mb-3 capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {amenities.map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => handleMultiSelectChange('amenities', amenity)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Meal Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Plans (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mealPlanOptions.map((plan) => (
                  <label key={plan.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mealPlans.includes(plan.value)}
                      onChange={() => handleMultiSelectChange('mealPlans', plan.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{plan.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                House Rules
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Smoking</label>
                  <select
                    value={formData.houseRules.smoking}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      houseRules: { ...prev.houseRules, smoking: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_allowed">Not Allowed</option>
                    <option value="allowed">Allowed</option>
                    <option value="outdoor_only">Outdoor Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Pets</label>
                  <select
                    value={formData.houseRules.pets}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      houseRules: { ...prev.houseRules, pets: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_allowed">Not Allowed</option>
                    <option value="allowed">Allowed</option>
                    <option value="small_pets_only">Small Pets Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Parties</label>
                  <select
                    value={formData.houseRules.parties}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      houseRules: { ...prev.houseRules, parties: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_allowed">Not Allowed</option>
                    <option value="allowed">Allowed</option>
                    <option value="small_gatherings">Small Gatherings Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Property Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Images
                <span className="text-xs text-gray-500 ml-2">(Recommended: At least 5 high-quality images)</span>
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = Array.from(e.dataTransfer.files);
                  handleFileUpload(files);
                }}
              >
                <div className="text-gray-600">
                  <p className="text-lg mb-2">Drop images here or click to upload</p>
                  <p className="text-sm">PNG, JPG, JPEG up to 10MB each</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                >
                  Choose Files
                </label>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Properties
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className={`ml-2 text-sm font-medium ${
                  step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Location'}
                  {step === 3 && 'Capacity'}
                  {step === 4 && 'Business'}
                  {step === 5 && 'Features'}
                </div>
                {step < 5 && <div className="w-8 h-0.5 bg-gray-200 mx-4"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Property</h1>
          <p className="text-gray-600">
            Complete all required fields to list your property professionally
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <i className="fas fa-exclamation-circle text-red-400 mr-3 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <i className="fas fa-check-circle text-green-400 mr-3 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-8 py-3 rounded-lg font-medium ${
                    isLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Adding Property...
                    </>
                  ) : (
                    'Add Property'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EnhancedAddProperty;