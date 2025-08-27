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
    'homestay': 'Homestay',
    'heritage': 'Heritage Palace',
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
    'homestay': 'homestay',
    'homestays': 'homestay',
    'heritage': 'heritage',
    'heritage palace': 'heritage',
    'hotel': 'hotel',
    'hotels': 'hotel',
    'apartment': 'apartment',
    'apartments': 'apartment'
  };
  
  return typeMap[normalized] || normalized.replace(/\s+/g, '_');
}
