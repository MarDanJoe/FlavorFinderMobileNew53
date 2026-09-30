import { placesFetch } from "./supabase";
import { DEMO_MODE } from "../config/demo";
import { demoPlaces, demoRestaurant } from "../config/demoData";
import { ENV } from "../config/env";

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
export const getRestaurantById = async (placeId: string, basic = false) => {
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
      coordinates: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      distance: 0, // We don't have user location here
      phone: place.formatted_phone_number,
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
    latitude: data.result.location.latitude as number,
    longitude: data.result.location.longitude as number,
    label:
      data.result.formattedAddress || data.result.displayName?.text || query,
  };
}
