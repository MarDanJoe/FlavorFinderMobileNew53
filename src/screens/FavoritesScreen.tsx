import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  priceLevel: number;
  address: string;
}

const sampleFavorites: Restaurant[] = [
  {
    id: '1',
    name: 'Sample Restaurant 1',
    image: 'https://via.placeholder.com/400x300',
    rating: 4.5,
    priceLevel: 2,
    address: '123 Main St, City',
  },
  // Add more sample favorites here
];

export default function FavoritesScreen() {
  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
        <Text style={styles.price}>{'$'.repeat(item.priceLevel)}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
      </View>
      {sampleFavorites.length > 0 ? (
        <FlatList
          data={sampleFavorites}
          renderItem={renderRestaurantItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ff6b6b" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubText}>
            Start swiping to find restaurants you love!
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