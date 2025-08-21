import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock } from 'lucide-react';

interface HourlyRate {
  meal_plan: string;
  hour_number: number;
  price_per_person: number;
  price_per_package: number;
}

interface Props {
  pricingType: 'per_person' | 'per_package';
  durationHours: number;
  hourlyRates: HourlyRate[];
  onUpdateHourlyRates: (rates: HourlyRate[]) => void;
}

const HourlyPricingSection: React.FC<Props> = ({
  pricingType,
  durationHours,
  hourlyRates,
  onUpdateHourlyRates
}) => {
  const ensureHourlyRatesExist = () => {
    const existingHours = new Set(
      hourlyRates.filter(r => r.meal_plan === 'ALL').map(r => r.hour_number)
    );
    
    const newRates = [...hourlyRates.filter(r => r.meal_plan === 'ALL')];
    
    // Add missing hours
    for (let hour = 1; hour <= durationHours; hour++) {
      if (!existingHours.has(hour)) {
        newRates.push({
          meal_plan: 'ALL',
          hour_number: hour,
          price_per_person: 0,
          price_per_package: 0
        });
      }
    }
    
    // Remove rates beyond duration
    const filteredRates = newRates.filter(rate => 
      rate.hour_number <= durationHours
    );
    
    if (filteredRates.length !== hourlyRates.filter(r => r.meal_plan === 'ALL').length) {
      // Keep non-ALL rates (for backward compatibility) and add our filtered ALL rates
      const nonAllRates = hourlyRates.filter(r => r.meal_plan !== 'ALL');
      onUpdateHourlyRates([...nonAllRates, ...filteredRates]);
    }
  };

  React.useEffect(() => {
    ensureHourlyRatesExist();
  }, [durationHours]);

  const updateRate = (hourNumber: number, field: 'price_per_person' | 'price_per_package', value: number) => {
    const updatedRates = hourlyRates.map(rate => {
      if (rate.meal_plan === 'ALL' && rate.hour_number === hourNumber) {
        return { ...rate, [field]: value };
      }
      return rate;
    });
    onUpdateHourlyRates(updatedRates);
  };

  const getRateValue = (hourNumber: number, field: 'price_per_person' | 'price_per_package') => {
    const rate = hourlyRates.find(r => r.meal_plan === 'ALL' && r.hour_number === hourNumber);
    return rate ? rate[field] : 0;
  };

  if (durationHours === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Hourly Pricing
        </CardTitle>
        <p className="text-sm text-gray-600">
          Set prices for each hour (applies to all meal plans)
        </p>
      </CardHeader>
      <CardContent>
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
                    value={getRateValue(hour, 'price_per_person')}
                    onChange={(e) => updateRate(hour, 'price_per_person', parseFloat(e.target.value) || 0)}
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
                    value={getRateValue(hour, 'price_per_package')}
                    onChange={(e) => updateRate(hour, 'price_per_package', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HourlyPricingSection;
