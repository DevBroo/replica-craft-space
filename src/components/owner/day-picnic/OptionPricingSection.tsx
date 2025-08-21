
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface OptionPrice {
  id?: string;
  option_type: 'inclusion' | 'add_on';
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
  const addOns = optionPrices.filter(opt => opt.option_type === 'add_on');

  const addOption = (type: 'inclusion' | 'add_on') => {
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

  const renderOptionList = (options: OptionPrice[], type: 'inclusion' | 'add_on') => {
    const startIndex = type === 'inclusion' 
      ? 0 
      : inclusions.length;

    return (
      <div className="space-y-3">
        {options.map((option, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <div key={actualIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
              <Input
                placeholder={`${type === 'inclusion' ? 'Inclusion' : 'Add-on'} name`}
                value={option.name}
                onChange={(e) => updateOption(actualIndex, 'name', e.target.value)}
                className="flex-1"
              />
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  value={option.price}
                  onChange={(e) => updateOption(actualIndex, 'price', parseFloat(e.target.value) || 0)}
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
          <Button variant="outline" onClick={() => addOption('inclusion')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Inclusion
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
          <Button variant="outline" onClick={() => addOption('add_on')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Add-on
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptionPricingSection;
