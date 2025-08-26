
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { NumericInput } from '../ui/NumericInput';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface OptionPrice {
  id?: string;
  option_type: 'inclusion' | 'add_on' | 'exclusion';
  name: string;
  price: number;
  is_required: boolean;
}

interface Props {
  optionPrices: OptionPrice[];
  onUpdateOptionPrices: (options: OptionPrice[]) => void;
}

const OptionPricingSection: React.FC<Props> = ({
  optionPrices,
  onUpdateOptionPrices
}) => {
  const inclusions = optionPrices.filter(opt => opt.option_type === 'inclusion');
  const exclusions = optionPrices.filter(opt => opt.option_type === 'exclusion');
  const addOns = optionPrices.filter(opt => opt.option_type === 'add_on');

  const addOption = (type: 'inclusion' | 'add_on' | 'exclusion') => {
    const newOption: OptionPrice = {
      option_type: type,
      name: '',
      price: 0,
      is_required: false
    };
    onUpdateOptionPrices([...optionPrices, newOption]);
  };

  const updateOption = (index: number, field: keyof OptionPrice, value: any) => {
    const updated = optionPrices.map((opt, i) => {
      if (i === index) {
        // Guard against strange price values
        if (field === 'price') {
          value = isNaN(value) || value < 0 ? 0 : value;
        }
        return { ...opt, [field]: value };
      }
      return opt;
    });
    onUpdateOptionPrices(updated);
  };

  const removeOption = (index: number) => {
    const updated = optionPrices.filter((_, i) => i !== index);
    onUpdateOptionPrices(updated);
  };

  const renderOptionList = (options: OptionPrice[], type: 'inclusion' | 'add_on' | 'exclusion') => {
    const startIndex = type === 'inclusion' 
      ? 0 
      : type === 'exclusion'
      ? inclusions.length
      : inclusions.length + exclusions.length;

    return (
      <div className="space-y-3">
        {options.map((option, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <div key={actualIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
              <Input
                placeholder={`${type === 'inclusion' ? 'Inclusion' : type === 'exclusion' ? 'Exclusion' : 'Add-on'} name`}
                value={option.name}
                onChange={(e) => updateOption(actualIndex, 'name', e.target.value)}
                className="flex-1"
              />
               <div className="w-24">
                 <NumericInput
                  value={option.price}
                  onValueChange={(value) => updateOption(actualIndex, 'price', value)}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
               </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${actualIndex}`}
                  checked={option.is_required}
                  onCheckedChange={(checked) => updateOption(actualIndex, 'is_required', checked)}
                />
                <Label htmlFor={`required-${actualIndex}`} className="text-sm">Required</Label>
              </div>
               <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOption(actualIndex)}
                aria-label="Delete option"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Inclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Inclusions with Pricing
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set individual prices for each inclusion. Users can select/deselect optional ones.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderOptionList(inclusions, 'inclusion')}
           <Button variant="outline" onClick={() => addOption('inclusion')} aria-label="Add new inclusion option">
            <Plus className="w-4 h-4 mr-2" />
            Add Inclusion
          </Button>
        </CardContent>
      </Card>

      {/* Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-red-600" />
            Exclusions with Pricing
          </CardTitle>
          <p className="text-sm text-gray-600">
            Items not included in the base price that guests need to pay extra for.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderOptionList(exclusions, 'exclusion')}
           <Button variant="outline" onClick={() => addOption('exclusion')} aria-label="Add new exclusion option">
            <Plus className="w-4 h-4 mr-2" />
            Add Exclusion
          </Button>
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600" />
            Add-ons
          </CardTitle>
          <p className="text-sm text-gray-600">
            Optional extras that users can add to their booking.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderOptionList(addOns, 'add_on')}
           <Button variant="outline" onClick={() => addOption('add_on')} aria-label="Add new add-on option">
            <Plus className="w-4 h-4 mr-2" />
            Add Add-on
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptionPricingSection;
