import React from 'react';
import { Layout, Typography, Button, Card, Space, theme, Row, Col } from 'antd';
import {
    LockOutlined,
    LoginOutlined,
    BarChartOutlined,
    CheckCircleOutlined,
    FileSearchOutlined,
    SafetyCertificateOutlined,
    ArrowRightOutlined,
    BulbOutlined,
    BulbFilled
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface UnauthorizedPageProps {
    isDarkMode: boolean;
    onToggleTheme: () => void;
    loginUrl?: string;
}

const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
    isDarkMode,
    onToggleTheme,
    loginUrl = `/login?redirect-to=${encodeURIComponent(window.location.href)}`
}) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();

    const handleLogin = () => {
        window.location.href = loginUrl;
    };

    const features = [
        {
            icon: <BarChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
            title: 'Executive Monitoring',
            description: 'Real-time oversight of county-wide health operations and resource allocation.'
        },
        {
            icon: <FileSearchOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
            title: 'Centralized Approvals',
            description: 'Streamlined workflow for processing purchase orders and claims across all facilities.'
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
            title: 'Unified Registry',
            description: 'Single source of truth for health professionals and facility affiliations.'
        }
    ];

    return (
        <Layout className="unauthorized-layout" style={{
            minHeight: '100vh',
            background: isDarkMode
                ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                : 'linear-gradient(135deg, #f0f4ff 0%, #e6e9f2 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Glassmorphic decorative shapes */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'rgba(24, 144, 255, 0.1)',
                filter: 'blur(80px)',
                top: '-100px',
                left: '-100px',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'rgba(114, 46, 209, 0.1)',
                filter: 'blur(80px)',
                bottom: '-50px',
                right: '-50px',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <Header
                style={{
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
                    padding: '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '1200px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}
                        >
                            H
                        </div>
                        <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
                            HealthPro ERP
                        </Title>
                    </div>

                    <Button
                        type="text"
                        icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
                        onClick={onToggleTheme}
                        style={{ borderRadius: '8px' }}
                    >
                        {isDarkMode ? 'Light' : 'Dark'} Mode
                    </Button>
                </div>
            </Header>

            <Content
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px',
                    zIndex: 1
                }}
            >
                <div style={{ maxWidth: '1100px', width: '100%' }}>
                    <Row gutter={[64, 48]} align="middle">
                        <Col xs={24} lg={11}>
                            <Card
                                style={{
                                    background: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                                    backdropFilter: 'blur(30px)',
                                    WebkitBackdropFilter: 'blur(30px)',
                                    borderRadius: '24px',
                                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.8)',
                                    boxShadow: isDarkMode
                                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                        : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                                    overflow: 'hidden'
                                }}
                                bodyStyle={{ padding: isMobile ? '32px 24px' : '56px 48px' }}
                            >
                                <Space direction="vertical" size={32} style={{ width: '100%' }}>
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '16px',
                                            background: 'rgba(24, 144, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <LockOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                                    </div>

                                    <div>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                color: '#8c8c8c',
                                                display: 'block',
                                                marginBottom: '12px'
                                            }}
                                        >
                                            County Executive Portal
                                        </Text>
                                        <Title
                                            level={1}
                                            style={{
                                                margin: 0,
                                                fontWeight: '800',
                                                fontSize: isMobile ? '28px' : '36px',
                                                letterSpacing: '-0.03em',
                                                lineHeight: 1.1
                                            }}
                                        >
                                            Sign In Required
                                        </Title>
                                        <Paragraph
                                            style={{
                                                fontSize: '16px',
                                                lineHeight: '1.6',
                                                color: token.colorTextSecondary,
                                                marginTop: '16px',
                                                marginBottom: 0
                                            }}
                                        >
                                            Welcome to the County Healthcare Executive Dashboard. Please sign in with your authorized credentials to access the system.
                                        </Paragraph>
                                    </div>

                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<LoginOutlined />}
                                        onClick={handleLogin}
                                        block
                                        style={{
                                            height: '56px',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                                            border: 'none',
                                            boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)'
                                        }}
                                    >
                                        Sign In to Dashboard
                                        <ArrowRightOutlined style={{ marginLeft: '12px' }} />
                                    </Button>

                                    <div
                                        style={{
                                            padding: '20px',
                                            borderRadius: '12px',
                                            background: isDarkMode ? 'rgba(24, 144, 255, 0.1)' : 'rgba(239, 246, 255, 1)',
                                            border: isDarkMode ? '1px solid rgba(24, 144, 255, 0.2)' : '1px solid rgba(191, 219, 254, 1)'
                                        }}
                                    >
                                        <Title level={5} style={{ margin: '0 0 12px 0', fontSize: '14px', color: isDarkMode ? '#60a5fa' : '#1e40af' }}>
                                            After You Sign In
                                        </Title>
                                        <Text style={{ fontSize: '13px', color: isDarkMode ? '#bfdbfe' : '#1e40af', lineHeight: '1.6' }}>
                                            Once authenticated, you'll have access to the executive dashboard based on your assigned county permissions. If you don't have county access, contact your system administrator.
                                        </Text>
                                    </div>

                                    <div
                                        style={{
                                            padding: '20px',
                                            borderRadius: '12px',
                                            background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)'
                                        }}
                                    >
                                        <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                            Need Help?
                                        </Title>
                                        <Text style={{ fontSize: '13px', color: token.colorTextTertiary }}>
                                            Contact your system administrator or ICT Support Desk if you need credentials or encounter access issues.
                                        </Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={13}>
                            <Space direction="vertical" size={40} style={{ width: '100%', padding: '0 20px' }}>
                                <div>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            color: isDarkMode ? '#1890ff' : '#096dd9',
                                            display: 'block',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        Executive Platform
                                    </Text>
                                    <Title level={2} style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '32px' }}>
                                        Smarter County Governance
                                    </Title>
                                    <Paragraph style={{ fontSize: '16px', color: token.colorTextSecondary }}>
                                        HealthPro ERP provides integrated oversight of health human resources,
                                        facility infrastructure, and financial claims.
                                    </Paragraph>
                                </div>

                                <div style={{ display: 'grid', gap: '20px' }}>
                                    {features.map((feature, index) => (
                                        <Card
                                            key={index}
                                            style={{
                                                borderRadius: '20px',
                                                background: 'transparent',
                                                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            bodyStyle={{ padding: '24px' }}
                                        >
                                            <Space size={20} align="start">
                                                <div
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '12px',
                                                        background: isDarkMode ? 'rgba(24, 144, 255, 0.15)' : 'rgba(24, 144, 255, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {feature.icon}
                                                </div>
                                                <div>
                                                    <Title level={5} style={{ margin: '0 0 4px 0', fontWeight: '700' }}>
                                                        {feature.title}
                                                    </Title>
                                                    <Text style={{ fontSize: '14px', color: token.colorTextSecondary }}>
                                                        {feature.description}
                                                    </Text>
                                                </div>
                                                <CheckCircleOutlined style={{ fontSize: '20px', color: '#52c41a', marginLeft: 'auto', alignSelf: 'center' }} />
                                            </Space>
                                        </Card>
                                    ))}
                                </div>

                                <div style={{
                                    marginTop: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    color: token.colorTextTertiary,
                                    fontSize: '12px'
                                }}>
                                    <SafetyCertificateOutlined style={{ fontSize: '20px' }} />
                                    <span>Secured by Enterprise-Grade Authentication System</span>
                                </div>
                            </Space>
                        </Col>
                    </Row>
                </div>
            </Content>
        </Layout>
    );
};

export default UnauthorizedPage;
