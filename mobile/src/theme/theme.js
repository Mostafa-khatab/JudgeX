// JudgeX Mobile Theme
// Design tokens matching Figma design

export const colors = {
  // Backgrounds
  background: '#0D1117',
  cardBackground: '#161B22',
  inputBackground: '#21262D',
  
  // Primary
  primary: '#00D9FF',
  primaryDark: '#00B8D9',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  
  // Borders
  border: '#30363D',
  inputBorder: '#30363D',
  
  // Status colors
  success: '#3FB950',
  error: '#F85149',
  warning: '#D29922',
  
  // Accent colors (for logo)
  accentRed: '#FF6B6B',
  accentYellow: '#FFD93D',
  accentBlue: '#6BCB77',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    hero: 40,
  },
  // Font weights
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export default theme;
