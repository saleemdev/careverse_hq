/**
 * Responsive Style Constants
 * Reusable style functions for consistent responsive behavior
 */

import { CSSProperties } from 'react';

export const responsiveContainerStyle = (isMobile: boolean, isTablet: boolean): CSSProperties => ({
  padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
  background: 'var(--bg-secondary)',
  minHeight: 'calc(100vh - 64px)',
});

export const responsiveCardPadding = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? '12px' : '20px',
});

export const responsiveHeaderStyle = (isMobile: boolean): CSSProperties => ({
  marginBottom: isMobile ? '16px' : '24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: isMobile ? 'flex-start' : 'center',
  flexDirection: isMobile ? 'column' : 'row',
  gap: isMobile ? '12px' : '16px',
});

export const responsiveSearchWidth = (isMobile: boolean, isTablet: boolean): number | string => {
  if (isMobile) return '100%';
  if (isTablet) return 200;
  return 250;
};

export const responsiveGutter = (isMobile: boolean): [number, number] =>
  isMobile ? [8, 16] : [16, 16];

export const responsiveColSpan = {
  fullWidth: { xs: 24, sm: 24, md: 24, lg: 24 },
  half: { xs: 24, sm: 12, md: 12, lg: 12 },
  third: { xs: 24, sm: 12, md: 8, lg: 8 },
  quarter: { xs: 24, sm: 12, md: 12, lg: 6 },
};
