import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Button } from '@/components/owner/ui/button';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Textarea } from '@/components/owner/ui/textarea';
import { Checkbox } from '@/components/owner/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectSeparator } from '@/components/owner/ui/select';
import { Alert, AlertDescription } from '@/components/owner/ui/alert';
import { PropertyService } from '@/lib/propertyService';
import { Progress } from '@/components/owner/ui/progress';
import { toast } from '@/hooks/use-toast';
import { getAllStates, getCitiesByState, getPopularCitiesByState } from '@/data/indianLocations';
import { normalizeTypeKey } from '@/lib/utils';

interface BookingComPropertyFormProps {
  onBack: () => void;
  editProperty?: any;
}

const BookingComPropertyForm: React.FC<BookingComPropertyFormProps> = ({ onBack, editProperty }) => {
  const navigate = useNavigate();
  const isEdit = !!editProperty;

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    city: '',
    state: '',
    postal_code: '',
    price: 0,
    capacity: 1,
    bedrooms: 0,
    bathrooms: 0,
    rooms_count: null,
    capacity_per_room: null,
    day_picnic_capacity: null,
    day_picnic_duration_category: '',
    description: '',
    amenities: [] as string[],
    images: [] as string[],
    contact_phone: '',
    license_number: ''
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [popularCities, setPopularCities] = useState<string[]>([]);

  const availableAmenities = [
    'Free Wifi', 'Parking', 'Swimming Pool', 'Gym', 'Spa', 'Restaurant',
    'Bar', '24-hour Front Desk', 'Air Conditioning', 'Pet-Friendly',
    'Room Service', 'Non-smoking Rooms', 'Family Rooms', 'Elevator',
    'Airport Shuttle', 'Laundry', 'Meeting Rooms', 'Business Center', 'Hot Tub'
  ];

  const propertyTypes = [
    'Hotel', 'Apartment', 'Resort', 'Villa', 'Guesthouse', 'Hostel',
    'Bed and Breakfast', 'Cottage', 'Cabin', 'Chalet', 'Farm stay',
    'Holiday park', 'Ryokan', 'Homestay', 'Country house', 'Aparthotel',
    'Condo', 'Vacation home', 'Serviced apartment', 'Bungalow', 'Motel',
    'Lodge', 'Guest suite', 'Timeshare', 'Earth house', 'Tent', 'Boat',
    'Castle', 'Cave', 'Island', 'Light house', 'Mill', 'Pension',
    'Riad', 'Tentalow', 'Treehouse', 'Yurt', 'Other', 'Day Picnic'
  ];

  const durationOptions = [
    { value: 'half_day', label: 'Half Day (4-5hrs)' },
    { value: 'full_day', label: 'Full Day (6-8hrs)' },
    { value: 'extended_day', label: 'Extended Day (10+hrs)' }
  ];

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    const statesData = await getAllStates();
    setStates(statesData);
  };

  const loadCities = async (selectedState: string) => {
    const citiesData = await getCitiesByState(selectedState);
    setCities(citiesData);

    const popularCitiesData = await getPopularCitiesByState(selectedState);
    setPopularCities(popularCitiesData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));

    if (id === 'state') {
      loadCities(value);
      setFormData(prev => ({ ...prev, city: '' }));
    }
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setUploadProgress(0);

    const imageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onprogress = (event) => {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
      };

      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        imageUrls.push(imageUrl);

        if (imageUrls.length === files.length) {
          setFormData(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }));
          setUploading(false);
          setUploadProgress(0);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (editProperty) {
      const locationData = editProperty.location as any;
      const city = locationData?.city || '';
      const state = locationData?.state || '';
      
      setFormData({
        name: editProperty.title || '',
        type: editProperty.property_type || '',
        location: locationData?.address || editProperty.address?.split(', ')[0] || '',
        city: city,
        state: state,
        postal_code: editProperty.postal_code || '',
        price: (editProperty.pricing as any)?.daily_rate || 0,
        capacity: editProperty.max_guests || 1,
        bedrooms: editProperty.bedrooms || 0,
        bathrooms: editProperty.bathrooms || 0,
        rooms_count: editProperty.rooms_count,
        capacity_per_room: editProperty.capacity_per_room,
        day_picnic_capacity: editProperty.day_picnic_capacity,
        day_picnic_duration_category: editProperty.day_picnic_duration_category || '',
        description: editProperty.description || '',
        amenities: editProperty.amenities || [],
        images: editProperty.images || [],
        contact_phone: editProperty.contact_phone || '',
        license_number: editProperty.license_number || ''
      });

      if (state) {
        loadCities(state);
      }
    }
  }, [editProperty]);

  const validateForm = () => {
    let errors: { [key: string]: string } = {};

    if (!formData.name) {
      errors.name = 'Property name is required';
    }
    if (!formData.type) {
      errors.type = 'Property type is required';
    }
    if (!formData.location) {
      errors.location = 'Location is required';
    }
    if (!formData.city) {
      errors.city = 'City is required';
    }
    if (!formData.state) {
      errors.state = 'State is required';
    }
    if (!formData.description) {
      errors.description = 'Description is required';
    }
    if (normalizeTypeKey(formData.type) === 'day_picnic' && !formData.day_picnic_duration_category) {
      errors.day_picnic_duration_category = 'Time duration is required for Day Picnic properties';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isDayPicnic = normalizeTypeKey(formData.type) === 'day_picnic';

  const progress = (() => {
    let completedFields = 0;
    if (formData.name) completedFields++;
    if (formData.type) completedFields++;
    if (formData.location) completedFields++;
    if (formData.city) completedFields++;
    if (formData.state) completedFields++;
    if (formData.description) completedFields++;
    if (formData.price > 0) completedFields++;
    if (formData.capacity > 0) completedFields++;
    if (formData.bedrooms >= 0) completedFields++;
    if (formData.bathrooms >= 0) completedFields++;
    if (formData.images.length > 0) completedFields++;

    return (completedFields / 11) * 100;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const propertyData = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        price: formData.price,
        capacity: formData.capacity,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        rooms_count: formData.rooms_count,
        capacity_per_room: formData.capacity_per_room,
        day_picnic_capacity: formData.day_picnic_capacity,
        day_picnic_duration_category: formData.day_picnic_duration_category,
        description: formData.description,
        amenities: formData.amenities,
        images: formData.images,
        postal_code: formData.postal_code,
        contact_phone: formData.contact_phone,
        license_number: formData.license_number
      };

      let result;
      if (isEdit) {
        result = await PropertyService.updateProperty(editProperty.id, propertyData);
      } else {
        const ownerId = localStorage.getItem('ownerId');
        if (!ownerId) {
          throw new Error('Owner ID not found. Please log in again.');
        }
        result = await PropertyService.addProperty(propertyData, ownerId);
      }

      if (result) {
        toast({
          title: isEdit ? "Property Updated!" : "Property Added!",
          description: isEdit 
            ? "Your property has been updated successfully." 
            : "Your property has been added successfully and is pending approval.",
        });
        
        // Handle Day Picnic redirect
        if (normalizeTypeKey(formData.type) === 'day_picnic' && !isEdit) {
          toast({
            title: "Day Picnic Property Added!",
            description: "Your property is now visible in the Day Picnic section.",
          });
        }
        
        onBack();
      }
    } catch (error: any) {
      console.error('Failed to save property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="mb-4">
            ← Back to Properties
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className="text-gray-600">Fill in the details to {isEdit ? 'update' : 'list'} your property</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter property name"
                    className={validationErrors.name ? 'border-red-500' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Property Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                    <SelectTrigger className={validationErrors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.type}</p>
                  )}
                </div>
              </div>

              {/* Day Picnic Time Duration */}
              {isDayPicnic && (
                <div>
                  <Label htmlFor="day_picnic_duration_category">Time Duration *</Label>
                  <Select 
                    value={formData.day_picnic_duration_category} 
                    onValueChange={(value) => handleSelectChange('day_picnic_duration_category', value)}
                  >
                    <SelectTrigger className={validationErrors.day_picnic_duration_category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select time duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.day_picnic_duration_category && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.day_picnic_duration_category}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your property..."
                  rows={4}
                  className={validationErrors.description ? 'border-red-500' : ''}
                />
                {validationErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Address *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    className={validationErrors.location ? 'border-red-500' : ''}
                  />
                  {validationErrors.location && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => handleSelectChange('state', value)}>
                    <SelectTrigger className={validationErrors.state ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.state && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Select value={formData.city} onValueChange={(value) => handleSelectChange('city', value)}>
                    <SelectTrigger className={validationErrors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularCities.length > 0 && (
                        <>
                          <SelectLabel>Popular Cities</SelectLabel>
                          {popularCities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                          <SelectSeparator />
                        </>
                      )}
                      <SelectLabel>All Cities</SelectLabel>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.city && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Rooms */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity & Rooms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Maximum Guests *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="Enter maximum guests"
                  />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="Enter number of bedrooms"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="Enter number of bathrooms"
                  />
                </div>

                <div>
                  <Label htmlFor="rooms_count">Rooms Count</Label>
                  <Input
                    id="rooms_count"
                    type="number"
                    value={formData.rooms_count || ''}
                    onChange={handleInputChange}
                    placeholder="Enter number of rooms"
                  />
                </div>
              </div>

              {formData.type === 'Hostel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity_per_room">Capacity Per Room</Label>
                    <Input
                      id="capacity_per_room"
                      type="number"
                      value={formData.capacity_per_room || ''}
                      onChange={handleInputChange}
                      placeholder="Enter capacity per room"
                    />
                  </div>
                </div>
              )}

              {normalizeTypeKey(formData.type) === 'day_picnic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="day_picnic_capacity">Day Picnic Capacity</Label>
                    <Input
                      id="day_picnic_capacity"
                      type="number"
                      value={formData.day_picnic_capacity || ''}
                      onChange={handleInputChange}
                      placeholder="Enter day picnic capacity"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price per Night *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price per night"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    placeholder="Enter contact phone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="Enter license number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableAmenities.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityChange(amenity)}
                    />
                    <Label htmlFor={amenity}>{amenity}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="images">Upload Images</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />

              {uploading && (
                <div className="space-y-2">
                  <p>Uploading... {uploadProgress}%</p>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img src={image} alt={`Property Image ${index + 1}`} className="rounded-md" />
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/50 hover:bg-white/70"
                      onClick={() => {
                        const newImages = [...formData.images];
                        newImages.splice(index, 1);
                        setFormData(prev => ({ ...prev, images: newImages }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button> */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button disabled={submitting} className="w-full" size="lg">
            {submitting ? (
              <>
                Submitting...
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
              </>
            ) : (
              isEdit ? 'Update Property' : 'Add Property'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingComPropertyForm;
