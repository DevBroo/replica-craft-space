import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WishlistService } from '@/lib/wishlistService';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Property = Tables<"properties">;

interface WishlistContextType {
  savedProperties: Property[];
  savedPropertyIds: Set<string>;
  isLoading: boolean;
  addToWishlist: (propertyId: string) => Promise<void>;
  removeFromWishlist: (propertyId: string) => Promise<void>;
  isPropertySaved: (propertyId: string) => boolean;
  refreshWishlist: () => Promise<void>;
  savedCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's wishlist when user changes
  useEffect(() => {
    if (user?.id) {
      refreshWishlist();
    } else {
      // Clear wishlist when user logs out
      setSavedProperties([]);
      setSavedPropertyIds(new Set());
      setSavedCount(0);
    }
  }, [user?.id]);

  const refreshWishlist = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [properties, propertyIds, count] = await Promise.all([
        WishlistService.getUserWishlist(user.id),
        WishlistService.getUserSavedPropertyIds(user.id),
        WishlistService.getSavedPropertiesCount(user.id)
      ]);

      setSavedProperties(properties);
      setSavedPropertyIds(new Set(propertyIds));
      setSavedCount(count);
    } catch (error) {
      console.error('Error refreshing wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to load your saved properties",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (propertyId: string) => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save properties",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    setSavedPropertyIds(prev => new Set([...prev, propertyId]));
    setSavedCount(prev => prev + 1);

    try {
      const success = await WishlistService.addToWishlist(user.id, propertyId);
      
      if (success) {
        toast({
          title: "Added to wishlist",
          description: "Property saved successfully",
        });
        // Refresh to get updated data
        refreshWishlist();
      } else {
        // Revert optimistic update
        setSavedPropertyIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        setSavedCount(prev => prev - 1);
        
        toast({
          title: "Error",
          description: "Failed to save property",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update
      setSavedPropertyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
      setSavedCount(prev => prev - 1);
      
      toast({
        title: "Error",
        description: "Failed to save property",
        variant: "destructive",
      });
    }
  };

  const removeFromWishlist = async (propertyId: string) => {
    if (!user?.id) return;

    // Optimistic update
    setSavedPropertyIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(propertyId);
      return newSet;
    });
    setSavedCount(prev => prev - 1);

    try {
      const success = await WishlistService.removeFromWishlist(user.id, propertyId);
      
      if (success) {
        toast({
          title: "Removed from wishlist",
          description: "Property removed successfully",
        });
        // Refresh to get updated data
        refreshWishlist();
      } else {
        // Revert optimistic update
        setSavedPropertyIds(prev => new Set([...prev, propertyId]));
        setSavedCount(prev => prev + 1);
        
        toast({
          title: "Error",
          description: "Failed to remove property",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update
      setSavedPropertyIds(prev => new Set([...prev, propertyId]));
      setSavedCount(prev => prev + 1);
      
      toast({
        title: "Error",
        description: "Failed to remove property",
        variant: "destructive",
      });
    }
  };

  const isPropertySaved = (propertyId: string): boolean => {
    return savedPropertyIds.has(propertyId);
  };

  const value: WishlistContextType = {
    savedProperties,
    savedPropertyIds,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isPropertySaved,
    refreshWishlist,
    savedCount,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}