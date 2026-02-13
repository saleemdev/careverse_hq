import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Table,
    Progress,
    Tag,
    Typography,
    Space,
    Button,
    Statistic,
    Row,
    Col,
    Alert,
    Select,
    Breadcrumb,
    Spin,
    theme
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    HomeOutlined,
    LinkOutlined,
    FileTextOutlined,
    SyncOutlined,
    CloudUploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface BulkUploadItem {
    name: string;
    identification_number: string;
    identification_type: string;
    employment_type: string;
    designation: string;
    verification_status: string;
    verification_error?: string;
    onboarding_status: string;
    onboarding_error?: string;
}

interface BulkUploadJob {
    name: string;
    facility: string;
    uploaded_by: string;
    status: string;
    creation: string;
    started_at?: string;
    completed_at?: string;
}

interface StatusDashboardProps {
    jobId: string;
    navigateToRoute: (route: string, id?: string) => void;
}

const StatusDashboard: React.FC<StatusDashboardProps> = ({ jobId, navigateToRoute }) => {
    const { token } = theme.useToken();
    const [job, setJob] = useState<BulkUploadJob | null>(null);
    const [items, setItems] = useState<BulkUploadItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    // Fetch job details
    const fetchJobDetails = useCallback(async (isAutoRefresh = false) => {
        if (isAutoRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            // Fetch parent job
            const jobResponse = await fetch('/api/method/frappe.client.get', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    doctype: 'Bulk Health Worker Upload',
                    name: jobId
                })
            });

            if (!jobResponse.ok) {
                throw new Error('Failed to fetch job details');
            }

            const jobResult = await jobResponse.json();
            setJob(jobResult.data);

            // Fetch child items
            const itemsResponse = await fetch('/api/method/frappe.client.get_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    doctype: 'Bulk Health Worker Upload Item',
                    filters: { parent: jobId },
                    fields: ['*'],
                    limit_page_length: 1000
                })
            });

            if (!itemsResponse.ok) {
                throw new Error('Failed to fetch items');
            }

            const itemsResult = await itemsResponse.json();
            setItems(itemsResult.data);

            // Stop auto-refresh if job is completed
            if (jobResult.data.status === 'Completed' || jobResult.data.status === 'Failed') {
                setAutoRefresh(false);
            }

        } catch (error: any) {
            console.error('Error fetching job details:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [jobId]);

    // Initial fetch
    useEffect(() => {
        fetchJobDetails();
    }, [fetchJobDetails]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (!autoRefresh || !job || job.status === 'Completed') {
            return;
        }

        const interval = setInterval(() => {
            fetchJobDetails(true);
        }, 10000);

        return () => clearInterval(interval);
    }, [autoRefresh, job, fetchJobDetails]);

    // Calculate statistics
    const getStatistics = () => {
        const total = items.length;
        const verified = items.filter(i => i.verification_status === 'Verified').length;
        const verificationFailed = items.filter(i => i.verification_status === 'Failed').length;
        const created = items.filter(i => i.onboarding_status === 'Success').length;
        const failed = items.filter(i => i.onboarding_status === 'Failed').length;
        const pending = items.filter(i => i.verification_status === 'Pending' || i.onboarding_status === 'Pending').length;

        const progress = total > 0 ? ((verified + verificationFailed) / total) * 100 : 0;

        return { total, verified, verificationFailed, created, failed, pending, progress };
    };

    const stats = getStatistics();

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'verified':
            case 'success':
            case 'created':
            case 'active':
                return 'success';
            case 'pending':
            case 'queued':
            case 'processing':
                return 'processing';
            case 'failed':
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    // Filter items
    const getFilteredItems = () => {
        switch (filter) {
            case 'verified':
                return items.filter(i => i.verification_status === 'Verified');
            case 'verification-failed':
                return items.filter(i => i.verification_status === 'Failed');
            case 'created':
                return items.filter(i => i.onboarding_status === 'Success');
            case 'failed':
                return items.filter(i => i.onboarding_status === 'Failed');
            case 'pending':
                return items.filter(i => i.verification_status === 'Pending' || i.onboarding_status === 'Pending');
            default:
                return items;
        }
    };

    // Table columns
    const columns: ColumnsType<BulkUploadItem> = [
        {
            title: 'Row',
            key: 'index',
            width: 60,
            render: (_: any, __: any, index: number) => index + 1
        },
        {
            title: 'ID Number',
            dataIndex: 'identification_number',
            key: 'id_number',
            width: 150
        },
        {
            title: 'ID Type',
            dataIndex: 'identification_type',
            key: 'id_type',
            width: 120
        },
        {
            title: 'Employment',
            dataIndex: 'employment_type',
            key: 'employment',
            width: 120
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            width: 130
        },
        {
            title: 'Verification',
            dataIndex: 'verification_status',
            key: 'verification',
            width: 130,
            render: (status: string) => (
                <Tag
                    color={getStatusColor(status)}
                    icon={
                        status === 'Verified' ? <CheckCircleOutlined /> :
                        status === 'Failed' ? <CloseCircleOutlined /> :
                        <ClockCircleOutlined />
                    }
                >
                    {status || 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Onboarding',
            dataIndex: 'onboarding_status',
            key: 'onboarding',
            width: 130,
            render: (status: string) => (
                <Tag
                    color={getStatusColor(status)}
                    icon={
                        status === 'Success' ? <CheckCircleOutlined /> :
                        status === 'Failed' ? <CloseCircleOutlined /> :
                        <ClockCircleOutlined />
                    }
                >
                    {status || 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Error Message',
            key: 'error',
            width: 300,
            render: (record: BulkUploadItem) => {
                const error = record.verification_error || record.onboarding_error;
                return error ? (
                    <Text type="danger" style={{ fontSize: 12 }}>{error}</Text>
                ) : (
                    <Text type="secondary">-</Text>
                );
            }
        }
    ];

    if (loading && !job) {
        return (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: 24 }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <a onClick={() => navigateToRoute('bulk-upload')}>
                        <CloudUploadOutlined /> Bulk Upload
                    </a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>Job Details</Breadcrumb.Item>
            </Breadcrumb>

            {/* Job Details Card */}
            <Card
                style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    marginBottom: 24
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                                <FileTextOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                                Upload Job: {jobId}
                            </Title>
                            <Text type="secondary">
                                Facility: {job?.facility} | Uploaded by: {job?.uploaded_by}
                            </Text>
                        </div>
                        <Space>
                            <Tag
                                color={getStatusColor(job?.status || '')}
                                icon={
                                    job?.status === 'Completed' ? <CheckCircleOutlined /> :
                                    job?.status === 'Processing' ? <SyncOutlined spin /> :
                                    <ClockCircleOutlined />
                                }
                                style={{ fontSize: 14, padding: '4px 12px' }}
                            >
                                {job?.status || 'Pending'}
                            </Tag>
                            <Button
                                icon={<ReloadOutlined spin={refreshing} />}
                                onClick={() => fetchJobDetails()}
                                disabled={refreshing}
                            >
                                Refresh
                            </Button>
                        </Space>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <Text strong style={{ marginBottom: 8, display: 'block' }}>Processing Progress</Text>
                        <Progress
                            percent={Math.round(stats.progress)}
                            status={
                                job?.status === 'Completed' ? 'success' :
                                job?.status === 'Failed' ? 'exception' :
                                'active'
                            }
                            strokeColor={token.colorPrimary}
                        />
                    </div>

                    {/* Auto-refresh notice */}
                    {autoRefresh && job?.status !== 'Completed' && (
                        <Alert
                            message="Auto-refreshing every 10 seconds"
                            type="info"
                            showIcon
                            icon={<SyncOutlined spin />}
                        />
                    )}
                </Space>
            </Card>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Total"
                            value={stats.total}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: token.colorPrimary }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Verified"
                            value={stats.verified}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Created"
                            value={stats.created}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Pending"
                            value={stats.pending}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: token.colorWarning }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Ver. Failed"
                            value={stats.verificationFailed}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: token.colorError }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Failed"
                            value={stats.failed}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: token.colorError }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Records Table */}
            <Card
                style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <Text strong style={{ fontSize: 16 }}>Upload Records</Text>
                        <Select
                            value={filter}
                            onChange={setFilter}
                            style={{ width: 200 }}
                            options={[
                                { label: 'All Records', value: 'all' },
                                { label: 'Verified', value: 'verified' },
                                { label: 'Verification Failed', value: 'verification-failed' },
                                { label: 'Affiliations Created', value: 'created' },
                                { label: 'Failed', value: 'failed' },
                                { label: 'Pending', value: 'pending' }
                            ]}
                        />
                    </div>
                }
            >
                <Table
                    dataSource={getFilteredItems()}
                    columns={columns}
                    rowKey="name"
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} records`
                    }}
                    scroll={{ x: 'max-content' }}
                    size="small"
                    loading={loading}
                    rowClassName={(record) => {
                        if (record.affiliation_status === 'Failed' || record.verification_status === 'Failed') {
                            return 'error-row';
                        }
                        return '';
                    }}
                />
            </Card>
        </div>
    );
};

export default StatusDashboard;
