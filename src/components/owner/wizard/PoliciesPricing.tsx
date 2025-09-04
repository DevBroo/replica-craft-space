import React from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Textarea } from '@/components/owner/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/owner/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { Checkbox } from '@/components/owner/ui/checkbox';
import { ArrowLeft, ArrowRight, DollarSign, Calendar, Clock, CreditCard } from 'lucide-react';

interface PoliciesPricingProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card', popular: true },
  { value: 'cash', label: 'Cash Payment', popular: true },
  { value: 'bank_transfer', label: 'Bank Transfer', popular: false },
  { value: 'upi', label: 'UPI Payment', popular: true },
  { value: 'digital_wallet', label: 'Digital Wallet', popular: false },
  { value: 'check', label: 'Check/Cheque', popular: false }
];

const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible', description: 'Free cancellation 24 hours before check-in' },
  { value: 'moderate', label: 'Moderate', description: 'Free cancellation 5 days before check-in' },
  { value: 'strict', label: 'Strict', description: 'Free cancellation 14 days before check-in' },
  { value: 'super_strict', label: 'Super Strict', description: '50% refund up to 30 days before check-in' },
  { value: 'non_refundable', label: 'Non-refundable', description: 'No refunds, but 10% lower prices' }
];

const MEAL_PLANS = [
  'Room Only', 'Bed & Breakfast', 'Half Board', 'Full Board', 'All Inclusive',
  'Continental Breakfast', 'American Breakfast', 'Lunch Included', 'Dinner Included'
];

const PoliciesPricing: React.FC<PoliciesPricingProps> = ({
  formData,
  setFormData,
  onNext,
  onPrevious
}) => {
  const handlePricingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value }
    }));
  };

  const handlePolicyChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      policies_extended: {
        ...prev.policies_extended,
        [category]: { ...prev.policies_extended[category as keyof typeof prev.policies_extended], [field]: value }
      }
    }));
  };

  const handlePaymentMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }));
  };

  const handleMealPlanToggle = (plan: string) => {
    setFormData(prev => ({
      ...prev,
      meal_plans: prev.meal_plans.includes(plan)
        ? prev.meal_plans.filter(p => p !== plan)
        : [...prev.meal_plans, plan]
    }));
  };

  const addSeasonalRate = () => {
    const baseRate = formData.pricing.daily_rate || 0;
    const newSeason = {
      name: 'Peak Season',
      rate: baseRate * 1.5,
      start_date: '',
      end_date: ''
    };
    
    setFormData(prev => ({
      ...prev,
      seasonal_pricing: {
        ...prev.seasonal_pricing,
        seasons: [...prev.seasonal_pricing.seasons, newSeason]
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Basic Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="daily_rate">Base Rate per Night *</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="daily_rate"
                  type="number"
                  min="100"
                  value={formData.pricing.daily_rate}
                  onChange={(e) => handlePricingChange('daily_rate', parseInt(e.target.value) || 0)}
                  className="pl-8"
                  placeholder="1000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="minimum_stay">Minimum Stay (nights)</Label>
              <Input
                id="minimum_stay"
                type="number"
                min="1"
                value={formData.minimum_stay}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_stay: parseInt(e.target.value) || 1 }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.pricing.currency}
                onValueChange={(value) => handlePricingChange('currency', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Pricing Recommendations</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Research similar properties in your area</div>
              <div>• Consider seasonal demand patterns</div>
              <div>• Factor in your unique amenities and services</div>
              <div>• Start competitive and adjust based on booking patterns</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seasonal & Special Pricing</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set different rates for peak seasons, holidays, or special events
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.seasonal_pricing.seasons.map((season, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Season {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      seasonal_pricing: {
                        ...prev.seasonal_pricing,
                        seasons: prev.seasonal_pricing.seasons.filter((_, i) => i !== index)
                      }
                    }));
                  }}
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Season Name</Label>
                  <Input
                    value={season.name}
                    onChange={(e) => {
                      const newSeasons = [...formData.seasonal_pricing.seasons];
                      newSeasons[index] = { ...season, name: e.target.value };
                      setFormData(prev => ({
                        ...prev,
                        seasonal_pricing: { ...prev.seasonal_pricing, seasons: newSeasons }
                      }));
                    }}
                    placeholder="Peak Season"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Rate per Night</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={season.rate}
                      onChange={(e) => {
                        const newSeasons = [...formData.seasonal_pricing.seasons];
                        newSeasons[index] = { ...season, rate: parseInt(e.target.value) || 0 };
                        setFormData(prev => ({
                          ...prev,
                          seasonal_pricing: { ...prev.seasonal_pricing, seasons: newSeasons }
                        }));
                      }}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={season.start_date}
                    onChange={(e) => {
                      const newSeasons = [...formData.seasonal_pricing.seasons];
                      newSeasons[index] = { ...season, start_date: e.target.value };
                      setFormData(prev => ({
                        ...prev,
                        seasonal_pricing: { ...prev.seasonal_pricing, seasons: newSeasons }
                      }));
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={season.end_date}
                    onChange={(e) => {
                      const newSeasons = [...formData.seasonal_pricing.seasons];
                      newSeasons[index] = { ...season, end_date: e.target.value };
                      setFormData(prev => ({
                        ...prev,
                        seasonal_pricing: { ...prev.seasonal_pricing, seasons: newSeasons }
                      }));
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addSeasonalRate} className="w-full">
            Add Seasonal Rate
          </Button>
        </CardContent>
      </Card>

      {/* Check-in/Check-out Times */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Check-in & Check-out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in_time">Check-in Time</Label>
              <Input
                id="check_in_time"
                type="time"
                value={formData.check_in_time}
                onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="check_out_time">Check-out Time</Label>
              <Input
                id="check_out_time"
                type="time"
                value={formData.check_out_time}
                onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PAYMENT_METHODS.map(method => (
              <div key={method.value} className="flex items-center space-x-2">
                <Checkbox
                  id={method.value}
                  checked={formData.payment_methods.includes(method.value)}
                  onCheckedChange={() => handlePaymentMethodToggle(method.value)}
                />
                <Label htmlFor={method.value} className="text-sm cursor-pointer">
                  {method.label}
                  {method.popular && <Badge variant="secondary" className="ml-1 text-xs">Popular</Badge>}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cancellation Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CANCELLATION_POLICIES.map(policy => (
              <div
                key={policy.value}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.cancellation_policy === policy.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-muted-foreground/25'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, cancellation_policy: policy.value }))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{policy.label}</div>
                    <div className="text-sm text-muted-foreground">{policy.description}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    formData.cancellation_policy === policy.value 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meal Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meal Plans Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MEAL_PLANS.map(plan => (
              <Badge
                key={plan}
                variant={formData.meal_plans.includes(plan) ? "default" : "outline"}
                className="cursor-pointer hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                onClick={() => handleMealPlanToggle(plan)}
              >
                {plan}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policy Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="child_policy">Child Policy</Label>
            <Textarea
              id="child_policy"
              placeholder="Specify age limits, additional charges, crib availability, etc."
              className="mt-1"
              rows={2}
              onChange={(e) => handlePolicyChange('child_policy', 'description', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="pet_policy">Pet Policy</Label>
            <Textarea
              id="pet_policy"
              placeholder="Pet-friendly accommodation details, charges, restrictions, etc."
              className="mt-1"
              rows={2}
              onChange={(e) => handlePolicyChange('pet_policy', 'description', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="smoking_policy">Smoking Policy</Label>
            <Textarea
              id="smoking_policy"
              placeholder="Smoking restrictions, designated areas, penalties, etc."
              className="mt-1"
              rows={2}
              onChange={(e) => handlePolicyChange('smoking_policy', 'description', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PoliciesPricing;