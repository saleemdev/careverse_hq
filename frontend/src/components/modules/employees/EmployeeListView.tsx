import React, { useEffect, useCallback, useState } from 'react';
import {
    Table,
    Card,
    Tag,
    Input,
    Space,
    Avatar,
    Typography,
    Badge,
    Button,
    theme,
    Select,
    Tooltip,
    Progress,
    Row,
    Col,
} from 'antd';
import {
    SafetyCertificateOutlined,
    SearchOutlined,
    ReloadOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
    EyeOutlined,
    ClearOutlined,
    MedicineBoxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import useEmployeeStore from '../../../stores/modules/employeeStore';
import type { Employee } from '../../../types/modules';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';
import MobileCardView from '../../shared/MobileCardView/MobileCardView';
import { LicenseStatusBadge } from '../health-professionals/LicenseStatusBadge';
import { employeesApi } from '../../../services/api';
import EmployeeDetailDrawer from './EmployeeDetailDrawer';
import useFacilityStore from '../../../stores/facilityStore';

const { Text, Title } = Typography;
const { Search } = Input;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type LicenseTimeline = {
    percentElapsed: number;
    daysRemaining: number;
    color: string;
    label: string;
};

const getLicenseTimeline = (licenseStart?: string, licenseEnd?: string): LicenseTimeline | null => {
    if (!licenseStart || !licenseEnd) return null;

    const start = new Date(licenseStart);
    const end = new Date(licenseEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;

    const now = new Date();
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
    const percentElapsed = (elapsedMs / totalMs) * 100;
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY);

    let color = '#52c41a';
    if (daysRemaining < 0) {
        color = '#ff4d4f';
    } else if (daysRemaining <= 30) {
        color = '#faad14';
    }

    const label =
        daysRemaining < 0
            ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} overdue`
            : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`;

    return {
        percentElapsed: Number(percentElapsed.toFixed(1)),
        daysRemaining,
        color,
        label,
    };
};

// Mobile Card Component for Employee
const EmployeeCard: React.FC<{ data: Employee; token: any; onViewDetails: () => void }> = ({ data, token, onViewDetails }) => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
            <Avatar size="large" src={data.image} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }}>
                {data.employee_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </Avatar>
            <div>
                <Text strong style={{ display: 'block', fontSize: '14px' }}>
                    {data.employee_name}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                    {data.employee_number || data.name}
                </Text>
            </div>
        </Space>

        {data.custom_is_licensed_practitioner && (
            <Tag color="blue" icon={<SafetyCertificateOutlined />} style={{ fontSize: '10px' }}>
                Licensed Practitioner
            </Tag>
        )}

        <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                {data.designation || 'N/A'} • {data.department || 'N/A'}
            </Text>
            {(data.custom_facility_name || data.custom_facility_id) && (
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                    <MedicineBoxOutlined style={{ marginRight: 4 }} />
                    {data.custom_facility_name || 'Unknown Facility'}
                    {data.custom_facility_id ? ` (${data.custom_facility_id})` : ''}
                </Text>
            )}
            {data.professional_cadre && (
                <Tag color="blue" style={{ marginTop: 4, fontSize: '10px' }}>
                    {data.professional_cadre}
                </Tag>
            )}
        </div>

        <div style={{ marginTop: '4px' }}>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                <PhoneOutlined style={{ marginRight: 4 }} />
                {data.cell_number || data.phone || 'No Phone'}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                <MailOutlined style={{ marginRight: 4 }} />
                {data.company_email || data.email || 'No Email'}
            </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
            <Badge status={data.status === 'Active' ? 'success' : 'default'} text={data.status} />
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={onViewDetails}>
                View
            </Button>
        </div>
    </Space>
);

const EmployeeListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile, isTablet } = useResponsive();
    const { company, availableFacilities } = useFacilityStore();

    const [cadreOptions, setCadreOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [departmentOptions, setDepartmentOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Detail drawer state
    const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const {
        employees,
        loading,
        filters,
        fetchEmployees,
        setFilters,
        resetFilters,
        setPage,
        total,
    } = useEmployeeStore();

    const handleRefresh = useCallback(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            await handleRefresh();
            if (isMounted) {
                setInitialLoadComplete(true);
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [filters.search, filters.page, filters.pageSize, filters.status, filters.company, filters.facility, filters.department, filters.cadre]);

    // Keep search input in sync when filters are externally reset.
    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    // Load cadre and department options.
    useEffect(() => {
        const loadOptions = async () => {
            setLoadingOptions(true);
            try {
                const [cadreResponse, deptResponse] = await Promise.all([
                    employeesApi.getCadreOptions(),
                    employeesApi.getDepartments(filters.company)
                ]);

                if (cadreResponse.success && cadreResponse.data) {
                    setCadreOptions(cadreResponse.data);
                }

                if (deptResponse.success && deptResponse.data) {
                    setDepartmentOptions(deptResponse.data);
                }
            } catch (error) {
                console.error('Failed to load options:', error);
            } finally {
                setLoadingOptions(false);
            }
        };
        loadOptions();
    }, [filters.company]);

    // Count active filters
    const activeFiltersCount = [
        filters.status,
        filters.company,
        filters.facility,
        filters.department,
        filters.cadre,
        filters.search
    ].filter(Boolean).length;

    // Table columns
    const columns: ColumnsType<Employee> = [
        {
            title: 'Employee',
            key: 'employee',
            fixed: isMobile ? undefined : 'left',
            width: isMobile ? undefined : 250,
            render: (record: Employee) => (
                <Space size="small">
                    <Avatar size={isMobile ? 'small' : 'default'} src={record.image} icon={<UserOutlined />}>
                        {record.employee_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{record.employee_name}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{record.employee_number || record.name}</Text>
                        {record.custom_is_licensed_practitioner && (
                            <Tag color="blue" icon={<SafetyCertificateOutlined />} style={{ fontSize: '9px', marginTop: 4, width: 'fit-content' }}>
                                Licensed
                            </Tag>
                        )}
                    </div>
                </Space>
            ),
        },
    ];

    // Keep visible columns compact and move secondary details to expandable rows.
    if (!isMobile) {
        columns.push({
            title: 'Facility',
            key: 'facility',
            width: isTablet ? 170 : 210,
            render: (record: Employee) => (
                record.custom_facility_name || record.custom_facility_id ? (
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: '13px' }}>
                            {record.custom_facility_name || 'Unknown Facility'}
                        </Text>
                        {record.custom_facility_id && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                ID: {record.custom_facility_id}
                            </Text>
                        )}
                    </Space>
                ) : (
                    <Text type="secondary">N/A</Text>
                )
            ),
        });

        columns.push({
            title: 'Professional Cadre',
            key: 'cadre',
            width: 160,
            render: (record: Employee) => (
                record.professional_cadre ? (
                    <Tag color="blue" style={{ fontSize: '12px' }}>
                        {record.professional_cadre}
                    </Tag>
                ) : (
                    <Text type="secondary">N/A</Text>
                )
            ),
        });

        columns.push({
            title: 'License Status',
            key: 'license',
            width: 190,
            render: (record: Employee) => {
                if (!record.license_end) {
                    return <Text type="secondary">N/A</Text>;
                }

                const timeline = getLicenseTimeline(record.license_start, record.license_end);

                return (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <LicenseStatusBadge record={record} />
                        {timeline ? (
                            <>
                                <Tooltip title={`${record.license_start} to ${record.license_end}`}>
                                    <Progress
                                        percent={timeline.percentElapsed}
                                        showInfo={false}
                                        size="small"
                                        strokeColor={timeline.color}
                                    />
                                </Tooltip>
                                <Text style={{ fontSize: '11px', color: timeline.color }}>
                                    {timeline.label}
                                </Text>
                            </>
                        ) : (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                Missing start/end dates
                            </Text>
                        )}
                    </Space>
                );
            },
        });

        columns.push({
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Badge status={status === 'Active' ? 'success' : 'default'} text={status} />
            ),
        });

        columns.push({
            title: 'Actions',
            key: 'actions',
            width: 90,
            render: (record: Employee) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedEmployeeId(record.name);
                        setDetailDrawerVisible(true);
                    }}
                >
                    View
                </Button>
            ),
        });
    }

    const renderExpandedEmployeeDetails = (record: Employee) => {
        const timeline = getLicenseTimeline(record.license_start, record.license_end);
        return (
            <div style={{ padding: '8px 8px 6px 48px' }}>
                <Row gutter={[16, 10]}>
                    <Col xs={24} md={12} lg={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Department & Designation</Text>
                        <div>
                            <Text style={{ fontSize: 13 }}>{record.department || 'N/A'}</Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{record.designation || 'N/A'}</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Contact</Text>
                        <div>
                            <Text style={{ fontSize: 12 }}>
                                <PhoneOutlined style={{ marginRight: 6, color: token.colorTextDescription }} />
                                {record.cell_number || record.phone || 'N/A'}
                            </Text>
                        </div>
                        <div>
                            <Text style={{ fontSize: 12 }}>
                                <MailOutlined style={{ marginRight: 6, color: token.colorTextDescription }} />
                                {record.company_email || record.email || 'N/A'}
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>License Period</Text>
                        <div>
                            <Text style={{ fontSize: 12 }}>
                                {record.license_start || 'N/A'} - {record.license_end || 'N/A'}
                            </Text>
                        </div>
                        {timeline && (
                            <>
                                <Progress
                                    percent={timeline.percentElapsed}
                                    showInfo={false}
                                    size="small"
                                    strokeColor={timeline.color}
                                    style={{ maxWidth: 220, marginTop: 4, marginBottom: 2 }}
                                />
                                <Text style={{ fontSize: 11, color: timeline.color }}>
                                    {timeline.label}
                                </Text>
                            </>
                        )}
                    </Col>
                </Row>
            </div>
        );
    };

    return (
        <div style={{ padding: isMobile ? '12px' : '24px' }}>
            <Title level={isMobile ? 4 : 3}>Health Professionals</Title>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space wrap size="middle" style={{ width: '100%' }}>
                        <Search
                            placeholder="Search by name, email, or phone"
                            allowClear
                            enterButton={<SearchOutlined />}
                            size={isMobile ? 'middle' : 'large'}
                            style={{ width: isMobile ? '100%' : 300 }}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onSearch={(value) => setFilters({ search: value.trim() })}
                        />

                        <Select
                            placeholder="Company"
                            allowClear
                            size={isMobile ? 'middle' : 'large'}
                            style={{ width: isMobile ? '100%' : 220 }}
                            value={filters.company}
                            onChange={(value) => {
                                setFilters({
                                    company: value,
                                    facility: undefined,
                                    department: undefined,
                                });
                            }}
                            options={company ? [{ label: company.company_name || company.name, value: company.name }] : []}
                            disabled={!company}
                        />

                        <Select
                            placeholder="Health Facility"
                            allowClear
                            size={isMobile ? 'middle' : 'large'}
                            style={{ width: isMobile ? '100%' : 240 }}
                            value={filters.facility}
                            onChange={(value) => setFilters({ facility: value })}
                            options={availableFacilities.map((facility) => ({
                                label: facility.facility_name,
                                value: facility.hie_id,
                            }))}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />

                        <Select
                            placeholder="Status"
                            allowClear
                            size={isMobile ? 'middle' : 'large'}
                            style={{ width: isMobile ? '100%' : 150 }}
                            value={filters.status}
                            onChange={(value) => setFilters({ status: value })}
                            options={[
                                { label: 'Active', value: 'Active' },
                                { label: 'Left', value: 'Left' },
                                { label: 'Suspended', value: 'Suspended' },
                            ]}
                        />

                        <Select
                            placeholder="Department"
                            allowClear
                            size={isMobile ? 'middle' : 'large'}
                            style={{ width: isMobile ? '100%' : 200 }}
                            value={filters.department}
                            onChange={(value) => setFilters({ department: value })}
                            options={departmentOptions}
                            loading={loadingOptions}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />

                        <Select
                            placeholder="Professional Cadre"
                            allowClear
                            size={isMobile ? 'middle' : 'large'}
                            style={{ width: isMobile ? '100%' : 200 }}
                            value={filters.cadre}
                            onChange={(value) => setFilters({ cadre: value })}
                            options={cadreOptions}
                            loading={loadingOptions}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />

                        <Tooltip title="Refresh">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefresh}
                                loading={loading}
                                size={isMobile ? 'middle' : 'large'}
                            />
                        </Tooltip>

                        {activeFiltersCount > 0 && (
                            <Tooltip title="Clear all filters">
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={() => {
                                        resetFilters();
                                        setSearchInput('');
                                    }}
                                    size={isMobile ? 'middle' : 'large'}
                                >
                                    Clear ({activeFiltersCount})
                                </Button>
                            </Tooltip>
                        )}
                    </Space>

                    <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Total {total} health professionals found
                        </Text>
                    </div>
                </Space>
            </Card>

            {/* Table / Card View */}
            {!initialLoadComplete ? (
                <TableSkeleton />
            ) : employees.length === 0 ? (
                <EmptyState
                    title="No employees found"
                    description="Try adjusting your search or filters"
                />
            ) : isMobile ? (
                <MobileCardView
                    data={employees}
                    renderCard={(employee) => (
                        <EmployeeCard
                            data={employee}
                            token={token}
                            onViewDetails={() => {
                                setSelectedEmployeeId(employee.name);
                                setDetailDrawerVisible(true);
                            }}
                        />
                    )}
                />
            ) : (
                <Card>
                    <Table
                        columns={columns}
                        dataSource={employees}
                        rowKey="name"
                        loading={loading}
                        expandable={{
                            expandedRowRender: renderExpandedEmployeeDetails,
                            rowExpandable: () => true,
                            columnWidth: 44,
                        }}
                        pagination={{
                            current: filters.page,
                            pageSize: 20,
                            total: total,
                            showSizeChanger: false,
                            showTotal: (total) => `Total ${total} health professionals`,
                            onChange: (page) => {
                                setPage(page);
                            },
                        }}
                        tableLayout="fixed"
                        scroll={{ x: isTablet ? 960 : 1120 }}
                    />
                </Card>
            )}

            {/* Detail Drawer */}
            <EmployeeDetailDrawer
                employeeId={selectedEmployeeId}
                visible={detailDrawerVisible}
                onClose={() => {
                    setDetailDrawerVisible(false);
                    setSelectedEmployeeId(null);
                }}
            />
        </div>
    );
};

export default EmployeeListView;
