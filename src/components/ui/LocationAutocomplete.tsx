import React, { useState, useRef, useEffect } from 'react';
import { getAllStates, getCitiesByState, searchCities } from '../../data/indianLocations';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface LocationSuggestion {
  type: 'city' | 'state';
  name: string;
  state?: string;
  displayName: string;
  region?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Where would you like to go?",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Popular destinations (will appear first)
  const popularDestinations = [
    { name: 'Goa', state: 'Goa' },
    { name: 'Bangalore', state: 'Karnataka' },
    { name: 'Mumbai', state: 'Maharashtra' },
    { name: 'Delhi', state: 'Delhi' },
    { name: 'Pune', state: 'Maharashtra' },
    { name: 'Hyderabad', state: 'Telangana' },
    { name: 'Chennai', state: 'Tamil Nadu' },
    { name: 'Mysore', state: 'Karnataka' }
  ];

  useEffect(() => {
    if (!value.trim()) {
      // Show popular destinations when input is empty
      const popularSuggestions: LocationSuggestion[] = popularDestinations.map(dest => ({
        type: 'city' as const,
        name: dest.name,
        state: dest.state,
        displayName: `${dest.name}, ${dest.state}`
      }));
      setSuggestions(popularSuggestions);
      return;
    }

    const query = value.toLowerCase().trim();
    const results: LocationSuggestion[] = [];

    // Search for cities
    const cityResults = searchCities(query);
    cityResults.forEach(cityName => {
      // Find which state this city belongs to
      const states = getAllStates();
      let cityState = '';
      
      for (const state of states) {
        const cities = getCitiesByState(state);
        if (cities.some(city => city.toLowerCase() === cityName.toLowerCase())) {
          cityState = state;
          break;
        }
      }
      
      if (cityState) {
        const isPopular = popularDestinations.some(p => 
          p.name.toLowerCase() === cityName.toLowerCase()
        );
        
        results.push({
          type: 'city',
          name: cityName,
          state: cityState,
          displayName: `${cityName}, ${cityState}`,
          region: isPopular ? 'popular' : undefined
        });
      }
    });

    // Search for states
    const states = getAllStates();
    states.forEach(state => {
      if (state.toLowerCase().includes(query)) {
        results.push({
          type: 'state',
          name: state,
          displayName: `${state} (State)`
        });
      }
    });

    // Sort results: popular cities first, then exact matches, then others
    results.sort((a, b) => {
      const aIsPopular = a.region === 'popular';
      const bIsPopular = b.region === 'popular';
      
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      const aExact = a.name.toLowerCase().startsWith(query);
      const bExact = b.name.toLowerCase().startsWith(query);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });

    setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
  }, [value]);

  const handleInputFocus = () => {
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const selectedValue = suggestion.type === 'city' 
      ? `${suggestion.name}, ${suggestion.state}`
      : suggestion.name;
    
    onChange(selectedValue);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocationIcon = (suggestion: LocationSuggestion) => {
    if (suggestion.type === 'state') return 'fas fa-map';
    if (suggestion.region === 'popular') return 'fas fa-star';
    return 'fas fa-map-marker-alt';
  };

  const getLocationIconColor = (suggestion: LocationSuggestion) => {
    if (suggestion.type === 'state') return 'text-primary';
    if (suggestion.region === 'popular') return 'text-brand-orange';
    return 'text-muted-foreground';
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className="fas fa-map-marker-alt text-brand-red text-lg"></i>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={`w-full pl-12 pr-4 py-4 text-gray-800 placeholder-gray-500 border-2 border-gray-200 rounded-xl outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/20 transition-all duration-300 text-base ${className}`}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto z-50"
        >
          {!value.trim() && (
            <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
              Popular Destinations
            </div>
          )}
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.name}-${suggestion.state || ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
            >
              <i className={`${getLocationIcon(suggestion)} ${getLocationIconColor(suggestion)} text-sm w-4`}></i>
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  {suggestion.displayName}
                </div>
                {suggestion.region === 'popular' && (
                  <div className="text-xs text-brand-orange">Popular destination</div>
                )}
                {suggestion.type === 'state' && (
                  <div className="text-xs text-muted-foreground">View all cities in this state</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;