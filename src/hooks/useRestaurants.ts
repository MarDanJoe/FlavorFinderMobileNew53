import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { searchRestaurants } from '../services/api';
import { ENV } from '../config/env';

export interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  rating: number;
  price?: string;
  categories: Array<{ alias: string; title: string }>;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  distance: number;
  is_open_now?: boolean;
  website?: string;
}

interface UseRestaurantsParams {
  radius?: number;
  rating?: number;
  price?: string[];
}

export const useRestaurants = (params?: UseRestaurantsParams) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [seenRestaurants] = useState(new Set<string>());
  const [isInitialFetch, setIsInitialFetch] = useState(true);

  // Get user's location
  const getLocation = async () => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log('Got user location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocation(location);
    } catch (err) {
      setError('Error getting location. Please make sure location services are enabled.');
      console.error('Error getting location:', err);
    }
  };

  // Filter out duplicates and already seen restaurants
  const filterNewRestaurants = useCallback((newRestaurants: Restaurant[]) => {
    return newRestaurants.filter(restaurant => {
      // Skip if already seen
      if (seenRestaurants.has(restaurant.id)) {
        return false;
      }

      // Apply rating filter
      if (params?.rating && restaurant.rating < params.rating) {
        return false;
      }

      // Apply price filter
      if (params?.price && params.price.length > 0) {
        if (!restaurant.price || !params.price.includes(restaurant.price)) {
          return false;
        }
      }

      return true;
    });
  }, [seenRestaurants, params?.rating, params?.price]);

  // Fetch restaurants based on location
  const fetchRestaurants = useCallback(async (pageToken?: string) => {
    if (!location) {
      console.log('No location available, skipping restaurant fetch');
      return;
    }

    try {
      setError(null);
      if (!pageToken) {
        setLoading(true);
      }
      setIsFetchingMore(true);

      console.log('Fetching restaurants:', {
        isFirstPage: !pageToken,
        currentCount: restaurants.length,
        pageToken,
        filters: params,
        isInitialFetch
      });

      const results = await searchRestaurants(
        location.coords.latitude,
        location.coords.longitude,
        params?.radius || ENV.DEFAULTS.SEARCH_RADIUS,
        ENV.DEFAULTS.RESULTS_LIMIT,
        pageToken
      );

      const newRestaurants = filterNewRestaurants(results.restaurants);

      if (newRestaurants.length === 0) {
        if (!pageToken && !isInitialFetch) {
          setError('No restaurants found in your area. Try adjusting your filters.');
        }
        return;
      }

      // Add new restaurants to seen set
      newRestaurants.forEach(r => seenRestaurants.add(r.id));

      if (pageToken) {
        setRestaurants(prev => {
          const updated = [...prev, ...newRestaurants];
          console.log('Updated restaurants list:', {
            previousCount: prev.length,
            newCount: updated.length,
            addedCount: newRestaurants.length,
            restaurants: updated.map(r => r.name)
          });
          return updated;
        });
      } else {
        console.log('Setting initial restaurants:', {
          count: newRestaurants.length,
          restaurants: newRestaurants.map(r => r.name)
        });
        setRestaurants(newRestaurants);
        setCurrentIndex(0);
      }

      setNextPageToken(results.nextPageToken);
      setIsInitialFetch(false);

      // If we got too few results, immediately fetch more
      if (newRestaurants.length < 5 && results.nextPageToken) {
        setTimeout(() => fetchRestaurants(results.nextPageToken), 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching restaurants';
      setError(errorMessage);
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [location, params, filterNewRestaurants, restaurants.length, isInitialFetch]);

  // Get next restaurant
  const nextRestaurant = useCallback(() => {
    setRestaurants(currentRestaurants => {
      console.log('Next restaurant requested:', {
        currentIndex,
        totalRestaurants: currentRestaurants.length,
        hasNextPage: !!nextPageToken,
        isFetchingMore,
        currentRestaurant: currentRestaurants[currentIndex]?.name,
        allRestaurants: currentRestaurants.map(r => r.name)
      });

      if (currentIndex < currentRestaurants.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (nextPageToken && !isFetchingMore) {
        fetchRestaurants(nextPageToken);
      } else if (!nextPageToken) {
        setCurrentIndex(0);
      }
      return currentRestaurants;
    });
  }, [currentIndex, nextPageToken, isFetchingMore, fetchRestaurants]);

  // Initialize location and restaurants
  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location && isInitialFetch) {
      fetchRestaurants();
    }
  }, [location, isInitialFetch, fetchRestaurants]);

  const refreshRestaurants = useCallback(() => {
    seenRestaurants.clear();
    setCurrentIndex(0);
    setIsInitialFetch(true);
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Restaurants state updated:', {
      count: restaurants.length,
      currentIndex,
      currentRestaurant: restaurants[currentIndex]?.name,
      allRestaurants: restaurants.map(r => r.name)
    });
  }, [restaurants, currentIndex]);

  return {
    currentRestaurant: restaurants[currentIndex],
    loading,
    error,
    nextRestaurant,
    refreshRestaurants,
  };
}; 