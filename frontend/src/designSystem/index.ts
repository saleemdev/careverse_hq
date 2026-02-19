/**
 * CareVerse HQ Design System - Main Export
 *
 * Quick import for all design tokens and utilities:
 * import { DESIGN_SYSTEM, createHoverLift, getResponsiveValue } from '@/designSystem'
 *
 * Full documentation: ../../UIUX.md
 * Component templates: ./COMPONENT_TEMPLATES.md
 */

export {
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
  DESIGN_SYSTEM,
  getResponsiveSpacing,
  cssVar,
  createHoverLift,
  createGlassmorphic,
  getResponsiveValue,
  getApprovalCardGradient,
  getApprovalCardBorderColor,
} from './context';

export type {
  Breakpoint,
  SpacingSize,
  FontSize,
  FontWeight,
  BorderRadius,
  ShadowSize,
  TransitionSpeed,
  ComponentWidth,
  GlassmorphicTier,
  ApprovalCardType,
  ResponsiveValue,
  ColorPalette,
  SemanticColors,
  TypographyPreset,
  HoverEffect,
  ComponentStyle,
} from './types';
