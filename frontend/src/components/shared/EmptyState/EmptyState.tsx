import React from 'react';
import { Button, Empty, Typography } from 'antd';
import { BuildOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EmptyStateProps {
    type: 'no-data' | 'no-results' | 'under-construction' | 'error';
    title?: string;
    description?: string;
    onAction?: () => void;
    actionText?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    type,
    title,
    description,
    onAction,
    actionText
}) => {
    const getConfig = () => {
        switch (type) {
            case 'under-construction':
                return {
                    icon: <BuildOutlined style={{ fontSize: 64, color: '#1890ff' }} />,
                    defaultTitle: 'Module Under Construction',
                    defaultDescription: 'We are currently building this section to provide you with the best experience. Stay tuned!',
                };
            case 'no-results':
                return {
                    icon: <SearchOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />,
                    defaultTitle: 'No Results Found',
                    defaultDescription: 'Try adjusting your filters or search terms to find what you are looking for.',
                };
            case 'error':
                return {
                    icon: <WarningOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />,
                    defaultTitle: 'Something Went Wrong',
                    defaultDescription: 'There was an error loading the data. Please try again.',
                };
            default:
                return {
                    icon: Empty.PRESENTED_IMAGE_SIMPLE,
                    defaultTitle: 'No Data Available',
                    defaultDescription: 'There are currently no records to display in this module.',
                };
        }
    };

    const config = getConfig();

    return (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <Empty
                image={config.icon}
                description={
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#262626', marginBottom: 8 }}>
                            {title || config.defaultTitle}
                        </div>
                        <Text type="secondary" style={{ maxWidth: 400, display: 'inline-block' }}>
                            {description || config.defaultDescription}
                        </Text>
                    </div>
                }
            >
                {onAction && (
                    <Button type="primary" onClick={onAction} style={{ marginTop: 16 }}>
                        {actionText || 'Retry'}
                    </Button>
                )}
            </Empty>
        </div>
    );
};

export default EmptyState;
