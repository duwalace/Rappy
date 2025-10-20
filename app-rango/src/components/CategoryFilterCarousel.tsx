import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap | string;
  slug?: string;
  imageUrl?: string;
}

interface CategoryFilterCarouselProps {
  categories: Category[];
  activeCategory: string;
  onCategoryPress: (categoryId: string) => void;
}

const CategoryFilterCarousel: React.FC<CategoryFilterCarouselProps> = ({
  categories,
  activeCategory,
  onCategoryPress,
}) => {
  const renderCategory = ({ item }: { item: Category }) => {
    // Comparar tanto com slug quanto com id
    const isActive = item.slug === activeCategory || item.id === activeCategory;
    
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isActive && styles.activeCategoryChip]}
        onPress={() => onCategoryPress(item.slug || item.id)}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : typeof item.icon === 'string' && item.icon.length <= 2 ? (
          <Text style={[styles.categoryEmoji, isActive && styles.activeCategoryEmoji]}>
            {item.icon}
          </Text>
        ) : (
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={isActive ? 'white' : '#666'}
            style={styles.categoryIcon}
          />
        )}
        <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  activeCategoryChip: {
    backgroundColor: '#EA1D2C',
    borderColor: '#EA1D2C',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  activeCategoryEmoji: {
    opacity: 0.9,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA1D2C',
  },
  activeCategoryText: {
    color: 'white',
  },
});

export default CategoryFilterCarousel;