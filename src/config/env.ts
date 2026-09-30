export const ENV = {
  // Google Places API Key
  API: {
    BASE_URL:
      process.env.EXPO_PUBLIC_PLACES_API_URL ||
      (process.env.EXPO_PUBLIC_SUPABASE_URL
        ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/places`
        : "http://localhost:8082/places"),
  },

  // Default search parameters
  DEFAULTS: {
    SEARCH_RADIUS: 24140, // 15 miles in meters
    RESULTS_LIMIT: 20,
  },

  // Storage keys
  STORAGE_KEYS: {
    USER_TOKEN: "user_token",
    USER: "user_data",
    FAVORITES: "@FlavorFinder:favorites",
    USER_PREFERENCES: "user_preferences",
  },
};
