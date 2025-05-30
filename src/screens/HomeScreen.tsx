import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  priceLevel: number;
  address: string;
  isOpen: boolean;
}

export default function HomeScreen() {
  const [restaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Sample Restaurant 1',
      image: 'https://via.placeholder.com/400x300',
      rating: 4.5,
      priceLevel: 2,
      address: '123 Main St, City',
      isOpen: true,
    },
    // Add more sample restaurants here
  ]);

  const position = useRef(new Animated.ValueXY()).current;
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 2, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete('right'));
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 2, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete('left'));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const restaurant = restaurants[currentIndex];
    if (direction === 'right') {
      console.log('Liked:', restaurant.name);
      // TODO: Implement like functionality
    } else {
      console.log('Disliked:', restaurant.name);
      // TODO: Implement dislike functionality
    }
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prevIndex) => prevIndex + 1);
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

  const renderCard = () => {
    if (currentIndex >= restaurants.length) {
      return (
        <View style={styles.noMoreCards}>
          <Text style={styles.noMoreCardsText}>No more restaurants!</Text>
          <Text style={styles.noMoreCardsSubText}>
            Check back later for more options
          </Text>
        </View>
      );
    }

    const restaurant = restaurants[currentIndex];

    return (
      <Animated.View
        style={[styles.card, getCardStyle()]}
        {...panResponder.panHandlers}
      >
        <Image source={{ uri: restaurant.image }} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{restaurant.rating}</Text>
          </View>
          <Text style={styles.price}>
            {'$'.repeat(restaurant.priceLevel)}
          </Text>
          <Text style={styles.address}>{restaurant.address}</Text>
          <Text style={[styles.status, restaurant.isOpen ? styles.open : styles.closed]}>
            {restaurant.isOpen ? 'Open Now' : 'Closed'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FlavorFinder</Text>
      </View>
      <View style={styles.cardContainer}>{renderCard()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  card: {
    width: SCREEN_WIDTH - 30,
    height: 450,
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
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  open: {
    color: '#2ecc71',
  },
  closed: {
    color: '#e74c3c',
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
}); 