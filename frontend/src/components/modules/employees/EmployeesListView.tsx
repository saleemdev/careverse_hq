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
    Avatar,
    Typography,
    Badge,
    Button,
    theme
} from 'antd';
import {
    TeamOutlined,
    CheckCircleOutlined,
    AppstoreOutlined,
    UserAddOutlined,
    SearchOutlined,
    ReloadOutlined,
    MailOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import useEmployeeStore from '../../../stores/modules/employeeStore';
import useFacilityStore from '../../../stores/facilityStore';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Title } = Typography;

const EmployeesListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, isTablet, isDesktop } = useResponsive();
    const { selectedFacilityIds } = useFacilityStore();
    const facilityIds = selectedFacilityIds;

    const {
        employees,
        loading,
        filters,
        fetchEmployees,
        setFilters,
        total
    } = useEmployeeStore();

    const handleRefresh = useCallback(() => {
        fetchEmployees(facilityIds);
    }, [fetchEmployees, facilityIds]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh, filters.search, filters.page, filters.pageSize]);

    // Responsive column definitions
    const baseColumns = [
        {
            title: 'Employee',
            key: 'employee',
            fixed: isMobile ? undefined : ('left' as const),
            width: isMobile ? undefined : 250,
            render: (record: any) => (
                <Space size="small">
                    <Avatar size={isMobile ? 'small' : 'large'} src={record.image} icon={<TeamOutlined />} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{record.employee_name}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text>
                        {record.custom_is_licensed_practitioner === 1 && (
                            <Tag color="blue" icon={<SafetyCertificateOutlined />} style={{ fontSize: '9px', marginTop: 4, width: 'fit-content' }}>
                                Licensed
                            </Tag>
                        )}
                    </div>
                </Space>
            ),
        },
    ];

    // Add designation column only on tablet and desktop
    if (!isMobile) {
        baseColumns.push({
            title: 'Designation & Department',
            key: 'position',
            width: isTablet ? 150 : 200,
            render: (record: any) => (
                <div>
                    <Text style={{ display: 'block', fontSize: isTablet ? '12px' : '13px' }}>{record.designation || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{record.department || 'N/A'}</Text>
                </div>
            ),
        });
    }

    // Add contact column only on desktop
    if (isDesktop) {
        baseColumns.push({
            title: 'Contact Information',
            key: 'contact',
            width: 220,
            render: (record: any) => (
                <Space direction="vertical" size={2}>
                    <Text style={{ fontSize: '13px' }}>
                        <MailOutlined style={{ marginRight: 8, color: token.colorTextDescription }} />
                        {record.company_email || 'No Email'}
                    </Text>
                    <Text style={{ fontSize: '13px' }}>
                        <PhoneOutlined style={{ marginRight: 8, color: token.colorTextDescription }} />
                        {record.cell_number || 'No Phone'}
                    </Text>
                </Space>
            ),
        });
    }

    // Add facility column on tablet and desktop
    if (!isMobile) {
        baseColumns.push({
            title: 'Facility',
            dataIndex: 'custom_facility_name',
            key: 'facility',
            width: isTablet ? 120 : 180,
            render: (name: string) => <Tag color="geekblue" style={{ fontSize: isTablet ? '11px' : '12px' }}>{name || 'Floating'}</Tag>
        });
    }

    // Add status column on tablet and desktop
    if (!isMobile) {
        baseColumns.push({
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Badge status={status === 'Active' ? 'success' : 'default'} text={status} />
            )
        });
    }

    // Add action column only on desktop
    if (isDesktop) {
        baseColumns.push({
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 80,
            render: () => <Button type="link" size="small">View</Button>
        });
    }

    const columns = baseColumns;

    return (
        <div style={{ padding: isMobile ? '12px' : '24px' }}>
            {/* Metric Section - Responsive Grid */}
            <Row gutter={[8, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>TOTAL ACTIVE</Text>}
                            value={employees.length}
                            prefix={<TeamOutlined style={{ color: token.colorPrimary, marginRight: 4 }} />}
                            valueStyle={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>LICENSED</Text>}
                            value={employees.filter(e => e.custom_is_licensed_practitioner === 1).length}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
                            valueStyle={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>DEPARTMENTS</Text>}
                            value={new Set(employees.map(e => e.department)).size}
                            prefix={<AppstoreOutlined style={{ color: '#722ed1', marginRight: 4 }} />}
                            valueStyle={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>NEW JOINERS</Text>}
                            value={0}
                            prefix={<UserAddOutlined style={{ color: '#faad14', marginRight: 4 }} />}
                            valueStyle={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table Section */}
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: 0 }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 8 : 12, padding: isMobile ? '12px 16px' : '16px 24px' }}>
                        <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>Employee Directory</Title>
                        <Space wrap size={isMobile ? 'small' : 'middle'}>
                            <Input
                                placeholder={isMobile ? "Search..." : "Search employees..."}
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                style={{ width: isMobile ? '100%' : 250, minWidth: '120px', borderRadius: 8 }}
                                value={filters.search}
                                onChange={e => setFilters({ search: e.target.value })}
                                allowClear
                            />
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} size={isMobile ? 'small' : 'middle'} />
                        </Space>
                    </div>
                }
            >
                {loading ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : employees.length > 0 ? (
                    <Table
                        dataSource={employees}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: total,
                            showSizeChanger: !isMobile,
                            pageSizeOptions: isMobile ? ['5', '10'] : ['10', '20', '50'],
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: isMobile ? 320 : 'max-content' }}
                        size={isMobile ? 'small' : 'middle'}
                    />
                ) : (
                    <EmptyState type="no-data" />
                )}
            </Card>
        </div>
    );
};

export default EmployeesListView;
