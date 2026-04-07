import React from 'react';
import { ArrowRightOutlined, CloudServerOutlined, PlusOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Typography, theme } from 'antd';

const { Paragraph, Text, Title } = Typography;

interface FacilitiesEmptyOnboardingCTAProps {
    organizationName?: string;
    onOnboard?: () => void;
    onRefresh?: () => void;
    onboardingEnabled?: boolean;
    isMobile?: boolean;
}

const FacilitiesEmptyOnboardingCTA: React.FC<FacilitiesEmptyOnboardingCTAProps> = ({
    organizationName,
    onOnboard,
    onRefresh,
    onboardingEnabled = true,
    isMobile = false,
}) => {
    const { token } = theme.useToken();

    const identifierCards = [
        {
            key: 'fid',
            icon: <CloudServerOutlined style={{ fontSize: 18, color: token.colorPrimary }} />,
            label: 'Search with FID',
            description: 'Use the HIE-generated Facility ID when you already have the DHA facility reference.',
        },
        {
            key: 'registration-number',
            icon: <SafetyCertificateOutlined style={{ fontSize: 18, color: '#0f766e' }} />,
            label: 'Or use Registration Number',
            description: 'Use the regulator-issued facility registration number exactly as it appears in HFR.',
        },
    ];

    return (
        <div style={{ padding: isMobile ? '20px 12px 28px' : '32px 24px 40px' }}>
            <div
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 24,
                    padding: isMobile ? 20 : 28,
                    border: `1px solid ${token.colorPrimaryBorder}`,
                    background: 'linear-gradient(135deg, rgba(230, 244, 255, 0.96) 0%, rgba(255, 255, 255, 0.98) 42%, rgba(236, 253, 245, 0.92) 100%)',
                    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: -80,
                        right: -40,
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(24, 144, 255, 0.18) 0%, rgba(24, 144, 255, 0.04) 55%, transparent 72%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -96,
                        left: -40,
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.03) 55%, transparent 72%)',
                    }}
                />

                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(260px, 0.9fr)',
                        gap: isMobile ? 20 : 28,
                        alignItems: 'stretch',
                    }}
                >
                    <div>
                        <Tag
                            color="blue"
                            style={{
                                borderRadius: 999,
                                paddingInline: 12,
                                paddingBlock: 4,
                                marginBottom: 14,
                                fontWeight: 600,
                                border: 'none',
                            }}
                        >
                            Facility onboarding
                        </Tag>

                        <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: '#0f172a' }}>
                            No facilities linked yet
                        </Title>

                        <Paragraph
                            style={{
                                marginTop: 12,
                                marginBottom: 20,
                                maxWidth: 720,
                                color: '#475569',
                                fontSize: isMobile ? 14 : 15,
                                lineHeight: 1.7,
                            }}
                        >
                            Add the first facility to <Text strong>{organizationName || 'this organization'}</Text>.
                            Start with either HFR identifier, verify the registered owner by OTP, then complete the
                            local setup in one guided flow.
                        </Paragraph>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                                gap: 12,
                            }}
                        >
                            {identifierCards.map((card) => (
                                <div
                                    key={card.key}
                                    style={{
                                        borderRadius: 18,
                                        padding: isMobile ? 14 : 16,
                                        background: 'rgba(255, 255, 255, 0.72)',
                                        border: '1px solid rgba(148, 163, 184, 0.16)',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                    }}
                                >
                                    <Space size={10} align="start">
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'rgba(255, 255, 255, 0.92)',
                                                border: '1px solid rgba(148, 163, 184, 0.14)',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {card.icon}
                                        </div>
                                        <div>
                                            <Text strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>
                                                {card.label}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
                                                {card.description}
                                            </Text>
                                        </div>
                                    </Space>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            borderRadius: 20,
                            padding: isMobile ? 18 : 22,
                            background: 'rgba(255, 255, 255, 0.84)',
                            border: '1px solid rgba(148, 163, 184, 0.18)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: isMobile ? 'auto' : 240,
                        }}
                    >
                        <div>
                            <Text
                                style={{
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    fontSize: 11,
                                    color: '#64748b',
                                    fontWeight: 700,
                                }}
                            >
                                Next step
                            </Text>
                            <Title level={5} style={{ marginTop: 10, marginBottom: 10, color: '#0f172a' }}>
                                Open the new facility wizard
                            </Title>
                            <Paragraph style={{ color: '#475569', marginBottom: 0, lineHeight: 1.7 }}>
                                Search HFR using the identifier you already have, review the facility preview, then
                                finish the onboarding flow for this organization.
                            </Paragraph>
                        </div>

                        <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 20 }}>
                            {onboardingEnabled && onOnboard && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={onOnboard}
                                    size="large"
                                    style={{
                                        width: '100%',
                                        height: 46,
                                        borderRadius: 14,
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #1677ff 0%, #0ea5e9 100%)',
                                        boxShadow: '0 12px 24px rgba(22, 119, 255, 0.24)',
                                        fontWeight: 600,
                                    }}
                                >
                                    Add First Facility
                                </Button>
                            )}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={onRefresh}
                                size="large"
                                style={{
                                    width: '100%',
                                    height: 44,
                                    borderRadius: 14,
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    border: '1px solid rgba(148, 163, 184, 0.22)',
                                    color: '#334155',
                                }}
                            >
                                Refresh List
                            </Button>
                            {onboardingEnabled && onOnboard && (
                                <Button
                                    type="link"
                                    icon={<ArrowRightOutlined />}
                                    onClick={onOnboard}
                                    style={{
                                        alignSelf: 'flex-start',
                                        paddingInline: 0,
                                        color: token.colorPrimary,
                                        fontWeight: 600,
                                    }}
                                >
                                    Go to facility onboarding
                                </Button>
                            )}
                        </Space>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacilitiesEmptyOnboardingCTA;
