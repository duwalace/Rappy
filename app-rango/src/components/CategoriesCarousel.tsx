import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap | string;
  imageUrl?: string;
  slug?: string;
}

interface CategoriesCarouselProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
}

const CategoriesCarousel: React.FC<CategoriesCarouselProps> = ({ categories, onCategoryPress }) => {
  const renderCategory = ({ item }: { item: Category }) => {
    const hasImage = item.imageUrl && item.imageUrl.trim() !== '';
    
    return (
      <TouchableOpacity 
        style={styles.categoryItem} 
        onPress={() => onCategoryPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {hasImage ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.categoryImage}
              resizeMode="cover"
            />
          ) : (
            // Fallback para ícone se não houver imagem
            <View style={styles.iconFallback}>
              {typeof item.icon === 'string' && item.icon.length <= 2 ? (
                // É um emoji
                <Text style={styles.emojiIcon}>{item.icon}</Text>
              ) : (
                // É um nome de ícone do Ionicons
                <Ionicons 
                  name={item.icon as keyof typeof Ionicons.glyphMap} 
                  size={28} 
                  color="#EA1D2C" 
                />
              )}
            </View>
          )}
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
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
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: width > 768 ? 90 : 75, // Responsivo: maior em tablets
  },
  iconContainer: {
    width: width > 768 ? 70 : 60,
    height: width > 768 ? 70 : 60,
    borderRadius: width > 768 ? 35 : 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    // Sombra moderna
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Borda sutil
    borderWidth: 1,
    borderColor: '#F5F5F5',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: width > 768 ? 35 : 30,
  },
  iconFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: width > 768 ? 35 : 30,
  },
  emojiIcon: {
    fontSize: width > 768 ? 32 : 28,
  },
  categoryName: {
    fontSize: width > 768 ? 13 : 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: width > 768 ? 16 : 14,
    paddingHorizontal: 2,
  },
});

export default CategoriesCarousel;