
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

interface MealPrice {
  meal_plan: string;
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
  mealPrices: MealPrice[];
  optionPrices: OptionPrice[];
  durationPrices: { duration_type: string; price: number }[];
  startTime: string;
  endTime: string;
}

const PricingPreview: React.FC<Props> = ({
  property,
  selectedMealPlans,
  pricingType,
  durationHours,
  hourlyRates,
  mealPrices,
  optionPrices,
  durationPrices,
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

  const calculateSampleHourlyPrice = () => {
    // Calculate for 4 hours as sample
    const sampleHours = Math.min(4, durationHours);
    let total = 0;
    
    for (let hour = 1; hour <= sampleHours; hour++) {
      const rate = hourlyRates.find(r => r.meal_plan === 'ALL' && r.hour_number === hour);
      if (rate) {
        total += pricingType === 'per_person' ? rate.price_per_person : rate.price_per_package;
      }
    }
    
    return total;
  };

  const calculateSampleMealPrice = () => {
    if (selectedMealPlans.length === 0 || mealPrices.length === 0) return 0;
    
    // Take first meal plan as sample
    const firstMeal = selectedMealPlans[0];
    const mealPrice = mealPrices.find(mp => mp.meal_plan === firstMeal);
    
    if (!mealPrice) return 0;
    
    return pricingType === 'per_person' ? mealPrice.price_per_person : mealPrice.price_per_package;
  };

  const requiredInclusions = optionPrices.filter(opt => opt.option_type === 'inclusion' && opt.is_required);
  const optionalInclusions = optionPrices.filter(opt => opt.option_type === 'inclusion' && !opt.is_required);
  const addOns = optionPrices.filter(opt => opt.option_type === 'add_on');

  const requiredInclusionsPrice = requiredInclusions.reduce((sum, inc) => sum + inc.price, 0);
  const sampleHourlyPrice = calculateSampleHourlyPrice();
  const sampleMealPrice = calculateSampleMealPrice();
  const sampleTotalPrice = sampleHourlyPrice + sampleMealPrice + requiredInclusionsPrice;

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
            <p className="font-medium">Meal Plans Available</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedMealPlans.map(meal => (
                <Badge key={meal} variant="secondary" className="text-xs">
                  {meal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sampleHourlyPrice > 0 && (
          <div>
            <p className="font-medium">Sample Hourly Pricing (4h)</p>
            <p className="text-lg font-semibold text-blue-600">
              ₹{sampleHourlyPrice} {pricingType.replace('_', ' ')}
            </p>
          </div>
        )}

        {sampleMealPrice > 0 && selectedMealPlans.length > 0 && (
          <div>
            <p className="font-medium">Sample Meal Price ({selectedMealPlans[0]})</p>
            <p className="text-lg font-semibold text-orange-600">
              ₹{sampleMealPrice} {pricingType.replace('_', ' ')}
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

        {property?.exclusions && property.exclusions.length > 0 && (
          <div>
            <p className="font-medium text-red-600">❌ Exclusions</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {property.exclusions.slice(0, 2).map((exclusion: any, index: number) => (
                <li key={index}>
                  <span>• {exclusion.item || exclusion}</span>
                  {exclusion.reason && <span className="text-gray-500"> ({exclusion.reason})</span>}
                </li>
              ))}
              {property.exclusions.length > 2 && (
                <li className="text-gray-400">+ {property.exclusions.length - 2} more</li>
              )}
            </ul>
          </div>
        )}

        {sampleTotalPrice > 0 && (
          <div className="pt-3 border-t">
            <p className="font-medium">Sample Total (Full Day)</p>
            <div className="text-sm text-gray-600 space-y-1">
              {sampleHourlyPrice > 0 && <p>Hours (4h): ₹{sampleHourlyPrice}</p>}
              {sampleMealPrice > 0 && <p>Meal: ₹{sampleMealPrice}</p>}
              {requiredInclusionsPrice > 0 && <p>Required: ₹{requiredInclusionsPrice}</p>}
            </div>
            <p className="text-xl font-bold text-green-600 mt-2">
              ₹{sampleTotalPrice}
            </p>
            
            <div className="mt-3 bg-gray-50 p-3 rounded-md">
              <p className="text-xs font-medium text-gray-700 mb-2">Duration-based pricing:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-blue-600 font-medium">Half Day</div>
                  <div>
                    {durationPrices.find(dp => dp.duration_type === 'half_day') 
                      ? `₹${durationPrices.find(dp => dp.duration_type === 'half_day')?.price}` 
                      : `₹${Math.round(sampleTotalPrice * 0.6)}`
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {durationPrices.find(dp => dp.duration_type === 'half_day') ? 'Owner set' : '60% of full day'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-medium">Full Day</div>
                  <div>
                    {durationPrices.find(dp => dp.duration_type === 'full_day') 
                      ? `₹${durationPrices.find(dp => dp.duration_type === 'full_day')?.price}` 
                      : `₹${sampleTotalPrice}`
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {durationPrices.find(dp => dp.duration_type === 'full_day') ? 'Owner set' : 'Base price'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-purple-600 font-medium">Extended</div>
                  <div>
                    {durationPrices.find(dp => dp.duration_type === 'extended_day') 
                      ? `₹${durationPrices.find(dp => dp.duration_type === 'extended_day')?.price}` 
                      : `₹${Math.round(sampleTotalPrice * 1.5)}`
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {durationPrices.find(dp => dp.duration_type === 'extended_day') ? 'Owner set' : '150% of full day'}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Final price depends on duration, meal & selections
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingPreview;
