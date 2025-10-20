import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SubCategory {
  id: string;
  name: string;
  image: string;
}

interface SubCategoryCarouselProps {
  data: SubCategory[];
  onSubCategoryPress?: (subCategory: SubCategory) => void;
}

const SubCategoryCarousel: React.FC<SubCategoryCarouselProps> = ({
  data,
  onSubCategoryPress,
}) => {
  const renderSubCategory = ({ item }: { item: SubCategory }) => (
    <TouchableOpacity
      style={styles.subCategoryItem}
      onPress={() => onSubCategoryPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.subCategoryImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.subCategoryName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderSubCategory}
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
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  subCategoryItem: {
    alignItems: 'center',
    width: width > 768 ? 90 : 75,
  },
  imageContainer: {
    width: width > 768 ? 80 : 70,
    height: width > 768 ? 80 : 70,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  subCategoryImage: {
    width: '100%',
    height: '100%',
  },
  subCategoryName: {
    fontSize: width > 768 ? 13 : 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: width > 768 ? 16 : 14,
  },
});

export default SubCategoryCarousel;