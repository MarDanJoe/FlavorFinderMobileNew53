export const ENV = {
  // Google Places API Key
  API: {
    BASE_URL: 'https://maps.googleapis.com/maps/api/place',
    KEY: 'AIzaSyDW3C7apil1_X7QUme8pTwdTgX8lMiuMys',
  },

  // Default search parameters
  DEFAULTS: {
    SEARCH_RADIUS: 24140, // 15 miles in meters
    RESULTS_LIMIT: 20,
  },

  // Storage keys
  STORAGE_KEYS: {
    USER_TOKEN: 'user_token',
    USER: 'user_data',
    FAVORITES: '@FlavorFinder:favorites',
    USER_PREFERENCES: 'user_preferences',
  },
}; 