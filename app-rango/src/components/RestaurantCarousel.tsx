import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import RestaurantCard from './RestaurantCard';

interface Restaurant {
  id: string;
  name: string;
  image: string;
  logo: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  isSponsored?: boolean;
  isFavorite?: boolean;
}

interface RestaurantCarouselProps {
  title: string;
  data: Restaurant[];
  onSeeMorePress: () => void;
  onRestaurantPress: (restaurant: Restaurant) => void;
  onFavoritePress: (restaurant: Restaurant) => void;
}

const RestaurantCarousel: React.FC<RestaurantCarouselProps> = ({
  title,
  data,
  onSeeMorePress,
  onRestaurantPress,
  onFavoritePress,
}) => {
  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <RestaurantCard
      restaurant={item}
      onPress={onRestaurantPress}
      onFavoritePress={onFavoritePress}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onSeeMorePress}>
          <Text style={styles.seeMoreText}>Ver mais</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={data}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 16,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#EA1D2C',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8, // Espaço extra para sombras não serem cortadas
  },
});

export default RestaurantCarousel;