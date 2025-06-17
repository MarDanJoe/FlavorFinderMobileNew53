import axios from 'axios';
import { ENV } from '../config/env';

// Create an axios instance for Google Places API
const placesApi = axios.create({
  baseURL: ENV.API.GOOGLE_PLACES_BASE_URL,
});

// Get details for a single restaurant
const getPlaceDetails = async (placeId: string) => {
  try {
    const response = await placesApi.get('/details/json', {
      params: {
        place_id: placeId,
        key: ENV.GOOGLE_PLACES_API_KEY,
        fields: 'formatted_phone_number,website',
      },
    });

    if (response.data.status !== 'OK') {
      console.warn(`Could not fetch details for place ${placeId}: ${response.data.status}`);
      return null;
    }

    return response.data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

// Restaurant search function using Google Places API
export const searchRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number = ENV.DEFAULTS.SEARCH_RADIUS,
  pageSize: number = ENV.DEFAULTS.RESULTS_LIMIT,
  pageToken?: string
) => {
  try {
    console.log('Searching restaurants with params:', {
      latitude,
      longitude,
      radius,
      pageSize,
      pageToken,
    });

    // Add a small delay if using pageToken (Google Places API requirement)
    if (pageToken) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const params: any = {
      location: `${latitude},${longitude}`,
      key: ENV.GOOGLE_PLACES_API_KEY,
      type: 'restaurant',
    };

    if (pageToken) {
      params.pagetoken = pageToken;
    } else {
      // Only use radius if it's specified and we're not using a page token
      if (radius) {
        params.radius = radius;
      } else {
        // If no radius specified, use rankby=distance
        params.rankby = 'distance';
      }
      params.keyword = 'restaurant'; // Required when using rankby=distance
    }

    const response = await placesApi.get('/nearbysearch/json', {
      params: params
    });

    console.log('Google Places API Response:', {
      status: response.data.status,
      resultsCount: response.data.results?.length,
      nextPageToken: response.data.next_page_token,
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API Error: ${response.data.status}`);
    }

    // Filter and transform Google Places results
    const restaurants = await Promise.all((response.data.results || [])
      .filter((place: any) => {
        // Filter out places without proper details
        return (
          place.geometry?.location &&
          place.name &&
          place.vicinity
        );
      })
      .map(async (place: any) => {
        // Calculate actual distance from user
        const distance = calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        // Fetch additional details
        const details = await getPlaceDetails(place.place_id);

        return {
          id: place.place_id,
          name: place.name,
          image_url: place.photos?.[0]
            ? `${ENV.API.GOOGLE_PLACES_BASE_URL}/photo?maxwidth=400&photoreference=${
                place.photos[0].photo_reference
              }&key=${ENV.GOOGLE_PLACES_API_KEY}`
            : 'https://via.placeholder.com/400x300?text=No+Image',
          rating: place.rating || 0,
          price: place.price_level ? '$'.repeat(place.price_level) : undefined,
          categories: place.types.map((type: string) => ({
            alias: type,
            title: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          })),
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
          phone: details?.formatted_phone_number || '',
          website: details?.website || '',
          distance: distance,
          is_open_now: place.opening_hours?.open_now,
        };
      }));

    const sortedRestaurants = restaurants.sort((a, b) => a.distance - b.distance);

    console.log('Transformed restaurants:', {
      count: sortedRestaurants.length,
      names: sortedRestaurants.map(r => `${r.name} (${r.distance.toFixed(1)}km)`),
    });

    return {
      restaurants: sortedRestaurants,
      nextPageToken: response.data.next_page_token,
    };
  } catch (error) {
    console.error('Error searching restaurants:', error);
    throw error;
  }
};

// Helper function to calculate distance between two points in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the earth in miles (instead of 6371 km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Get restaurant details
export const getRestaurantDetails = async (placeId: string) => {
  try {
    const response = await placesApi.get('/details/json', {
      params: {
        place_id: placeId,
        key: ENV.GOOGLE_PLACES_API_KEY,
        fields: 'name,formatted_phone_number,formatted_address,opening_hours,photos,reviews,price_level,rating,website',
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API Error: ${response.data.status}`);
    }

    const place = response.data.result;
    return {
      id: place.place_id,
      name: place.name,
      phone: place.formatted_phone_number,
      address: place.formatted_address,
      opening_hours: place.opening_hours,
      photos: place.photos?.map((photo: any) => ({
        url: `${ENV.API.GOOGLE_PLACES_BASE_URL}/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${ENV.GOOGLE_PLACES_API_KEY}`,
      })),
      reviews: place.reviews,
      price_level: place.price_level,
      rating: place.rating,
      website: place.website,
    };
  } catch (error) {
    console.error('Error getting restaurant details:', error);
    throw error;
  }
};

// Export the API instance
export default placesApi; 