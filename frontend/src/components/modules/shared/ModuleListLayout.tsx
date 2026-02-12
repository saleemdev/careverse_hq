import React from 'react';
import { Card, Breadcrumb, Space, Button, Typography, theme } from 'antd';
import { HomeOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useResponsive } from '../../../hooks/useResponsive';

const { Title, Text } = Typography;

interface ModuleListLayoutProps {
    title: string;
    breadcrumbItems?: { title: React.ReactNode; onClick?: () => void }[];
    onRefresh?: () => void;
    onExport?: () => void;
    extra?: React.ReactNode;
    children: React.ReactNode;
}

const ModuleListLayout: React.FC<ModuleListLayoutProps> = ({
    title,
    breadcrumbItems = [],
    onRefresh,
    onExport,
    extra,
    children
}) => {
    const { token } = theme.useToken();
    const { isMobile, isTablet } = useResponsive();

    const defaultBreadcrumbs = [
        { title: <HomeOutlined />, onClick: () => window.location.hash = '#dashboard' },
        ...breadcrumbItems,
        { title }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Breadcrumb items={defaultBreadcrumbs} style={{ marginBottom: '8px' }} />
                    <Title level={2} style={{ margin: 0 }}>{title}</Title>
                </div>
                <Space
                    size={isMobile ? 'small' : 'middle'}
                    wrap={isTablet}
                    style={{
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-end'
                    }}
                >
                    {onExport && (
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={onExport}
                            size={isMobile ? 'middle' : 'large'}
                            block={isMobile}
                        >
                            {!isMobile && 'Export'}
                        </Button>
                    )}
                    {onRefresh && (
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={onRefresh}
                            size={isMobile ? 'middle' : 'large'}
                            block={isMobile}
                        >
                            {!isMobile && 'Refresh'}
                        </Button>
                    )}
                    {extra}
                </Space>
            </div>
            <Card
                bodyStyle={{ padding: 0 }}
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    border: 'none',
                    overflow: 'hidden'
                }}
            >
                {children}
            </Card>
        </div>
    );
};

export default ModuleListLayout;
