import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock } from 'lucide-react';

interface DurationPrice {
  duration_type: 'half_day' | 'full_day' | 'extended_day';
  price: number;
}

interface Props {
  durationPrices: DurationPrice[];
  onUpdateDurationPrices: (prices: DurationPrice[]) => void;
  pricingType: 'per_person' | 'per_package';
}

const DurationPricingSection: React.FC<Props> = ({
  durationPrices,
  onUpdateDurationPrices,
  pricingType
}) => {
  const durationCategories = [
    { 
      key: 'half_day' as const, 
      label: 'Half Day (4-6 hours)', 
      description: 'Perfect for shorter visits' 
    },
    { 
      key: 'full_day' as const, 
      label: 'Full Day (8-10 hours)', 
      description: 'Complete day experience' 
    },
    { 
      key: 'extended_day' as const, 
      label: 'Extended Day (10+ hours)', 
      description: 'Maximum duration experience' 
    }
  ];

  const updateDurationPrice = (durationType: DurationPrice['duration_type'], price: number) => {
    const updated = [...durationPrices];
    const existingIndex = updated.findIndex(dp => dp.duration_type === durationType);
    
    if (existingIndex >= 0) {
      updated[existingIndex] = { duration_type: durationType, price };
    } else {
      updated.push({ duration_type: durationType, price });
    }
    
    onUpdateDurationPrices(updated);
  };

  const getDurationPrice = (durationType: DurationPrice['duration_type']) => {
    const found = durationPrices.find(dp => dp.duration_type === durationType);
    return found ? found.price : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Duration-Based Pricing
        </CardTitle>
        <p className="text-sm text-gray-600">
          Set different prices for different durations. Guests can choose their preferred duration.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {durationCategories.map((category) => (
          <div key={category.key} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="font-medium">{category.label}</Label>
                <p className="text-sm text-gray-500">{category.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">₹</span>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={getDurationPrice(category.key)}
                  onChange={(e) => updateDurationPrice(category.key, parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">
                  {pricingType.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-700 font-medium">Pricing Tips:</p>
          <ul className="text-xs text-blue-600 mt-1 space-y-1">
            <li>• Half Day: Usually 60-70% of full day price</li>
            <li>• Full Day: Your standard rate</li>
            <li>• Extended Day: Usually 130-150% of full day price</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DurationPricingSection;