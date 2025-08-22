
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Users, 
  Save,
  ArrowLeft 
} from 'lucide-react';
import HourlyPricingSection from './day-picnic/HourlyPricingSection';
import MealPricingSection from './day-picnic/MealPricingSection';
import OptionPricingSection from './day-picnic/OptionPricingSection';
import PricingPreview from './day-picnic/PricingPreview';

interface DayPicnicPackage {
  id?: string;
  property_id: string;
  meal_plan: string[];
  start_time: string;
  end_time: string;
  duration_hours: number;
  pricing_type: 'per_person' | 'per_package';
  base_price: number;
  min_hours: number;
  inclusions: string[];
  exclusions: { item: string; reason: string }[];
  add_ons: { name: string; price: number }[];
}

interface HourlyRate {
  meal_plan: string;
  hour_number: number;
  price_per_person: number;
  price_per_package: number;
}

interface MealPrice {
  meal_plan: string;
  price_per_person: number;
  price_per_package: number;
}

interface OptionPrice {
  id?: string;
  option_type: 'inclusion' | 'add_on';
  name: string;
  price: number;
  is_required: boolean;
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
    min_hours: 1,
    inclusions: [],
    exclusions: [],
    add_ons: []
  });
  const [hourlyRates, setHourlyRates] = useState<HourlyRate[]>([]);
  const [mealPrices, setMealPrices] = useState<MealPrice[]>([]);
  const [optionPrices, setOptionPrices] = useState<OptionPrice[]>([]);

  // Predefined options
  const mealPlanOptions = ['Breakfast', 'Lunch', 'Hi-Tea', 'Snacks', 'Dinner'];

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
      const { data: packageData, error: packageError } = await supabase
        .from('day_picnic_packages')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (packageError && packageError.code !== 'PGRST116') throw packageError;

      if (packageData) {
        const validPricingType = (packageData.pricing_type === 'per_person' || packageData.pricing_type === 'per_package') 
          ? packageData.pricing_type as 'per_person' | 'per_package'
          : 'per_person';
          
        setPackage({
          id: packageData.id,
          property_id: packageData.property_id,
          meal_plan: Array.isArray(packageData.meal_plan) ? packageData.meal_plan as string[] : [],
          start_time: packageData.start_time || '09:00',
          end_time: packageData.end_time || '18:00',
          duration_hours: packageData.duration_hours || 9,
          pricing_type: validPricingType,
          base_price: packageData.base_price || 0,
          min_hours: packageData.min_hours || 1,
          inclusions: Array.isArray(packageData.inclusions) ? packageData.inclusions as string[] : [],
          exclusions: Array.isArray(packageData.exclusions) ? packageData.exclusions as { item: string; reason: string }[] : [],
          add_ons: Array.isArray(packageData.add_ons) ? packageData.add_ons as { name: string; price: number }[] : []
        });

        // Fetch hourly rates
        const { data: ratesData, error: ratesError } = await supabase
          .from('day_picnic_hourly_rates')
          .select('*')
          .eq('package_id', packageData.id);

        if (ratesError) throw ratesError;
        if (ratesData) {
          setHourlyRates(ratesData.map(rate => ({
            meal_plan: rate.meal_plan,
            hour_number: rate.hour_number,
            price_per_person: rate.price_per_person,
            price_per_package: rate.price_per_package
          })));
        }

        // Fetch meal prices
        const { data: mealData, error: mealError } = await (supabase as any)
          .from('day_picnic_meal_prices')
          .select('*')
          .eq('package_id', packageData.id);

        if (mealError) throw mealError;
        if (mealData) {
          setMealPrices(mealData.map((meal: any) => ({
            meal_plan: meal.meal_plan,
            price_per_person: meal.price_per_person,
            price_per_package: meal.price_per_package
          })));
        }

        // Fetch option prices
        const { data: optionsData, error: optionsError } = await supabase
          .from('day_picnic_option_prices')
          .select('*')
          .eq('package_id', packageData.id);

        if (optionsError) throw optionsError;
        if (optionsData) {
          setOptionPrices(optionsData.map(opt => ({
            id: opt.id,
            option_type: opt.option_type as 'inclusion' | 'add_on',
            name: opt.name,
            price: opt.price,
            is_required: opt.is_required
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching package:', error);
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

  const handleSave = async () => {
    if (!package_.meal_plan.length) {
      toast({
        title: "Validation Error",
        description: "Please select at least one meal plan",
        variant: "destructive"
      });
      return;
    }

    if (hourlyRates.filter(r => r.meal_plan === 'ALL').length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please set hourly pricing",
        variant: "destructive"
      });
      return;
    }

    if (mealPrices.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please set meal prices",
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
        min_hours: package_.min_hours,
        inclusions: package_.inclusions,
        exclusions: package_.exclusions,
        add_ons: package_.add_ons
      };

      let packageResult;
      let packageId = package_.id;

      if (package_.id) {
        // Update existing
        packageResult = await supabase
          .from('day_picnic_packages')
          .update(packageData)
          .eq('id', package_.id)
          .select()
          .single();
      } else {
        // Create new
        packageResult = await supabase
          .from('day_picnic_packages')
          .insert(packageData)
          .select()
          .single();
        
        if (packageResult.data) {
          packageId = packageResult.data.id;
        }
      }

      if (packageResult.error) throw packageResult.error;

      // Save hourly rates
      if (packageId) {
        // Delete existing rates
        await supabase
          .from('day_picnic_hourly_rates')
          .delete()
          .eq('package_id', packageId);

        // Insert new rates (only ALL rates)
        const allRates = hourlyRates.filter(r => r.meal_plan === 'ALL');
        if (allRates.length > 0) {
          const ratesData = allRates.map(rate => ({
            package_id: packageId,
            meal_plan: rate.meal_plan,
            hour_number: rate.hour_number,
            price_per_person: rate.price_per_person,
            price_per_package: rate.price_per_package
          }));

          const { error: ratesError } = await supabase
            .from('day_picnic_hourly_rates')
            .insert(ratesData);

          if (ratesError) throw ratesError;
        }

        // Save meal prices
        await (supabase as any)
          .from('day_picnic_meal_prices')
          .delete()
          .eq('package_id', packageId);

        if (mealPrices.length > 0) {
          const mealData = mealPrices.map(meal => ({
            package_id: packageId,
            meal_plan: meal.meal_plan,
            price_per_person: meal.price_per_person,
            price_per_package: meal.price_per_package
          }));

          const { error: mealError } = await (supabase as any)
            .from('day_picnic_meal_prices')
            .insert(mealData);

          if (mealError) throw mealError;
        }

        // Save option prices
        await supabase
          .from('day_picnic_option_prices')
          .delete()
          .eq('package_id', packageId);

        if (optionPrices.length > 0) {
          const optionsData = optionPrices
            .filter(opt => opt.name.trim() !== '')
            .map(opt => ({
              package_id: packageId,
              option_type: opt.option_type,
              name: opt.name,
              price: opt.price,
              is_required: opt.is_required
            }));

          if (optionsData.length > 0) {
            const { error: optionsError } = await supabase
              .from('day_picnic_option_prices')
              .insert(optionsData);

            if (optionsError) throw optionsError;
          }
        }
      }

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
      <div className="max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-6">
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="min_hours">Minimum Hours</Label>
                    <Input
                      id="min_hours"
                      type="number"
                      min="1"
                      value={package_.min_hours}
                      onChange={(e) => setPackage(prev => ({ 
                        ...prev, 
                        min_hours: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meal Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Meal Plan Selection</CardTitle>
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

            {/* Base Price Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Base Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pricing-type">Pricing Type</Label>
                      <Select 
                        value={package_.pricing_type} 
                        onValueChange={(value: 'per_person' | 'per_package') => 
                          setPackage(prev => ({ ...prev, pricing_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_person">Per Person</SelectItem>
                          <SelectItem value="per_package">Per Package</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="base-price">Base Price - Full Day (₹)</Label>
                      <Input
                        id="base-price"
                        type="number"
                        min="0"
                        step="100"
                        value={package_.base_price}
                        onChange={(e) => setPackage(prev => ({ 
                          ...prev, 
                          base_price: parseFloat(e.target.value) || 0 
                        }))}
                        placeholder="Enter full day base price"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Duration-Based Pricing</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">Half Day (4-5h)</div>
                        <div className="text-gray-700">₹{Math.round(package_.base_price * 0.6)}</div>
                        <div className="text-xs text-gray-500">60% of full day</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">Full Day (6-8h)</div>  
                        <div className="text-gray-700">₹{package_.base_price}</div>
                        <div className="text-xs text-gray-500">Base price</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">Extended (10+h)</div>
                        <div className="text-gray-700">₹{Math.round(package_.base_price * 1.5)}</div>
                        <div className="text-xs text-gray-500">150% of full day</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Pricing */}
            <HourlyPricingSection
              pricingType={package_.pricing_type}
              durationHours={Math.floor(package_.duration_hours)}
              hourlyRates={hourlyRates}
              onUpdateHourlyRates={setHourlyRates}
            />

            {/* Meal Pricing */}
            <MealPricingSection
              selectedMealPlans={package_.meal_plan}
              pricingType={package_.pricing_type}
              mealPrices={mealPrices}
              onUpdateMealPrices={setMealPrices}
            />

            {/* Option Pricing */}
            <OptionPricingSection
              optionPrices={optionPrices}
              onUpdateOptionPrices={setOptionPrices}
            />

            {/* Save Button */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
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

          {/* Preview */}
          <div className="lg:col-span-1">
            <PricingPreview
              property={property}
              selectedMealPlans={package_.meal_plan}
              pricingType={package_.pricing_type}
              durationHours={Math.floor(package_.duration_hours)}
              hourlyRates={hourlyRates}
              mealPrices={mealPrices}
              optionPrices={optionPrices}
              startTime={package_.start_time}
              endTime={package_.end_time}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayPicnicSetup;
