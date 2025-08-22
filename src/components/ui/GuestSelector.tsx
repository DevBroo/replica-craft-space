import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Users, Baby, User } from "lucide-react";

export interface GuestBreakdown {
  adults: number;
  children: Array<{
    age: number;
    priceCategory: 'free' | 'half' | 'full';
  }>;
}

interface GuestSelectorProps {
  maxGuests: number;
  onGuestsChange: (guests: GuestBreakdown) => void;
  initialGuests?: GuestBreakdown;
  className?: string;
}

export const GuestSelector: React.FC<GuestSelectorProps> = ({
  maxGuests,
  onGuestsChange,
  initialGuests = { adults: 2, children: [] },
  className = ""
}) => {
  const [adults, setAdults] = useState(initialGuests.adults);
  const [children, setChildren] = useState<Array<{ age: number; priceCategory: 'free' | 'half' | 'full' }>>(
    initialGuests.children
  );

  const getPriceCategory = (age: number): 'free' | 'half' | 'full' => {
    if (age <= 5) return 'free';
    if (age <= 10) return 'half';
    return 'full';
  };

  const updateChildAge = (index: number, age: number) => {
    const newChildren = [...children];
    newChildren[index] = {
      age,
      priceCategory: getPriceCategory(age)
    };
    setChildren(newChildren);
  };

  const addChild = () => {
    if (adults + children.length < maxGuests) {
      setChildren([...children, { age: 6, priceCategory: 'half' }]);
    }
  };

  const removeChild = (index: number) => {
    const newChildren = children.filter((_, i) => i !== index);
    setChildren(newChildren);
  };

  const incrementAdults = () => {
    if (adults + children.length < maxGuests) {
      setAdults(adults + 1);
    }
  };

  const decrementAdults = () => {
    if (adults > 1) {
      setAdults(adults - 1);
    }
  };

  const totalGuests = adults + children.length;

  useEffect(() => {
    onGuestsChange({ adults, children });
  }, [adults, children, onGuestsChange]);

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Adults</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decrementAdults}
              disabled={adults <= 1}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-medium">{adults}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={incrementAdults}
              disabled={totalGuests >= maxGuests}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Label className="font-medium">Children</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addChild}
              disabled={totalGuests >= maxGuests}
              className="h-8"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Child
            </Button>
          </div>

          {children.map((child, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
              <Baby className="w-3 h-3 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor={`child-age-${index}`} className="text-xs text-muted-foreground">
                  Child {index + 1} age
                </Label>
                <Input
                  id={`child-age-${index}`}
                  type="number"
                  min="0"
                  max="17"
                  value={child.age}
                  onChange={(e) => updateChildAge(index, parseInt(e.target.value) || 0)}
                  className="h-7 text-sm"
                />
              </div>
              <div className="text-xs text-center min-w-[50px]">
                {child.priceCategory === 'free' && (
                  <span className="text-green-600 font-medium">Free</span>
                )}
                {child.priceCategory === 'half' && (
                  <span className="text-orange-600 font-medium">Half</span>
                )}
                {child.priceCategory === 'full' && (
                  <span className="text-blue-600 font-medium">Full</span>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeChild(index)}
              >
                <Minus className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Guests:</span>
            <span className="font-medium">{totalGuests} / {maxGuests}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            • Age 0-5: Free • Age 6-10: Half price • Age 11+: Full price
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuestSelector;