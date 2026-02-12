/**
 * Main Application Layout for F360 Central
 * Professional executive dashboard layout with sidebar navigation
 */

import { useState, useEffect } from 'react';
import {
    Layout,
    Menu,
    Typography,
    Avatar,
    Dropdown,
    Space,
    Badge,
    Button,
    Drawer,
    Breadcrumb,
    theme,
    Tooltip,
} from 'antd';
import {
    DashboardOutlined,
    TeamOutlined,
    BankOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BellOutlined,
    SearchOutlined,
    HomeOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    CalendarOutlined,
    MoonOutlined,
    SunOutlined,
    AppstoreOutlined,
    LaptopOutlined,
    MedicineBoxOutlined,
    LinkOutlined,
    ClockCircleOutlined,
    InboxOutlined,
    DollarOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';
import useAuthStore from '../stores/authStore';
import useFacilityStore from '../stores/facilityStore';
import FacilityContextSwitcher from './FacilityContextSwitcher';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface AppLayoutProps {
    children: React.ReactNode;
    currentRoute: string;
    onNavigate: (route: string, id?: string) => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    currentRoute,
    onNavigate,
    isDarkMode,
    onToggleTheme,
}) => {
    const { token } = theme.useToken();
    const { isMobile, isTablet } = useResponsive();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
    const { user, logout } = useAuthStore();
    const { company, selectedFacilities } = useFacilityStore();

    // Auto-collapse on tablet
    useEffect(() => {
        setCollapsed(isTablet);
    }, [isTablet]);

    // Get user initials
    const getUserInitials = (fullName: string | undefined, name: string | undefined) => {
        const displayName = fullName || name || 'U';
        return displayName.replace(/\s+/g, '').substring(0, 2).toUpperCase();
    };

    // Menu items
    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Executive Dashboard',
        },
        {
            key: 'modules',
            icon: <AppstoreOutlined />,
            label: 'Modules',
            children: [
                {
                    key: 'employees',
                    icon: <TeamOutlined />,
                    label: 'Employees',
                },
                {
                    key: 'assets',
                    icon: <LaptopOutlined />,
                    label: 'Assets',
                },
                {
                    key: 'facilities',
                    icon: <MedicineBoxOutlined />,
                    label: 'Health Facilities',
                },
                {
                    key: 'affiliations',
                    icon: <LinkOutlined />,
                    label: 'Facility Affiliations',
                },
                {
                    key: 'licenses',
                    icon: <SafetyCertificateOutlined />,
                    label: 'Licenses',
                },
                {
                    key: 'purchase-orders',
                    icon: <ShoppingCartOutlined />,
                    label: 'Purchase Orders',
                },
                {
                    key: 'expense-claims',
                    icon: <DollarOutlined />,
                    label: 'Expense Claims',
                },
                {
                    key: 'material-requests',
                    icon: <InboxOutlined />,
                    label: 'Material Requests',
                },
                {
                    key: 'leave-applications',
                    icon: <CalendarOutlined />,
                    label: 'Leave Applications',
                },
                {
                    key: 'attendance',
                    icon: <ClockCircleOutlined />,
                    label: 'Attendance Records',
                },
            ],
        },
    ];

    // User dropdown menu
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'My Profile',
            onClick: () => onNavigate('profile'),
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            onClick: () => onNavigate('settings'),
        },
        {
            key: 'switch-desk',
            icon: <LinkOutlined />,
            label: 'Switch to Desk',
            onClick: () => window.location.href = '/app',
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
            onClick: logout,
        },
    ];

    // Handle menu click
    const handleMenuClick = (e: { key: string }) => {
        onNavigate(e.key);
        if (isMobile) {
            setMobileMenuVisible(false);
        }
    };

    // Get current page title
    const getPageTitle = () => {
        const routes: Record<string, string> = {
            dashboard: 'Executive Dashboard',
            employees: 'Employees',
            assets: 'Assets',
            facilities: 'Facilities',
            affiliations: 'Affiliations',
            licenses: 'Licenses',
            'purchase-orders': 'Purchase Orders',
            'expense-claims': 'Expense Claims',
            'material-requests': 'Material Requests',
            'leave-applications': 'Leave Applications',
            attendance: 'Attendance',
        };
        return routes[currentRoute] || 'Dashboard';
    };

    // Sidebar logo
    const renderLogo = () => (
        <div
            style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0' : '0 24px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                marginBottom: '8px',
                transition: 'all 0.2s ease',
            }}
        >
            <div
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 700,
                }}
            >
                {company?.abbr?.charAt(0) || 'F'}
            </div>
            {!collapsed && (
                <div style={{ marginLeft: '12px' }}>
                    <Title level={5} style={{ margin: 0, color: token.colorText, lineHeight: 1.2, fontSize: '14px' }}>
                        F360 Central
                    </Title>
                    <Text type="secondary" style={{ fontSize: '10px' }}>Administration</Text>
                </div>
            )}
        </div>
    );

    // Render sidebar
    const renderSidebar = () => (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            collapsedWidth={80}
            theme="light"
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                background: token.colorBgContainer,
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
                zIndex: 100,
            }}
        >
            {renderLogo()}
            <Menu
                mode="inline"
                selectedKeys={[currentRoute]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    border: 'none',
                    fontSize: '13px',
                }}
            />
        </Sider>
    );

    // Mobile & Tablet drawer
    const renderMobileDrawer = () => (
        <Drawer
            placement="left"
            closable={false}
            onClose={() => setMobileMenuVisible(false)}
            open={mobileMenuVisible}
            width={isMobile ? 280 : 300}
            bodyStyle={{ padding: 0 }}
            headerStyle={{ display: 'none' }}
        >
            {renderLogo()}
            <Menu
                mode="inline"
                selectedKeys={[currentRoute]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    border: 'none',
                    fontSize: '13px',
                }}
            />
        </Drawer>
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Sidebar - Desktop only */}
            {!isMobile && !isTablet && renderSidebar()}

            {/* Mobile & Tablet Drawer */}
            {(isMobile || isTablet) && renderMobileDrawer()}

            {/* Main Layout */}
            <Layout
                style={{
                    marginLeft: (isMobile || isTablet) ? 0 : collapsed ? 80 : 260,
                    transition: 'margin-left 0.2s ease',
                }}
            >
                {/* Header */}
                <Header
                    style={{
                        padding: isMobile ? '0 12px' : '0 24px',
                        background: token.colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        position: 'sticky',
                        top: 0,
                        zIndex: 1000, // Increased to stay above layout elements
                        height: '64px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                >
                    <Space size={isMobile ? "small" : "middle"} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        {/* Menu Toggle */}
                        <Button
                            type="text"
                            icon={(isMobile || isTablet) ? <MenuUnfoldOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => ((isMobile || isTablet) ? setMobileMenuVisible(true) : setCollapsed(!collapsed))}
                            style={{ fontSize: '18px', width: '40px', height: '40px' }}
                        />

                        {/* Prominent County Name Badge - Desktop only */}
                        {!isMobile && !isTablet && company && (
                            <div
                                style={{
                                    background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.25)',
                                }}
                            >
                                <BankOutlined style={{ color: '#fff', fontSize: '16px' }} />
                                <div>
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            display: 'block',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {company.company_name}
                                    </Text>
                                    <Text
                                        style={{
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            fontSize: '11px',
                                            display: 'block',
                                            marginTop: '2px',
                                        }}
                                    >
                                        County Government
                                    </Text>
                                </div>
                            </div>
                        )}

                        {/* Compact County Badge - Tablet */}
                        {!isMobile && isTablet && company && (
                            <div
                                style={{
                                    background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.25)',
                                }}
                            >
                                <BankOutlined style={{ color: '#fff', fontSize: '14px' }} />
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                    }}
                                >
                                    {company.abbr || company.company_name}
                                </Text>
                            </div>
                        )}

                        {/* Mobile County Name */}
                        {isMobile && company && (
                            <Text
                                strong
                                style={{
                                    fontSize: '14px',
                                    color: token.colorPrimary,
                                }}
                            >
                                {company.abbr}
                            </Text>
                        )}

                        {/* Breadcrumb - Desktop only */}
                        {!isMobile && !isTablet && (
                            <Breadcrumb
                                items={[
                                    { title: <HomeOutlined />, onClick: () => onNavigate('dashboard') },
                                    { title: getPageTitle() },
                                ]}
                            />
                        )}
                    </Space>

                    <Space size="middle">
                        {/* Facility Context Switcher - All devices */}
                        {isMobile ? (
                            <Dropdown
                                trigger={['click']}
                                placement="bottomRight"
                                dropdownRender={() => (
                                    <div style={{
                                        background: token.colorBgElevated,
                                        borderRadius: '8px',
                                        padding: '12px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                        minWidth: '280px',
                                    }}>
                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                                            Filter by Facility
                                        </Text>
                                        <FacilityContextSwitcher variant="minimal" showLabel={false} />
                                    </div>
                                )}
                            >
                                <Tooltip title="Facility Filter">
                                    <Badge
                                        count={selectedFacilities.length > 0 ? selectedFacilities.length : 0}
                                        size="small"
                                        offset={[-2, 2]}
                                    >
                                        <Button
                                            type="text"
                                            icon={<MedicineBoxOutlined />}
                                            style={{ width: '36px', height: '36px' }}
                                        />
                                    </Badge>
                                </Tooltip>
                            </Dropdown>
                        ) : (
                            <FacilityContextSwitcher variant="compact" showLabel={false} />
                        )}

                        {/* Secondary Actions - Desktop Only */}
                        {!isTablet && !isMobile && (
                            <>
                                <Tooltip title="Search">
                                    <Button type="text" icon={<SearchOutlined />} style={{ width: '40px', height: '40px' }} />
                                </Tooltip>

                                <Tooltip title="Notifications">
                                    <Badge count={5} size="small">
                                        <Button type="text" icon={<BellOutlined />} style={{ width: '40px', height: '40px' }} />
                                    </Badge>
                                </Tooltip>
                            </>
                        )}

                        {/* Theme Toggle - Always available but smaller on mobile */}
                        <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                            <Button
                                type="text"
                                icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                                onClick={onToggleTheme}
                                style={{ width: '36px', height: '36px' }}
                            />
                        </Tooltip>

                        {/* User Menu */}
                        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}>
                                <Avatar
                                    size="default"
                                    src={user?.user_image}
                                    style={{
                                        backgroundColor: '#1890ff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {getUserInitials(user?.full_name, user?.name)}
                                </Avatar>
                                {!isMobile && (
                                    <div style={{ lineHeight: 1.2 }}>
                                        <Text strong style={{ fontSize: '13px', display: 'block' }}>
                                            {user?.full_name || user?.name || 'User'}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>Administrator</Text>
                                    </div>
                                )}
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>

                {/* Content */}
                <Content
                    style={{
                        background: token.colorBgLayout,
                        minHeight: 'calc(100vh - 64px)',
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
