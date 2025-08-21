import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Plus,
  Trash2,
  Save,
  ArrowLeft 
} from 'lucide-react';

interface DayPicnicPackage {
  id?: string;
  property_id: string;
  meal_plan: string[];
  start_time: string;
  end_time: string;
  duration_hours: number;
  pricing_type: 'per_person' | 'per_package';
  base_price: number;
  inclusions: string[];
  exclusions: { item: string; reason: string }[];
  add_ons: { name: string; price: number }[];
}

const DayPicnicSetup: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [package_, setPackage] = useState<DayPicnicPackage>({
    property_id: propertyId || '',
    meal_plan: [],
    start_time: '09:00',
    end_time: '18:00',
    duration_hours: 9,
    pricing_type: 'per_person',
    base_price: 0,
    inclusions: [],
    exclusions: [],
    add_ons: []
  });

  // Predefined options
  const mealPlanOptions = ['Breakfast', 'Lunch', 'Hi-Tea', 'Snacks', 'Dinner'];
  const inclusionOptions = [
    'Activities', 'Games', 'Facilities', 'Food', 'Pool Access', 
    'Garden Area', 'Adventure Sports', 'Parking', 'Music System',
    'Photography Area', 'Bonfire', 'BBQ Setup'
  ];

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
      fetchExistingPackage();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load property details",
        variant: "destructive"
      });
    }
  };

  const fetchExistingPackage = async () => {
    try {
      const { data, error } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (data) {
        const validPricingType = (data.pricing_type === 'per_person' || data.pricing_type === 'per_package') 
          ? data.pricing_type as 'per_person' | 'per_package'
          : 'per_person';
          
        setPackage({
          id: data.id,
          property_id: data.property_id,
          meal_plan: Array.isArray(data.meal_plan) ? data.meal_plan as string[] : [],
          start_time: data.start_time || '09:00',
          end_time: data.end_time || '18:00',
          duration_hours: data.duration_hours || 9,
          pricing_type: validPricingType,
          base_price: data.base_price || 0,
          inclusions: Array.isArray(data.inclusions) ? data.inclusions as string[] : [],
          exclusions: Array.isArray(data.exclusions) ? data.exclusions as { item: string; reason: string }[] : [],
          add_ons: Array.isArray(data.add_ons) ? data.add_ons as { name: string; price: number }[] : []
        });
      }
    } catch (error) {
      // No existing package, keep defaults
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Next day
    
    return Math.round(diffMinutes / 60 * 10) / 10; // Round to 1 decimal
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    const newPackage = { ...package_, [field]: value };
    
    if (field === 'start_time' || field === 'end_time') {
      const duration = calculateDuration(newPackage.start_time, newPackage.end_time);
      newPackage.duration_hours = duration;
    }
    
    setPackage(newPackage);
  };

  const handleMealPlanChange = (meal: string, checked: boolean) => {
    setPackage(prev => ({
      ...prev,
      meal_plan: checked 
        ? [...prev.meal_plan, meal]
        : prev.meal_plan.filter(m => m !== meal)
    }));
  };

  const handleInclusionChange = (inclusion: string, checked: boolean) => {
    setPackage(prev => ({
      ...prev,
      inclusions: checked 
        ? [...prev.inclusions, inclusion]
        : prev.inclusions.filter(i => i !== inclusion)
    }));
  };

  const addExclusion = () => {
    setPackage(prev => ({
      ...prev,
      exclusions: [...prev.exclusions, { item: '', reason: 'Extra cost' }]
    }));
  };

  const updateExclusion = (index: number, field: 'item' | 'reason', value: string) => {
    setPackage(prev => ({
      ...prev,
      exclusions: prev.exclusions.map((exc, i) => 
        i === index ? { ...exc, [field]: value } : exc
      )
    }));
  };

  const removeExclusion = (index: number) => {
    setPackage(prev => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== index)
    }));
  };

  const addAddOn = () => {
    setPackage(prev => ({
      ...prev,
      add_ons: [...prev.add_ons, { name: '', price: 0 }]
    }));
  };

  const updateAddOn = (index: number, field: 'name' | 'price', value: string | number) => {
    setPackage(prev => ({
      ...prev,
      add_ons: prev.add_ons.map((addon, i) => 
        i === index ? { ...addon, [field]: value } : addon
      )
    }));
  };

  const removeAddOn = (index: number) => {
    setPackage(prev => ({
      ...prev,
      add_ons: prev.add_ons.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!package_.meal_plan.length) {
      toast({
        title: "Validation Error",
        description: "Please select at least one meal plan",
        variant: "destructive"
      });
      return;
    }

    if (package_.base_price <= 0) {
      toast({
        title: "Validation Error", 
        description: "Please set a base price",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const packageData = {
        property_id: propertyId,
        meal_plan: package_.meal_plan,
        start_time: package_.start_time,
        end_time: package_.end_time,
        duration_hours: package_.duration_hours,
        pricing_type: package_.pricing_type,
        base_price: package_.base_price,
        inclusions: package_.inclusions,
        exclusions: package_.exclusions,
        add_ons: package_.add_ons
      };

      let result;
      if (package_.id) {
        // Update existing
        result = await supabase
          .from('day_picnic_packages')
          .update(packageData)
          .eq('id', package_.id);
      } else {
        // Create new
        result = await supabase
          .from('day_picnic_packages')
          .insert(packageData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: "Day Picnic package saved successfully!",
      });

      navigate('/host/dashboard?tab=properties');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save package",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/host/dashboard?tab=properties')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Day Picnic Package Setup</h1>
            <p className="text-gray-600">{property.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Timing & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={package_.start_time}
                      onChange={(e) => handleTimeChange('start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={package_.end_time}
                      onChange={(e) => handleTimeChange('end_time', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (Hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    value={package_.duration_hours}
                    onChange={(e) => setPackage(prev => ({ 
                      ...prev, 
                      duration_hours: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Meal Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Meal Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {mealPlanOptions.map(meal => (
                    <div key={meal} className="flex items-center space-x-2">
                      <Checkbox
                        id={meal}
                        checked={package_.meal_plan.includes(meal)}
                        onCheckedChange={(checked) => handleMealPlanChange(meal, checked as boolean)}
                      />
                      <Label htmlFor={meal}>{meal}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pricing Type</Label>
                  <div className="flex space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="per_person"
                        name="pricing_type"
                        value="per_person"
                        checked={package_.pricing_type === 'per_person'}
                        onChange={(e) => setPackage(prev => ({ ...prev, pricing_type: e.target.value as any }))}
                      />
                      <Label htmlFor="per_person">Per Person</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="per_package"
                        name="pricing_type"
                        value="per_package"
                        checked={package_.pricing_type === 'per_package'}
                        onChange={(e) => setPackage(prev => ({ ...prev, pricing_type: e.target.value as any }))}
                      />
                      <Label htmlFor="per_package">Per Package</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="base_price">Base Price (₹)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={package_.base_price}
                    onChange={(e) => setPackage(prev => ({ 
                      ...prev, 
                      base_price: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inclusions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Inclusions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {inclusionOptions.map(inclusion => (
                    <div key={inclusion} className="flex items-center space-x-2">
                      <Checkbox
                        id={inclusion}
                        checked={package_.inclusions.includes(inclusion)}
                        onCheckedChange={(checked) => handleInclusionChange(inclusion, checked as boolean)}
                      />
                      <Label htmlFor={inclusion}>{inclusion}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exclusions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <XCircle className="w-5 h-5 mr-2 text-red-600" />
                  Exclusions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {package_.exclusions.map((exclusion, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Item name"
                      value={exclusion.item}
                      onChange={(e) => updateExclusion(index, 'item', e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={exclusion.reason}
                      onChange={(e) => updateExclusion(index, 'reason', e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="Extra cost">Extra cost</option>
                      <option value="Not available">Not available</option>
                      <option value="On request">On request</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExclusion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addExclusion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exclusion
                </Button>
              </CardContent>
            </Card>

            {/* Add-ons */}
            <Card>
              <CardHeader>
                <CardTitle>Add-ons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {package_.add_ons.map((addon, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Add-on name"
                      value={addon.name}
                      onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={addon.price}
                      onChange={(e) => updateAddOn(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAddOn(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addAddOn}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Add-on
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Package Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Day Picnic at {property.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.address}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Timing</p>
                  <p className="text-sm text-gray-600">
                    {formatTime12Hour(package_.start_time)} - {formatTime12Hour(package_.end_time)} | {package_.duration_hours} Hours
                  </p>
                </div>

                {package_.meal_plan.length > 0 && (
                  <div>
                    <p className="font-medium">Meal Plan</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {package_.meal_plan.map(meal => (
                        <Badge key={meal} variant="secondary" className="text-xs">
                          {meal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="font-medium">Price</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{package_.base_price} {package_.pricing_type.replace('_', ' ')}
                  </p>
                </div>

                {package_.inclusions.length > 0 && (
                  <div>
                    <p className="font-medium text-green-600">✅ Inclusions</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {package_.inclusions.slice(0, 3).map(inclusion => (
                        <li key={inclusion}>• {inclusion}</li>
                      ))}
                      {package_.inclusions.length > 3 && (
                        <li className="text-gray-400">+ {package_.inclusions.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}

                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Package
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayPicnicSetup;
