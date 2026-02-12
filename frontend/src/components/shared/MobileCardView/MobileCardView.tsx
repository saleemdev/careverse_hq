/**
 * MobileCardView Component
 * Provides a mobile-friendly card alternative to tables
 */

import { Card, List, Empty, Spin } from 'antd';
import { ReactNode } from 'react';

interface MobileCardViewProps<T = any> {
  data: T[];
  renderCard: (item: T, index: number) => ReactNode;
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  emptyText?: string;
}

function MobileCardView<T = any>({
  data,
  renderCard,
  loading = false,
  pagination,
  emptyText = 'No data available',
}: MobileCardViewProps<T>) {
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div style={{ padding: '40px' }}><Empty description={emptyText} /></div>;
  }

  return (
    <List
      dataSource={data}
      renderItem={(item, index) => (
        <List.Item style={{ padding: '8px 16px', border: 'none' }}>
          <Card
            style={{
              width: '100%',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            bodyStyle={{ padding: '12px' }}
          >
            {renderCard(item, index)}
          </Card>
        </List.Item>
      )}
      pagination={pagination ? { ...pagination, simple: true, size: 'small' } : false}
    />
  );
}

export default MobileCardView;
