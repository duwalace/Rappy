/**
 * Sistema de Responsividade
 * Utilitários para criar layouts responsivos em diferentes tamanhos de tela
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// Dimensões base para escala (iPhone 11 Pro como referência)
const WINDOW = Dimensions.get('window');
const SCREEN = Dimensions.get('screen');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Para web, limitar a largura máxima considerada para escala
const MAX_MOBILE_WIDTH = 768;

/**
 * Obtém as dimensões atuais da janela
 */
export const getWindowDimensions = () => {
  return Dimensions.get('window');
};

/**
 * Obtém as dimensões da tela
 */
export const getScreenDimensions = () => {
  return Dimensions.get('screen');
};

/**
 * Largura efetiva para cálculos (limitada em dispositivos web)
 */
const getEffectiveWidth = () => {
  if (Platform.OS === 'web' && WINDOW.width > MAX_MOBILE_WIDTH) {
    return MAX_MOBILE_WIDTH;
  }
  return WINDOW.width;
};

/**
 * Largura da tela
 */
export const screenWidth = WINDOW.width;

/**
 * Altura da tela
 */
export const screenHeight = WINDOW.height;

/**
 * Largura efetiva para escala
 */
const effectiveWidth = getEffectiveWidth();

/**
 * Escala horizontal baseada na largura (limitada para web)
 */
export const widthScale = effectiveWidth / BASE_WIDTH;

/**
 * Escala vertical baseada na altura
 */
export const heightScale = screenHeight / BASE_HEIGHT;

/**
 * Calcula a largura responsiva baseada em uma porcentagem
 * @param percentage - Porcentagem da largura (0-100)
 */
export const wp = (percentage: number): number => {
  // Para web em telas grandes, usar largura limitada
  const width = Platform.OS === 'web' && screenWidth > MAX_MOBILE_WIDTH 
    ? MAX_MOBILE_WIDTH 
    : screenWidth;
  return (width * percentage) / 100;
};

/**
 * Calcula a altura responsiva baseada em uma porcentagem
 * @param percentage - Porcentagem da altura (0-100)
 */
export const hp = (percentage: number): number => {
  return (screenHeight * percentage) / 100;
};

/**
 * Escala um valor baseado na largura da tela
 * Útil para fontes, margens, paddings
 * @param size - Tamanho base
 * @param factor - Fator de limitação (padrão 0.5)
 */
export const scale = (size: number, factor: number = 0.5): number => {
  // No web, se a escala for maior que 1.2, limitar para evitar elementos muito grandes
  const limitedScale = Platform.OS === 'web' && widthScale > 1.2 ? 1.2 : widthScale;
  return size + (limitedScale - 1) * size * factor;
};

/**
 * Escala vertical baseada na altura
 * @param size - Tamanho base
 * @param factor - Fator de limitação (padrão 0.5)
 */
export const verticalScale = (size: number, factor: number = 0.5): number => {
  return size + (heightScale - 1) * size * factor;
};

/**
 * Escala moderada que considera tanto largura quanto altura
 * @param size - Tamanho base
 * @param factor - Fator de limitação (padrão 0.5)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const avgScale = (widthScale + heightScale) / 2;
  return size + (avgScale - 1) * size * factor;
};

/**
 * Normaliza o tamanho da fonte baseado no tamanho da tela e densidade de pixels
 * @param size - Tamanho da fonte
 */
export const normalizeFont = (size: number): number => {
  const newSize = scale(size);
  if (Platform.OS === 'web') {
    // Na web, retornar o tamanho sem ajuste de pixel ratio
    return Math.round(newSize);
  } else if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Breakpoints para diferentes tamanhos de tela
 */
export const breakpoints = {
  smallPhone: 320,    // iPhone SE
  phone: 375,         // iPhone 11 Pro, iPhone X
  largePhone: 414,    // iPhone 11 Pro Max
  tablet: 768,        // iPad
  largeTablet: 1024,  // iPad Pro
  desktop: 1280,      // Desktop pequeno
  largeDesktop: 1920, // Desktop grande
};

/**
 * Verifica se é um dispositivo pequeno
 */
export const isSmallDevice = screenWidth < breakpoints.phone;

/**
 * Verifica se é um dispositivo de tamanho médio
 */
export const isMediumDevice = 
  screenWidth >= breakpoints.phone && 
  screenWidth < breakpoints.tablet;

/**
 * Verifica se é um tablet
 */
export const isTablet = 
  screenWidth >= breakpoints.tablet && 
  screenWidth < breakpoints.desktop;

/**
 * Verifica se é desktop/web
 */
export const isDesktop = screenWidth >= breakpoints.desktop;

/**
 * Verifica se é um dispositivo grande (tablet ou desktop)
 */
export const isLargeDevice = screenWidth >= breakpoints.tablet;

/**
 * Retorna o tipo de dispositivo
 */
export const getDeviceType = (): 'small' | 'medium' | 'tablet' | 'desktop' => {
  if (isSmallDevice) return 'small';
  if (isMediumDevice) return 'medium';
  if (isTablet) return 'tablet';
  return 'desktop';
};

/**
 * Espaçamentos responsivos padrão
 */
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

/**
 * Tamanhos de fonte responsivos
 */
export const fontSize = {
  xs: normalizeFont(10),
  sm: normalizeFont(12),
  base: normalizeFont(14),
  md: normalizeFont(16),
  lg: normalizeFont(18),
  xl: normalizeFont(20),
  xxl: normalizeFont(24),
  xxxl: normalizeFont(32),
  huge: normalizeFont(40),
};

/**
 * Raio de borda responsivo
 */
export const borderRadius = {
  xs: scale(2),
  sm: scale(4),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  xxl: scale(24),
  round: scale(999),
};

/**
 * Tamanhos de ícone responsivos
 */
export const iconSize = {
  xs: scale(12),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

/**
 * Utilitário para valores condicionais baseados no tamanho da tela
 */
export const responsiveValue = <T,>(values: {
  small?: T;
  medium?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  const deviceType = getDeviceType();
  
  if (deviceType === 'small' && values.small !== undefined) {
    return values.small;
  }
  if (deviceType === 'medium' && values.medium !== undefined) {
    return values.medium;
  }
  if (deviceType === 'tablet' && values.tablet !== undefined) {
    return values.tablet;
  }
  if (deviceType === 'desktop' && values.desktop !== undefined) {
    return values.desktop;
  }
  
  return values.default;
};

/**
 * Calcula o número de colunas baseado no tamanho da tela
 */
export const getNumColumns = (
  itemMinWidth: number = 150,
  gap: number = 16
): number => {
  const availableWidth = screenWidth - (gap * 2);
  const columns = Math.floor(availableWidth / (itemMinWidth + gap));
  return Math.max(1, columns);
};

/**
 * Calcula a largura de um item em um grid
 */
export const getGridItemWidth = (
  numColumns: number,
  gap: number = 16,
  padding: number = 32
): number => {
  const totalGap = gap * (numColumns - 1);
  const availableWidth = screenWidth - padding - totalGap;
  return availableWidth / numColumns;
};

/**
 * Dimensões máximas para conteúdo em telas grandes
 */
export const maxContentWidth = responsiveValue({
  desktop: 1200,
  tablet: 900,
  default: screenWidth,
});

/**
 * Padding horizontal baseado no tamanho da tela
 */
export const horizontalPadding = responsiveValue({
  small: spacing.md,
  medium: spacing.md,
  tablet: spacing.xl,
  desktop: spacing.xxl,
  default: spacing.md,
});

/**
 * Retorna estilos centralizados para conteúdo em telas grandes
 */
export const getCenteredContentStyle = () => {
  if (isLargeDevice) {
    return {
      alignSelf: 'center' as const,
      width: '100%',
      maxWidth: maxContentWidth,
    };
  }
  return {
    width: '100%',
  };
};

/**
 * Hook para ouvir mudanças de dimensão (para uso em componentes)
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = React.useState({
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setDimensions({ window, screen });
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...dimensions,
    width: dimensions.window.width,
    height: dimensions.window.height,
    isSmall: dimensions.window.width < breakpoints.phone,
    isMedium: dimensions.window.width >= breakpoints.phone && 
              dimensions.window.width < breakpoints.tablet,
    isTablet: dimensions.window.width >= breakpoints.tablet && 
              dimensions.window.width < breakpoints.desktop,
    isDesktop: dimensions.window.width >= breakpoints.desktop,
  };
};

// Importar React apenas se necessário para o hook
import * as React from 'react';

export default {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  normalizeFont,
  screenWidth,
  screenHeight,
  spacing,
  fontSize,
  borderRadius,
  iconSize,
  isSmallDevice,
  isMediumDevice,
  isTablet,
  isDesktop,
  isLargeDevice,
  getDeviceType,
  responsiveValue,
  getNumColumns,
  getGridItemWidth,
  maxContentWidth,
  horizontalPadding,
  getCenteredContentStyle,
  breakpoints,
};

