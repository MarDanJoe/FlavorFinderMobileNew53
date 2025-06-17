import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { getPlaceDetails, getRestaurantById } from '../services/api';
import { Restaurant } from '../hooks/useRestaurants';
import { RootStackParamList } from '../navigation/AppNavigator';
import { searchRestaurants } from '../services/api';

type RestaurantDetailScreenRouteProp = RouteProp<RootStackParamList, 'RestaurantDetail'>;
type RestaurantDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RestaurantDetail'>;

type Props = {
  route: RestaurantDetailScreenRouteProp;
  navigation: RestaurantDetailScreenNavigationProp;
};

type PlaceDetails = {
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
  }>;
};

export const RestaurantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const [placeDetails, restaurantData] = await Promise.all([
          getPlaceDetails(id),
          getRestaurantById(id)
        ]);
        
        setRestaurant(restaurantData);
        setDetails(placeDetails);
      } catch (err) {
        console.error('Error loading restaurant details:', err);
        setError('Failed to load restaurant details');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id]);

  const handleCall = () => {
    if (details?.formatted_phone_number) {
      Linking.openURL(`tel:${details.formatted_phone_number}`);
    }
  };

  const handleWebsite = () => {
    if (details?.website) {
      Linking.openURL(details.website);
    }
  };

  const handleDirections = () => {
    const { latitude, longitude } = restaurant?.coordinates || { latitude: 0, longitude: 0 };
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    );
  };

  if (loading || !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: restaurant.image_url }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.name}>{restaurant.name}</Text>
        
        <View style={styles.ratingContainer}>
          <Icon name="star" size={24} color="#FFD700" />
          <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
          <Text style={styles.price}>{restaurant.price}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.address}>{restaurant.location.address1}</Text>
          <Text style={styles.distance}>{restaurant.distance.toFixed(1)} miles away</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.button} onPress={handleCall}>
            <Icon name="call" size={24} color="#FF6B6B" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleWebsite}>
            <Icon name="globe" size={24} color="#FF6B6B" />
            <Text style={styles.buttonText}>Website</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleDirections}>
            <Icon name="navigate" size={24} color="#FF6B6B" />
            <Text style={styles.buttonText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {details?.opening_hours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hours</Text>
            <Text style={styles.hoursStatus}>
              {details.opening_hours.open_now ? 'Open Now' : 'Closed'}
            </Text>
            {details.opening_hours.weekday_text?.map((day, index) => (
              <Text key={index} style={styles.hoursText}>{day}</Text>
            ))}
          </View>
        )}

        {details?.reviews && details.reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {details.reviews.map((review, index) => (
              <View key={index} style={styles.reviewContainer}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                  <View style={styles.reviewRating}>
                    <Icon name="star" size={16} color="#FFD700" />
                    <Text style={styles.reviewRatingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewTime}>{review.relative_time_description}</Text>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rating: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
    marginRight: 15,
  },
  price: {
    fontSize: 18,
    color: '#666',
  },
  infoSection: {
    marginBottom: 20,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  distance: {
    fontSize: 16,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  button: {
    alignItems: 'center',
  },
  buttonText: {
    color: '#FF6B6B',
    marginTop: 5,
    fontSize: 14,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  hoursStatus: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 10,
  },
  hoursText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  reviewContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    marginLeft: 5,
    color: '#666',
  },
  reviewTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 