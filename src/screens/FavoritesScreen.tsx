import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { Restaurant } from '../hooks/useRestaurants';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    try {
      const favoritesString = await AsyncStorage.getItem(ENV.STORAGE_KEYS.FAVORITES);
      if (favoritesString) {
        const loadedFavorites = JSON.parse(favoritesString);
        setFavorites(loadedFavorites);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => {
    if (!item) return null;
    return (
      <TouchableOpacity style={styles.card}>
        <Image source={{ uri: item.image_url }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          {item.price && (
            <Text style={styles.price}>{item.price}</Text>
          )}
          <Text style={styles.address}>{item.location.address1}</Text>
          {item.distance && (
            <Text style={styles.distance}>
              {(item.distance / 1000).toFixed(1)} km away
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
      </View>
      {favorites.filter(Boolean).length > 0 ? (
        <FlatList
          data={favorites.filter(Boolean)}
          renderItem={renderRestaurantItem}
          keyExtractor={(item) => item?.id || Math.random().toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff6b6b']}
              tintColor="#ff6b6b"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ff6b6b" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubText}>
            Start swiping right on restaurants you love!
          </Text>
        </View>
      )}
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
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rating: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 14,
    color: '#2ecc71',
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
}); 