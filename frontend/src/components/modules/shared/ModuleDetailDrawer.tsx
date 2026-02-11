import React from 'react';
import { Drawer, Button, Space, Skeleton, theme } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useResponsive } from '../../../hooks/useResponsive';

interface ModuleDetailDrawerProps {
    title: string;
    visible: boolean;
    onClose: () => void;
    loading?: boolean;
    children: React.ReactNode;
    extra?: React.ReactNode;
    width?: string | number;
}

const ModuleDetailDrawer: React.FC<ModuleDetailDrawerProps> = ({
    title,
    visible,
    onClose,
    loading = false,
    children,
    extra,
    width
}) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();

    // Default width: 75% on desktop, 95% on mobile
    const drawerWidth = width || (isMobile ? '95%' : '75%');

    return (
        <Drawer
            title={title}
            width={drawerWidth}
            onClose={onClose}
            open={visible}
            bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
            extra={
                <Space>
                    <Button icon={<PrinterOutlined />}>Print</Button>
                    {extra}
                    <Button icon={<CloseOutlined />} onClick={onClose}>Close</Button>
                </Space>
            }
        >
            {loading ? (
                <div style={{ padding: '24px' }}>
                    <Skeleton active paragraph={{ rows: 15 }} />
                </div>
            ) : (
                children
            )}
        </Drawer>
    );
};

export default ModuleDetailDrawer;
