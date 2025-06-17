export const ENV = {
  // Google Places API Key
  GOOGLE_PLACES_API_KEY: 'AIzaSyDW3C7apil1_X7QUme8pTwdTgX8lMiuMys',
  
  // API endpoints
  API: {
    GOOGLE_PLACES_BASE_URL: 'https://maps.googleapis.com/maps/api/place',
  },

  // Default search parameters
  DEFAULTS: {
    SEARCH_RADIUS: 24140, // 15 miles in meters
    RESULTS_LIMIT: 20,
    MINIMUM_RATING: 0, // Lower minimum rating to show all restaurants
  },

  // Storage keys
  STORAGE_KEYS: {
    USER_TOKEN: 'user_token',
    USER: 'user_data',
    FAVORITES: 'favorites',
    USER_PREFERENCES: 'user_preferences',
  },
}; 