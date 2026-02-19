/**
 * Design System Type Definitions
 * Used with design tokens for better TypeScript support
 */

import { BREAKPOINTS, SPACING_RESPONSIVE, TYPOGRAPHY } from './context';

export type Breakpoint = keyof typeof BREAKPOINTS;
export type SpacingSize = keyof typeof SPACING_RESPONSIVE;
export type FontSize = keyof typeof TYPOGRAPHY.sizes;
export type FontWeight = keyof typeof TYPOGRAPHY.weights;
export type BorderRadius = 'sm' | 'md' | 'lg' | 'xl' | 'round';
export type ShadowSize = 'sm' | 'md' | 'lg' | 'xl' | 'primary';
export type TransitionSpeed = 'fast' | 'base' | 'slow';
export type ComponentWidth = 'searchInput' | 'drawer' | 'sidebar' | 'facilitySelector';
export type GlassmorphicTier = 'premium' | 'standard' | 'subtle';
export type ApprovalCardType = 'purchase-orders' | 'expense-claims' | 'material-requests';

export interface ResponsiveValue<T = number | string> {
  mobile?: T;
  tablet?: T;
  desktop: T;
}

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface SemanticColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderColor: string;
  borderColorLight: string;
}

export interface TypographyPreset {
  fontSize: number;
  fontWeight: number;
  lineHeight?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
}

export interface HoverEffect {
  transform: string;
  boxShadow?: string;
  transition: string;
  cursor?: string;
}

export interface ComponentStyle {
  borderRadius: number | string;
  boxShadow?: string;
  padding?: number;
  transition?: string;
}
