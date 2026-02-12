import React, { useEffect, useCallback } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Statistic,
    Tag,
    Input,
    Space,
    Typography,
    Button,
    theme
} from 'antd';
import {
    ShoppingCartOutlined,
    DollarCircleOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    ShopOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import useFinanceModuleStore from '../../../stores/modules/financeStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import { COMPONENT_WIDTHS } from '../../../styles/tokens';

const { Text, Title } = Typography;

const PurchaseOrdersListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, getResponsiveValue } = useResponsive();

    const {
        purchaseOrders,
        loading,
        filters,
        fetchPurchaseOrders,
        setFilters
    } = useFinanceModuleStore();

    const handleRefresh = useCallback(() => {
        fetchPurchaseOrders();
    }, [fetchPurchaseOrders]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.status, filters.page, filters.pageSize]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'to receive and bill': return 'processing';
            case 'draft': return 'warning';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'Order ID',
            key: 'name',
            fixed: 'left' as const,
            width: 150,
            render: (record: any) => (
                <Space>
                    <FileTextOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>{record.name}</Text>
                </Space>
            ),
        },
        {
            title: 'Supplier',
            dataIndex: 'supplier',
            key: 'supplier',
            width: 250,
            render: (supplier: string) => (
                <Space>
                    <ShopOutlined style={{ color: token.colorTextDescription }} />
                    <Text>{supplier || 'N/A'}</Text>
                </Space>
            )
        },
        {
            title: 'Amount',
            key: 'amount',
            width: 150,
            render: (record: any) => (
                <Text strong>
                    {record.currency || 'KES'} {new Intl.NumberFormat().format(record.grand_total || 0)}
                </Text>
            )
        },
        {
            title: 'Date',
            dataIndex: 'transaction_date',
            key: 'date',
            width: 120,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 180,
            render: (status: string) => (
                <Tag color={getStatusColor(status)} style={{ borderRadius: 12 }}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: () => <Button type="link">View PO</Button>
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL SPENT</Text>}
                            value={purchaseOrders.reduce((sum, po) => sum + (po.grand_total || 0), 0)}
                            prefix={<DollarCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            precision={2}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL ORDERS</Text>}
                            value={purchaseOrders.length}
                            prefix={<ShoppingCartOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING DELIVERY</Text>}
                            value={purchaseOrders.filter(po => po.status === 'To Receive and Bill').length}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table Section */}
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: 0 }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 24px' }}>
                        <Title level={4} style={{ margin: 0 }}>Purchase Orders</Title>
                        <Space wrap>
                            <Input
                                placeholder="Search PO or Supplier..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                style={{
                                    width: getResponsiveValue(COMPONENT_WIDTHS.searchInput),
                                    minWidth: isMobile ? '120px' : 'auto',
                                    borderRadius: 8
                                }}
                                allowClear
                            />
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Space>
                    </div>
                }
            >
                {loading.po ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : purchaseOrders.length > 0 ? (
                    <Table
                        dataSource={purchaseOrders}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: purchaseOrders.length,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Purchase Orders"
                        description="There are currently no purchase orders recorded for your company."
                        onAction={handleRefresh}
                        actionText="Reload Orders"
                    />
                )}
            </Card>
        </div>
    );
};

export default PurchaseOrdersListView;
