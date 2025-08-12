import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PropertyService } from '@/lib/propertyService';

interface PropertyCacheContextType {
  // Global property cache
  allProperties: any[];
  ownerProperties: any[];
  activeProperties: any[];
  
  // Loading states
  isLoading: boolean;
  isOwnerLoading: boolean;
  isActiveLoading: boolean;
  
  // Cache status
  lastUpdated: number;
  cacheAge: number;
  
  // Actions
  refreshAllProperties: () => Promise<void>;
  refreshOwnerProperties: (ownerId: string) => Promise<void>;
  refreshActiveProperties: () => Promise<void>;
  addProperty: (property: any) => void;
  updateProperty: (propertyId: string, updates: any) => void;
  deleteProperty: (propertyId: string) => void;
  clearCache: () => void;
  
  // Cache management
  isCacheValid: boolean;
  cacheExpiryMinutes: number;
}

const PropertyCacheContext = createContext<PropertyCacheContextType | undefined>(undefined);

export const usePropertyCache = () => {
  const context = useContext(PropertyCacheContext);
  if (!context) {
    throw new Error('usePropertyCache must be used within a PropertyCacheProvider');
  }
  return context;
};

interface PropertyCacheProviderProps {
  children: React.ReactNode;
}

export const PropertyCacheProvider: React.FC<PropertyCacheProviderProps> = ({ children }) => {
  // Global property caches
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [ownerProperties, setOwnerProperties] = useState<any[]>([]);
  const [activeProperties, setActiveProperties] = useState<any[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);
  const [isActiveLoading, setIsActiveLoading] = useState(false);
  
  // Cache metadata
  const [lastUpdated, setLastUpdated] = useState(0);
  const [cacheExpiryMinutes] = useState(60); // 1 hour cache
  
  // Initialize cache from localStorage on mount
  useEffect(() => {
    const initializeCache = () => {
      try {
        // Load global properties cache
        const cachedAllProperties = localStorage.getItem('global_properties_cache');
        const cachedOwnerProperties = localStorage.getItem('global_owner_properties_cache');
        const cachedActiveProperties = localStorage.getItem('global_active_properties_cache');
        const cachedTimestamp = localStorage.getItem('global_properties_cache_timestamp');
        
        if (cachedAllProperties) {
          const parsed = JSON.parse(cachedAllProperties);
          setAllProperties(parsed);
          console.log('⚡ Global properties cache loaded:', parsed.length);
        }
        
        if (cachedOwnerProperties) {
          const parsed = JSON.parse(cachedOwnerProperties);
          setOwnerProperties(parsed);
          console.log('⚡ Owner properties cache loaded:', parsed.length);
        }
        
        if (cachedActiveProperties) {
          const parsed = JSON.parse(cachedActiveProperties);
          setActiveProperties(parsed);
          console.log('⚡ Active properties cache loaded:', parsed.length);
        }
        
        if (cachedTimestamp) {
          setLastUpdated(parseInt(cachedTimestamp));
        }
      } catch (error) {
        console.warn('⚠️ Error loading property cache from localStorage:', error);
      }
    };
    
    initializeCache();
  }, []);
  
  // Calculate cache age
  const cacheAge = Date.now() - lastUpdated;
  const isCacheValid = cacheAge < (cacheExpiryMinutes * 60 * 1000);
  
  // Save cache to localStorage whenever it changes
  const saveCache = useCallback((properties: any[], cacheKey: string) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(properties));
      localStorage.setItem('global_properties_cache_timestamp', Date.now().toString());
      setLastUpdated(Date.now());
    } catch (error) {
      console.warn('⚠️ Failed to save property cache:', error);
    }
  }, []);
  
  // Refresh all properties (for admin/global use)
  const refreshAllProperties = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Refreshing all properties...');
      const properties = await PropertyService.getAllProperties();
      setAllProperties(properties);
      saveCache(properties, 'global_properties_cache');
      console.log('✅ All properties refreshed:', properties.length);
    } catch (error) {
      console.error('❌ Error refreshing all properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, saveCache]);
  
  // Refresh owner properties
  const refreshOwnerProperties = useCallback(async (ownerId: string) => {
    if (isOwnerLoading) return;
    
    setIsOwnerLoading(true);
    try {
      console.log('🔄 Refreshing owner properties for:', ownerId);
      const properties = await PropertyService.getOwnerProperties(ownerId);
      const frontendProperties = properties.map(PropertyService.convertToFrontendFormat);
      setOwnerProperties(frontendProperties);
      saveCache(frontendProperties, 'global_owner_properties_cache');
      console.log('✅ Owner properties refreshed:', frontendProperties.length);
    } catch (error) {
      console.error('❌ Error refreshing owner properties:', error);
    } finally {
      setIsOwnerLoading(false);
    }
  }, [isOwnerLoading, saveCache]);
  
  // Refresh active properties (for public properties page)
  const refreshActiveProperties = useCallback(async () => {
    if (isActiveLoading) return;
    
    setIsActiveLoading(true);
    try {
      console.log('🔄 Refreshing active properties...');
      const properties = await PropertyService.getActiveProperties();
      setActiveProperties(properties);
      saveCache(properties, 'global_active_properties_cache');
      console.log('✅ Active properties refreshed:', properties.length);
    } catch (error) {
      console.error('❌ Error refreshing active properties:', error);
    } finally {
      setIsActiveLoading(false);
    }
  }, [isActiveLoading, saveCache]);
  
  // Add a new property to cache
  const addProperty = useCallback((property: any) => {
    setAllProperties(prev => [...prev, property]);
    setOwnerProperties(prev => [...prev, property]);
    if (property.status === 'approved' || property.status === 'pending') {
      setActiveProperties(prev => [...prev, property]);
    }
    
    // Update localStorage
    saveCache([...allProperties, property], 'global_properties_cache');
    saveCache([...ownerProperties, property], 'global_owner_properties_cache');
    if (property.status === 'approved' || property.status === 'pending') {
      saveCache([...activeProperties, property], 'global_active_properties_cache');
    }
  }, [allProperties, ownerProperties, activeProperties, saveCache]);
  
  // Update a property in cache
  const updateProperty = useCallback((propertyId: string, updates: any) => {
    const updatePropertyInArray = (properties: any[]) => 
      properties.map(prop => prop.id === propertyId ? { ...prop, ...updates } : prop);
    
    setAllProperties(updatePropertyInArray);
    setOwnerProperties(updatePropertyInArray);
    setActiveProperties(updatePropertyInArray);
    
    // Update localStorage
    const updatedAll = updatePropertyInArray(allProperties);
    const updatedOwner = updatePropertyInArray(ownerProperties);
    const updatedActive = updatePropertyInArray(activeProperties);
    
    saveCache(updatedAll, 'global_properties_cache');
    saveCache(updatedOwner, 'global_owner_properties_cache');
    saveCache(updatedActive, 'global_active_properties_cache');
  }, [allProperties, ownerProperties, activeProperties, saveCache]);
  
  // Delete a property from cache
  const deleteProperty = useCallback((propertyId: string) => {
    const removePropertyFromArray = (properties: any[]) => 
      properties.filter(prop => prop.id !== propertyId);
    
    setAllProperties(removePropertyFromArray);
    setOwnerProperties(removePropertyFromArray);
    setActiveProperties(removePropertyFromArray);
    
    // Update localStorage
    const updatedAll = removePropertyFromArray(allProperties);
    const updatedOwner = removePropertyFromArray(ownerProperties);
    const updatedActive = removePropertyFromArray(activeProperties);
    
    saveCache(updatedAll, 'global_properties_cache');
    saveCache(updatedOwner, 'global_owner_properties_cache');
    saveCache(updatedActive, 'global_active_properties_cache');
  }, [allProperties, ownerProperties, activeProperties, saveCache]);
  
  // Clear all cache
  const clearCache = useCallback(() => {
    setAllProperties([]);
    setOwnerProperties([]);
    setActiveProperties([]);
    setLastUpdated(0);
    
    localStorage.removeItem('global_properties_cache');
    localStorage.removeItem('global_owner_properties_cache');
    localStorage.removeItem('global_active_properties_cache');
    localStorage.removeItem('global_properties_cache_timestamp');
    
    console.log('🗑️ Property cache cleared');
  }, []);
  
  // Background refresh if cache is stale
  useEffect(() => {
    if (!isCacheValid && lastUpdated > 0) {
      console.log('🔄 Cache is stale, refreshing in background...');
      refreshActiveProperties();
    }
  }, [isCacheValid, lastUpdated, refreshActiveProperties]);
  
  const value: PropertyCacheContextType = {
    allProperties,
    ownerProperties,
    activeProperties,
    isLoading,
    isOwnerLoading,
    isActiveLoading,
    lastUpdated,
    cacheAge,
    refreshAllProperties,
    refreshOwnerProperties,
    refreshActiveProperties,
    addProperty,
    updateProperty,
    deleteProperty,
    clearCache,
    isCacheValid,
    cacheExpiryMinutes
  };
  
  return (
    <PropertyCacheContext.Provider value={value}>
      {children}
    </PropertyCacheContext.Provider>
  );
};
