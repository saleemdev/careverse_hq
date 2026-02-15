import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Card,
    Table,
    Button,
    Input,
    Space,
    Typography,
    Tag,
    Row,
    Col,
    Progress,
    theme,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    CloudUploadOutlined,
    FileTextOutlined,
    FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType, FilterValue, SorterResult } from 'antd/es/table/interface';
import type { TablePaginationConfig } from 'antd/es/table';
import EmptyState from '../../components/shared/EmptyState/EmptyState';

const { Title, Text } = Typography;

interface BulkUploadJob {
    name: string;
    facility: string;
    facility_name: string;
    facility_id: string;
    uploaded_by: string;
    upload_date: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    total_records?: number;
    verified?: number;
    created?: number;
    failed?: number;
    pending?: number;
}

interface BulkUploadListPageProps {
    navigateToRoute: (route: string, id?: string) => void;
}

const BulkUploadListPage: React.FC<BulkUploadListPageProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const [jobs, setJobs] = useState<BulkUploadJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
    const [sortedInfo, setSortedInfo] = useState<SorterResult<BulkUploadJob>>({});
    const formatDateTime = (date?: string) => {
        if (!date) return '-';
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return '-';
        return parsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fetch all bulk upload jobs
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('per_page', '100');

            const response = await fetch(
                `/api/method/careverse_hq.api.bulk_health_worker_onboarding.get_bulk_upload_jobs?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Frappe-CSRF-Token': (window as any).csrf_token
                    },
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch upload jobs');
            }

            const result = await response.json();

            if (result.status === 'success') {
                setJobs(result.data.jobs || []);
            } else {
                throw new Error(result.message || 'Failed to fetch upload jobs');
            }
        } catch (error: any) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Get status properties
    const getStatusProps = (status: string) => {
        const statusMap = {
            completed: { color: 'success', icon: <CheckCircleOutlined /> },
            processing: { color: 'processing', icon: <SyncOutlined spin /> },
            queued: { color: 'default', icon: <ClockCircleOutlined /> },
            failed: { color: 'error', icon: <CloseCircleOutlined /> }
        };
        return statusMap[status?.toLowerCase() as keyof typeof statusMap] ||
               { color: 'default', icon: <FileTextOutlined /> };
    };

    // Calculate progress
    const getProgress = (job: BulkUploadJob) => {
        if (!job.total_records || job.total_records === 0) return 0;
        const pending = job.pending || 0;
        const processed = job.total_records - pending;
        return Math.round((processed / job.total_records) * 100);
    };

    // Get unique values for filters - memoized to prevent filter dropdown issues
    const statusFilters = useMemo(() => {
        const statuses = Array.from(new Set(jobs.map(job => job.status))).sort();
        return statuses.map(status => ({ text: status, value: status }));
    }, [jobs]);

    const facilityFilters = useMemo(() => {
        const facilities = Array.from(
            new Set(jobs.map((job) => (job.facility_name || '').trim() || 'Unknown Facility'))
        ).sort();
        return facilities.map(facility => ({ text: facility, value: facility }));
    }, [jobs]);

    // Filter jobs by search text
    const getFilteredJobs = () => {
        if (!searchText) return jobs;
        const search = searchText.toLowerCase();
        return jobs.filter(job =>
            job.name.toLowerCase().includes(search) ||
            (job.facility_name || '').toLowerCase().includes(search) ||
            (job.facility_id || '').toLowerCase().includes(search) ||
            (job.facility || '').toLowerCase().includes(search) ||
            job.uploaded_by.toLowerCase().includes(search)
        );
    };

    // Handle table changes
    const handleTableChange = (
        pagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<BulkUploadJob> | SorterResult<BulkUploadJob>[]
    ) => {
        setFilteredInfo(filters);
        setSortedInfo(sorter as SorterResult<BulkUploadJob>);
    };

    // Table columns with advanced features
    const columns: ColumnsType<BulkUploadJob> = [
        {
            title: 'Upload Job',
            dataIndex: 'name',
            key: 'name',
            width: 220,
            fixed: 'left',
            sorter: (a, b) => a.name.localeCompare(b.name),
            sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
            render: (name: string, record: BulkUploadJob) => (
                <Space direction="vertical" size={0}>
                    <Text
                        className="admin-detail"
                        style={{
                            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                            fontSize: 11,
                            color: token.colorTextTertiary,
                            opacity: 0.75
                        }}
                    >
                        {name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(record.upload_date)}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Facility',
            dataIndex: 'facility_name',
            key: 'facility_name',
            width: 240,
            filters: facilityFilters,
            filteredValue: filteredInfo.facility_name || null,
            onFilter: (value, record) => (((record.facility_name || '').trim() || 'Unknown Facility') === value),
            sorter: (a, b) =>
                (((a.facility_name || '').trim() || 'Unknown Facility')).localeCompare(((b.facility_name || '').trim() || 'Unknown Facility')),
            sortOrder: sortedInfo.columnKey === 'facility_name' ? sortedInfo.order : null,
            render: (facility_name: string, record: BulkUploadJob) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 14 }}>
                        {(facility_name || '').trim() || 'Unknown Facility'}
                    </Text>
                    {(record.facility_id || record.facility) && (
                        <Text
                            type="secondary"
                            className="admin-detail"
                            style={{
                                fontSize: 11,
                                fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                                opacity: 0.6
                            }}
                        >
                            ID: {record.facility_id || record.facility}
                        </Text>
                    )}
                </Space>
            )
        },
        {
            title: 'Records',
            dataIndex: 'total_records',
            key: 'total_records',
            width: 100,
            align: 'center',
            sorter: (a, b) => (a.total_records || 0) - (b.total_records || 0),
            sortOrder: sortedInfo.columnKey === 'total_records' ? sortedInfo.order : null,
            render: (count: number) => (
                <Text strong style={{ fontSize: 15, color: token.colorPrimary }}>
                    {count?.toLocaleString() || 0}
                </Text>
            )
        },
        {
            title: 'Progress',
            key: 'progress',
            width: 200,
            sorter: (a, b) => getProgress(a) - getProgress(b),
            sortOrder: sortedInfo.columnKey === 'progress' ? sortedInfo.order : null,
            render: (record: BulkUploadJob) => {
                const progress = getProgress(record);
                const pending = record.pending || 0;
                const verified = record.verified || 0;
                const created = record.created || 0;

                return (
                    <Tooltip
                        title={
                            <div>
                                <div>Verified: {verified}</div>
                                <div>Onboarded: {created}</div>
                                <div>Pending: {pending}</div>
                            </div>
                        }
                    >
                        <Progress
                            percent={progress}
                            size="small"
                            strokeColor={{
                                '0%': 'rgba(24, 144, 255, 0.5)',
                                '100%': 'rgba(24, 144, 255, 1)'
                            }}
                            trailColor="rgba(0, 0, 0, 0.04)"
                            status={
                                record.status === 'Completed' ? 'success' :
                                record.status === 'Failed' ? 'exception' :
                                progress === 100 ? 'success' :
                                'active'
                            }
                            style={{ marginBottom: 0 }}
                        />
                    </Tooltip>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            filters: statusFilters,
            filteredValue: filteredInfo.status || null,
            onFilter: (value, record) => record.status === value,
            render: (status: string) => {
                const props = getStatusProps(status);
                return (
                    <Tag
                        color={props.color}
                        icon={props.icon}
                        style={{
                            borderRadius: 6,
                            padding: '2px 10px',
                            fontSize: 12,
                            border: 'none'
                        }}
                    >
                        {status || 'Pending'}
                    </Tag>
                );
            }
        },
        {
            title: '',
            key: 'actions',
            fixed: 'right',
            width: 60,
            render: (record: BulkUploadJob) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => navigateToRoute('bulk-upload/status', record.name)}
                    style={{
                        color: token.colorPrimary,
                        transition: 'all 0.2s ease'
                    }}
                />
            )
        }
    ];

    const renderExpandedJobDetails = (record: BulkUploadJob) => (
        <div style={{ padding: '8px 8px 6px 40px' }}>
            <Row gutter={[16, 12]}>
                <Col xs={24} md={12} lg={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Submitted By</Text>
                    <div>
                        <Text style={{ fontSize: 13 }}>{record.uploaded_by || '-'}</Text>
                    </div>
                    <div style={{ marginTop: 6 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Facility Reference</Text>
                    </div>
                    <div>
                        <Text style={{ fontSize: 12 }}>{record.facility_id || record.facility || '-'}</Text>
                    </div>
                </Col>

                <Col xs={24} md={12} lg={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Timeline</Text>
                    <div>
                        <Text style={{ fontSize: 12 }}>Uploaded: {formatDateTime(record.upload_date)}</Text>
                    </div>
                    <div>
                        <Text style={{ fontSize: 12 }}>Started: {formatDateTime(record.started_at)}</Text>
                    </div>
                    <div>
                        <Text style={{ fontSize: 12 }}>Completed: {formatDateTime(record.completed_at)}</Text>
                    </div>
                </Col>

                <Col xs={24} md={24} lg={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Processing Breakdown</Text>
                    <div style={{ marginTop: 6 }}>
                        <Space wrap size={[8, 8]}>
                            <Tag color="blue">Total: {record.total_records || 0}</Tag>
                            <Tag color="processing">Verified: {record.verified || 0}</Tag>
                            <Tag color="success">Onboarded: {record.created || 0}</Tag>
                            <Tag color="error">Failed: {record.failed || 0}</Tag>
                            <Tag color="warning">Pending: {record.pending || 0}</Tag>
                        </Space>
                    </div>
                </Col>
            </Row>
        </div>
    );

    return (
        <div style={{
            padding: '32px 24px',
            background: `
                radial-gradient(circle at 20% 30%, rgba(24, 144, 255, 0.02) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(24, 144, 255, 0.015) 0%, transparent 50%),
                ${token.colorBgLayout}
            `,
            minHeight: '100vh'
        }}>
            {/* Header Section - Proximity & Continuity */}
            <div style={{ marginBottom: 20 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 0,
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <Title
                            level={2}
                            style={{
                                margin: 0,
                                marginBottom: 8,
                                fontSize: 28,
                                fontWeight: 600,
                                color: token.colorText,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 12
                            }}
                        >
                            <CloudUploadOutlined style={{
                                opacity: 0.5,
                                color: token.colorTextTertiary
                            }} />
                            Bulk Health Worker Upload
                        </Title>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 14,
                                display: 'block',
                                marginTop: 4
                            }}
                        >
                            Upload and validate health worker data in bulk
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => navigateToRoute('bulk-upload/new')}
                        style={{
                            borderRadius: 8,
                            height: 44,
                            paddingLeft: 24,
                            paddingRight: 24,
                            fontWeight: 500,
                            boxShadow: `0 4px 12px ${token.colorPrimary}25`
                        }}
                    >
                        New Upload
                    </Button>
                </div>
            </div>

            {/* Main Content Card - Figure/Ground */}
            <Card
                bordered={false}
                style={{
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(18px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)'
                }}
                bodyStyle={{ padding: 0 }}
            >
                {/* Search and Filter Bar */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`
                }}>
                    <Space
                        style={{
                            width: '100%',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap'
                        }}
                    >
                        <Input
                            placeholder="Search jobs, facilities, or users..."
                            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{
                                width: 320,
                                borderRadius: 8
                            }}
                        />
                        <Space>
                            <Tooltip title="Use table column filters for advanced filtering">
                                <Button
                                    icon={<FilterOutlined />}
                                    style={{ borderRadius: 8 }}
                                    type={Object.keys(filteredInfo).filter(key => filteredInfo[key]).length > 0 ? 'primary' : 'default'}
                                >
                                    {Object.keys(filteredInfo).filter(key => filteredInfo[key]).length} Filters
                                </Button>
                            </Tooltip>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchJobs}
                                loading={loading}
                                style={{ borderRadius: 8 }}
                            >
                                Refresh
                            </Button>
                        </Space>
                    </Space>
                </div>

                {/* Table */}
                <div style={{ padding: 24 }}>
                    {jobs.length === 0 && !loading ? (
                        <EmptyState
                            type="no-data"
                            title="No Upload Jobs Yet"
                            description="Start by uploading your first batch of health worker data"
                            onAction={() => navigateToRoute('bulk-upload/new')}
                            actionText="Create First Upload"
                        />
                    ) : (
                        <Table
                            dataSource={getFilteredJobs()}
                            columns={columns}
                            rowKey="name"
                            loading={loading}
                            expandable={{
                                expandedRowRender: renderExpandedJobDetails,
                                rowExpandable: () => true,
                                columnWidth: 44
                            }}
                            onChange={handleTableChange}
                            pagination={{
                                pageSize: 20,
                                showSizeChanger: true,
                                showTotal: (total) => (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {total} {total === 1 ? 'job' : 'jobs'}
                                    </Text>
                                ),
                                style: { marginTop: 16 }
                            }}
                            tableLayout="fixed"
                            scroll={{ x: 1040 }}
                            style={{
                                borderRadius: 8
                            }}
                            rowClassName={() => 'table-row-hover'}
                        />
                    )}
                </div>
            </Card>

            <style>{`
                .table-row-hover:hover {
                    background: ${token.colorBgTextHover} !important;
                    transition: background 0.2s ease;
                }
                .ant-table-thead > tr > th {
                    background: ${token.colorBgContainer} !important;
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: ${token.colorTextSecondary} !important;
                    border-bottom: 2px solid ${token.colorBorderSecondary} !important;
                }
                .ant-table-cell {
                    padding: 16px !important;
                }
            `}</style>
        </div>
    );
};

export default BulkUploadListPage;
