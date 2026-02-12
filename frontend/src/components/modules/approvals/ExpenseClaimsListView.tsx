import React, { useEffect, useCallback } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Statistic,
    Input,
    Space,
    Typography,
    Button,
    theme,
    Badge
} from 'antd';
import {
    WalletOutlined,
    DollarCircleOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined
} from '@ant-design/icons';
import useFinanceModuleStore from '../../../stores/modules/financeStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import { COMPONENT_WIDTHS } from '../../../styles/tokens';

const { Text, Title } = Typography;

const ExpenseClaimsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, getResponsiveValue } = useResponsive();

    const {
        expenseClaims,
        loading,
        filters,
        fetchExpenseClaims,
        setFilters
    } = useFinanceModuleStore();

    const handleRefresh = useCallback(() => {
        fetchExpenseClaims();
    }, [fetchExpenseClaims]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.status, filters.page, filters.pageSize]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'success';
            case 'approved': return 'processing';
            case 'submitted': return 'warning';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'Claimant',
            key: 'employee',
            fixed: 'left' as const,
            width: 250,
            render: (record: any) => (
                <Space>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: token.colorFillAlter,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorPrimary
                    }}>
                        <UserOutlined />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px' }}>{record.employee_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.name}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Amount',
            key: 'amount',
            width: 150,
            render: (record: any) => (
                <Text strong>
                    KES {new Intl.NumberFormat().format(record.total_claimed_amount || 0)}
                </Text>
            )
        },
        {
            title: 'Posting Date',
            dataIndex: 'posting_date',
            key: 'date',
            width: 150,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Badge status={getStatusColor(status) as any} text={status} />
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: () => <Button type="link">Review</Button>
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL CLAIMED</Text>}
                            value={expenseClaims.reduce((sum, ec) => sum + (ec.total_claimed_amount || 0), 0)}
                            prefix={<DollarCircleOutlined style={{ color: '#13c2c2', marginRight: 8 }} />}
                            precision={2}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL CLAIMS</Text>}
                            value={expenseClaims.length}
                            prefix={<WalletOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING APPROVAL</Text>}
                            value={expenseClaims.filter(ec => ec.status === 'Submitted').length}
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
                        <Title level={4} style={{ margin: 0 }}>Expense Claims</Title>
                        <Space wrap>
                            <Input
                                placeholder="Search claimant or ID..."
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
                {loading.ec ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : expenseClaims.length > 0 ? (
                    <Table
                        dataSource={expenseClaims}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: expenseClaims.length,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Expense Claims"
                        description="There are currently no reimbursement or expense claims to display."
                        onAction={handleRefresh}
                        actionText="Reload Claims"
                    />
                )}
            </Card>
        </div>
    );
};

export default ExpenseClaimsListView;
