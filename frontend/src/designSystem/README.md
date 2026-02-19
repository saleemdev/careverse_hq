# 🎨 CareVerse HQ Design System

This directory contains the complete design system context and utilities for the CareVerse HQ React application.

## 📚 Files Overview

| File | Purpose |
|------|---------|
| **context.ts** | Complete design tokens and utility functions (export this!) |
| **index.ts** | Main export barrel - imports from context |
| **types.ts** | TypeScript type definitions for design system |
| **COMPONENT_TEMPLATES.md** | Ready-to-use component templates following design patterns |
| **README.md** | This file |

## 🚀 Quick Start

### Import Design System

```tsx
// Method 1: Import everything (recommended)
import { DESIGN_SYSTEM as DS } from '@/designSystem';

// Method 2: Import specific exports
import { COLORS, SPACING, createHoverLift } from '@/designSystem';

// Method 3: Import utilities
import { getResponsiveValue, createGlassmorphic } from '@/designSystem/context';
```

### Use in Components

```tsx
const MyComponent = () => {
  return (
    <div style={{
      padding: DS.SPACING.lg,                    // 24px
      borderRadius: `${DS.BORDER_RADIUS.lg}px`, // 12px
      background: DS.COLORS.light.bgPrimary,
      color: DS.COLORS.light.textPrimary,
      boxShadow: DS.SHADOWS.md,
      transition: `all ${DS.TRANSITIONS.base}`,
    }}>
      Content
    </div>
  );
};
```

## 📖 What's Available

### Colors

```ts
DS.COLORS.primary           // #1890ff
DS.COLORS.success           // #52c41a
DS.COLORS.warning           // #faad14
DS.COLORS.error             // #ff4d4f
DS.COLORS.info              // #13c2c2

// Gradients
DS.COLORS.gradientPrimary   // Blue → Purple
DS.COLORS.gradientSecondary // Purple → Purple
DS.COLORS.gradientSuccess   // Teal → Blue
DS.COLORS.gradientWarm      // Pink → Red

// Light Mode
DS.COLORS.light.bgPrimary   // #ffffff
DS.COLORS.light.textPrimary // #262626

// Dark Mode
DS.COLORS.dark.bgPrimary    // #1f1f1f
DS.COLORS.dark.textPrimary  // #ffffff
```

### Typography

```ts
// Font sizes
DS.TYPOGRAPHY.sizes.xs      // 11px
DS.TYPOGRAPHY.sizes.base    // 14px
DS.TYPOGRAPHY.sizes.xxxl    // 32px

// Font weights
DS.TYPOGRAPHY.weights.light     // 300
DS.TYPOGRAPHY.weights.bold      // 700

// Presets
DS.TYPOGRAPHY.presets.title       // { fontSize: 32, fontWeight: 700 }
DS.TYPOGRAPHY.presets.kpiValue    // { fontSize: 32, fontWeight: 700 }
DS.TYPOGRAPHY.presets.kpiLabel    // { fontSize: 13, fontWeight: 500, uppercase }
DS.TYPOGRAPHY.presets.body        // { fontSize: 14, fontWeight: 400 }
```

### Spacing

```ts
DS.SPACING.xs   // 4px
DS.SPACING.sm   // 8px
DS.SPACING.md   // 16px (most common)
DS.SPACING.lg   // 24px
DS.SPACING.xl   // 32px
DS.SPACING.xxl  // 48px

// Responsive spacing
DS.SPACING_RESPONSIVE.md.mobile    // 12px
DS.SPACING_RESPONSIVE.md.tablet    // 16px
DS.SPACING_RESPONSIVE.md.desktop   // 16px
```

### Shadows

```ts
DS.SHADOWS.sm      // Subtle
DS.SHADOWS.md      // Normal (most used)
DS.SHADOWS.lg      // Emphasized
DS.SHADOWS.xl      // Strong
DS.SHADOWS.primary // Primary color shadow
```

### Transitions & Animations

```ts
DS.TRANSITIONS.fast    // 0.15s ease
DS.TRANSITIONS.base    // 0.25s ease (most common)
DS.TRANSITIONS.slow    // 0.4s ease

DS.ANIMATIONS.fadeIn.name      // 'fadeIn'
DS.ANIMATIONS.slideIn.duration // 300ms
DS.ANIMATIONS.pulse.name       // 'pulse'
```

### Border Radius

```ts
DS.BORDER_RADIUS.sm    // 4px
DS.BORDER_RADIUS.md    // 8px
DS.BORDER_RADIUS.lg    // 12px (most used)
DS.BORDER_RADIUS.xl    // 16px
DS.BORDER_RADIUS.round // 50%
```

### Responsive Breakpoints

```ts
DS.BREAKPOINTS.mobile      // 768px
DS.BREAKPOINTS.tablet      // 1024px
DS.BREAKPOINTS.desktop     // 1440px

DS.MEDIA_QUERIES.mobile    // @media (max-width: 767px)
DS.MEDIA_QUERIES.tablet    // @media (min-width: 768px) and (max-width: 1023px)
DS.MEDIA_QUERIES.desktop   // @media (min-width: 1440px)
```

## 🛠️ Utility Functions

### createHoverLift(distance?)

Create a hover effect that lifts elements up.

```tsx
import { createHoverLift } from '@/designSystem';

<div style={createHoverLift(4)}>
  Hover me - lifts 4px up
</div>
```

### createGlassmorphic(tier, isDarkMode?)

Create glassmorphic (frosted glass) effect.

```tsx
import { createGlassmorphic } from '@/designSystem';

<Card style={createGlassmorphic('premium', isDarkMode)}>
  Glassmorphic card
</Card>
```

### getResponsiveValue(values, device)

Get responsive value for current device.

```tsx
import { getResponsiveValue } from '@/designSystem';

const columns = getResponsiveValue(
  { mobile: 1, tablet: 2, desktop: 4 },
  breakpoint
);
```

### getApprovalCardGradient(type)

Get gradient for approval card types.

```tsx
const gradient = getApprovalCardGradient('purchase-orders');
// Returns: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, ...)'
```

### getApprovalCardBorderColor(type)

Get border color for approval cards.

```tsx
const borderColor = getApprovalCardBorderColor('expense-claims');
// Returns: 'rgba(245, 87, 108, 0.2)'
```

## 📝 Component Patterns

### KPI Card Pattern

```tsx
import { Card } from 'antd';
import { DS } from '@/designSystem';

<Card style={{
  borderRadius: `${DS.BORDER_RADIUS.lg}px`,
  boxShadow: DS.SHADOWS.md,
  padding: DS.SPACING.lg,
  transition: `all ${DS.TRANSITIONS.base}`,
}}>
  {/* Content */}
</Card>
```

### Section Header Pattern

```tsx
<div style={DS.COMPONENT_PATTERNS.sectionHeader}>
  <div style={{
    width: 40,
    height: 40,
    borderRadius: '10px',
    background: DS.COLORS.gradientSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  }}>
    <IconComponent />
  </div>
  <h2>Section Title</h2>
</div>
```

### Approval Card Pattern

```tsx
import { getApprovalCardGradient } from '@/designSystem';

<Card style={{
  background: getApprovalCardGradient('purchase-orders'),
  borderRadius: '10px',
  padding: DS.SPACING.lg,
  transition: `all ${DS.TRANSITIONS.base}`,
}}>
  {/* Content */}
</Card>
```

## 🌓 Dark Mode Support

All colors automatically adapt to dark mode when `data-theme="dark"` is set on the root element.

```tsx
// Light mode (default)
DS.COLORS.light.bgPrimary  // #ffffff

// Dark mode (automatic)
DS.COLORS.dark.bgPrimary   // #1f1f1f

// Or use CSS variables (automatic)
background: 'var(--bg-primary)'  // Adapts automatically
color: 'var(--text-primary)'     // Adapts automatically
```

## 📱 Responsive Design

### Using useResponsive Hook

```tsx
import { useResponsive } from '@/hooks/useResponsive';

const MyComponent = () => {
  const { isMobile, isTablet, isDesktop, getResponsiveValue } = useResponsive();

  // Method 1: Conditional rendering
  if (isMobile) return <MobileLayout />;
  if (isTablet) return <TabletLayout />;
  return <DesktopLayout />;

  // Method 2: Get value
  const cols = getResponsiveValue({
    mobile: 1,
    tablet: 2,
    desktop: 4,
  });
};
```

### Responsive Grid

```tsx
<Row gutter={[DS.SPACING.md, DS.SPACING.md]}>
  <Col xs={24} sm={12} lg={6}>
    {/* Full width mobile, half tablet, 1/4 desktop */}
  </Col>
</Row>
```

## 📖 Full Documentation

For complete documentation including:
- Design philosophy and principles
- Detailed color system explanations
- Typography guidelines
- Layout systems and diagrams
- Animation guidelines
- Accessibility considerations
- Implementation best practices

**See:** `../../UIUX.md`

## 📋 Component Templates

Ready-to-use component templates for:
- Basic responsive components
- KPI cards
- Responsive grids
- Dark mode aware components
- Glassmorphic cards
- Responsive tables
- Section headers
- Approval cards

**See:** `./COMPONENT_TEMPLATES.md`

## 🎯 Usage Examples

### Example 1: Simple Card

```tsx
import { Card } from 'antd';
import { DS } from '@/designSystem';

<Card style={{
  padding: DS.SPACING.lg,
  borderRadius: `${DS.BORDER_RADIUS.lg}px`,
  boxShadow: DS.SHADOWS.md,
}}>
  Content
</Card>
```

### Example 2: Responsive Button

```tsx
import { Button } from 'antd';
import { useResponsive } from '@/hooks/useResponsive';
import { DS } from '@/designSystem';

const padding = getResponsiveValue({
  mobile: DS.SPACING.md,
  desktop: DS.SPACING.lg,
}, breakpoint);

<Button style={{ padding }}>Click me</Button>
```

### Example 3: Dark Mode Aware

```tsx
import { DS } from '@/designSystem';

const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
const colors = isDarkMode ? DS.COLORS.dark : DS.COLORS.light;

<div style={{ color: colors.textPrimary }}>
  Adapts to dark mode
</div>
```

## 🔍 Key Variables to Remember

Most commonly used values:

```tsx
// Padding
DS.SPACING.md      // 16px
DS.SPACING.lg      // 24px

// Border radius
DS.BORDER_RADIUS.lg  // 12px

// Shadow
DS.SHADOWS.md      // Subtle
DS.SHADOWS.lg      // Emphasized

// Color
DS.COLORS.primary  // #1890ff
DS.COLORS.light.bgPrimary  // #ffffff

// Transition
DS.TRANSITIONS.base  // 0.25s ease

// Grid
Column grid: xs={24} sm={12} lg={6}
Gap: [DS.SPACING.md, DS.SPACING.md]
```

## 🚨 Common Mistakes to Avoid

❌ Don't use magic numbers - use design tokens
```tsx
// Bad
padding: 24
// Good
padding: DS.SPACING.lg
```

❌ Don't hardcode colors - use design system or CSS vars
```tsx
// Bad
color: '#262626'
// Good
color: DS.COLORS.light.textPrimary
// Or
color: 'var(--text-primary)'  // Adapts to dark mode
```

❌ Don't duplicate responsive logic - use useResponsive hook
```tsx
// Bad
if (window.innerWidth < 768) { /* ... */ }
// Good
const { isMobile } = useResponsive();
```

❌ Don't create components without checking templates
```tsx
// Check COMPONENT_TEMPLATES.md first!
```

## 📞 Support

- **Full Documentation:** See `UIUX.md`
- **Component Examples:** See `COMPONENT_TEMPLATES.md`
- **Type Definitions:** See `types.ts`
- **Token Definitions:** See `context.ts`

---

**Last Updated:** 2026-02-19
**Framework:** React 19 + TypeScript + Ant Design v5.29.3
