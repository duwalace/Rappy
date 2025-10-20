/**
 * Tema Global da Aplicação
 * Define cores, tipografia e espaçamentos responsivos
 */

import { 
  fontSize, 
  spacing, 
  borderRadius, 
  iconSize,
  screenWidth,
  isLargeDevice 
} from '../utils/responsive';

/**
 * Paleta de Cores
 */
export const colors = {
  // Cores Principais
  primary: '#EA1D2C',
  primaryLight: '#FF6B35',
  primaryDark: '#C41621',
  
  // Cores Secundárias
  secondary: '#4CAF50',
  secondaryLight: '#81C784',
  secondaryDark: '#388E3C',
  
  // Cores de Fundo
  background: '#F5F5F5',
  backgroundLight: '#FFFFFF',
  backgroundDark: '#E0E0E0',
  
  // Cores de Texto
  text: '#333333',
  textLight: '#666666',
  textLighter: '#999999',
  textDark: '#000000',
  textInverse: '#FFFFFF',
  
  // Cores de Estado
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Cores de Borda
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#CCCCCC',
  
  // Cores de Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Cores de Card
  card: '#FFFFFF',
  cardHover: '#F8F8F8',
  
  // Cores Especiais
  gold: '#FFB800',
  rating: '#FFA000',
  discount: '#FF5722',
};

/**
 * Tipografia Responsiva
 */
export const typography = {
  // Tamanhos de Fonte
  fontSize: {
    xs: fontSize.xs,
    sm: fontSize.sm,
    base: fontSize.base,
    md: fontSize.md,
    lg: fontSize.lg,
    xl: fontSize.xl,
    xxl: fontSize.xxl,
    xxxl: fontSize.xxxl,
    huge: fontSize.huge,
  },
  
  // Pesos de Fonte
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Altura de Linha
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

/**
 * Espaçamentos Responsivos
 */
export const layout = {
  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    xxl: spacing.xxl,
  },
  
  borderRadius: {
    xs: borderRadius.xs,
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    xl: borderRadius.xl,
    xxl: borderRadius.xxl,
    round: borderRadius.round,
  },
  
  iconSize: {
    xs: iconSize.xs,
    sm: iconSize.sm,
    md: iconSize.md,
    lg: iconSize.lg,
    xl: iconSize.xl,
    xxl: iconSize.xxl,
  },
  
  // Container Widths
  containerWidth: {
    full: '100%',
    content: isLargeDevice ? 1200 : screenWidth,
    narrow: isLargeDevice ? 900 : screenWidth,
    wide: isLargeDevice ? 1400 : screenWidth,
  },
};

/**
 * Sombras (Elevation)
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

/**
 * Estilos Comuns de Componentes
 */
export const components = {
  // Botões
  button: {
    height: spacing.xxl + spacing.md, // 48 + 16 = 64
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  buttonSmall: {
    height: spacing.xl + spacing.sm, // 32 + 8 = 40
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  
  // Inputs
  input: {
    height: spacing.xxl + spacing.md, // 48 + 16 = 64
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.md,
  },
  
  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  
  cardFlat: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Headers
  screenHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
  },
};

/**
 * Animações
 */
export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    linear: 'linear' as const,
    easeIn: 'ease-in' as const,
    easeOut: 'ease-out' as const,
    easeInOut: 'ease-in-out' as const,
  },
};

/**
 * Z-Index Layers
 */
export const zIndex = {
  base: 0,
  dropdown: 100,
  modal: 200,
  overlay: 300,
  toast: 400,
  tooltip: 500,
};

/**
 * Tema Completo
 */
const theme = {
  colors,
  typography,
  layout,
  shadows,
  components,
  animations,
  zIndex,
};

export default theme;

