import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Users, 
  Bed, 
  Bath, 
  Wifi, 
  Car, 
  Coffee,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
    propertyType: '',
    price: '',
    guests: '',
    bedrooms: '',
    bathrooms: '',
    amenities: [] as string[],
    images: [] as File[]
  });

  // Redirect if not authenticated or not an agent
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/agent/login', { replace: true });
      return;
    }
    
    if (user && user.role !== 'agent') {
      navigate('/login', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Property name is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.city.trim()) return 'City is required';
    if (!formData.state.trim()) return 'State is required';
    if (!formData.pincode.trim()) return 'Pincode is required';
    if (!formData.propertyType) return 'Property type is required';
    if (!formData.price) return 'Price is required';
    if (!formData.guests) return 'Number of guests is required';
    if (!formData.bedrooms) return 'Number of bedrooms is required';
    if (!formData.bathrooms) return 'Number of bathrooms is required';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/agent/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user || user.role !== 'agent') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={picnifyLogo} alt="Picnify.in Logo" className="h-8" />
              <span className="ml-3 text-xl font-semibold text-gray-900">Agent Portal</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/agent/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Property</h1>
          <p className="text-gray-600">
            List your property and start earning commissions
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Property added successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter property name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select value={formData.propertyType} onValueChange={(value) => handleSelectChange('propertyType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="cottage">Cottage</SelectItem>
                        <SelectItem value="resort">Resort</SelectItem>
                        <SelectItem value="farmhouse">Farmhouse</SelectItem>
                        <SelectItem value="homestay">Homestay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your property..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Address *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter pincode"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Capacity */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Pricing & Capacity</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Night (₹) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter price"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guests">Max Guests *</Label>
                    <Input
                      id="guests"
                      name="guests"
                      type="number"
                      value={formData.guests}
                      onChange={handleInputChange}
                      placeholder="Enter max guests"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms *</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      placeholder="Enter number of bedrooms"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms *</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      placeholder="Enter number of bathrooms"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Amenities</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'wifi', label: 'WiFi', icon: Wifi },
                    { id: 'parking', label: 'Parking', icon: Car },
                    { id: 'kitchen', label: 'Kitchen', icon: Coffee },
                    { id: 'ac', label: 'Air Conditioning', icon: Building },
                    { id: 'pool', label: 'Swimming Pool', icon: Building },
                    { id: 'garden', label: 'Garden', icon: Building },
                    { id: 'tv', label: 'TV', icon: Building },
                    { id: 'heating', label: 'Heating', icon: Building }
                  ].map((amenity) => {
                    const Icon = amenity.icon;
                    return (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={amenity.id}
                          checked={formData.amenities.includes(amenity.id)}
                          onChange={() => handleAmenityToggle(amenity.id)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={amenity.id} className="text-sm font-medium text-gray-700 flex items-center">
                          <Icon className="w-4 h-4 mr-1" />
                          {amenity.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Property Images</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images</Label>
                  <Input
                    id="images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-orange file:text-white hover:file:bg-brand-red"
                  />
                  <p className="text-sm text-gray-600">
                    Upload multiple images to showcase your property
                  </p>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-orange to-brand-red hover:from-orange-600 hover:to-red-600 text-white font-medium py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Property...
                  </>
                ) : (
                  'Add Property'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProperty;
