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
            icon: <BarChartOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
            title: 'Executive Monitoring',
            description: 'Real-time oversight of county-wide health operations and resource allocation.'
        },
        {
            icon: <FileSearchOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
            title: 'Centralized Approvals',
            description: 'Streamlined workflow for processing purchase orders and claims across all facilities.'
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
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
                    padding: '0 20px',
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
                                background: 'rgba(24, 144, 255, 0.12)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(24, 144, 255, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1890ff',
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}
                        >
                            H
                        </div>
                        <Title level={4} style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.01em' }}>
                            F360 Central
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
                    padding: '36px 20px',
                    zIndex: 1
                }}
            >
                <div style={{ maxWidth: '1100px', width: '100%' }}>
                    <Row gutter={[40, 28]} align="middle">
                        <Col xs={24} lg={11}>
                            <Card
                                style={{
                                    background: '#fff',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                    overflow: 'hidden'
                                }}
                                bodyStyle={{ padding: isMobile ? '24px 20px' : '40px 36px' }}
                            >
                                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: '#1890ff15',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            color: '#1890ff'
                                        }}
                                    >
                                        <LockOutlined />
                                    </div>

                                    <div>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                color: '#8c8c8c',
                                                display: 'block',
                                                marginBottom: '10px'
                                            }}
                                        >
                                            Organization Portal
                                        </Text>
                                        <Title
                                            level={1}
                                            style={{
                                                margin: 0,
                                                fontWeight: '700',
                                                fontSize: isMobile ? '24px' : '30px',
                                                letterSpacing: '-0.02em',
                                                lineHeight: 1.15
                                            }}
                                        >
                                            Sign In to Continue
                                        </Title>
                                        <Paragraph
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '1.5',
                                                color: token.colorTextSecondary,
                                                marginTop: '12px',
                                                marginBottom: 0
                                            }}
                                        >
                                            Sign in to access your organization's management portal.
                                        </Paragraph>
                                    </div>

                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<LoginOutlined />}
                                        onClick={handleLogin}
                                        block
                                        style={{
                                            height: '48px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #1890ff 0%, #1890ff 100%)',
                                            border: 'none',
                                            boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)',
                                            color: '#fff'
                                        }}
                                    >
                                        Sign In to Dashboard
                                        <ArrowRightOutlined style={{ marginLeft: '12px' }} />
                                    </Button>

                                    <div
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            background: '#f5f8fc',
                                            border: '1px solid #e0e8f5'
                                        }}
                                    >
                                        <Title level={5} style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1890ff' }}>
                                            After You Sign In
                                        </Title>
                                        <Text style={{ fontSize: '12px', color: '#595959', lineHeight: '1.5' }}>
                                            You'll see your organization's dashboard based on your assigned permissions. Need access? Contact your administrator.
                                        </Text>
                                    </div>

                                    <div
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            background: '#f9f9f9',
                                            border: '1px solid #e8e8e8'
                                        }}
                                    >
                                        <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                            Need Help?
                                        </Title>
                                        <Text style={{ fontSize: '12px', color: token.colorTextTertiary }}>
                                            Reach out to your system administrator or IT support for credential and access help.
                                        </Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={13}>
                            <Space direction="vertical" size={28} style={{ width: '100%', padding: '0 12px' }}>
                                <div>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            color: isDarkMode ? '#1890ff' : '#096dd9',
                                            display: 'block',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        Executive Platform
                                    </Text>
                                    <Title level={2} style={{ margin: '0 0 10px 0', fontWeight: '700', fontSize: '28px' }}>
                                        Smarter Organization Management
                                    </Title>
                                    <Paragraph style={{ fontSize: '14px', color: token.colorTextSecondary }}>
                                        Integrated oversight of your workforce, facilities, and operational processes.
                                    </Paragraph>
                                </div>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {features.map((feature, index) => (
                                        <Card
                                            key={index}
                                            style={{
                                                borderRadius: '12px',
                                                background: '#fff',
                                                border: 'none',
                                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            bodyStyle={{ padding: '18px' }}
                                        >
                                            <Space size={16} align="start">
                                                <div
                                                    style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '10px',
                                                        background: '#1890ff15',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        color: '#1890ff'
                                                    }}
                                                >
                                                    {feature.icon}
                                                </div>
                                                <div>
                                                    <Title level={5} style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
                                                        {feature.title}
                                                    </Title>
                                                    <Text style={{ fontSize: '13px', color: token.colorTextSecondary }}>
                                                        {feature.description}
                                                    </Text>
                                                </div>
                                                <CheckCircleOutlined style={{ fontSize: '18px', color: '#52c41a', marginLeft: 'auto', alignSelf: 'center' }} />
                                            </Space>
                                        </Card>
                                    ))}
                                </div>

                                <div style={{
                                    marginTop: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    color: token.colorTextTertiary,
                                    fontSize: '12px'
                                }}>
                                    <SafetyCertificateOutlined style={{ fontSize: '18px' }} />
                                    <span>Secure access for authorized personnel</span>
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
