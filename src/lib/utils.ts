import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Property type formatting utilities
export function formatPropertyType(type: string): string {
  if (!type) return 'Unknown';
  
  // Normalize common variations to "Day Picnic"
  const normalized = type.toLowerCase().replace(/[_-]/g, ' ').trim();
  
  if (normalized === 'day picnic' || normalized === 'daypicnic') {
    return 'Day Picnic';
  }
  
  // Handle other common types
  const typeMap: { [key: string]: string } = {
    'villa': 'Villa',
    'resort': 'Resort', 
    'farmhouse': 'Farmhouse',
    'farm house': 'Farm House',
    'homestay': 'Home Stays',
    'home-stays': 'Home Stays',
    'heritage': 'Heritage Place',
    'heritage-place': 'Heritage Place',
    'hotel': 'Hotel',
    'hotels': 'Hotels',
    'apartment': 'Apartment',
    'apartments': 'Apartments',
    'other': 'Other'
  };
  
  return typeMap[normalized] || type.charAt(0).toUpperCase() + type.slice(1);
}

export function normalizeTypeKey(type: string): string {
  if (!type) return '';
  
  // Convert to lowercase and normalize separators
  const normalized = type.toLowerCase().replace(/[_-]/g, ' ').trim();
  
  // Map various forms to consistent keys for comparison
  const typeMap: { [key: string]: string } = {
    'day picnic': 'day_picnic',
    'daypicnic': 'day_picnic',
    'villa': 'villa',
    'villas': 'villa',
    'resort': 'resort', 
    'resorts': 'resort',
    'farmhouse': 'farmhouse',
    'farm house': 'farmhouse',
    'homestay': 'home-stays',
    'homestays': 'home-stays',
    'home-stays': 'home-stays',
    'heritage': 'heritage-place',
    'heritage palace': 'heritage-place',
    'heritage-place': 'heritage-place',
    'hotel': 'hotel',
    'hotels': 'hotel',
    'apartment': 'apartment',
    'apartments': 'apartment'
  };
  
  return typeMap[normalized] || normalized.replace(/\s+/g, '_');
}

export function transformRoomData(inputData) {
  return inputData.types.map(room => {
    return {
      type: room.type,
      count: room.count,
      price: room.price_per_night,
      amenities: inputData.amenities_per_room[room.type] || []
    };
  });
}

const parseTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes; // total minutes from midnight
};

export const calculateDuration = (start_time: string, end_time: string) => {
  const startMins = parseTime(start_time);
  const endMins = parseTime(end_time);

  if (endMins < startMins) {
    console.warn("End time is before start time");
    return null;
  }

  return formatDuration(endMins - startMins); // duration in minutes
};

const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins != 0 ? `${mins}m` : ''}`;
};