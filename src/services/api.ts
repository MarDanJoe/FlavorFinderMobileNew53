import { ENV } from '../config/env';

// Get details for a single restaurant
export const getPlaceDetails = async (placeId: string) => {
  try {
    const response = await fetch(
      `${ENV.API.BASE_URL}/details/json?place_id=${placeId}&key=${ENV.API.KEY}&fields=formatted_phone_number,website,opening_hours,reviews,user_ratings_total`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Failed to fetch place details');
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
};

// Restaurant search function using Google Places API
export const searchRestaurants = async (params: {
  latitude: number;
  longitude: number;
  radius: number;
  pageSize: number;
  pageToken?: string;
}) => {
  try {
    const { latitude, longitude, radius, pageSize, pageToken } = params;
    const location = `${latitude},${longitude}`;
    const type = 'restaurant';
    
    const url = `${ENV.API.BASE_URL}/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${ENV.API.KEY}${pageToken ? `&pagetoken=${pageToken}` : ''}`;
    
    console.log('Searching restaurants with URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(data.error_message || 'Failed to fetch restaurants');
    }

    return {
      results: data.results || [],
      nextPageToken: data.next_page_token,
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

// Get a single restaurant by ID
export const getRestaurantById = async (placeId: string) => {
  try {
    const response = await fetch(
      `${ENV.API.BASE_URL}/details/json?place_id=${placeId}&key=${ENV.API.KEY}&fields=name,formatted_phone_number,formatted_address,opening_hours,photos,reviews,price_level,rating,website,geometry,types`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Failed to fetch restaurant details');
    }

    const place = data.result;
    return {
      id: placeId,
      name: place.name,
      image_url: place.photos?.[0]
        ? `${ENV.API.BASE_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${ENV.API.KEY}`
        : 'https://via.placeholder.com/400x300?text=No+Image',
      rating: place.rating || 0,
      price: place.price_level ? '$'.repeat(place.price_level) : undefined,
      categories: place.types?.map((type: string) => ({
        alias: type,
        title: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      })) || [],
      location: {
        address1: place.formatted_address,
        city: '',
        state: '',
        zip_code: '',
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
    console.error('Error fetching restaurant by ID:', error);
    throw error;
  }
};

// Get restaurant details
export const getRestaurantDetails = async (placeId: string) => {
  try {
    const response = await fetch(
      `${ENV.API.BASE_URL}/details/json?place_id=${placeId}&key=${ENV.API.KEY}&fields=name,formatted_phone_number,formatted_address,opening_hours,photos,reviews,price_level,rating,website`
    );

    if (response.status !== 200) {
      throw new Error('Failed to fetch restaurant details');
    }

    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(data.error_message || 'Failed to fetch restaurant details');
    }

    const place = data.result;
    return {
      id: place.place_id,
      name: place.name,
      phone: place.formatted_phone_number,
      address: place.formatted_address,
      opening_hours: place.opening_hours,
      photos: place.photos?.map((photo: any) => ({
        url: `${ENV.API.BASE_URL}/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${ENV.API.KEY}`,
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