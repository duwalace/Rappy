import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  useWindowDimensions,
  Platform 
} from 'react-native';

interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  imageUrl?: string; // Suporte para formato de Banner do Firebase
  backgroundColor?: string;
}

interface PromoBannerCardProps {
  banner: PromoBanner;
  onPress?: (banner: PromoBanner) => void;
}

const PromoBannerCard: React.FC<PromoBannerCardProps> = ({
  banner,
  onPress,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  
  // Calcular largura responsiva do card
  const maxAppWidth = Platform.OS === 'web' ? Math.min(windowWidth, 768) : windowWidth;
  const cardWidth = Math.max(280, Math.min(maxAppWidth * 0.8, 350));
  
  // Calcular altura proporcional (mantendo aspect ratio ~2.5:1)
  const cardHeight = Math.round(cardWidth / 2.5);
  
  // Calcular tamanho da imagem decorativa
  const imageSize = Math.round(cardHeight * 0.65);
  
  // Suportar ambos formatos de banner
  const imageSource = banner.image || banner.imageUrl || '';
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: banner.backgroundColor || '#EA1D2C',
          width: cardWidth,
          height: cardHeight,
        }
      ]} 
      onPress={() => onPress?.(banner)}
      activeOpacity={0.9}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>{banner.title}</Text>
        {banner.subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>{banner.subtitle}</Text>
        )}
      </View>
      
      {imageSource && (
        <Image 
          source={{ uri: imageSource }} 
          style={[
            styles.bannerImage,
            {
              width: imageSize,
              height: imageSize,
            }
          ]}
          resizeMode="contain"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    lineHeight: 18,
  },
  bannerImage: {
    flexShrink: 0,
  },
});

export default PromoBannerCard;