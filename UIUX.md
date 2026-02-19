# CareVerse HQ - UI/UX Design System Documentation

Complete guide for the CareVerse HQ React dashboard design system. Use this to understand, maintain, and replicate patterns across other React applications.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Patterns](#component-patterns)
6. [Responsive Design](#responsive-design)
7. [Animations & Transitions](#animations--transitions)
8. [Dark Mode System](#dark-mode-system)
9. [Component Library Integration](#component-library-integration)
10. [Implementation Patterns](#implementation-patterns)

---

## Design Philosophy

### Core Principles

**1. Executive Dashboard Aesthetic**
- Clean, professional interface designed for C-suite executives and administrators
- Focus on KPIs, metrics, and actionable insights
- Minimalist visual approach with purposeful use of color and typography

**2. Data-Centric Design**
- Emphasize information hierarchy clearly
- Use progressive disclosure (show key metrics, detailed views on demand)
- Mobile-first responsive design - content adapts gracefully to all screens

**3. Premium Glassmorphic Design**
- Modern frosted glass effects with backdrop blur
- Layered depth through shadows and transparency
- Professional, contemporary feel

**4. Accessibility First**
- WCAG AA compliant color contrasts
- Keyboard navigation throughout
- Dark/Light mode support for all users
- Semantic HTML and ARIA labels

**5. Consistency**
- Single source of truth for all design tokens
- Centralized theme configuration in Ant Design ConfigProvider
- Responsive design tokens scale automatically across devices

---

## Color System

### Base Color Palette

```typescript
// Light Mode (Default)
--color-primary:       #1890ff  // Primary blue - used for CTAs, highlights
--color-primary-light: #40a9ff  // Hover/light variant
--color-primary-dark:  #096dd9  // Active/dark variant

--color-success:  #52c41a  // Green - success states, confirmations
--color-warning:  #faad14  // Orange - warnings, cautions
--color-error:    #ff4d4f  // Red - errors, deletions
--color-info:     #13c2c2  // Cyan - informational states

// Gradients (135deg diagonal)
--gradient-primary:   linear-gradient(135deg, #1890ff 0%, #722ed1 100%)      // Blue → Purple
--gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)      // Purple → Darker Purple
--gradient-success:   linear-gradient(135deg, #36d1c4 0%, #5b86e5 100%)      // Teal → Blue
--gradient-warm:      linear-gradient(135deg, #f093fb 0%, #f5576c 100%)      // Pink → Red
```

### Light Mode Semantic Colors

```typescript
--bg-primary:       #ffffff   // Main backgrounds, cards
--bg-secondary:     #f5f7fa   // Page backgrounds, secondary surfaces
--bg-tertiary:      #fafafa   // Tertiary surfaces, subtle backgrounds

--text-primary:     #262626   // Main text, high contrast
--text-secondary:   #595959   // Secondary text, descriptions
--text-tertiary:    #8c8c8c   // Tertiary text, labels, hints

--border-color:     #e8e8e8   // Main borders
--border-color-light: #f0f0f0  // Subtle borders
```

### Dark Mode Semantic Colors

Apply via `[data-theme='dark']` selector:

```typescript
[data-theme='dark'] {
  --bg-primary:       #1f1f1f   // Main backgrounds
  --bg-secondary:     #141414   // Page backgrounds
  --bg-tertiary:      #262626   // Tertiary surfaces

  --text-primary:     #ffffff   // Main text
  --text-secondary:   #a6a6a6   // Secondary text
  --text-tertiary:    #737373   // Tertiary text

  --border-color:     #303030   // Main borders
  --border-color-light: #424242  // Subtle borders
}
```

### Color Usage Guidelines

| Color | Primary Use | Secondary Use |
|-------|------------|---------------|
| **Primary Blue** (#1890ff) | Primary buttons, links, active states | Highlights, focus indicators |
| **Success Green** (#52c41a) | Completed tasks, approved items | Status indicators |
| **Warning Orange** (#faad14) | Pending items, warnings | Alerts, cautions |
| **Error Red** (#ff4d4f) | Errors, deletions, failures | Danger actions |
| **Info Cyan** (#13c2c2) | Information, notifications | Status updates |
| **Gradients** | Section headers, card backgrounds | Interactive elements, emphasis |

### Approval Card Gradients

```typescript
// Color-coded approval types
.approval-card.purchase-orders {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-color: rgba(102, 126, 234, 0.2);  // Purple tint
}

.approval-card.expense-claims {
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.08) 0%, rgba(245, 87, 108, 0.08) 100%);
  border-color: rgba(245, 87, 108, 0.2);   // Pink tint
}

.approval-card.material-requests {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.08) 0%, rgba(0, 242, 254, 0.08) 100%);
  border-color: rgba(0, 242, 254, 0.2);    // Cyan tint
}
```

---

## Typography

### Font Family

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               'Helvetica Neue', Arial, sans-serif;
```

**Inter Font** - Modern, geometric sans-serif with excellent readability
- Imported from Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700`
- Font weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Font Size Scale

```typescript
// 7-tier responsive font scale
--font-size-xs:    11px   // Smallest labels, hints
--font-size-sm:    12px   // Small text, captions
--font-size-base:  14px   // Body text, default
--font-size-lg:    16px   // Larger body text
--font-size-xl:    20px   // Subheadings
--font-size-xxl:   24px   // Section headers
--font-size-xxxl:  32px   // Page titles
```

### Responsive Font Sizing

```typescript
// Fonts scale by device:
FONT_SIZE_RESPONSIVE = {
  xs:    { mobile: 10px,  tablet: 11px,  desktop: 11px  },
  sm:    { mobile: 11px,  tablet: 12px,  desktop: 12px  },
  base:  { mobile: 13px,  tablet: 14px,  desktop: 14px  },
  lg:    { mobile: 14px,  tablet: 16px,  desktop: 16px  },
  xl:    { mobile: 18px,  tablet: 20px,  desktop: 20px  },
  xxl:   { mobile: 22px,  tablet: 24px,  desktop: 24px  },
  xxxl:  { mobile: 28px,  tablet: 32px,  desktop: 32px  },
}
```

### Typography Components

```typescript
// Ant Design Typography tokens in App.tsx
fontSize: 13px          // Base
fontSizeLG: 15px       // Large variant
fontSizeXL: 18px       // Extra large variant

// Ant Design ConfigProvider
fontSize: 13
controlHeight: 30      // Regular buttons
controlHeightLG: 36    // Large buttons
```

### Font Weight Guidelines

| Weight | Use Case |
|--------|----------|
| **300 Light** | Decorative text, subtle emphasis |
| **400 Regular** | Body text, default content |
| **500 Medium** | Secondary headings, labels |
| **600 SemiBold** | Primary headings, buttons, emphasis |
| **700 Bold** | KPI values, critical information |

### Typography Examples

```tsx
// Page Title
<Title level={1} style={{ fontSize: '32px', fontWeight: 700 }}>
  Page Title
</Title>

// Section Header
<Title level={2} style={{ fontSize: '24px', fontWeight: 600, marginTop: '32px' }}>
  Section Header
</Title>

// KPI Value
<div className="kpi-value" style={{ fontSize: '32px', fontWeight: 700 }}>
  1,234
</div>

// KPI Label
<div className="kpi-title" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
  Total Items
</div>

// Body Text
<Text style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
  Description or body content goes here
</Text>
```

---

## Spacing & Layout

### Spacing Scale

```typescript
// 6-tier spacing system (4px base unit)
--spacing-xs:   4px    // Tight spacing
--spacing-sm:   8px    // Compact spacing
--spacing-md:   16px   // Normal spacing
--spacing-lg:   24px   // Generous spacing
--spacing-xl:   32px   // Large spacing
--spacing-xxl:  48px   // Extra large spacing
```

### Responsive Spacing

```typescript
// Spacing adapts to device size
SPACING_RESPONSIVE = {
  xs:  { mobile: 4px,   tablet: 4px,   desktop: 4px   },
  sm:  { mobile: 8px,   tablet: 8px,   desktop: 8px   },
  md:  { mobile: 12px,  tablet: 16px,  desktop: 16px  },  // Note: tighter on mobile
  lg:  { mobile: 16px,  tablet: 24px,  desktop: 24px  },
  xl:  { mobile: 24px,  tablet: 32px,  desktop: 32px  },
  xxl: { mobile: 32px,  tablet: 48px,  desktop: 48px  },
}
```

### Border Radius Scale

```typescript
// 4 tiers + round
--radius-sm:    4px     // Subtle rounding (inputs, small cards)
--radius-md:    8px     // Default rounding (buttons, cards)
--radius-lg:    12px    // Prominent rounding (large cards)
--radius-xl:    16px    // Subtle rounding (modals, drawers)
--radius-round:  50%    // Circular (avatars, badges)
```

### Layout System

#### Desktop Layout (1024px+)

```
┌─────────────────────────────────────┐
│  HEADER (Fixed, 64px tall)          │
├─────────┬──────────────────────────┤
│ SIDEBAR │   CONTENT AREA            │
│ 260px   │   (responsive grid)      │
│         │                           │
│         │   - KPI Cards (4 column)  │
│         │   - Tables (full width)   │
│         │   - Charts (responsive)   │
└─────────┴──────────────────────────┘
```

#### Tablet Layout (768px - 1023px)

```
┌─────────────────────────────────┐
│  HEADER with Menu Toggle        │
├─┬───────────────────────────────┤
│S│   CONTENT AREA                │
│D│   - KPI Cards (2 column)      │
│B│   - Tables (card view)        │
│R│   - Sidebar auto-collapse     │
└─┴───────────────────────────────┘

SDB collapses to 80px (icon-only sidebar)
```

#### Mobile Layout (<768px)

```
┌─────────────────────────────────┐
│  HEADER with Drawer Toggle      │
├─────────────────────────────────┤
│   CONTENT AREA                  │
│   - KPI Cards (1-2 column)      │
│   - Tables (card view)          │
│   - Full-width inputs           │
│   - Drawer navigation           │
└─────────────────────────────────┘

Sidebar hidden, replaced with drawer
```

### Container Widths

```typescript
COMPONENT_WIDTHS = {
  searchInput:     { mobile: '100%',   tablet: 200px, desktop: 250px },
  drawer:          { mobile: '95%',    tablet: '80%', desktop: '75%' },
  sidebar:         { mobile: 280px,    tablet: 80px,  desktop: 260px },
  facilitySelector: { mobile: 180px,   tablet: 240px, desktop: 280px },
}
```

### Grid Layout

```tsx
// Desktop: 4-column grid
// Tablet: 2-column grid
// Mobile: 1-column grid

<Row gutter={[16, 16]}>  // 16px horizontal/vertical gap
  <Col xs={24} sm={12} lg={6}>
    <Card>KPI Card</Card>
  </Col>
  {/* Repeat 4 times for 4-column desktop layout */}
</Row>
```

---

## Component Patterns

### KPI Cards (Key Performance Indicator)

```typescript
.kpi-card {
  border-radius: var(--radius-lg);       // 12px rounded
  box-shadow: var(--shadow-md);          // 0 2px 8px rgba(0,0,0,0.08)
  border: none;
  transition: all var(--transition-base); // 0.25s ease
  padding: 20px;
}

.kpi-card:hover {
  transform: translateY(-4px);           // Lift up on hover
  box-shadow: var(--shadow-xl);          // Stronger shadow on hover
}

.kpi-icon {
  width: 56px;                           // Desktop icon size
  height: 56px;
  border-radius: var(--radius-lg);       // 12px rounded
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: var(--gradient-primary);   // Gradient background
  color: white;
}

.kpi-value {
  font-size: 32px;     // Large numbers
  font-weight: 700;    // Bold
  line-height: 1.1;
  margin-top: 8px;
  color: var(--text-primary);
}

.kpi-title {
  font-size: 13px;
  text-transform: uppercase;      // All caps
  letter-spacing: 0.5px;          // Tracking
  color: var(--text-tertiary);
  margin-top: 12px;
}
```

**Component sizing by device:**

```typescript
// Mobile variant
.kpi-icon:        { width: 48px, height: 48px, fontSize: 20px }
.kpi-value:       { fontSize: 28px }
.kpi-title:       { fontSize: 11px }

// Desktop variant
.kpi-icon:        { width: 56px, height: 56px, fontSize: 24px }
.kpi-value:       { fontSize: 32px }
.kpi-title:       { fontSize: 13px }
```

### Section Headers

```typescript
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 32px 0 20px;  // Spacing before/after
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--gradient-secondary);  // Purple gradient
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

// Adjacent text (h2 element)
<h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
  Section Title
</h2>
```

### Approval Cards

```typescript
.approval-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, ...);
  border-radius: 10px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  text-align: center;
  padding: 20px;
  cursor: pointer;
  transition: all var(--transition-base);
}

.approval-card:hover {
  transform: translateY(-2px);            // Subtle lift
  box-shadow: var(--shadow-lg);
  border-color: rgba(102, 126, 234, 0.4); // Stronger border
}
```

### Glassmorphic Cards

```typescript
// Premium glassmorphic background effect
backdrop-filter: blur(20px);
background: rgba(255, 255, 255, 0.8);  // Light mode
border: 1px solid rgba(255, 255, 255, 0.3);

// Dark mode variant
[data-theme='dark'] {
  background: rgba(31, 31, 31, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// Tiers by prominence:
// Premium:  blur(20px), rgba(255, 255, 255, 0.8)
// Standard: blur(16px), rgba(255, 255, 255, 0.6)
// Subtle:   blur(10px), rgba(255, 255, 255, 0.4)
```

### Buttons (Ant Design ConfigProvider)

```typescript
// Primary Button (Gradient)
<Button type="primary">Action</Button>

// Theme tokens override Ant Design buttons
colorPrimary: '#1890ff'    // Primary color
controlHeight: 30          // Regular height (30px)
controlHeightLG: 36        // Large height (36px)
borderRadius: 8            // 8px rounded
```

### Tables

```typescript
// Table customization via Ant Design theme token
fontSize: 13px             // Table font size
padding: 16px              // Cell padding
borderRadius: 10px         // Rounded table corners

// Row height: 48-64px depending on content density
// Uppercase headers for emphasis
// Responsive: Card view on mobile
```

### Input Fields

```typescript
// Via Ant Design theme tokens
borderRadius: 8px          // Rounded inputs
fontSize: 13px             // Input text size
controlHeight: 30          // Input height
```

---

## Responsive Design

### Breakpoints

```typescript
BREAKPOINTS = {
  mobile:  768,    // < 768px
  tablet:  1024,   // 768px - 1023px
  desktop: 1440,   // ≥ 1024px
}

// Defined as:
// Mobile:  < 768px
// Tablet:  768px - 1023px
// Desktop: ≥ 1024px
```

### Responsive Hook Usage

```tsx
import { useResponsive } from '@/hooks/useResponsive';

const MyComponent = () => {
  const { isMobile, isTablet, isDesktop, breakpoint, getResponsiveValue } = useResponsive();

  // Method 1: Conditional rendering
  return (
    <>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </>
  );

  // Method 2: Get responsive value
  const columns = getResponsiveValue({
    mobile: 1,
    tablet: 2,
    desktop: 4,
  });

  // Method 3: Check breakpoint
  const gridColumns = breakpoint === 'mobile' ? 1 : breakpoint === 'tablet' ? 2 : 4;
};
```

### Mobile-First Strategy

**Principle:** Start with mobile layout, enhance for larger screens

```tsx
<Col xs={24} sm={12} lg={8}>
  // xs={24}:  Full width on mobile (24/24)
  // sm={12}:  Half width on tablet (12/24)
  // lg={8}:   1/3 width on desktop (8/24)
</Col>
```

### Common Responsive Patterns

**Pattern 1: Responsive Grid**
```tsx
<Row gutter={[16, 16]}>  // Gap adapts
  <Col xs={24} sm={12} lg={6}>
    <Card>Item 1</Card>
  </Col>
  {/* ... 3 more for 4-column layout */}
</Row>
```

**Pattern 2: Show/Hide by Breakpoint**
```tsx
{!isMobile && <DesktopSidebar />}
{isMobile && <MobileDrawer />}
```

**Pattern 3: Responsive Typography**
```tsx
<Title
  level={isDesktop ? 1 : isMobile ? 3 : 2}
  style={{ fontSize: getResponsiveValue({ mobile: '24px', tablet: '28px', desktop: '32px' }) }}
>
  Title
</Title>
```

**Pattern 4: Responsive Component Widths**
```tsx
<Card style={{ width: getResponsiveValue({ mobile: '100%', tablet: '90%', desktop: '80%' }) }}>
  Content
</Card>
```

### Table to Card View Transformation (Mobile)

**Desktop:** DataTable with multiple columns
**Mobile:** Card-based view with key information emphasized

```tsx
{isMobile ? (
  <List
    dataSource={data}
    renderItem={(item) => (
      <Card style={{ marginBottom: '12px' }}>
        <Card.Meta
          title={item.name}
          description={item.description}
        />
      </Card>
    )}
  />
) : (
  <Table columns={columns} dataSource={data} />
)}
```

---

## Animations & Transitions

### Transition Speeds

```typescript
--transition-fast:  0.15s ease   // Quick feedback (hover, active)
--transition-base:  0.25s ease   // Standard animations
--transition-slow:  0.4s ease    // Longer animations
```

### Standard Animations

```typescript
// Fade In
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 300ms ease;

// Slide In
@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: slideIn 300ms ease;

// Pulse (infinite)
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
animation: pulse 2s ease infinite;
```

### Utility Classes

```css
.fade-in { animation: fadeIn 300ms ease; }
.slide-in { animation: slideIn 300ms ease; }
.pulse { animation: pulse 2s ease infinite; }
```

### Hover Effects

```typescript
// Card Hover - Lift effect
transform: translateY(-4px);     // Move up 4px
box-shadow: var(--shadow-xl);    // Enhance shadow

// Approval Card Hover - Subtle lift
transform: translateY(-2px);     // Move up 2px
box-shadow: var(--shadow-lg);    // Enhanced shadow

// Avatar Hover
transform: scale(1.05);          // 5% zoom

// Button Hover (via Ant Design)
// Primary buttons get opacity/shadow enhancement
```

### Transition Example

```tsx
<Card
  style={{
    transition: 'all 0.25s ease',  // Use --transition-base variable
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 'var(--shadow-xl)',
    }
  }}
>
  Content
</Card>
```

---

## Dark Mode System

### Implementation

**Trigger:** Data attribute on `<html>` or parent div

```tsx
// In App.tsx
const [isDarkMode, setIsDarkMode] = useState(false);

useEffect(() => {
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}, [isDarkMode]);

// Toggle button
<Button onClick={() => setIsDarkMode(!isDarkMode)}>
  {isDarkMode ? <SunOutlined /> : <MoonOutlined />}
</Button>
```

### CSS Variable Overrides

```css
/* Light Mode (default) */
:root {
  --bg-primary: #ffffff;
  --text-primary: #262626;
  --border-color: #e8e8e8;
}

/* Dark Mode */
[data-theme='dark'] {
  --bg-primary: #1f1f1f;
  --text-primary: #ffffff;
  --border-color: #303030;
}
```

### Dark Mode Color Adjustments

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background Primary | #ffffff | #1f1f1f |
| Background Secondary | #f5f7fa | #141414 |
| Background Tertiary | #fafafa | #262626 |
| Text Primary | #262626 | #ffffff |
| Text Secondary | #595959 | #a6a6a6 |
| Border | #e8e8e8 | #303030 |
| Scrollbar | #c1c1c1 | #4a4a4a |

### Ant Design Dark Mode

```typescript
// Ant Design ConfigProvider theme algorithm
import { theme } from 'antd';
const { darkAlgorithm, defaultAlgorithm } = theme;

<ConfigProvider
  theme={{
    algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      // Other tokens...
    },
  }}
>
  {/* App content */}
</ConfigProvider>
```

### Scrollbar Styling in Dark Mode

```css
/* Light mode scrollbar */
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
}

/* Dark mode scrollbar */
[data-theme='dark'] ::-webkit-scrollbar-thumb {
  background: #4a4a4a;
}
```

---

## Component Library Integration

### Ant Design v5.29.3 + Pro Components

```json
{
  "@ant-design/pro-components": "^2.8.10",
  "@ant-design/pro-table": "^3.21.0",
  "antd": "^5.29.3",
  "@ant-design/icons": "^5.6.1"
}
```

### ConfigProvider Setup

```tsx
import { ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';

<ConfigProvider
  locale={enUS}
  theme={{
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      // Colors
      colorPrimary: '#1890ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#13c2c2',

      // Typography
      fontSize: 13,
      fontSizeLG: 15,
      fontSizeXL: 18,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",

      // Sizes
      controlHeight: 30,
      controlHeightLG: 36,
      borderRadius: 8,

      // Shadows
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      boxShadowSecondary: '0 1px 3px rgba(0,0,0,0.05)',
    },
    components: {
      Layout: {
        headerBg: 'var(--bg-primary)',
        headerHeight: 64,
        siderBg: 'var(--bg-primary)',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: 'rgba(24, 144, 255, 0.1)',
        itemBorderRadius: 8,
      },
      Card: {
        borderRadiusLG: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      Button: {
        primaryColor: '#1890ff',
        controlHeight: 30,
        controlHeightLG: 36,
        borderRadius: 8,
      },
      // ... more component overrides
    },
  }}
>
  {children}
</ConfigProvider>
```

### Commonly Used Components

```tsx
// Layout
import { Layout, Menu, Button, Card, Form, Input, Table, Modal, Drawer } from 'antd';

// Icons (100+ icons used)
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';

// Pro Components
import { ProTable, ProForm, ProCard } from '@ant-design/pro-components';
```

---

## Implementation Patterns

### Project Structure

```
frontend/src/
├── styles/
│   ├── tokens.ts           // Design tokens
│   ├── responsive.ts       // Responsive utilities
│   └── componentSizes.ts   // Component sizing
├── hooks/
│   └── useResponsive.ts    // Responsive detection hook
├── components/
│   ├── AppLayout.tsx       // Main layout wrapper
│   ├── shared/             // Reusable components
│   └── modules/            // Feature modules
├── App.css                 // App-specific styles
├── index.css               // Global styles (design tokens)
└── main.tsx                // Entry point
```

### Adding New Components

**Step 1: Use Design Tokens**
```tsx
const MyComponent = () => {
  return (
    <div style={{
      padding: 'var(--spacing-lg)',      // 24px
      borderRadius: 'var(--radius-lg)',  // 12px
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-md)',
      transition: 'all var(--transition-base)',
    }}>
      Content
    </div>
  );
};
```

**Step 2: Make it Responsive**
```tsx
import { useResponsive } from '@/hooks/useResponsive';

const MyComponent = () => {
  const { isMobile, isTablet, getResponsiveValue } = useResponsive();

  const padding = getResponsiveValue({
    mobile: 'var(--spacing-md)',     // 12px
    tablet: 'var(--spacing-lg)',     // 24px
    desktop: 'var(--spacing-xl)',    // 32px
  });

  return <div style={{ padding }}>Content</div>;
};
```

**Step 3: Support Dark Mode**
```tsx
const MyComponent = () => {
  // CSS variables automatically adapt via [data-theme='dark']
  return (
    <div style={{
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    }}>
      Content
    </div>
  );
};
```

### Creating a New Module

1. **Create module directory**
   ```
   components/modules/new-feature/
   ├── NewFeatureListView.tsx
   ├── NewFeatureDetailView.tsx
   ├── components/
   │   ├── NewFeatureCard.tsx
   │   └── NewFeatureForm.tsx
   └── styles.css
   ```

2. **Use Ant Design + Design Tokens**
   ```tsx
   import { Card, Table, Button } from 'antd';
   import { useResponsive } from '@/hooks/useResponsive';

   export const NewFeatureListView: React.FC = () => {
     const { isMobile } = useResponsive();

     return (
       <div style={{
         padding: 'var(--spacing-lg)',
         background: 'var(--bg-secondary)',
       }}>
         {/* Content */}
       </div>
     );
   };
   ```

3. **Add module-specific styling** (if needed)
   ```css
   .new-feature-card {
     padding: var(--spacing-md);
     border-radius: var(--radius-lg);
     transition: all var(--transition-base);
   }

   .new-feature-card:hover {
     transform: translateY(-4px);
     box-shadow: var(--shadow-lg);
   }
   ```

### Theme Switching Integration

```tsx
// In App.tsx
const [isDarkMode, setIsDarkMode] = useState(false);

// Apply theme
useEffect(() => {
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}, [isDarkMode]);

// Ant Design theme integration
<ConfigProvider
  theme={{
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    // tokens...
  }}
>
  {children}
</ConfigProvider>

// Toggle button in header
<Button
  type="text"
  icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
  onClick={() => setIsDarkMode(!isDarkMode)}
/>
```

### Responsive Table Implementation

```tsx
import { Table, Card, List } from 'antd';
import { useResponsive } from '@/hooks/useResponsive';

const MyTable = () => {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <List
        dataSource={data}
        renderItem={(item) => (
          <Card
            style={{
              marginBottom: 'var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Card.Meta
              title={item.name}
              description={item.description}
            />
          </Card>
        )}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={data}
      style={{ borderRadius: 'var(--radius-lg)' }}
    />
  );
};
```

---

## Accessibility Considerations

### Color Contrast

- **WCAG AA Compliant**
  - Primary blue (#1890ff) on white (#ffffff): 4.5:1 contrast ratio ✓
  - Text colors meet 4.5:1 minimum for standard text

### Keyboard Navigation

- All interactive elements keyboard accessible
- Tab order follows visual hierarchy
- Escape key closes modals/drawers
- Enter key submits forms

### Semantic HTML

```tsx
// Use semantic HTML elements
<main> {/* Main content */} </main>
<header> {/* Header */} </header>
<nav> {/* Navigation */} </nav>
<section> {/* Content sections */} </section>

// Use ARIA labels
<button aria-label="Toggle dark mode">
  {isDarkMode ? <SunOutlined /> : <MoonOutlined />}
</button>

<div role="status" aria-live="polite">
  {/* Status messages */}
</div>
```

### Focus Indicators

- Default browser focus visible via Ant Design
- Custom focus styles override default browser styles minimally
- High contrast focus indicators (minimum 3:1 contrast)

---

## Quick Reference Cheat Sheet

### Most Used Values

```typescript
// Spacing
Gap/Padding: var(--spacing-md)   // 16px (most common)
Section padding: var(--spacing-lg) // 24px

// Border Radius
Cards/Buttons: var(--radius-lg)   // 12px (or 8px)
Inputs: var(--radius-md)           // 8px

// Shadows
Normal: var(--shadow-md)           // Subtle
Hover: var(--shadow-lg)            // Emphasized

// Colors
Primary action: var(--color-primary)      // #1890ff
Success: var(--color-success)             // #52c41a
Warning: var(--color-warning)             // #faad14
Error: var(--color-error)                 // #ff4d4f

// Text
Headers: font-weight: 600-700
Body: font-weight: 400

// Transitions
All interactive: transition: all var(--transition-base);
```

### Device Breakpoints

```
Mobile:  < 768px   (phones)
Tablet:  768-1023px (tablets, small laptops)
Desktop: ≥ 1024px  (desktops, large screens)
```

### Component Grid Layout

```
Desktop:  4 columns  (Col lg={6})
Tablet:   2 columns  (Col sm={12})
Mobile:   1 column   (Col xs={24})
```

---

## File References

- **Global Styles:** `/frontend/src/index.css` (502 lines)
- **App Styles:** `/frontend/src/App.css` (430 lines)
- **Design Tokens:** `/frontend/src/styles/tokens.ts`
- **Responsive Hook:** `/frontend/src/hooks/useResponsive.ts`
- **Main Config:** `/frontend/src/App.tsx`
- **Ant Design Config:** ConfigProvider in `App.tsx` (lines 140+)

---

## Design System Evolution

This design system can be extended by:

1. **Adding new color tokens** - Update both light and dark mode CSS variables
2. **Creating new component patterns** - Add to `App.css` with consistent naming
3. **Adjusting breakpoints** - Modify `BREAKPOINTS` in `tokens.ts` if needed
4. **Enhancing animations** - Add new `@keyframes` to `index.css`
5. **Component-specific tokens** - Use `componentSizes.ts` pattern for new features

---

**Version:** 1.0
**Last Updated:** 2026-02-19
**Framework:** React 19 + TypeScript + Ant Design v5.29.3 + Vite
