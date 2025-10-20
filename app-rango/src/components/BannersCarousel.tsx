import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { Banner } from '../services/bannerService';
import { Video } from 'expo-av';

const AUTOPLAY_INTERVAL = 7000; // 7 segundos

// Aspect ratios comuns para banners
const ASPECT_RATIOS = {
  ultraWide: 21 / 9,    // 2.33:1 - Ultra Wide
  wide: 16 / 9,         // 1.78:1 - Wide (padrão)
  standard: 4 / 3,      // 1.33:1 - Standard
  square: 1 / 1,        // 1:1 - Square
  portrait: 9 / 16,     // 0.56:1 - Portrait
};

interface BannersCarouselProps {
  banners: Banner[];
  onBannerPress?: (banner: Banner) => void;
  aspectRatio?: number; // Proporção customizada (width/height)
  minHeight?: number;
  maxHeight?: number;
}

const BannersCarousel: React.FC<BannersCarouselProps> = ({
  banners,
  onBannerPress,
  aspectRatio,
  minHeight = 150,
  maxHeight = 300,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Usar useWindowDimensions para obter dimensões responsivas
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  // Calcular dimensões do banner baseado nas dimensões da janela (responsivo)
  const bannerDimensions = useMemo(() => {
    // Para web, limitar a largura máxima do app (mobile-first)
    const maxAppWidth = Platform.OS === 'web' ? Math.min(windowWidth, 768) : windowWidth;
    
    const bannerWidth = maxAppWidth - 32; // 16px margin on each side
    const bannerHeight = 200; // Altura fixa para todos os banners
    
    return {
      width: bannerWidth,
      height: bannerHeight,
      gap: 16,
    };
  }, [windowWidth]);
  
  // Auto-play
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        
        // Scroll para o próximo banner
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (bannerDimensions.width + bannerDimensions.gap),
          animated: true,
        });
        
        return nextIndex;
      });
    }, AUTOPLAY_INTERVAL);
    
    return () => clearInterval(interval);
  }, [banners.length, bannerDimensions]);
  
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (bannerDimensions.width + bannerDimensions.gap));
    setCurrentIndex(index);
  };
  
  if (banners.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={bannerDimensions.width + bannerDimensions.gap}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <BannerItem
            key={banner.id}
            banner={banner}
            width={bannerDimensions.width}
            height={bannerDimensions.height}
            onPress={() => onBannerPress?.(banner)}
          />
        ))}
      </ScrollView>
      
      {/* Indicadores de página */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

interface BannerItemProps {
  banner: Banner;
  width: number;
  height: number;
  onPress: () => void;
}

const BannerItem: React.FC<BannerItemProps> = ({ banner, width, height, onPress }) => {
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef<any>(null);
  
  const hasVideo = banner.videoUrl && !videoError;
  
  // Para web, usar vídeo HTML nativo com melhor controle
  useEffect(() => {
    if (Platform.OS === 'web' && hasVideo && videoRef.current) {
      const videoElement = videoRef.current as HTMLVideoElement;
      
      // Aplicar estilos CSS diretamente
      videoElement.style.objectFit = 'contain';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.backgroundColor = 'transparent';
      
      // Configurar atributos do vídeo
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.loop = true;
      
      // Tentar reproduzir
      videoElement.play().catch(err => {
        console.warn('Autoplay bloqueado:', err);
      });
    }
  }, [hasVideo, banner.videoUrl]);
  
  // Usar backgroundColor do banner se disponível, senão usar transparente
  const backgroundColor = banner.backgroundColor || 'transparent';
  
  return (
    <TouchableOpacity
      style={[
        styles.bannerContainer,
        {
          width,
          height,
          backgroundColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {hasVideo ? (
        Platform.OS === 'web' ? (
          // Vídeo HTML5 nativo para web (melhor controle)
          <video
            ref={videoRef}
            src={banner.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={() => {
              console.error('Erro ao carregar vídeo do banner');
              setVideoError(true);
            }}
          />
        ) : (
          // Expo Video para mobile
          <Video
            source={{ uri: banner.videoUrl! }}
            style={styles.bannerMedia}
            resizeMode="cover"
            shouldPlay
            isLooping
            isMuted
            useNativeControls={false}
            onError={(error) => {
              console.error('Erro ao carregar vídeo do banner:', error);
              setVideoError(true);
            }}
          />
        )
      ) : (
        <Image
          source={{ uri: banner.imageUrl }}
          style={[
            styles.bannerMedia,
            Platform.OS === 'web' && {
              // @ts-ignore - CSS específico para web
              objectFit: 'cover',
            },
          ]}
          resizeMode="cover"
          onError={(error) => {
            console.error('Erro ao carregar imagem do banner:', error);
            setImageError(true);
          }}
        />
      )}
      
      {/* Fallback caso a imagem não carregue */}
      {(imageError || videoError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{banner.title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
    alignSelf: 'center',
    maxWidth: Platform.OS === 'web' ? 768 : undefined, // Limitar largura na web
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  bannerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  bannerMedia: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#EA1D2C',
  },
});

export default BannersCarousel;

