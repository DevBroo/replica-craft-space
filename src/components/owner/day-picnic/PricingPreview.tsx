
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MapPin, Clock, Users } from 'lucide-react';

interface HourlyRate {
  meal_plan: string;
  hour_number: number;
  price_per_person: number;
  price_per_package: number;
}

interface OptionPrice {
  option_type: 'inclusion' | 'add_on';
  name: string;
  price: number;
  is_required: boolean;
}

interface Props {
  property: any;
  selectedMealPlans: string[];
  pricingType: 'per_person' | 'per_package';
  durationHours: number;
  hourlyRates: HourlyRate[];
  optionPrices: OptionPrice[];
  startTime: string;
  endTime: string;
}

const PricingPreview: React.FC<Props> = ({
  property,
  selectedMealPlans,
  pricingType,
  durationHours,
  hourlyRates,
  optionPrices,
  startTime,
  endTime
}) => {
  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  const calculateSamplePrice = () => {
    if (hourlyRates.length === 0) return 0;
    
    // Calculate for 4 hours as sample
    const sampleHours = Math.min(4, durationHours);
    let total = 0;
    
    selectedMealPlans.forEach(meal => {
      for (let hour = 1; hour <= sampleHours; hour++) {
        const rate = hourlyRates.find(r => r.meal_plan === meal && r.hour_number === hour);
        if (rate) {
          total += pricingType === 'per_person' ? rate.price_per_person : rate.price_per_package;
        }
      }
    });
    
    return total;
  };

  const requiredInclusions = optionPrices.filter(opt => opt.option_type === 'inclusion' && opt.is_required);
  const optionalInclusions = optionPrices.filter(opt => opt.option_type === 'inclusion' && !opt.is_required);
  const addOns = optionPrices.filter(opt => opt.option_type === 'add_on');

  const requiredInclusionsPrice = requiredInclusions.reduce((sum, inc) => sum + inc.price, 0);
  const sampleBasePrice = calculateSamplePrice();
  const sampleTotalPrice = sampleBasePrice + requiredInclusionsPrice;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Package Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Day Picnic at {property?.title}</h3>
          <p className="text-sm text-gray-600 flex items-center mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {property?.address}
          </p>
        </div>

        <div>
          <p className="font-medium flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Timing
          </p>
          <p className="text-sm text-gray-600">
            {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)} | {durationHours} Hours
          </p>
        </div>

        {selectedMealPlans.length > 0 && (
          <div>
            <p className="font-medium">Meal Plans</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedMealPlans.map(meal => (
                <Badge key={meal} variant="secondary" className="text-xs">
                  {meal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hourlyRates.length > 0 && (
          <div>
            <p className="font-medium">Sample Pricing (4 hours)</p>
            <p className="text-lg font-semibold text-green-600">
              ₹{sampleBasePrice} {pricingType.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-500">
              Varies by meal plan and duration selected
            </p>
          </div>
        )}

        {requiredInclusions.length > 0 && (
          <div>
            <p className="font-medium text-green-600">✅ Required Inclusions</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {requiredInclusions.slice(0, 3).map(inclusion => (
                <li key={inclusion.name} className="flex justify-between">
                  <span>• {inclusion.name}</span>
                  <span className="font-medium">₹{inclusion.price}</span>
                </li>
              ))}
              {requiredInclusions.length > 3 && (
                <li className="text-gray-400">+ {requiredInclusions.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        {optionalInclusions.length > 0 && (
          <div>
            <p className="font-medium text-blue-600">🔲 Optional Inclusions</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {optionalInclusions.slice(0, 2).map(inclusion => (
                <li key={inclusion.name} className="flex justify-between">
                  <span>• {inclusion.name}</span>
                  <span className="font-medium">₹{inclusion.price}</span>
                </li>
              ))}
              {optionalInclusions.length > 2 && (
                <li className="text-gray-400">+ {optionalInclusions.length - 2} more</li>
              )}
            </ul>
          </div>
        )}

        {addOns.length > 0 && (
          <div>
            <p className="font-medium text-purple-600">➕ Add-ons Available</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {addOns.slice(0, 2).map(addon => (
                <li key={addon.name} className="flex justify-between">
                  <span>• {addon.name}</span>
                  <span className="font-medium">₹{addon.price}</span>
                </li>
              ))}
              {addOns.length > 2 && (
                <li className="text-gray-400">+ {addOns.length - 2} more</li>
              )}
            </ul>
          </div>
        )}

        {sampleTotalPrice > 0 && (
          <div className="pt-3 border-t">
            <p className="font-medium">Sample Total (4h + required)</p>
            <p className="text-xl font-bold text-green-600">
              ₹{sampleTotalPrice}
            </p>
            <p className="text-xs text-gray-500">
              Final price depends on selections
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingPreview;
