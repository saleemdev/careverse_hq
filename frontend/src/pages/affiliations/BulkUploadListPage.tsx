import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Table,
    Button,
    Input,
    Space,
    Typography,
    Tag,
    Breadcrumb,
    Row,
    Col,
    Statistic,
    Select,
    Progress,
    theme
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
    HomeOutlined,
    CloudUploadOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import EmptyState from '../../components/shared/EmptyState/EmptyState';

const { Title, Text } = Typography;

interface BulkUploadJob {
    name: string;
    facility: string;
    uploaded_by: string;
    upload_date: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    total_records?: number;
    verified?: number;
    created?: number;
    failed?: number;
}

interface BulkUploadListPageProps {
    navigateToRoute: (route: string, id?: string) => void;
}

const BulkUploadListPage: React.FC<BulkUploadListPageProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const [jobs, setJobs] = useState<BulkUploadJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch all bulk upload jobs
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }

            const response = await fetch('/api/method/frappe.client.get_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    doctype: 'Bulk Health Worker Upload',
                    fields: ['name', 'facility', 'uploaded_by', 'upload_date', 'status', 'started_at', 'completed_at'],
                    filters: filters,
                    order_by: 'creation desc',
                    limit_page_length: 100
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch upload jobs');
            }

            const result = await response.json();
            const jobsData = result.data || [];

            // Fetch item counts for each job
            const jobsWithCounts = await Promise.all(
                jobsData.map(async (job: BulkUploadJob) => {
                    try {
                        const itemsResponse = await fetch('/api/method/frappe.client.get_list', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Frappe-CSRF-Token': (window as any).csrf_token
                            },
                            body: JSON.stringify({
                                doctype: 'Bulk Health Worker Upload Item',
                                fields: ['verification_status', 'onboarding_status'],
                                filters: { parent: job.name },
                                limit_page_length: 1000
                            })
                        });

                        if (itemsResponse.ok) {
                            const itemsResult = await itemsResponse.json();
                            const items = itemsResult.data || [];

                            job.total_records = items.length;
                            job.verified = items.filter((i: any) => i.verification_status === 'Verified').length;
                            job.created = items.filter((i: any) => i.onboarding_status === 'Success').length;
                            job.failed = items.filter((i: any) => i.onboarding_status === 'Failed').length;
                        }
                    } catch (error) {
                        console.error(`Error fetching items for job ${job.name}:`, error);
                    }

                    return job;
                })
            );

            setJobs(jobsWithCounts);
        } catch (error: any) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'success';
            case 'processing':
                return 'processing';
            case 'queued':
                return 'default';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return <CheckCircleOutlined />;
            case 'processing':
                return <SyncOutlined spin />;
            case 'queued':
                return <ClockCircleOutlined />;
            case 'failed':
                return <CloseCircleOutlined />;
            default:
                return <FileTextOutlined />;
        }
    };

    // Calculate progress
    const getProgress = (job: BulkUploadJob) => {
        if (!job.total_records || job.total_records === 0) return 0;
        const processed = (job.verified || 0) + (job.failed || 0);
        return Math.round((processed / job.total_records) * 100);
    };

    // Filter jobs by search text
    const getFilteredJobs = () => {
        if (!searchText) return jobs;

        return jobs.filter(job =>
            job.name.toLowerCase().includes(searchText.toLowerCase()) ||
            job.facility.toLowerCase().includes(searchText.toLowerCase()) ||
            job.uploaded_by.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    // Calculate summary statistics
    const getSummaryStats = () => {
        const total = jobs.length;
        const active = jobs.filter(j => j.status === 'Queued' || j.status === 'Processing').length;
        const completed = jobs.filter(j => j.status === 'Completed').length;
        const failed = jobs.filter(j => j.status === 'Failed').length;

        return { total, active, completed, failed };
    };

    const stats = getSummaryStats();

    // Table columns
    const columns: ColumnsType<BulkUploadJob> = [
        {
            title: 'Job ID',
            dataIndex: 'name',
            key: 'name',
            width: 180,
            fixed: 'left',
            render: (name: string) => (
                <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {name}
                </Text>
            )
        },
        {
            title: 'Facility',
            dataIndex: 'facility',
            key: 'facility',
            width: 200,
            render: (facility: string) => <Text>{facility}</Text>
        },
        {
            title: 'Uploaded By',
            dataIndex: 'uploaded_by',
            key: 'uploaded_by',
            width: 180
        },
        {
            title: 'Date',
            dataIndex: 'upload_date',
            key: 'upload_date',
            width: 180,
            render: (date: string) => date ? new Date(date).toLocaleString() : '-'
        },
        {
            title: 'Total Records',
            dataIndex: 'total_records',
            key: 'total_records',
            width: 120,
            align: 'center',
            render: (count: number) => <Text strong>{count || 0}</Text>
        },
        {
            title: 'Progress',
            key: 'progress',
            width: 180,
            render: (record: BulkUploadJob) => {
                const progress = getProgress(record);
                return (
                    <Progress
                        percent={progress}
                        size="small"
                        status={
                            record.status === 'Completed' ? 'success' :
                            record.status === 'Failed' ? 'exception' :
                            'active'
                        }
                    />
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status: string) => (
                <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
                    {status || 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (record: BulkUploadJob) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigateToRoute('bulk-upload/status', record.name)}
                >
                    View Details
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: 24 }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <CloudUploadOutlined /> Bulk Upload
                </Breadcrumb.Item>
            </Breadcrumb>

            {/* Summary Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Total Uploads"
                            value={stats.total}
                            prefix={<FileTextOutlined style={{ color: token.colorPrimary }} />}
                            valueStyle={{ color: token.colorPrimary }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Active Jobs"
                            value={stats.active}
                            prefix={<SyncOutlined style={{ color: token.colorWarning }} />}
                            valueStyle={{ color: token.colorWarning }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Completed"
                            value={stats.completed}
                            prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Failed"
                            value={stats.failed}
                            prefix={<CloseCircleOutlined style={{ color: token.colorError }} />}
                            valueStyle={{ color: token.colorError }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Main Card */}
            <Card
                style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
                            <CloudUploadOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                            Bulk Health Worker Upload
                        </Title>
                        <Text type="secondary">
                            Upload and validate health worker data in bulk
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => navigateToRoute('bulk-upload/new')}
                    >
                        New Upload
                    </Button>
                </div>

                {/* Filters */}
                <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Space wrap>
                        <Input
                            placeholder="Search by Job ID or Facility..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 150 }}
                            options={[
                                { label: 'All Status', value: 'all' },
                                { label: 'Queued', value: 'Queued' },
                                { label: 'Processing', value: 'Processing' },
                                { label: 'Completed', value: 'Completed' },
                                { label: 'Failed', value: 'Failed' }
                            ]}
                        />
                    </Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchJobs}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </Space>

                {/* Table */}
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
                        pagination={{
                            pageSize: 20,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} jobs`
                        }}
                        scroll={{ x: 'max-content' }}
                    />
                )}
            </Card>
        </div>
    );
};

export default BulkUploadListPage;
