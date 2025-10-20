import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';

export interface ResponsiveBannerProps {
  imageUrl: string;
  videoUrl?: string;
  title?: string;
  backgroundColor?: string;
  onPress?: () => void;
  aspectRatio?: number; // Proporção fixa (opcional)
  minHeight?: number;
  maxHeight?: number;
  borderRadius?: number;
  marginHorizontal?: number;
  marginVertical?: number;
}

/**
 * Componente de Banner Responsivo que se adapta automaticamente
 * ao tamanho da imagem/vídeo mantendo proporções corretas
 */
const ResponsiveBanner: React.FC<ResponsiveBannerProps> = ({
  imageUrl,
  videoUrl,
  title,
  backgroundColor = 'transparent',
  onPress,
  aspectRatio,
  minHeight = 180,
  maxHeight = 180,
  borderRadius = 12,
  marginHorizontal = 16,
  marginVertical = 16,
}) => {
  const [hasError, setHasError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = React.useRef<any>(null);
  
  const { width: windowWidth } = useWindowDimensions();
  
  const hasVideo = videoUrl && !videoError;
  
  // Calcular largura do banner (responsivo)
  const bannerWidth = useMemo(() => {
    // Para web, limitar a largura máxima
    const maxAppWidth = Platform.OS === 'web' ? Math.min(windowWidth, 768) : windowWidth;
    return maxAppWidth - (marginHorizontal * 2);
  }, [windowWidth, marginHorizontal]);
  
  // Altura fixa para todos os banners
  const bannerHeight = 180;
  
  // Para web, configurar vídeo HTML5
  useEffect(() => {
    if (Platform.OS === 'web' && hasVideo && videoRef.current) {
      const videoElement = videoRef.current as HTMLVideoElement;
      
      videoElement.style.objectFit = 'cover';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.loop = true;
      
      videoElement.play().catch(err => {
        console.warn('Autoplay bloqueado:', err);
        setVideoError(true);
      });
    }
  }, [hasVideo]);
  
  const renderContent = () => {
    if (hasError && !hasVideo) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {title || 'Erro ao carregar banner'}
          </Text>
        </View>
      );
    }
    
    if (hasVideo) {
      return Platform.OS === 'web' ? (
        <video
          ref={videoRef}
          src={videoUrl}
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
        <Video
          source={{ uri: videoUrl }}
          style={styles.media}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
          onError={(error) => {
            console.error('Erro ao carregar vídeo:', error);
            setVideoError(true);
          }}
        />
      );
    }
    
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.media,
          Platform.OS === 'web' && {
            // @ts-ignore - CSS específico para web
            objectFit: 'cover',
          },
        ]}
        resizeMode="cover"
        onError={(error) => {
          console.error('Erro ao carregar imagem:', error);
          setHasError(true);
        }}
      />
    );
  };
  
  const containerStyle = {
    width: bannerWidth,
    height: bannerHeight,
    backgroundColor,
    borderRadius,
    marginHorizontal,
    marginVertical,
  };
  
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[styles.container, containerStyle]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    maxWidth: Platform.OS === 'web' ? 768 : undefined,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ResponsiveBanner;

