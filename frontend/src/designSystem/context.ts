/**
 * CareVerse HQ Design System Context
 * Complete reference for all design tokens and patterns
 *
 * Import this file for quick access to:
 * - Color tokens
 * - Typography scales
 * - Spacing system
 * - Animation values
 * - Component patterns
 *
 * See: ../../UIUX.md for complete documentation
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const COLORS = {
  // Base Palette
  primary: '#1890ff',
  primaryLight: '#40a9ff',
  primaryDark: '#096dd9',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#13c2c2',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
  gradientSecondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradientSuccess: 'linear-gradient(135deg, #36d1c4 0%, #5b86e5 100%)',
  gradientWarm: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',

  // Light Mode
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f7fa',
    bgTertiary: '#fafafa',
    textPrimary: '#262626',
    textSecondary: '#595959',
    textTertiary: '#8c8c8c',
    borderColor: '#e8e8e8',
    borderColorLight: '#f0f0f0',
  },

  // Dark Mode
  dark: {
    bgPrimary: '#1f1f1f',
    bgSecondary: '#141414',
    bgTertiary: '#262626',
    textPrimary: '#ffffff',
    textSecondary: '#a6a6a6',
    textTertiary: '#737373',
    borderColor: '#303030',
    borderColorLight: '#424242',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",

  // Font Sizes
  sizes: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  } as const,

  // Font Weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  } as const,

  // Line Heights
  lineHeights: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
  } as const,

  // Preset Styles (for quick use)
  presets: {
    title: {
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.1,
    },
    sectionHeader: {
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    kpiValue: {
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.1,
    },
    kpiLabel: {
      fontSize: 13,
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    body: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    small: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.5,
    },
  } as const,
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const SPACING_RESPONSIVE = {
  xs: { mobile: 4, tablet: 4, desktop: 4 },
  sm: { mobile: 8, tablet: 8, desktop: 8 },
  md: { mobile: 12, tablet: 16, desktop: 16 },
  lg: { mobile: 16, tablet: 24, desktop: 24 },
  xl: { mobile: 24, tablet: 32, desktop: 32 },
  xxl: { mobile: 32, tablet: 48, desktop: 48 },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: '50%',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
  md: '0 2px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.1)',
  xl: '0 8px 32px rgba(0, 0, 0, 0.12)',
  primary: '0 4px 14px rgba(24, 144, 255, 0.4)',
} as const;

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const TRANSITIONS = {
  fast: '0.15s ease',
  base: '0.25s ease',
  slow: '0.4s ease',
} as const;

export const ANIMATIONS = {
  fadeIn: {
    name: 'fadeIn',
    duration: 300,
    timing: 'ease',
  },
  slideIn: {
    name: 'slideIn',
    duration: 300,
    timing: 'ease',
  },
  pulse: {
    name: 'pulse',
    duration: 2000,
    timing: 'ease infinite',
  },
} as const;

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

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

// ============================================================================
// COMPONENT SIZING
// ============================================================================

export const COMPONENT_SIZING = {
  kpiIcon: {
    mobile: 48,
    tablet: 56,
    desktop: 56,
  },
  kpiValue: {
    mobile: 28,
    tablet: 32,
    desktop: 32,
  },
  avatar: {
    small: 32,
    medium: 48,
    large: 72,
  },
  button: {
    regular: 30,
    large: 36,
  },
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 40,
  },
} as const;

// ============================================================================
// GLASSMORPHISM PRESETS
// ============================================================================

export const GLASSMORPHISM = {
  premium: {
    backdrop: 'blur(20px)',
    bgLight: 'rgba(255, 255, 255, 0.8)',
    bgDark: 'rgba(31, 31, 31, 0.8)',
    border: 'rgba(255, 255, 255, 0.3)',
  },
  standard: {
    backdrop: 'blur(16px)',
    bgLight: 'rgba(255, 255, 255, 0.6)',
    bgDark: 'rgba(31, 31, 31, 0.6)',
    border: 'rgba(255, 255, 255, 0.2)',
  },
  subtle: {
    backdrop: 'blur(10px)',
    bgLight: 'rgba(255, 255, 255, 0.4)',
    bgDark: 'rgba(31, 31, 31, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

// ============================================================================
// COMPONENT PATTERNS
// ============================================================================

export const COMPONENT_PATTERNS = {
  kpiCard: {
    borderRadius: BORDER_RADIUS.lg,
    boxShadow: SHADOWS.md,
    padding: SPACING.lg,
    transition: `all ${TRANSITIONS.base}`,
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: SHADOWS.xl,
    },
  },
  approvalCard: {
    borderRadius: 10,
    padding: SPACING.lg,
    transition: `all ${TRANSITIONS.base}`,
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: SHADOWS.lg,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get responsive spacing value based on device
 * @param size - Size key from SPACING_RESPONSIVE
 * @param device - Device type ('mobile' | 'tablet' | 'desktop')
 * @returns Spacing value in pixels
 */
export function getResponsiveSpacing(
  size: keyof typeof SPACING_RESPONSIVE,
  device: 'mobile' | 'tablet' | 'desktop'
): number {
  return SPACING_RESPONSIVE[size][device];
}

/**
 * Generate CSS variable reference
 * @param name - Variable name
 * @returns CSS variable string
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Create a hover transform effect
 * @param distance - How many pixels to move up
 * @returns Transform object
 */
export function createHoverLift(distance: number = 4) {
  return {
    transform: `translateY(-${distance}px)`,
    transition: `all ${TRANSITIONS.base}`,
    cursor: 'pointer',
  };
}

/**
 * Create a glassmorphic effect
 * @param tier - 'premium' | 'standard' | 'subtle'
 * @param isDarkMode - Whether dark mode is active
 * @returns Style object
 */
export function createGlassmorphic(tier: 'premium' | 'standard' | 'subtle', isDarkMode: boolean = false) {
  const preset = GLASSMORPHISM[tier];
  return {
    backdropFilter: preset.backdrop,
    background: isDarkMode ? preset.bgDark : preset.bgLight,
    border: `1px solid ${preset.border}`,
  };
}

/**
 * Get responsive value based on device
 * Usage: getResponsiveValue({ mobile: '100%', desktop: '80%' })
 */
export function getResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop: T;
}, device: 'mobile' | 'tablet' | 'desktop'): T {
  if (device === 'mobile' && values.mobile !== undefined) return values.mobile;
  if (device === 'tablet' && values.tablet !== undefined) return values.tablet;
  return values.desktop;
}

/**
 * Create a color-coded gradient for approval cards
 * @param type - Type of approval card
 * @returns Gradient string
 */
export function getApprovalCardGradient(type: 'purchase-orders' | 'expense-claims' | 'material-requests'): string {
  const gradients = {
    'purchase-orders': 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
    'expense-claims': 'linear-gradient(135deg, rgba(240, 147, 251, 0.08) 0%, rgba(245, 87, 108, 0.08) 100%)',
    'material-requests': 'linear-gradient(135deg, rgba(79, 172, 254, 0.08) 0%, rgba(0, 242, 254, 0.08) 100%)',
  };
  return gradients[type];
}

/**
 * Get approval card border color
 * @param type - Type of approval card
 * @returns Border color rgba string
 */
export function getApprovalCardBorderColor(type: 'purchase-orders' | 'expense-claims' | 'material-requests'): string {
  const colors = {
    'purchase-orders': 'rgba(102, 126, 234, 0.2)',
    'expense-claims': 'rgba(245, 87, 108, 0.2)',
    'material-requests': 'rgba(0, 242, 254, 0.2)',
  };
  return colors[type];
}

// ============================================================================
// EXPORT COMPLETE DESIGN SYSTEM
// ============================================================================

export const DESIGN_SYSTEM = {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SPACING_RESPONSIVE,
  BORDER_RADIUS,
  SHADOWS,
  TRANSITIONS,
  ANIMATIONS,
  BREAKPOINTS,
  MEDIA_QUERIES,
  COMPONENT_SIZING,
  GLASSMORPHISM,
  COMPONENT_PATTERNS,
} as const;

export default DESIGN_SYSTEM;
