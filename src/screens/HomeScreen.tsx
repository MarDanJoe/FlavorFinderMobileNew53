import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ImageStyle,
  ScrollView,
  TextInput,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRestaurants, Restaurant } from '../hooks/useRestaurants';
import { ENV } from '../config/env';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import * as Animatable from 'react-native-animatable';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

interface Address {
  address1: string;
  city: string;
  state: string;
  zip_code: string;
}

export function HomeScreen({ navigation }: Props) {
  const [filterParams, setFilterParams] = useState({
    rating: 0,
    price: [] as string[],
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { currentRestaurant, loading, error, nextRestaurant } = useRestaurants(filterParams);
  const position = useRef(new Animated.ValueXY()).current;
  const cardRef = useRef<Animatable.View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const item = currentRestaurant;
    direction === 'right' ? addToFavorites(item) : null;
    position.setValue({ x: 0, y: 0 });
    nextRestaurant();
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  const addToFavorites = async (restaurant: Restaurant) => {
    try {
      const existingFavoritesString = await AsyncStorage.getItem(ENV.STORAGE_KEYS.FAVORITES);
      const existingFavorites = existingFavoritesString ? JSON.parse(existingFavoritesString) : [];
      const updatedFavorites = [...existingFavorites, restaurant];
      await AsyncStorage.setItem(ENV.STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
    } catch (err) {
      console.error('Error saving to favorites:', err);
    }
  };

  const formatAddress = (location: string | Address) => {
    if (typeof location === 'string') {
      try {
        const address = JSON.parse(location) as Address;
        return `${address.address1}, ${address.city}, ${address.state} ${address.zip_code}`;
      } catch {
        return location;
      }
    }
    return `${location.address1}, ${location.city}, ${location.state} ${location.zip_code}`;
  };

  const renderFilters = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.filterModal}>
        <View style={styles.filterContent}>
          <Text style={styles.filterTitle}>Filters</Text>
          
          <Text style={styles.filterLabel}>Price</Text>
          <View style={styles.priceButtons}>
            {['$', '$$', '$$$', '$$$$'].map((price) => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.priceButton,
                  filterParams.price.includes(price) && styles.priceButtonActive,
                ]}
                onPress={() => {
                  setFilterParams(prev => ({
                    ...prev,
                    price: prev.price.includes(price)
                      ? prev.price.filter(p => p !== price)
                      : [...prev.price, price],
                  }));
                }}
              >
                <Text style={[
                  styles.priceButtonText,
                  filterParams.price.includes(price) && styles.priceButtonTextActive,
                ]}>{price}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Minimum Rating</Text>
          <View style={styles.ratingButtons}>
            {[0, 3, 3.5, 4, 4.5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  filterParams.rating === rating && styles.ratingButtonActive,
                ]}
                onPress={() => setFilterParams(prev => ({ ...prev, rating }))}
              >
                <Text style={[
                  styles.ratingButtonText,
                  filterParams.rating === rating && styles.ratingButtonTextActive,
                ]}>
                  {rating === 0 ? 'All' : `${rating}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => setShowFilterModal(true)}
        style={styles.filterButton}
      >
        <Ionicons name="filter" size={24} color="#FF6B6B" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>FlavorFinder</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderCard = () => {
    if (loading) {
      return (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.messageText}>Finding restaurants...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{error}</Text>
        </View>
      );
    }

    if (!currentRestaurant) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No more restaurants found</Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[styles.card, getCardStyle()]}
        {...panResponder.panHandlers}
      >
        <Image
          source={{ uri: currentRestaurant.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{currentRestaurant.name}</Text>
          <Text style={styles.subtitle}>
            {currentRestaurant.categories?.map(cat => cat.title).join(' • ')}
          </Text>
          <View style={styles.details}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>
                {currentRestaurant.rating?.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.price}>
              {currentRestaurant.price || 'Price not available'}
            </Text>
          </View>
          <Text style={styles.address}>
            {formatAddress(currentRestaurant.location)}
          </Text>
          <Text style={styles.distance}>
            {currentRestaurant.distance.toFixed(1)} miles away
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderRestaurantCard = (restaurant: Restaurant) => {
    if (!restaurant) return null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RestaurantDetail', { id: restaurant.id })}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: restaurant.image_url }}
          style={styles.image}
          onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
        />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.price}>{restaurant.price}</Text>
          <Text style={styles.address}>{restaurant.location.address1}</Text>
          <Text style={styles.distance}>{restaurant.distance.toFixed(1)} miles away</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      <View style={styles.cardContainer}>
        <View style={styles.cardWrapper}>
          {renderCard()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    flex: 1,
  },
  filterButton: {
    padding: 8,
  },
  headerRight: {
    width: 40, // To balance the filter button on the left
  },
  favoritesButton: {
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: SCREEN_WIDTH - 32,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '50%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 16,
    color: '#666',
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#999',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  filterModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 18,
    marginBottom: 10,
  },
  priceButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  priceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  priceButtonActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  priceButtonText: {
    fontSize: 16,
    color: '#666',
  },
  priceButtonTextActive: {
    color: 'white',
  },
  ratingButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  ratingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  ratingButtonActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#666',
  },
  ratingButtonTextActive: {
    color: 'white',
  },
  applyButton: {
    backgroundColor: '#ff6b6b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
