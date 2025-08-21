
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Trash2 } from 'lucide-react';

interface HourlyRate {
  meal_plan: string;
  hour_number: number;
  price_per_person: number;
  price_per_package: number;
}

interface Props {
  selectedMealPlans: string[];
  pricingType: 'per_person' | 'per_package';
  durationHours: number;
  hourlyRates: HourlyRate[];
  onUpdateHourlyRates: (rates: HourlyRate[]) => void;
}

const HourlyPricingSection: React.FC<Props> = ({
  selectedMealPlans,
  pricingType,
  durationHours,
  hourlyRates,
  onUpdateHourlyRates
}) => {
  const generateDefaultRates = () => {
    const rates: HourlyRate[] = [];
    selectedMealPlans.forEach(meal => {
      for (let hour = 1; hour <= durationHours; hour++) {
        rates.push({
          meal_plan: meal,
          hour_number: hour,
          price_per_person: 0,
          price_per_package: 0
        });
      }
    });
    return rates;
  };

  const ensureRatesExist = () => {
    const defaultRates = generateDefaultRates();
    const existingRates = new Set(
      hourlyRates.map(r => `${r.meal_plan}-${r.hour_number}`)
    );
    
    const newRates = [...hourlyRates];
    defaultRates.forEach(rate => {
      const key = `${rate.meal_plan}-${rate.hour_number}`;
      if (!existingRates.has(key)) {
        newRates.push(rate);
      }
    });
    
    // Remove rates for unselected meals or beyond duration
    const filteredRates = newRates.filter(rate => 
      selectedMealPlans.includes(rate.meal_plan) && 
      rate.hour_number <= durationHours
    );
    
    if (filteredRates.length !== hourlyRates.length) {
      onUpdateHourlyRates(filteredRates);
    }
  };

  React.useEffect(() => {
    ensureRatesExist();
  }, [selectedMealPlans, durationHours]);

  const updateRate = (mealPlan: string, hourNumber: number, field: 'price_per_person' | 'price_per_package', value: number) => {
    const updatedRates = hourlyRates.map(rate => {
      if (rate.meal_plan === mealPlan && rate.hour_number === hourNumber) {
        return { ...rate, [field]: value };
      }
      return rate;
    });
    onUpdateHourlyRates(updatedRates);
  };

  const getRateValue = (mealPlan: string, hourNumber: number, field: 'price_per_person' | 'price_per_package') => {
    const rate = hourlyRates.find(r => r.meal_plan === mealPlan && r.hour_number === hourNumber);
    return rate ? rate[field] : 0;
  };

  if (selectedMealPlans.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Pricing by Meal Plan</CardTitle>
        <p className="text-sm text-gray-600">
          Set prices for each hour and meal plan combination
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedMealPlans.map(meal => (
          <div key={meal} className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{meal}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: durationHours }, (_, i) => i + 1).map(hour => (
                <div key={hour} className="border rounded-lg p-3 space-y-2">
                  <Label className="text-sm font-medium">Hour {hour}</Label>
                  {pricingType === 'per_person' && (
                    <div>
                      <Label className="text-xs text-gray-500">Per Person (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={getRateValue(meal, hour, 'price_per_person')}
                        onChange={(e) => updateRate(meal, hour, 'price_per_person', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  )}
                  {pricingType === 'per_package' && (
                    <div>
                      <Label className="text-xs text-gray-500">Per Package (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={getRateValue(meal, hour, 'price_per_package')}
                        onChange={(e) => updateRate(meal, hour, 'price_per_package', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default HourlyPricingSection;
