import { DEMO_MODE } from "../config/demo";
import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { searchRestaurants } from "../services/api";
import { ENV } from "../config/env";

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 3959; // Radius of the earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in miles
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export interface Restaurant {
  provider_attributions?: Array<{ provider: string; providerUri?: string }>;
  photo_source_uri?: string;
  photo_attributions?: Array<{
    displayName: string;
    uri?: string;
    photoUri?: string;
    sourceUri?: string;
  }>;
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
  searchLocation?: { latitude: number; longitude: number };
  radius?: number;
  rating?: number;
  price?: string[];
  cuisine?: string;
  openNow?: boolean;
}

export const useRestaurants = (params?: UseRestaurantsParams) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [locationRetry, setLocationRetry] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const nextPageToken = useRef<string | undefined>(undefined);
  const seen = useRef(new Set<string>());
  const generation = useRef(0);
  const fetching = useRef(false);
  const radius = params?.radius ?? ENV.DEFAULTS.SEARCH_RADIUS;
  const rating = params?.rating ?? 0;
  const cuisine = params?.cuisine ?? "";
  const openNow = params?.openNow ?? false;
  const prices = JSON.stringify(params?.price ?? []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (params?.searchLocation) {
          if (active)
            setLocation({
              coords: params.searchLocation,
            } as Location.LocationObject);
          return;
        }
        if (DEMO_MODE) {
          if (active)
            setLocation({
              coords: { latitude: 40.7128, longitude: -74.006 },
            } as Location.LocationObject);
          return;
        }
        let locationTimer: ReturnType<typeof setTimeout> | undefined;
        let position: Location.LocationObject;
        try {
          position = await Promise.race([
            (async () => {
              const { status } =
                await Location.requestForegroundPermissionsAsync();
              if (status !== "granted")
                throw new Error(
                  "Location access was denied. Choose a city to find restaurants.",
                );
              if (!active) throw new Error("Location request cancelled.");
              return Location.getCurrentPositionAsync({});
            })(),
            new Promise<never>((_, reject) => {
              locationTimer = setTimeout(
                () =>
                  reject(
                    new Error(
                      "Location access is taking too long. Choose a city or ZIP code above to find restaurants.",
                    ),
                  ),
                20000,
              );
            }),
          ]);
        } finally {
          if (locationTimer) clearTimeout(locationTimer);
        }
        if (active) setLocation(position);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to get your location",
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [
    locationRetry,
    params?.searchLocation?.latitude,
    params?.searchLocation?.longitude,
  ]);

  const fetchPage = useCallback(
    async (firstPage: boolean, requestGeneration: number) => {
      if (!location || fetching.current) return;
      fetching.current = true;
      setLoading(true);
      setError(null);
      try {
        let token = firstPage ? undefined : nextPageToken.current;
        const selectedPrices: string[] = JSON.parse(prices);
        // Continue through pages whose restaurants are all excluded by filters.
        do {
          if (token) await new Promise((resolve) => setTimeout(resolve, 2000));
          if (requestGeneration !== generation.current) return;
          const page = await searchRestaurants({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            radius,
            pageSize: ENV.DEFAULTS.RESULTS_LIMIT,
            pageToken: token,
            keyword: cuisine,
            openNow,
          });
          if (requestGeneration !== generation.current) return;
          token = page.nextPageToken;
          nextPageToken.current = token;
          const batch: Restaurant[] = page.results
            .map(
              (place: any): Restaurant => ({
                id: place.place_id,
                name: place.name,
                image_url:
                  place.image_url ||
                  (place.photos?.[0]
                    ? `${ENV.API.BASE_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}`
                    : ""),
                provider_attributions: place.provider_attributions ?? [],
                photo_source_uri: place.photos?.[0]?.source_uri,
                photo_attributions:
                  place.photos?.[0]?.author_attributions ?? [],
                rating: place.rating ?? 0,
                price:
                  place.price_level != null
                    ? "$".repeat(place.price_level)
                    : undefined,
                categories: (place.types ?? []).map((type: string) => ({
                  alias: type,
                  title: type.replace(/_/g, " "),
                })),
                location: {
                  address1: place.vicinity ?? "",
                  city: "",
                  state: "",
                  zip_code: "",
                },
                coordinates: {
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                },
                phone: "",
                is_open_now: place.opening_hours?.open_now,
                distance: calculateDistance(
                  location.coords.latitude,
                  location.coords.longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng,
                ),
              }),
            )
            .filter((restaurant: Restaurant) => {
              if (
                seen.current.has(restaurant.id) ||
                restaurant.rating < rating ||
                (!DEMO_MODE && restaurant.distance * 1609.34 > radius)
              )
                return false;
              if (
                selectedPrices.length &&
                (!restaurant.price ||
                  !selectedPrices.includes(restaurant.price))
              )
                return false;
              seen.current.add(restaurant.id);
              return true;
            });
          if (batch.length) {
            setRestaurants((previous) =>
              firstPage ? batch : [...previous, ...batch],
            );
            return;
          }
        } while (token);
        setError(
          "No more restaurants match your filters. Try adjusting your filters.",
        );
      } catch (err) {
        if (requestGeneration === generation.current) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch restaurants",
          );
        }
      } finally {
        if (requestGeneration === generation.current) {
          fetching.current = false;
          setLoading(false);
        }
      }
    },
    [location, radius, rating, prices, cuisine, openNow],
  );

  useEffect(() => {
    const requestGeneration = ++generation.current;
    fetching.current = false;
    seen.current.clear();
    nextPageToken.current = undefined;
    setRestaurants([]);
    setCurrentIndex(0);
    if (location) void fetchPage(true, requestGeneration);
    return () => {
      generation.current++;
    };
  }, [fetchPage, refreshVersion]);

  const nextRestaurant = useCallback(() => {
    if (fetching.current || !restaurants.length) return;
    if (currentIndex < restaurants.length - 1) {
      setCurrentIndex((index) => index + 1);
    } else if (nextPageToken.current) {
      setCurrentIndex(restaurants.length);
      void fetchPage(false, generation.current);
    } else {
      setCurrentIndex(restaurants.length);
      setError(
        "You have seen all matching restaurants. Try adjusting your filters.",
      );
    }
  }, [currentIndex, restaurants.length, fetchPage]);

  const previousRestaurant = useCallback(() => {
    if (!fetching.current) {
      setCurrentIndex((index) => Math.max(0, index - 1));
      setError(null);
    }
  }, []);
  const refreshRestaurants = useCallback(() => {
    if (!location) setLocationRetry((version) => version + 1);
    else setRefreshVersion((version) => version + 1);
  }, [location]);
  return {
    restaurants,
    currentRestaurant: restaurants[currentIndex],
    loading,
    error,
    nextRestaurant,
    previousRestaurant,
    refreshRestaurants,
    currentIndex,
    total: restaurants.length,
    useDeviceLocation: () => setLocationRetry((version) => version + 1),
  };
};
