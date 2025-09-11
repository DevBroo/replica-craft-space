import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { SearchService, PROPERTY_CATEGORIES, type SearchFilters } from '@/lib/searchService';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  onSearch?: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  compact?: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ 
  onSearch, 
  initialFilters = {},
  compact = false 
}) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    location: 'all',
    category: 'day-picnic',
    date: '',
    guests: 2,
    search: '',
    ...initialFilters
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Fetch available locations from database
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['available-locations'],
    queryFn: SearchService.getAvailableLocations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch categories with counts
  const { data: categoriesWithCounts = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: SearchService.getCategoriesWithCounts,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Update date filter when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      setFilters(prev => ({ ...prev, date: dateString }));
    }
  }, [selectedDate]);

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category: category as any }));
  };

  // Handle location selection
  const handleLocationChange = (location: string) => {
    setFilters(prev => ({ ...prev, location }));
  };

  // Handle guests selection
  const handleGuestsChange = (guests: string) => {
    setFilters(prev => ({ ...prev, guests: parseInt(guests) }));
  };

  // Handle search
  const handleSearch = () => {
    console.log('🔍 Search triggered with filters:', filters);
    
    // Auto-detect day picnic searches
    let finalFilters = { ...filters };
    if (filters.search && filters.search.toLowerCase().includes('day picnic')) {
      finalFilters.category = 'day-picnic';
    }
    
    if (onSearch) {
      onSearch(finalFilters);
    } else {
      // Navigate to properties page with search params
      const searchParams = new URLSearchParams();
      
      if (finalFilters.location && finalFilters.location !== 'all') {
        searchParams.set('location', finalFilters.location);
      }
      if (finalFilters.category && finalFilters.category !== 'all' as any) {
        searchParams.set('category', finalFilters.category);
      }
      if (finalFilters.date) {
        searchParams.set('date', finalFilters.date);
      }
      if (finalFilters.guests && finalFilters.guests > 0) {
        searchParams.set('guests', finalFilters.guests.toString());
      }
      if (finalFilters.search) {
        searchParams.set('search', finalFilters.search);
      }

      const queryString = searchParams.toString();
      navigate(`/properties${queryString ? `?${queryString}` : ''}`);
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-3 md:mb-0">
            {categoriesWithCounts.slice(0, 6).map((category) => (
              <button
                key={category.category}
                onClick={() => handleCategoryChange(category.category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  filters.category === category.category
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <i className={`${category.icon} mr-2`}></i>
                {category.label}
                {category.count > 0 && (
                  <span className="ml-1 text-xs opacity-75">({category.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search Fields */}
          <div className="flex flex-1 gap-2">
            {/* Search Term */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full h-10 pl-10 pr-3 text-sm border border-gray-300 rounded-lg hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>

            {/* Location */}
            <Select value={filters.location} onValueChange={handleLocationChange}>
              <SelectTrigger className="flex-1">
                <MapPinIcon className="w-4 h-4 mr-2 text-orange-500" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={`${location.city}-${location.state}`} value={location.city}>
                    {location.city}, {location.state}
                    <span className="text-xs text-gray-500 ml-2">({location.property_count})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Guests */}
            <Select value={filters.guests?.toString()} onValueChange={handleGuestsChange}>
              <SelectTrigger className="w-24">
                <UsersIcon className="w-4 h-4 mr-2 text-orange-500" />
                <SelectValue>
                  {filters.guests ? `${filters.guests}` : '2'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button 
              onClick={handleSearch}
              className="bg-orange-500 hover:bg-red-500 text-white px-6"
            >
              <i className="fas fa-search mr-2"></i>
              Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Category Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {categoriesWithCounts.map((category) => (
            <button
              key={category.category}
              onClick={() => handleCategoryChange(category.category)}
              className={cn(
                "px-6 py-3 rounded-xl text-base font-medium transition-all duration-300 flex items-center",
                filters.category === category.category
                  ? "bg-orange-500 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              )}
              disabled={categoriesLoading}
            >
              <i className={`${category.icon} mr-2 text-lg`}></i>
              {category.label}
            </button>
          ))}
        </div>
        {categoriesLoading && (
          <div className="flex gap-3 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        )}
      </div>

      {/* Search Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 md:gap-6 items-center">
        {/* Search Term */}
        <div className="lg:col-span-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search properties..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full h-14 pl-12 pr-4 text-base border border-gray-300 rounded-lg hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
            />
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Location */}
        <div className="lg:col-span-2">
          <Select value={filters.location} onValueChange={handleLocationChange} disabled={locationsLoading}>
            <SelectTrigger className="w-full h-14 text-base border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300">
              <div className="flex items-center w-full">
                <MapPinIcon className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" />
                <SelectValue placeholder="Where would you like to go?" className="flex-1 text-left" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={`${location.city}-${location.state}`} value={location.city}>
                  <div className="flex items-center justify-between w-full">
                    <span>{location.city}, {location.state}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {location.property_count} {location.property_count === 1 ? 'property' : 'properties'}
                    </span>
                  </div>
                </SelectItem>
              ))}
              {locationsLoading && (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                    Loading locations...
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="lg:col-span-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-14 text-base justify-start text-left font-normal border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" />
                <span className="flex-1 text-left whitespace-nowrap">
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Select date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests */}
        <div className="lg:col-span-2">
          <Select value={filters.guests?.toString()} onValueChange={handleGuestsChange}>
            <SelectTrigger className="w-full h-14 text-base border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300">
              <div className="flex items-center w-full">
                <UsersIcon className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" />
                <SelectValue placeholder="Guests" className="flex-1 text-left">
                  {filters.guests ? `${filters.guests} ${filters.guests === 1 ? 'Guest' : 'Guests'}` : 'Guests'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 50].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <div className="lg:col-span-2 lg:ml-3 xl:ml-4">
          <Button 
            onClick={handleSearch}
            className="w-full h-14 bg-orange-500 hover:bg-red-500 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <i className="fas fa-search mr-2"></i>
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;


