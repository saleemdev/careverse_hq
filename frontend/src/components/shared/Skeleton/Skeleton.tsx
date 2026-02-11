import React from 'react';
import { Skeleton, Card, Row, Col, Space } from 'antd';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div style={{ background: '#fff', padding: 24, borderRadius: 12 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton.Input active size="default" style={{ width: 200 }} />
                    <Skeleton.Button active size="default" style={{ width: 100 }} />
                </div>
                {[...Array(rows)].map((_, i) => (
                    <Skeleton key={i} active paragraph={{ rows: 1 }} title={false} />
                ))}
            </Space>
        </div>
    );
};

export const MetricCardSkeleton: React.FC = () => {
    return (
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Skeleton active avatar={{ size: 'large', shape: 'square' }} paragraph={{ rows: 1 }} />
        </Card>
    );
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <div style={{ padding: 24 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                {[...Array(4)].map((_, i) => (
                    <Col key={i} xs={24} sm={12} lg={6}>
                        <MetricCardSkeleton />
                    </Col>
                ))}
            </Row>
            <TableSkeleton rows={8} />
        </div>
    );
};
