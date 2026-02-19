# Component Templates

Quick-start templates for creating new components following the CareVerse HQ design system.

**See: UIUX.md for complete design system documentation**

---

## Basic Responsive Component

```tsx
import { Card } from 'antd';
import { useResponsive } from '@/hooks/useResponsive';
import { DESIGN_SYSTEM as DS } from '@/designSystem/context';

interface MyComponentProps {
  title: string;
  children: React.ReactNode;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, children }) => {
  const { isMobile, getResponsiveValue } = useResponsive();

  const padding = getResponsiveValue({
    mobile: DS.SPACING.md,
    tablet: DS.SPACING.lg,
    desktop: DS.SPACING.lg,
  });

  return (
    <Card
      title={title}
      style={{
        borderRadius: `${DS.BORDER_RADIUS.lg}px`,
        padding,
        transition: `all ${DS.TRANSITIONS.base}`,
      }}
    >
      {children}
    </Card>
  );
};
```

---

## KPI Card Component

```tsx
import { Card, Tooltip } from 'antd';
import { useResponsive } from '@/hooks/useResponsive';
import { DESIGN_SYSTEM as DS, createHoverLift } from '@/designSystem/context';

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down';
}

export const KPICard: React.FC<KPICardProps> = ({ icon, title, value, unit, trend }) => {
  const { isMobile } = useResponsive();
  const iconSize = isMobile ? DS.COMPONENT_SIZING.kpiIcon.mobile : DS.COMPONENT_SIZING.kpiIcon.desktop;

  return (
    <Card
      className="kpi-card"
      style={{
        borderRadius: `${DS.BORDER_RADIUS.lg}px`,
        boxShadow: DS.SHADOWS.md,
        padding: DS.SPACING.lg,
        transition: `all ${DS.TRANSITIONS.base}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = 'translateY(-4px)';
        target.style.boxShadow = DS.SHADOWS.xl;
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = 'translateY(0)';
        target.style.boxShadow = DS.SHADOWS.md;
      }}
    >
      <div
        className="kpi-icon"
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: `${DS.BORDER_RADIUS.lg}px`,
          background: DS.COLORS.gradientPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
        }}
      >
        {icon}
      </div>

      <div style={{ marginTop: DS.SPACING.md }}>
        <div
          className="kpi-value"
          style={{
            fontSize: isMobile ? '28px' : '32px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {value}
          {unit && <span style={{ fontSize: '14px', marginLeft: '4px' }}>{unit}</span>}
        </div>

        <div
          className="kpi-title"
          style={{
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-tertiary)',
            marginTop: DS.SPACING.sm,
          }}
        >
          {title}
        </div>
      </div>
    </Card>
  );
};
```

---

## Responsive Grid Layout

```tsx
import { Row, Col, Card } from 'antd';
import { useResponsive } from '@/hooks/useResponsive';
import { DESIGN_SYSTEM as DS } from '@/designSystem/context';

export const ResponsiveGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useResponsive();

  return (
    <div style={{ padding: DS.SPACING.lg, background: 'var(--bg-secondary)' }}>
      <Row gutter={[DS.SPACING.md, DS.SPACING.md]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>Mobile: Full | Tablet: Half | Desktop: 1/4</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>Mobile: Full | Tablet: Half | Desktop: 1/4</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>Mobile: Full | Tablet: Half | Desktop: 1/4</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>Mobile: Full | Tablet: Half | Desktop: 1/4</Card>
        </Col>
      </Row>
    </div>
  );
};
```

---

## Dark Mode Aware Component

```tsx
import { useState, useEffect } from 'react';
import { Button, Card } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { DESIGN_SYSTEM as DS } from '@/designSystem/context';

export const DarkModeAwareComponent: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is already active
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setIsDarkMode(isDark);
  }, []);

  const colors = isDarkMode ? DS.COLORS.dark : DS.COLORS.light;

  return (
    <Card
      style={{
        background: colors.bgPrimary,
        color: colors.textPrimary,
        borderColor: colors.borderColor,
        padding: DS.SPACING.lg,
        borderRadius: `${DS.BORDER_RADIUS.lg}px`,
      }}
    >
      <h2>This card adapts to dark mode</h2>
      <p style={{ color: colors.textSecondary }}>Secondary text color adapts too</p>

      <Button
        type="text"
        icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
        onClick={() => {
          const newDarkMode = !isDarkMode;
          if (newDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
          setIsDarkMode(newDarkMode);
        }}
      >
        Toggle Theme
      </Button>
    </Card>
  );
};
```

---

## Glassmorphic Card

```tsx
import { Card } from 'antd';
import { DESIGN_SYSTEM as DS, createGlassmorphic } from '@/designSystem/context';

interface GlassmorphicCardProps {
  tier?: 'premium' | 'standard' | 'subtle';
  children: React.ReactNode;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({ tier = 'standard', children }) => {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const glassmorphicStyle = createGlassmorphic(tier, isDarkMode);

  return (
    <Card
      style={{
        ...glassmorphicStyle,
        borderRadius: `${DS.BORDER_RADIUS.lg}px`,
        padding: DS.SPACING.lg,
        boxShadow: DS.SHADOWS.md,
      }}
    >
      {children}
    </Card>
  );
};
```

---

## Responsive Table (Desktop) / Card View (Mobile)

```tsx
import { Table, Card, List, Row, Col } from 'antd';
import { useResponsive } from '@/hooks/useResponsive';
import { DESIGN_SYSTEM as DS } from '@/designSystem/context';

interface DataItem {
  id: string;
  name: string;
  status: string;
  value: number;
}

interface ResponsiveTableProps {
  columns: any[];
  dataSource: DataItem[];
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ columns, dataSource }) => {
  const { isMobile } = useResponsive();

  if (isMobile) {
    // Card view on mobile
    return (
      <List
        dataSource={dataSource}
        renderItem={(item) => (
          <Card
            style={{
              marginBottom: DS.SPACING.md,
              borderRadius: `${DS.BORDER_RADIUS.lg}px`,
              boxShadow: DS.SHADOWS.sm,
            }}
          >
            <Row gutter={[DS.SPACING.md, DS.SPACING.md]}>
              <Col xs={24}>
                <strong>{item.name}</strong>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{item.status}</div>
              </Col>
              <Col xs={24}>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{item.value}</div>
              </Col>
            </Row>
          </Card>
        )}
      />
    );
  }

  // Table view on desktop/tablet
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      style={{
        borderRadius: `${DS.BORDER_RADIUS.lg}px`,
      }}
    />
  );
};
```

---

## Section Header with Icon

```tsx
import { DESIGN_SYSTEM as DS } from '@/designSystem/context';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle }) => {
  return (
    <div style={DS.COMPONENT_PATTERNS.sectionHeader}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: DS.COLORS.gradientSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
        }}
      >
        {icon}
      </div>
      <div>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: '24px', color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {subtitle && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{subtitle}</p>}
      </div>
    </div>
  );
};
```

---

## Approval Card (Color-Coded)

```tsx
import { Card } from 'antd';
import { DESIGN_SYSTEM as DS, getApprovalCardGradient, getApprovalCardBorderColor } from '@/designSystem/context';

type ApprovalType = 'purchase-orders' | 'expense-claims' | 'material-requests';

interface ApprovalCardProps {
  type: ApprovalType;
  title: string;
  count: number;
  onClick: () => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ type, title, count, onClick }) => {
  const gradient = getApprovalCardGradient(type);
  const borderColor = getApprovalCardBorderColor(type);

  return (
    <Card
      onClick={onClick}
      style={{
        background: gradient,
        border: `1px solid ${borderColor}`,
        borderRadius: '10px',
        padding: DS.SPACING.lg,
        textAlign: 'center',
        cursor: 'pointer',
        transition: `all ${DS.TRANSITIONS.base}`,
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = 'translateY(-2px)';
        target.style.boxShadow = DS.SHADOWS.lg;
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = 'translateY(0)';
        target.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{count}</div>
      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: DS.SPACING.sm }}>{title}</div>
    </Card>
  );
};
```

---

## Usage Example

```tsx
import {
  KPICard,
  ResponsiveGrid,
  SectionHeader,
  ResponsiveTable,
  ApprovalCard,
} from '@/components/modules/YourModule';
import { DESIGN_SYSTEM as DS } from '@/designSystem/context';
import { BankOutlined } from '@ant-design/icons';

export const MyDashboard = () => {
  return (
    <div style={{ padding: DS.SPACING.lg, background: 'var(--bg-secondary)' }}>
      {/* Section Header */}
      <SectionHeader icon={<BankOutlined />} title="Dashboard" subtitle="Key metrics" />

      {/* KPI Cards Grid */}
      <div style={{ marginTop: DS.SPACING.xl }}>
        <ResponsiveGrid>
          <KPICard icon={<BankOutlined />} title="Total Items" value={1234} />
          <KPICard icon={<BankOutlined />} title="Active" value={567} />
          <KPICard icon={<BankOutlined />} title="Pending" value={89} />
          <KPICard icon={<BankOutlined />} title="Completed" value={2345} />
        </ResponsiveGrid>
      </div>

      {/* Approval Cards */}
      <div style={{ marginTop: DS.SPACING.xl }}>
        <SectionHeader icon={<BankOutlined />} title="Approvals" />
        <ResponsiveGrid>
          <ApprovalCard type="purchase-orders" title="Purchase Orders" count={5} onClick={() => {}} />
          <ApprovalCard type="expense-claims" title="Expense Claims" count={3} onClick={() => {}} />
          <ApprovalCard type="material-requests" title="Material Requests" count={7} onClick={() => {}} />
        </ResponsiveGrid>
      </div>
    </div>
  );
};
```

---

## Key Imports to Remember

```tsx
// Design system context
import { DESIGN_SYSTEM as DS } from '@/designSystem/context';
import { createHoverLift, createGlassmorphic, getResponsiveValue } from '@/designSystem/context';

// Responsive hook
import { useResponsive } from '@/hooks/useResponsive';

// Ant Design
import { Card, Button, Table, Row, Col } from 'antd';
import { BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
```

---

## Common Patterns Quick Reference

```tsx
// Padding
padding: DS.SPACING.lg

// Border radius
borderRadius: `${DS.BORDER_RADIUS.lg}px`

// Shadow
boxShadow: DS.SHADOWS.md

// Transition
transition: `all ${DS.TRANSITIONS.base}`

// Hover lift effect
...createHoverLift(4)

// Responsive value
const value = getResponsiveValue({ mobile: '100%', desktop: '80%' }, breakpoint)

// Dark mode aware
color: isDarkMode ? DS.COLORS.dark.textPrimary : DS.COLORS.light.textPrimary

// Grid
<Row gutter={[DS.SPACING.md, DS.SPACING.md]}>
  <Col xs={24} sm={12} lg={6}>Content</Col>
</Row>
```

---

**Remember:** Always check `UIUX.md` for complete documentation and design principles!
