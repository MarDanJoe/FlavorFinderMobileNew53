import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRestaurants, Restaurant } from '../hooks/useRestaurants';
import { ENV } from '../config/env';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = 120;

export default function HomeScreen({ navigation }) {
  const [filterParams, setFilterParams] = useState({
    radius: ENV.DEFAULTS.SEARCH_RADIUS,
    rating: 0,
    price: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const { currentRestaurant, loading, error, nextRestaurant } = useRestaurants(filterParams);

  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

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

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 2, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onSwipeComplete('right');
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 2, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onSwipeComplete('left');
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const restaurant = currentRestaurant;
    if (direction === 'right' && restaurant) {
      addToFavorites(restaurant);
    }
    position.setValue({ x: 0, y: 0 });
    setTimeout(() => {
      nextRestaurant();
    }, 100);
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 2, 0, SCREEN_WIDTH * 2],
      outputRange: ['-120deg', '0deg', '120deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
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
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
        <View style={styles.noMoreCards}>
          <Text style={styles.noMoreCardsText}>No more restaurants!</Text>
          <Text style={styles.noMoreCardsSubText}>
            Check back later for more options
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('RestaurantDetails', { restaurant: currentRestaurant })}
      >
        <Animated.View
          style={[styles.card, getCardStyle()]}
          {...panResponder.panHandlers}
        >
          <Image source={{ uri: currentRestaurant.image_url }} style={styles.image} />
          <View style={styles.cardContent}>
            <Text style={styles.name}>{currentRestaurant.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{currentRestaurant.rating}</Text>
            </View>
            {currentRestaurant.price && (
              <Text style={styles.price}>{currentRestaurant.price}</Text>
            )}
            <Text style={styles.address}>{currentRestaurant.location.address1}</Text>
            <Text style={styles.distance}>
              {(currentRestaurant.distance / 1000).toFixed(1)} km away
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={24} color="#ff6b6b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FlavorFinder</Text>
        <TouchableOpacity
          style={styles.favoritesButton}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Ionicons name="heart" size={24} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContainer}>
        {renderCard()}
        {renderFilters()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  filterButton: {
    padding: 5,
  },
  favoritesButton: {
    padding: 5,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  card: {
    width: SCREEN_WIDTH - 30,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 5,
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 16,
    color: '#2ecc71',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  noMoreCards: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noMoreCardsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  noMoreCardsSubText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  filterModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  priceButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  priceButtonActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  priceButtonText: {
    color: '#666',
  },
  priceButtonTextActive: {
    color: '#fff',
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  ratingButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  ratingButtonActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  ratingButtonText: {
    color: '#666',
  },
  ratingButtonTextActive: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
