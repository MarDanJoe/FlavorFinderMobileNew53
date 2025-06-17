import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRestaurantDetails } from '../services/api';
import { Restaurant } from '../hooks/useRestaurants';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface RestaurantDetailsProps {
  route: {
    params: {
      restaurant: Restaurant;
    };
  };
  navigation: any;
}

interface DetailedRestaurant extends Restaurant {
  photos?: { url: string }[];
  reviews?: {
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
  }[];
  opening_hours?: {
    weekday_text: string[];
    open_now: boolean;
  };
}

export default function RestaurantDetailsScreen({ route, navigation }: RestaurantDetailsProps) {
  const { restaurant } = route.params;
  const [detailedInfo, setDetailedInfo] = useState<DetailedRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    loadRestaurantDetails();
  }, []);

  const loadRestaurantDetails = async () => {
    try {
      const details = await getRestaurantDetails(restaurant.id);
      setDetailedInfo({ ...restaurant, ...details });
    } catch (error) {
      console.error('Error loading restaurant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
  };

  const handleWebsitePress = (url: string) => {
    Linking.openURL(url);
  };

  const handleDirectionsPress = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${restaurant.name} ${restaurant.location.address1}`
    )}&destination_place_id=${restaurant.id}`;
    Linking.openURL(url);
  };

  const handleReviewsPress = () => {
    const url = `https://search.google.com/local/reviews?placeid=${restaurant.id}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
      </View>

      {/* Photo Gallery */}
      <View style={styles.photoContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActivePhotoIndex(newIndex);
          }}
        >
          <Image 
            source={{ uri: restaurant.image_url }} 
            style={styles.photo}
          />
          {detailedInfo?.photos?.map((photo, index) => (
            <Image 
              key={index} 
              source={{ uri: photo.url }} 
              style={styles.photo}
            />
          ))}
        </ScrollView>
        {/* Photo Indicators */}
        <View style={styles.photoIndicators}>
          {[restaurant.image_url, ...(detailedInfo?.photos?.map(p => p.url) || [])].map((_, index) => (
            <View
              key={index}
              style={[
                styles.photoIndicator,
                index === activePhotoIndex && styles.photoIndicatorActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        <View style={styles.ratingContainer}>
          <TouchableOpacity 
            style={styles.ratingButton}
            onPress={handleReviewsPress}
          >
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.rating}>{restaurant.rating}</Text>
          </TouchableOpacity>
          {restaurant.price && (
            <Text style={styles.price}>{restaurant.price}</Text>
          )}
          <Text style={[
            styles.openStatus,
            detailedInfo?.opening_hours?.open_now ? styles.open : styles.closed
          ]}>
            {detailedInfo?.opening_hours?.open_now ? 'Open' : 'Closed'}
          </Text>
        </View>

        <Text style={styles.address}>{restaurant.location.address1}</Text>
        <Text style={styles.distance}>
          {(restaurant.distance * 0.621371).toFixed(1)} miles away
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {restaurant.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePhonePress(restaurant.phone)}
            >
              <Ionicons name="call" size={24} color="#2ecc71" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          {restaurant.website && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleWebsitePress(restaurant.website)}
            >
              <Ionicons name="globe-outline" size={24} color="#3498db" />
              <Text style={styles.actionButtonText}>Website</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDirectionsPress}
          >
            <Ionicons name="navigate" size={24} color="#9b59b6" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Hours */}
        {detailedInfo?.opening_hours?.weekday_text && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hours</Text>
            {detailedInfo.opening_hours.weekday_text.map((day, index) => (
              <Text key={index} style={styles.hoursText}>{day}</Text>
            ))}
          </View>
        )}

        {/* Reviews */}
        {detailedInfo?.reviews && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {detailedInfo.reviews.map((review, index) => (
              <View key={index} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.reviewRatingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewTime}>{review.relative_time_description}</Text>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.moreReviewsButton}
              onPress={handleReviewsPress}
            >
              <Text style={styles.moreReviewsText}>See all reviews</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    flex: 1,
  },
  photoContainer: {
    height: 300,
    width: SCREEN_WIDTH,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  photoIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  photoIndicatorActive: {
    backgroundColor: '#fff',
  },
  infoContainer: {
    padding: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 16,
    marginRight: 12,
  },
  rating: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginRight: 12,
  },
  openStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  open: {
    color: '#2ecc71',
  },
  closed: {
    color: '#e74c3c',
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hoursText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  review: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    marginLeft: 4,
    fontSize: 14,
  },
  reviewTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
  moreReviewsButton: {
    padding: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  moreReviewsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 