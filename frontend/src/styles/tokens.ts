/**
 * Design Token System for CareVerse HQ
 * Centralized responsive design values for consistent UI across all devices
 */

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

export const MEDIA_QUERIES = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
} as const;

export const SPACING_RESPONSIVE = {
  xs: { mobile: 4, tablet: 4, desktop: 4 },
  sm: { mobile: 8, tablet: 8, desktop: 8 },
  md: { mobile: 12, tablet: 16, desktop: 16 },
  lg: { mobile: 16, tablet: 24, desktop: 24 },
  xl: { mobile: 24, tablet: 32, desktop: 32 },
  xxl: { mobile: 32, tablet: 48, desktop: 48 },
} as const;

export const FONT_SIZE_RESPONSIVE = {
  xs: { mobile: 10, tablet: 11, desktop: 11 },
  sm: { mobile: 11, tablet: 12, desktop: 12 },
  base: { mobile: 13, tablet: 14, desktop: 14 },
  lg: { mobile: 14, tablet: 16, desktop: 16 },
  xl: { mobile: 18, tablet: 20, desktop: 20 },
  xxl: { mobile: 22, tablet: 24, desktop: 24 },
  xxxl: { mobile: 28, tablet: 32, desktop: 32 },
} as const;

export const COMPONENT_WIDTHS = {
  searchInput: { mobile: '100%', tablet: 200, desktop: 250 },
  drawer: { mobile: '95%', tablet: '80%', desktop: '75%' },
  sidebar: { mobile: 280, tablet: 80, desktop: 260 },
  facilitySelector: { mobile: 180, tablet: 240, desktop: 280 },
} as const;

// Type exports for TypeScript support
export type Breakpoint = keyof typeof BREAKPOINTS;
export type SpacingSize = keyof typeof SPACING_RESPONSIVE;
export type FontSize = keyof typeof FONT_SIZE_RESPONSIVE;
export type ComponentWidth = keyof typeof COMPONENT_WIDTHS;
