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
    facility_name: string;
    facility_id: string;
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
            // Use new custom API endpoint that fetches job + items efficiently
            const response = await fetch(
                `/api/method/careverse_hq.api.bulk_health_worker_onboarding.get_bulk_upload_job_details?job_id=${jobId}`,
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
                throw new Error(errorData.message || 'Failed to fetch job details');
            }

            const result = await response.json();

            // Handle standardized API response format
            if (result.status === 'success') {
                const jobData = result.data;

                // Set job details
                setJob({
                    name: jobData.name,
                    facility: jobData.facility,
                    facility_name: jobData.facility_name || jobData.facility,
                    facility_id: jobData.facility_id || '',
                    uploaded_by: jobData.uploaded_by,
                    status: jobData.status,
                    creation: jobData.creation,
                    started_at: jobData.started_at,
                    completed_at: jobData.completed_at
                });

                // Set items
                setItems(jobData.items || []);

                // Stop auto-refresh if job is completed
                if (jobData.status === 'Completed' || jobData.status === 'Failed') {
                    setAutoRefresh(false);
                }
            } else {
                throw new Error(result.message || 'Failed to fetch job details');
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
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 16,
                    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.1)',
                    marginBottom: 24
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Metadata Section - Subtle Glass Inset */}
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.02)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderRadius: 12,
                        padding: 16,
                        border: '1px solid rgba(0, 0, 0, 0.04)'
                    }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Text className="admin-detail" style={{
                                fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                                fontSize: 11,
                                opacity: 0.7
                            }}>
                                Job ID: {jobId}
                            </Text>
                            <Text className="admin-detail" style={{
                                fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                                fontSize: 11,
                                opacity: 0.7
                            }}>
                                Facility: {job?.facility_name || job?.facility}
                                {job?.facility_id && ` (${job.facility_id})`}
                            </Text>
                            <Text className="admin-detail" style={{
                                fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                                fontSize: 11,
                                opacity: 0.7
                            }}>
                                Uploaded by: {job?.uploaded_by} | {job?.creation ? new Date(job.creation).toLocaleString() : '-'}
                            </Text>
                        </Space>
                    </div>

                    {/* Status and Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={4} style={{ margin: 0 }}>
                            Upload Status
                        </Title>
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
                            strokeColor={{
                                '0%': 'rgba(24, 144, 255, 0.6)',
                                '100%': 'rgba(24, 144, 255, 1)'
                            }}
                            trailColor="rgba(0, 0, 0, 0.04)"
                            strokeWidth={10}
                            status={
                                job?.status === 'Completed' ? 'success' :
                                job?.status === 'Failed' ? 'exception' :
                                'active'
                            }
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
                    <Card style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
                    }}>
                        <Statistic
                            title="Total"
                            value={stats.total}
                            prefix={
                                <FileTextOutlined style={{
                                    color: token.colorPrimary,
                                    fontSize: 18,
                                    opacity: 0.7
                                }} />
                            }
                            valueStyle={{
                                color: token.colorText,
                                fontSize: 24,
                                fontWeight: 600
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
                    }}>
                        <Statistic
                            title="Verified"
                            value={stats.verified}
                            prefix={
                                <CheckCircleOutlined style={{
                                    color: token.colorSuccess,
                                    fontSize: 18,
                                    opacity: 0.7
                                }} />
                            }
                            valueStyle={{
                                color: token.colorText,
                                fontSize: 24,
                                fontWeight: 600
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
                    }}>
                        <Statistic
                            title="Created"
                            value={stats.created}
                            prefix={
                                <CheckCircleOutlined style={{
                                    color: token.colorSuccess,
                                    fontSize: 18,
                                    opacity: 0.7
                                }} />
                            }
                            valueStyle={{
                                color: token.colorText,
                                fontSize: 24,
                                fontWeight: 600
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
                    }}>
                        <Statistic
                            title="Pending"
                            value={stats.pending}
                            prefix={
                                <ClockCircleOutlined style={{
                                    color: token.colorWarning,
                                    fontSize: 18,
                                    opacity: 0.7
                                }} />
                            }
                            valueStyle={{
                                color: token.colorText,
                                fontSize: 24,
                                fontWeight: 600
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
                    }}>
                        <Statistic
                            title="Ver. Failed"
                            value={stats.verificationFailed}
                            prefix={
                                <CloseCircleOutlined style={{
                                    color: token.colorError,
                                    fontSize: 18,
                                    opacity: 0.7
                                }} />
                            }
                            valueStyle={{
                                color: token.colorText,
                                fontSize: 24,
                                fontWeight: 600
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
                    }}>
                        <Statistic
                            title="Failed"
                            value={stats.failed}
                            prefix={
                                <CloseCircleOutlined style={{
                                    color: token.colorError,
                                    fontSize: 18,
                                    opacity: 0.7
                                }} />
                            }
                            valueStyle={{
                                color: token.colorText,
                                fontSize: 24,
                                fontWeight: 600
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Records Table */}
            <Card
                className="glass-card-standard"
                style={{
                    borderRadius: 16,
                    overflow: 'hidden'
                }}
                title={
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        margin: '-24px -24px 0',
                        padding: '16px 24px',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12
                    }}>
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
                    className="glass-table"
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
