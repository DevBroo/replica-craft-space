// Google Maps utilities for generating directions and location links

/**
 * Generate a Google Maps directions URL for a given address
 * @param address - The full address to navigate to
 * @param mode - Transportation mode (driving, walking, transit, bicycling)
 * @returns Google Maps URL for directions
 */
export function generateGoogleMapsDirectionsUrl(
  address: string, 
  mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
): string {
  const encodedAddress = encodeURIComponent(address);
  const baseUrl = 'https://www.google.com/maps/dir/';
  
  // Generate URL with current location as starting point and destination address
  return `${baseUrl}/?api=1&destination=${encodedAddress}&travelmode=${mode}`;
}

/**
 * Generate a Google Maps search URL for a specific location
 * @param address - The address to search for
 * @param zoom - Map zoom level (1-20)
 * @returns Google Maps search URL
 */
export function generateGoogleMapsSearchUrl(address: string, zoom: number = 15): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}&zoom=${zoom}`;
}

/**
 * Generate a Google Maps place URL with coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @param placeName - Optional place name for display
 * @returns Google Maps place URL
 */
export function generateGoogleMapsPlaceUrl(
  lat: number, 
  lng: number, 
  placeName?: string
): string {
  const coords = `${lat},${lng}`;
  const query = placeName ? encodeURIComponent(placeName) : coords;
  return `https://www.google.com/maps/place/${query}/@${coords},15z`;
}

/**
 * Open Google Maps directions in a new tab
 * @param address - The destination address
 * @param mode - Transportation mode
 */
export function openGoogleMapsDirections(
  address: string, 
  mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
): void {
  const url = generateGoogleMapsDirectionsUrl(address, mode);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Open Google Maps search in a new tab
 * @param address - The address to search for
 * @param zoom - Map zoom level
 */
export function openGoogleMapsSearch(address: string, zoom: number = 15): void {
  const url = generateGoogleMapsSearchUrl(address, zoom);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Predefined coordinates for major Indian cities (for better accuracy)
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'thane': { lat: 19.2183, lng: 72.9781 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'pimpri-chinchwad': { lat: 18.6298, lng: 73.7997 }
};

/**
 * Get coordinates for a city if available
 * @param cityName - Name of the city
 * @returns Coordinates if found, null otherwise
 */
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalizedCity = cityName.toLowerCase().trim();
  return CITY_COORDINATES[normalizedCity] || null;
}

/**
 * Generate the best Google Maps URL for an office location
 * @param office - Office location object with city, address, etc.
 * @returns Optimized Google Maps URL
 */
export function generateOfficeDirectionsUrl(office: {
  city: string;
  address: string;
  phone?: string;
}): string {
  // Try to use coordinates for better accuracy
  const coordinates = getCityCoordinates(office.city);
  
  if (coordinates) {
    // Use place URL with coordinates for more accurate location
    return generateGoogleMapsPlaceUrl(
      coordinates.lat, 
      coordinates.lng, 
      `${office.address}`
    );
  }
  
  // Fallback to address-based directions
  return generateGoogleMapsDirectionsUrl(office.address);
}

/**
 * Office-specific coordinates for exact locations
 */
export const OFFICE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'bangalore-koramangala': { lat: 12.9279, lng: 77.6271 },
  'mumbai-andheri-east': { lat: 19.1136, lng: 72.8697 },
  'delhi-connaught-place': { lat: 28.6315, lng: 77.2167 }
};

/**
 * Get specific office coordinates
 * @param city - City name
 * @param area - Area/locality name
 * @returns Coordinates if found
 */
export function getOfficeCoordinates(city: string, area: string): { lat: number; lng: number } | null {
  const key = `${city.toLowerCase()}-${area.toLowerCase().replace(/\s+/g, '-')}`;
  return OFFICE_COORDINATES[key] || getCityCoordinates(city);
}
