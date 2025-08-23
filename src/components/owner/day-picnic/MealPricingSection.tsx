
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { NumericInput } from '../ui/NumericInput';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Utensils } from 'lucide-react';

interface MealPrice {
  meal_plan: string;
  price_per_person: number;
  price_per_package: number;
}

interface Props {
  selectedMealPlans: string[];
  pricingType: 'per_person' | 'per_package';
  mealPrices: MealPrice[];
  onUpdateMealPrices: (prices: MealPrice[]) => void;
}

const MealPricingSection: React.FC<Props> = ({
  selectedMealPlans,
  pricingType,
  mealPrices,
  onUpdateMealPrices
}) => {
  const ensureMealPricesExist = React.useCallback(() => {
    const existingMeals = new Set(mealPrices.map(mp => mp.meal_plan));
    const newPrices = [...mealPrices];
    
    selectedMealPlans.forEach(meal => {
      if (!existingMeals.has(meal)) {
        newPrices.push({
          meal_plan: meal,
          price_per_person: 0,
          price_per_package: 0
        });
      }
    });
    
    // Remove prices for unselected meals
    const filteredPrices = newPrices.filter(mp => 
      selectedMealPlans.includes(mp.meal_plan)
    );
    
    // Only update if there's an actual change
    const hasChanges = filteredPrices.length !== mealPrices.length ||
      filteredPrices.some((fp, idx) => {
        const existing = mealPrices[idx];
        return !existing || fp.meal_plan !== existing.meal_plan;
      });
    
    if (hasChanges) {
      onUpdateMealPrices(filteredPrices);
    }
  }, [selectedMealPlans, mealPrices, onUpdateMealPrices]);

  React.useEffect(() => {
    ensureMealPricesExist();
  }, [ensureMealPricesExist]);

  const updateMealPrice = React.useCallback((mealPlan: string, field: 'price_per_person' | 'price_per_package', value: number) => {
    // Prevent unnecessary updates
    const existingPrice = mealPrices.find(mp => mp.meal_plan === mealPlan);
    if (existingPrice && existingPrice[field] === value) {
      return;
    }
    
    const updatedPrices = mealPrices.map(mp => {
      if (mp.meal_plan === mealPlan) {
        return { ...mp, [field]: value };
      }
      return mp;
    });
    onUpdateMealPrices(updatedPrices);
  }, [mealPrices, onUpdateMealPrices]);

  const getMealPriceValue = (mealPlan: string, field: 'price_per_person' | 'price_per_package') => {
    const mealPrice = mealPrices.find(mp => mp.meal_plan === mealPlan);
    return mealPrice ? mealPrice[field] : 0;
  };

  if (selectedMealPlans.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Utensils className="w-5 h-5 mr-2 text-orange-600" />
          Meal Plan Pricing
        </CardTitle>
        <p className="text-sm text-gray-600">
          Set a flat price for each meal plan (not per hour)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedMealPlans.map(meal => (
            <div key={meal} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{meal}</Badge>
              </div>
              
              {pricingType === 'per_person' && (
                <div>
                  <Label className="text-sm font-medium">Per Person (₹)</Label>
                   <NumericInput
                    value={getMealPriceValue(meal, 'price_per_person')}
                    onValueChange={(value) => updateMealPrice(meal, 'price_per_person', value)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                  />
                </div>
              )}
              
              {pricingType === 'per_package' && (
                <div>
                  <Label className="text-sm font-medium">Per Package (₹)</Label>
                   <NumericInput
                    value={getMealPriceValue(meal, 'price_per_package')}
                    onValueChange={(value) => updateMealPrice(meal, 'price_per_package', value)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
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

export default MealPricingSection;
