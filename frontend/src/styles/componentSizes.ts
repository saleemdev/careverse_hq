/**
 * Component Sizing System
 * Standardized sizes for consistent UI components across all devices
 */

export const KPI_CARD_SIZES = {
  iconContainer: { mobile: 48, tablet: 52, desktop: 56 },
  iconSize: { mobile: 20, tablet: 22, desktop: 24 },
  valueSize: { mobile: 28, tablet: 30, desktop: 32 },
  titleSize: { mobile: 11, tablet: 12, desktop: 13 },
  padding: { mobile: 16, tablet: 18, desktop: 20 },
} as const;

export const BUTTON_SIZES = {
  small: { mobile: 'small', tablet: 'small', desktop: 'middle' },
  medium: { mobile: 'middle', tablet: 'middle', desktop: 'large' },
  large: { mobile: 'middle', tablet: 'large', desktop: 'large' },
} as const;

export const CARD_PADDING = {
  small: { mobile: 12, tablet: 16, desktop: 16 },
  medium: { mobile: 16, tablet: 20, desktop: 20 },
  large: { mobile: 20, tablet: 24, desktop: 24 },
} as const;

export const ICON_SIZES = {
  small: { mobile: 16, tablet: 18, desktop: 18 },
  medium: { mobile: 20, tablet: 22, desktop: 24 },
  large: { mobile: 24, tablet: 28, desktop: 32 },
  xlarge: { mobile: 28, tablet: 32, desktop: 40 },
} as const;

export const TABLE_SIZES = {
  fontSize: { mobile: 12, tablet: 13, desktop: 14 },
  padding: { mobile: 8, tablet: 12, desktop: 16 },
  rowHeight: { mobile: 48, tablet: 56, desktop: 64 },
} as const;

export const AVATAR_SIZES = {
  small: { mobile: 32, tablet: 36, desktop: 40 },
  medium: { mobile: 40, tablet: 48, desktop: 56 },
  large: { mobile: 56, tablet: 64, desktop: 72 },
} as const;
