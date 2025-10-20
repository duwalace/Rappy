import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  image: string;
  storeName?: string;
  storeId: string;
  rating?: number;
  isPopular?: boolean;
  isFavorite?: boolean;
}

interface ProductCarouselProps {
  title: string;
  data: Product[];
  onSeeMorePress: () => void;
  onProductPress: (product: Product) => void;
  onFavoritePress?: (product: Product) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  data,
  onSeeMorePress,
  onProductPress,
  onFavoritePress,
}) => {
  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={onProductPress}
      onFavoritePress={onFavoritePress}
    />
  );

  if (data.length === 0) {
    return null; // Não renderiza se não houver produtos
  }

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
        renderItem={renderProduct}
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

export default ProductCarousel;

