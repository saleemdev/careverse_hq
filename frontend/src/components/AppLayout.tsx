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
    CalendarOutlined,
    MoonOutlined,
    SunOutlined,
    AppstoreOutlined,
    LaptopOutlined,
    MedicineBoxOutlined,
    LinkOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined,
    CloudUploadOutlined,
    ExclamationCircleOutlined,
    AuditOutlined,
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
    const headerActionButtonStyle = {
        width: isMobile ? '36px' : '40px',
        height: isMobile ? '36px' : '40px',
        fontSize: isMobile ? '16px' : '17px',
    };

    const handleLogout = () => {
        logout();
    };

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
                    key: 'health-professionals',
                    icon: <TeamOutlined />,
                    label: 'Health Professionals',
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
                    key: 'bulk-upload',
                    icon: <CloudUploadOutlined />,
                    label: 'Bulk Upload',
                },
                {
                    key: 'licenses',
                    icon: <SafetyCertificateOutlined />,
                    label: 'Licenses',
                },
                {
                    key: 'attendance',
                    icon: <ClockCircleOutlined />,
                    label: 'Attendance Records',
                },
                {
                    key: 'e-contracting',
                    icon: <AuditOutlined />,
                    label: 'eContracting',
                },
            ],
        },
        {
            key: 'administration',
            icon: <SettingOutlined />,
            label: 'Administration',
            children: [
                {
                    key: 'user-management',
                    icon: <TeamOutlined />,
                    label: 'User Management',
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
        },
        {
            key: 'switch-desk',
            icon: <LinkOutlined />,
            label: 'Switch to Desk',
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
        },
    ];

    // Handle user menu selection
    const handleUserMenuClick = (e: { key: string }) => {
        if (e.key === 'logout') {
            handleLogout();
        } else if (e.key === 'switch-desk') {
            window.location.href = '/app';
        } else {
            onNavigate(e.key);
        }
    };

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
            'health-professionals': 'Health Professionals',
            assets: 'Assets',
            facilities: 'Facilities',
            affiliations: 'Affiliations',
            'bulk-upload': 'Bulk Upload',
            'bulk-upload/new': 'New Upload',
            'bulk-upload/status': 'Upload Status',
            licenses: 'Licenses',
            attendance: 'Attendance',
            'e-contracting': 'eContracting',
            'user-management': 'User Management',
            'user-management/new': 'Create User',
            'user-management/security': 'User Security',
            'create-user': 'Create User',
            'edit-user': 'Edit User',
            profile: 'My Profile',
        };
        return routes[currentRoute] || 'Dashboard';
    };

    const selectedMenuKey = currentRoute.startsWith('user-management')
        ? 'user-management'
        : currentRoute;

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
                    background: 'rgba(24, 144, 255, 0.18)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(24, 144, 255, 0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: token.colorPrimary,
                    fontSize: '16px',
                    fontWeight: 700,
                    overflow: 'hidden',
                }}
            >
                {company?.company_logo ? (
                    <img
                        src={company.company_logo}
                        alt={`${company.company_name || company.name} logo`}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <SafetyCertificateOutlined style={{ fontSize: '16px', color: token.colorPrimary }} />
                )}
            </div>
            {!collapsed && (
                <div style={{ marginLeft: '12px' }}>
                    <Title level={5} style={{ margin: 0, color: token.colorText, lineHeight: 1.2, fontSize: '13px' }}>
                        F360 Central
                    </Title>
                    <Text type="secondary" style={{ fontSize: '9px' }}>Administration</Text>
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
                selectedKeys={[selectedMenuKey]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    border: 'none',
                    fontSize: '12px',
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
                selectedKeys={[selectedMenuKey]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    border: 'none',
                    fontSize: '12px',
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
                            className="header-action-btn header-action-btn--menu"
                            style={{ ...headerActionButtonStyle, fontSize: '16px' }}
                        />

                        {/* Prominent Organization Name Badge - Desktop only */}
                        {!isMobile && !isTablet && company && (
                            <div
                                style={{
                                    background: 'rgba(24, 144, 255, 0.20)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(24, 144, 255, 0.25)',
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.25)',
                                }}
                            >
                                <BankOutlined style={{ color: '#0050b3', fontSize: '14px' }} />
                                <div>
                                    <Text
                                        style={{
                                            color: '#0050b3',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            display: 'block',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {company.company_name}
                                    </Text>
                                    <Text
                                        style={{
                                            color: 'rgba(0, 80, 179, 0.85)',
                                            fontSize: '10px',
                                            display: 'block',
                                            marginTop: '2px',
                                        }}
                                    >
                                        Organization
                                    </Text>
                                </div>
                            </div>
                        )}

                        {/* Compact Organization Badge - Tablet */}
                        {!isMobile && isTablet && company && (
                            <div
                                style={{
                                    background: 'rgba(24, 144, 255, 0.20)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(24, 144, 255, 0.25)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.25)',
                                }}
                            >
                                <BankOutlined style={{ color: '#0050b3', fontSize: '13px' }} />
                                <Text
                                    style={{
                                        color: '#0050b3',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                    }}
                                >
                                    {company.abbr || company.company_name}
                                </Text>
                            </div>
                        )}

                        {/* Mobile Organization Name */}
                        {isMobile && company && (
                            <Text
                                strong
                                style={{
                                    fontSize: '13px',
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
                        {/* Facility Context Switcher - hidden on Executive Dashboard */}
                        {currentRoute !== 'dashboard' && (
                            isMobile ? (
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
                                        <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>
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
                                                className="header-action-btn"
                                                style={headerActionButtonStyle}
                                            />
                                        </Badge>
                                    </Tooltip>
                                </Dropdown>
                            ) : (
                                <FacilityContextSwitcher variant="compact" showLabel={false} />
                            )
                        )}

                        {/* Secondary Actions - Desktop Only */}
                        {!isTablet && !isMobile && (
                            <>
                                <Tooltip title="Search">
                                    <Button
                                        type="text"
                                        icon={<SearchOutlined />}
                                        className="header-action-btn"
                                        style={headerActionButtonStyle}
                                    />
                                </Tooltip>

                                <Tooltip title="Notifications">
                                    <Badge count={0} showZero size="small">
                                        <Button
                                            type="text"
                                            icon={<BellOutlined />}
                                            className="header-action-btn"
                                            style={headerActionButtonStyle}
                                        />
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
                                className="header-action-btn"
                                style={headerActionButtonStyle}
                            />
                        </Tooltip>

                        {/* User Menu */}
                        <Dropdown
                            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Space className="header-user-trigger" style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}>
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
                                        <Text strong style={{ fontSize: '12px', display: 'block' }}>
                                            {user?.full_name || user?.name || 'User'}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '10px' }}>Administrator</Text>
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
