import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { CalendarIcon, MapPinIcon, UsersIcon, SearchIcon, ChevronDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ModernSearchFilterProps {
  // Search term
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  
  // Location
  locationFilter: string;
  onLocationChange: (value: string) => void;
  
  // Check-in date
  checkInDate?: Date;
  onCheckInDateChange: (date: Date | undefined) => void;
  
  // Guests
  guests: number;
  onGuestsChange: (value: number) => void;
  
  // Price range
  priceRange: string;
  onPriceRangeChange: (value: string) => void;
  
  // Property type (for regular properties)
  propertyTypeFilter: string;
  onPropertyTypeChange: (value: string) => void;
  
  // Duration filter (for day picnics)
  durationFilter: string;
  onDurationChange: (value: string) => void;
  
  // Show day picnics mode
  showDayPicnics: boolean;
  
  // Available options
  propertyTypes: string[];
  
  // Search handler
  onSearch: () => void;
}

const ModernSearchFilter: React.FC<ModernSearchFilterProps> = ({
  searchTerm,
  onSearchTermChange,
  locationFilter,
  onLocationChange,
  checkInDate,
  onCheckInDateChange,
  guests,
  onGuestsChange,
  priceRange,
  onPriceRangeChange,
  propertyTypeFilter,
  onPropertyTypeChange,
  durationFilter,
  onDurationChange,
  showDayPicnics,
  propertyTypes,
  onSearch
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const priceRanges = [
    { value: 'any', label: 'Any price' },
    { value: '0-5000', label: '₹0 - ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-20000', label: '₹10,000 - ₹20,000' },
    { value: '20000-50000', label: '₹20,000 - ₹50,000' },
    { value: '50000+', label: '₹50,000+' }
  ];

  const guestOptions = [
    { value: 1, label: '1 Guest' },
    { value: 2, label: '2 Guests' },
    { value: 3, label: '3 Guests' },
    { value: 4, label: '4 Guests' },
    { value: 5, label: '5 Guests' },
    { value: 6, label: '6 Guests' },
    { value: 8, label: '8 Guests' },
    { value: 10, label: '10 Guests' },
    { value: 12, label: '12 Guests' },
    { value: 15, label: '15 Guests' },
    { value: 20, label: '20+ Guests' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Destination */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
            <Input
              placeholder="Search destination..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10 h-12 text-base border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-in
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal border-gray-300 rounded-lg hover:border-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
                  !checkInDate && "text-gray-500"
                )}
              >
                <CalendarIcon className="w-5 h-5 mr-2 text-orange-500" />
                <span className="flex-1">
                  {checkInDate ? format(checkInDate, "dd/MM/yyyy") : "-/-/-"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkInDate}
                onSelect={(date) => {
                  onCheckInDateChange(date);
                  setCalendarOpen(false);
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guests
          </label>
          <Select value={guests.toString()} onValueChange={(value) => onGuestsChange(parseInt(value))}>
            <SelectTrigger className="h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <div className="flex items-center w-full">
                <UsersIcon className="w-5 h-5 mr-2 text-blue-500" />
                <SelectValue className="flex-1 text-left">
                  {guestOptions.find(option => option.value === guests)?.label || 'Select guests'}
                </SelectValue>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {guestOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <Select value={priceRange} onValueChange={onPriceRangeChange}>
            <SelectTrigger className="h-12 border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500">
              <div className="flex items-center w-full">
                <span className="text-green-500 font-semibold mr-2">₹</span>
                <SelectValue className="flex-1 text-left">
                  {priceRanges.find(range => range.value === priceRange)?.label || 'Any price'}
                </SelectValue>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property Type or Duration (conditional) */}
        {!showDayPicnics && (
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type
            </label>
            <Select value={propertyTypeFilter} onValueChange={onPropertyTypeChange}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                <SelectValue placeholder="Property Type" />
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {propertyTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showDayPicnics && (
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <Select value={durationFilter} onValueChange={onDurationChange}>
              <SelectTrigger className="h-12 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                <SelectValue placeholder="Duration" />
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="half-day">Half day (4-5 hrs)</SelectItem>
                <SelectItem value="full-day">Full day (6-8 hrs)</SelectItem>
                <SelectItem value="extended-day">Extended Day (10+ hrs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search Button */}
        <div className="flex-shrink-0">
          <Button
            onClick={onSearch}
            className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <SearchIcon className="w-5 h-5" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModernSearchFilter;
