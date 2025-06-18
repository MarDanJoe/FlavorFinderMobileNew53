import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { searchRestaurants } from '../services/api';
import { ENV } from '../config/env';

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

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
  const restaurantsRef = useRef<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [seenRestaurants] = useState(new Set<string>());
  const [isInitialFetch, setIsInitialFetch] = useState(true);

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

  const fetchRestaurants = useCallback(async (isFirstPage: boolean = true) => {
    try {
      if (!location) {
        console.log('No user location available');
        return;
      }

      setLoading(true);
      setError(null);

      console.log('Fetching restaurants:', {
        currentCount: restaurantsRef.current.length,
        filters: params,
        isFirstPage,
        isInitialFetch,
        pageToken: isFirstPage ? undefined : nextPageToken,
      });

      const { results, nextPageToken: newPageToken } = await searchRestaurants({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        radius: params?.radius || ENV.DEFAULTS.SEARCH_RADIUS,
        pageSize: ENV.DEFAULTS.RESULTS_LIMIT,
        pageToken: isFirstPage ? undefined : nextPageToken,
      });

      console.log('Search results:', {
        count: results.length,
        hasNextPage: !!newPageToken,
      });

      if (!results || results.length === 0) {
        setError('No restaurants found in your area. Try adjusting your filters.');
        setLoading(false);
        return;
      }

      // Transform the results into our restaurant format
      const newRestaurants = results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        image_url: place.photos?.[0]
          ? `${ENV.API.BASE_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${ENV.API.KEY}`
          : 'https://via.placeholder.com/400x300?text=No+Image',
        rating: place.rating || 0,
        price: place.price_level ? '$'.repeat(place.price_level) : undefined,
        location: {
          address1: place.vicinity,
          city: '',
          state: '',
          zip_code: '',
        },
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        distance: calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
      }));

      // Filter out duplicates and apply filters
      const filteredNewRestaurants = filterNewRestaurants(newRestaurants);

      if (filteredNewRestaurants.length === 0) {
        if (!isInitialFetch) {
          setError('No restaurants found in your area. Try adjusting your filters.');
        }
        setLoading(false);
        return;
      }

      // Add new restaurants to seen set
      filteredNewRestaurants.forEach(r => seenRestaurants.add(r.id));

      const updated = isFirstPage ? filteredNewRestaurants : [...restaurantsRef.current, ...filteredNewRestaurants];
      restaurantsRef.current = updated;
      setRestaurants(updated);

      console.log('Restaurants state updated:', {
        count: updated.length,
        currentIndex,
        currentRestaurant: updated[currentIndex],
        allRestaurants: updated,
      });

      setNextPageToken(newPageToken);
      setIsInitialFetch(false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch restaurants');
      setLoading(false);
    }
  }, [location, params, currentIndex, isInitialFetch, nextPageToken, filterNewRestaurants]);

  const nextRestaurant = useCallback(() => {
    console.log('Next restaurant requested:', {
      currentIndex,
      totalRestaurants: restaurantsRef.current.length,
      hasNextPage: !!nextPageToken,
      isFetchingMore,
      currentRestaurant: restaurantsRef.current[currentIndex],
      allRestaurants: restaurantsRef.current,
    });

    if (currentIndex < restaurantsRef.current.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (nextPageToken && !isFetchingMore) {
      setIsFetchingMore(true);
      fetchRestaurants(false).finally(() => {
        setIsFetchingMore(false);
      });
    } else if (!nextPageToken && restaurantsRef.current.length > 0) {
      // If we've gone through all restaurants, fetch a new batch
      seenRestaurants.clear();
      setCurrentIndex(0);
      fetchRestaurants(true);
    }
  }, [currentIndex, nextPageToken, isFetchingMore, fetchRestaurants]);

  // Initialize location and restaurants
  useEffect(() => {
    let mounted = true;
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        if (mounted) {
          console.log('Got initial location:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setLocation(location);
        }
      } catch (err) {
        if (mounted) {
          setError('Error getting location. Please make sure location services are enabled.');
          console.error('Error getting location:', err);
        }
      }
    };

    initLocation();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch restaurants when location is available
  useEffect(() => {
    let mounted = true;
    if (location && isInitialFetch) {
      console.log('Location available, fetching initial restaurants');
      fetchRestaurants(true).then(() => {
        if (mounted) {
          console.log('Initial restaurants fetched');
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [location, isInitialFetch, fetchRestaurants]);

  // Debug effect to log state changes
  useEffect(() => {
    const currentRestaurant = restaurantsRef.current[currentIndex];
    console.log('Restaurants state updated:', {
      count: restaurantsRef.current.length,
      currentIndex,
      currentRestaurant,
      allRestaurants: restaurantsRef.current,
    });
  }, [restaurants, currentIndex]);

  const refreshRestaurants = useCallback(() => {
    seenRestaurants.clear();
    setCurrentIndex(0);
    setIsInitialFetch(true);
    fetchRestaurants(true);
  }, [fetchRestaurants]);

  const currentRestaurant = restaurantsRef.current[currentIndex];
  if (!currentRestaurant) {
    console.log('No current restaurant available:', {
      currentIndex,
      totalRestaurants: restaurantsRef.current.length,
    });
  }

  return {
    currentRestaurant,
    loading,
    error,
    nextRestaurant,
    refreshRestaurants,
  };
}; 