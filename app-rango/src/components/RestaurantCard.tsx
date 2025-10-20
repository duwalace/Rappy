import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadowPresets } from '../utils/shadowUtils';
import { spacing, fontSize, iconSize, borderRadius, scale, responsiveValue } from '../utils/responsive';
import theme from '../styles/theme';

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

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
  onFavoritePress: (restaurant: Restaurant) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress, onFavoritePress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(restaurant)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
        
        {/* Badge de Avaliação */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={iconSize.xs} color={theme.colors.gold} />
          <Text style={styles.ratingText}>{restaurant.rating}</Text>
        </View>
        
        {/* Ícone de Favorito */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={() => onFavoritePress(restaurant)}
        >
          <Ionicons 
            name={restaurant.isFavorite ? "heart" : "heart-outline"} 
            size={iconSize.md} 
            color={restaurant.isFavorite ? theme.colors.primary : theme.colors.textInverse} 
          />
        </TouchableOpacity>
        
        {/* Tag Patrocinado */}
        {restaurant.isSponsored && (
          <View style={styles.sponsoredTag}>
            <Text style={styles.sponsoredText}>Patrocinado</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.headerInfo}>
          <Image source={{ uri: restaurant.logo }} style={styles.logo} />
          <View style={styles.textInfo}>
            <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
            <Text style={styles.deliveryInfo}>
              {restaurant.deliveryTime} • {restaurant.deliveryFee}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardWidth = responsiveValue({
  small: 260,
  medium: 280,
  tablet: 320,
  desktop: 350,
  default: Platform.OS === 'web' ? 280 : 280,
});

const imageHeight = responsiveValue({
  small: 140,
  medium: 160,
  tablet: 180,
  desktop: 200,
  default: Platform.OS === 'web' ? 150 : 160,
});

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginRight: spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: borderRadius.md,
    ...shadowPresets.card,
  },
  imageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: imageHeight,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: theme.colors.overlayDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    color: theme.colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: spacing.xs / 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsoredTag: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  sponsoredText: {
    color: theme.colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  infoContainer: {
    padding: spacing.sm,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: spacing.sm,
  },
  textInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  deliveryInfo: {
    fontSize: fontSize.base,
    color: theme.colors.textLight,
  },
});

export default RestaurantCard;