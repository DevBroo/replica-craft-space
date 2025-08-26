import React from 'react';
import { Clock, Users, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PackageCardProps {
  pkg: {
    id: string;
    meal_plan: string[];
    duration_hours?: number;
    min_hours?: number;
    inclusions?: any[];
    exclusions?: any[];
    base_price: number;
    pricing_type: string;
    start_time?: string;
    end_time?: string;
  };
  onSelect: (pkg: any) => void;
  isSelected?: boolean;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onSelect,
  isSelected = false
}) => {
  const duration = pkg.duration_hours || pkg.min_hours || 8;
  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];
  const exclusions = Array.isArray(pkg.exclusions) ? pkg.exclusions : [];

  return (
    <Card className={`h-full transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-4">
        {/* Duration and time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {duration} hours
          </div>
          {pkg.start_time && pkg.end_time && (
            <div className="text-sm text-muted-foreground">
              {pkg.start_time} - {pkg.end_time}
            </div>
          )}
        </div>

        {/* Meal plan badges */}
        {pkg.meal_plan && pkg.meal_plan.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {pkg.meal_plan.map((meal, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {meal.charAt(0).toUpperCase() + meal.slice(1)}
              </Badge>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">₹{pkg.base_price}</span>
          <span className="text-sm text-muted-foreground">
            {pkg.pricing_type === 'per_person' ? 'per person' : 'per package'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Inclusions */}
        {inclusions.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-green-700">What's Included</h4>
            <ul className="space-y-1">
              {inclusions.slice(0, 4).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
              {inclusions.length > 4 && (
                <li className="text-xs text-muted-foreground ml-5">
                  +{inclusions.length - 4} more inclusions
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {exclusions.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-red-700">Not Included</h4>
            <ul className="space-y-1">
              {exclusions.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <X className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
              {exclusions.length > 3 && (
                <li className="text-xs text-muted-foreground ml-5">
                  +{exclusions.length - 3} more exclusions
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Select button */}
        <Button 
          onClick={() => onSelect(pkg)}
          className="w-full mt-4"
          variant={isSelected ? "default" : "outline"}
        >
          {isSelected ? 'Selected Package' : 'Select Package'}
        </Button>
      </CardContent>
    </Card>
  );
};