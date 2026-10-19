import { placesFetch } from "./supabase";
import { DEMO_MODE } from "../config/demo";
import { demoPlaces, demoRestaurant } from "../config/demoData";
import { ENV } from "../config/env";
import type { Restaurant } from "../hooks/useRestaurants";

export interface RestaurantReview {
  author_name?: string;
  author_url?: string;
  author_photo?: string;
  source_uri?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  visit_date?: { year: number; month: number; day?: number };
}
export interface RestaurantDetails extends Restaurant {
  opening_hours?: { open_now?: boolean; weekday_text?: string[] };
  reviews?: RestaurantReview[];
}
function coordinates(latitude: unknown, longitude: unknown) {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    throw new Error(
      "Restaurant service returned invalid coordinates. Please try again.",
    );
  return { latitude, longitude };
}

// Restaurant search function using Google Places API
export const searchRestaurants = async (params: {
  latitude: number;
  longitude: number;
  radius: number;
  pageSize: number;
  pageToken?: string;
  keyword?: string;
  openNow?: boolean;
}) => {
  try {
    if (DEMO_MODE)
      return {
        results: demoPlaces.filter(
          (place) =>
            !params.keyword ||
            place.types
              .join(" ")
              .toLowerCase()
              .includes(params.keyword.toLowerCase()),
        ),
        nextPageToken: undefined,
      };
    const { latitude, longitude, radius, pageSize, pageToken } = params;
    const location = `${latitude},${longitude}`;
    const type = "restaurant";

    const url = `${ENV.API.BASE_URL}/nearbysearch/json?location=${location}&radius=${radius}&type=${type}${pageToken ? `&pagetoken=${encodeURIComponent(pageToken)}` : ""}${params.keyword ? `&keyword=${encodeURIComponent(params.keyword)}` : ""}${params.openNow ? "&opennow=true" : ""}`;

    const data = await placesFetch(url.replace(`${ENV.API.BASE_URL}/`, ""));

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(data.error_message || "Failed to fetch restaurants");
    }

    return {
      results: data.results || [],
      nextPageToken: data.next_page_token,
    };
  } catch (error) {
    throw error;
  }
};

// Get a single restaurant by ID
// Share only requests that are currently running; never retain provider results
// as a persistent or background cache.
const pendingDetails = new Map<string, Promise<RestaurantDetails>>();
export const getRestaurantById = (placeId: string, basic = false) => {
  const key = `${basic ? "basic" : "full"}:${placeId}`;
  const existing = pendingDetails.get(key);
  if (existing) return existing;
  const pending = loadRestaurantById(placeId, basic).finally(() => {
    if (pendingDetails.get(key) === pending) pendingDetails.delete(key);
  });
  pendingDetails.set(key, pending);
  return pending;
};
const loadRestaurantById = async (
  placeId: string,
  basic = false,
): Promise<RestaurantDetails> => {
  if (DEMO_MODE) return demoRestaurant(placeId);
  try {
    const data = await placesFetch(
      `details/json?place_id=${encodeURIComponent(placeId)}&fields=${basic ? "name,formatted_address,photos,rating,geometry,types,price_level" : "name,formatted_phone_number,formatted_address,opening_hours,photos,reviews,price_level,rating,website,geometry,types"}`,
    );

    if (data.status !== "OK") {
      throw new Error(
        data.error_message || "Failed to fetch restaurant details",
      );
    }

    const place = data.result;
    if (typeof place?.name !== "string" || !place.name.trim())
      throw new Error("Restaurant details are unavailable. Please try again.");
    const position = coordinates(
      place.geometry?.location?.lat,
      place.geometry?.location?.lng,
    );
    return {
      id: placeId,
      name: place.name,
      image_url: place.photos?.[0]
        ? `${ENV.API.BASE_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}`
        : "",
      provider_attributions: place.provider_attributions ?? [],
      photo_source_uri: place.photos?.[0]?.source_uri,
      photo_attributions: place.photos?.[0]?.author_attributions ?? [],
      rating: place.rating || 0,
      price: place.price_level ? "$".repeat(place.price_level) : undefined,
      categories:
        place.types?.map((type: string) => ({
          alias: type,
          title: type
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        })) || [],
      location: {
        address1: place.formatted_address,
        city: "",
        state: "",
        zip_code: "",
      },
      coordinates: position,
      distance: 0, // We don't have user location here
      phone: place.formatted_phone_number ?? "",
      website: place.website,
      opening_hours: place.opening_hours,
      reviews: place.reviews,
    };
  } catch (error) {
    throw error;
  }
};

export async function findSearchLocation(query: string) {
  const data = await placesFetch(
    `location/json?query=${encodeURIComponent(query.trim())}`,
  );
  if (!data.result?.location)
    throw new Error("No location found. Try a city and state or ZIP code.");
  return {
    ...coordinates(
      data.result.location.latitude,
      data.result.location.longitude,
    ),
    label:
      data.result.formattedAddress || data.result.displayName?.text || query,
  };
}
