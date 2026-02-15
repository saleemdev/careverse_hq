import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Table,
    Progress,
    Tag,
    Typography,
    Space,
    Button,
    Row,
    Col,
    Breadcrumb,
    Spin,
    Input,
    Tooltip,
    theme
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    HomeOutlined,
    FileTextOutlined,
    SyncOutlined,
    SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface BulkUploadItem {
    name: string;
    row_number: number;
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
    items: BulkUploadItem[];
}

interface BulkUploadDetailViewProps {
    jobId: string;
    navigateToRoute: (route: string, id?: string) => void;
}

const BulkUploadDetailView: React.FC<BulkUploadDetailViewProps> = ({ jobId, navigateToRoute }) => {
    const { token } = theme.useToken();
    const [job, setJob] = useState<BulkUploadJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchText, setSearchText] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Fetch job details
    const fetchJobDetails = useCallback(async (isAutoRefresh = false) => {
        if (isAutoRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
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

            // Check if response is wrapped in 'message' key (Frappe sometimes does this)
            const actualResult = result.message || result;

            if (actualResult.status === 'success') {
                const jobData = actualResult.data;

                setJob({
                    name: jobData.name,
                    facility: jobData.facility,
                    facility_name: jobData.facility_name || jobData.facility,
                    facility_id: jobData.facility_id || '',
                    uploaded_by: jobData.uploaded_by,
                    status: jobData.status,
                    creation: jobData.creation,
                    started_at: jobData.started_at,
                    completed_at: jobData.completed_at,
                    items: jobData.items || []
                });

                // Stop auto-refresh if job is completed or failed
                if (jobData.status === 'Completed' || jobData.status === 'Failed') {
                    setAutoRefresh(false);
                }
            } else {
                throw new Error(actualResult.message || 'Failed to fetch job details');
            }

        } catch (err: any) {
            console.error('Error fetching job details:', err);
            setError(err.message || 'Failed to load job details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [jobId]);

    // Initial fetch
    useEffect(() => {
        fetchJobDetails();
    }, [fetchJobDetails]);

    // Auto-refresh every 10 seconds when processing
    useEffect(() => {
        if (!autoRefresh || !job || job.status === 'Completed' || job.status === 'Failed') {
            return;
        }

        const interval = setInterval(() => {
            fetchJobDetails(true);
        }, 10000);

        return () => clearInterval(interval);
    }, [autoRefresh, job, fetchJobDetails]);

    // Calculate progress
    const getProgress = () => {
        if (!job || !job.items.length) return { percentage: 0, processed: 0, total: 0 };

        const total = job.items.length;
        const verified = job.items.filter(i => i.verification_status === 'Verified').length;
        const verificationFailed = job.items.filter(i => i.verification_status === 'Failed').length;
        const processed = verified + verificationFailed;
        const percentage = Math.round((processed / total) * 100);

        return { percentage, processed, total };
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'verified':
            case 'success':
                return 'success';
            case 'pending':
            case 'queued':
                return 'default';
            case 'processing':
                return 'processing';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    };

    // Get progress status for progress bar
    const getProgressStatus = () => {
        if (!job) return 'normal';
        switch (job.status) {
            case 'Completed':
                return 'success';
            case 'Failed':
                return 'exception';
            case 'Processing':
                return 'active';
            default:
                return 'normal';
        }
    };

    // Filter and search items
    const getFilteredItems = () => {
        if (!job) return [];

        let filtered = job.items;

        // Apply status filter
        switch (filter) {
            case 'verified':
                filtered = filtered.filter(i => i.verification_status === 'Verified');
                break;
            case 'verification-failed':
                filtered = filtered.filter(i => i.verification_status === 'Failed');
                break;
            case 'created':
                filtered = filtered.filter(i => i.onboarding_status === 'Success');
                break;
            case 'failed':
                filtered = filtered.filter(i => i.onboarding_status === 'Failed');
                break;
            case 'pending':
                filtered = filtered.filter(i =>
                    i.verification_status === 'Pending' || i.onboarding_status === 'Pending'
                );
                break;
            default:
                break;
        }

        // Apply search filter
        if (searchText) {
            const search = searchText.toLowerCase();
            filtered = filtered.filter(i =>
                i.identification_number?.toLowerCase().includes(search) ||
                i.identification_type?.toLowerCase().includes(search)
            );
        }

        return filtered;
    };

    // Format datetime
    const formatDateTime = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Table columns
    const columns: ColumnsType<BulkUploadItem> = [
        {
            title: 'Row #',
            dataIndex: 'row_number',
            key: 'row_number',
            width: 60,
            align: 'center',
            render: (num: number) => (
                <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {num}
                </Text>
            )
        },
        {
            title: 'ID Number',
            dataIndex: 'identification_number',
            key: 'identification_number',
            width: 150,
            render: (text: string) => (
                <Text strong style={{ fontFamily: 'monospace' }}>
                    {text}
                </Text>
            )
        },
        {
            title: 'ID Type',
            dataIndex: 'identification_type',
            key: 'identification_type',
            width: 120
        },
        {
            title: 'Employment',
            dataIndex: 'employment_type',
            key: 'employment_type',
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
            key: 'verification_status',
            width: 130,
            render: (status: string) => {
                const config = {
                    'Verified': { icon: <CheckCircleOutlined />, color: 'success' },
                    'Failed': { icon: <CloseCircleOutlined />, color: 'error' },
                    'Pending': { icon: <ClockCircleOutlined />, color: 'default' }
                };
                const { icon, color } = config[status as keyof typeof config] || config['Pending'];
                return (
                    <Tag icon={icon} color={color}>
                        {status}
                    </Tag>
                );
            }
        },
        {
            title: 'Onboarding',
            dataIndex: 'onboarding_status',
            key: 'onboarding_status',
            width: 130,
            render: (status: string) => {
                const config = {
                    'Success': { icon: <CheckCircleOutlined />, color: 'success' },
                    'Failed': { icon: <CloseCircleOutlined />, color: 'error' },
                    'Pending': { icon: <ClockCircleOutlined />, color: 'default' }
                };
                const { icon, color } = config[status as keyof typeof config] || config['Pending'];
                return (
                    <Tag icon={icon} color={color}>
                        {status}
                    </Tag>
                );
            }
        },
        {
            title: 'Error Message',
            key: 'error',
            width: 300,
            render: (record: BulkUploadItem) => {
                const error = record.verification_error || record.onboarding_error;
                if (!error) return '-';

                return (
                    <Tooltip title={error}>
                        <Text
                            type="danger"
                            style={{
                                fontSize: 12,
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '280px'
                            }}
                        >
                            {error}
                        </Text>
                    </Tooltip>
                );
            }
        }
    ];

    const progress = getProgress();
    const filteredItems = getFilteredItems();

    // Loading state
    if (loading && !job) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: token.colorBgLayout
            }}>
                <Spin size="large" />
            </div>
        );
    }

    // Error state - only show if there's an explicit error after loading is complete
    if (error || (!loading && !job)) {
        return (
            <div style={{
                padding: '32px 24px',
                background: token.colorBgLayout,
                minHeight: '100vh'
            }}>
                <Card>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Text type="danger" strong>{error || 'Job not found'}</Text>
                        <Button
                            type="primary"
                            onClick={() => navigateToRoute('bulk-upload/status')}
                        >
                            Back to List
                        </Button>
                    </Space>
                </Card>
            </div>
        );
    }

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
            {/* Breadcrumb Navigation */}
            <div style={{ marginBottom: 24 }}>
                <Breadcrumb
                    items={[
                        {
                            title: (
                                <a onClick={() => navigateToRoute('home')} style={{ cursor: 'pointer' }}>
                                    <HomeOutlined style={{ marginRight: 4 }} />
                                    Home
                                </a>
                            )
                        },
                        {
                            title: (
                                <a onClick={() => navigateToRoute('bulk-upload/status')} style={{ cursor: 'pointer' }}>
                                    Bulk Upload
                                </a>
                            )
                        },
                        {
                            title: 'Job Details'
                        }
                    ]}
                />
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Job Metadata Card */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 16,
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
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
                        <Space>
                            <FileTextOutlined style={{ fontSize: 24, color: token.colorPrimary, opacity: 0.8 }} />
                            <Title level={3} style={{ margin: 0 }}>
                                Bulk Upload Job Details
                            </Title>
                            <Tag color={getStatusColor(job.status)}>
                                {job.status}
                            </Tag>
                        </Space>
                        <Space>
                            {autoRefresh && job.status === 'Processing' && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <SyncOutlined spin /> Auto-refreshing...
                                </Text>
                            )}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => fetchJobDetails()}
                                loading={refreshing}
                            >
                                Refresh
                            </Button>
                            <Button onClick={() => navigateToRoute('bulk-upload/status')}>
                                Back to List
                            </Button>
                        </Space>
                    </div>

                    {/* Metadata Grid */}
                    <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" size={2}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Job ID</Text>
                                <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                    {job.name}
                                </Text>
                            </Space>
                        </Col>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" size={2}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Facility</Text>
                                <div>
                                    <Text strong style={{ fontSize: 14 }}>
                                        {(job.facility_name || '').trim() || 'Unknown Facility'}
                                    </Text>
                                    {(job.facility_id || job.facility) && (
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8, fontFamily: 'monospace', opacity: 0.6 }}>
                                            ID: {job.facility_id || job.facility}
                                        </Text>
                                    )}
                                </div>
                            </Space>
                        </Col>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" size={2}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Uploaded By</Text>
                                <Text>{job.uploaded_by}</Text>
                            </Space>
                        </Col>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" size={2}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Upload Date</Text>
                                <Text>{formatDateTime(job.creation)}</Text>
                            </Space>
                        </Col>
                        {job.started_at && (
                            <Col xs={24} md={12}>
                                <Space direction="vertical" size={2}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Started At</Text>
                                    <Text>{formatDateTime(job.started_at)}</Text>
                                </Space>
                            </Col>
                        )}
                        {job.completed_at && (
                            <Col xs={24} md={12}>
                                <Space direction="vertical" size={2}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Completed At</Text>
                                    <Text>{formatDateTime(job.completed_at)}</Text>
                                </Space>
                            </Col>
                        )}
                    </Row>

                    {/* Progress Section */}
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${token.colorBorder}` }}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Processing Progress</Text>
                            <Progress
                                percent={progress.percentage}
                                status={getProgressStatus()}
                                strokeColor={{
                                    '0%': 'rgba(24, 144, 255, 0.6)',
                                    '100%': 'rgba(24, 144, 255, 1)'
                                }}
                            />
                            <Text style={{ fontSize: 13 }}>
                                {progress.processed} of {progress.total} records processed ({progress.percentage}%)
                            </Text>
                        </Space>
                    </div>
                </Card>

                {/* Items Table Card */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 16,
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)'
                    }}
                    title={
                        <Space>
                            <Text strong>Upload Records</Text>
                            <Tag>{job.items.length}</Tag>
                        </Space>
                    }
                    extra={
                        <Space wrap>
                            <Input
                                placeholder="Search ID Number"
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: 200 }}
                                allowClear
                            />
                            <Space.Compact>
                                <Button
                                    type={filter === 'all' ? 'primary' : 'default'}
                                    size="small"
                                    onClick={() => setFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    type={filter === 'verified' ? 'primary' : 'default'}
                                    size="small"
                                    onClick={() => setFilter('verified')}
                                >
                                    Verified
                                </Button>
                                <Button
                                    type={filter === 'verification-failed' ? 'primary' : 'default'}
                                    size="small"
                                    onClick={() => setFilter('verification-failed')}
                                >
                                    Ver. Failed
                                </Button>
                                <Button
                                    type={filter === 'created' ? 'primary' : 'default'}
                                    size="small"
                                    onClick={() => setFilter('created')}
                                >
                                    Created
                                </Button>
                                <Button
                                    type={filter === 'failed' ? 'primary' : 'default'}
                                    size="small"
                                    onClick={() => setFilter('failed')}
                                >
                                    Failed
                                </Button>
                                <Button
                                    type={filter === 'pending' ? 'primary' : 'default'}
                                    size="small"
                                    onClick={() => setFilter('pending')}
                                >
                                    Pending
                                </Button>
                            </Space.Compact>
                        </Space>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={filteredItems}
                        rowKey="name"
                        pagination={{
                            pageSize: 20,
                            showSizeChanger: false,
                            showTotal: (total) => `${total} records`
                        }}
                        scroll={{ x: 1200 }}
                        rowClassName={(record) => {
                            if (record.verification_status === 'Failed' || record.onboarding_status === 'Failed') {
                                return 'error-row';
                            }
                            return '';
                        }}
                        locale={{
                            emptyText: 'No records found'
                        }}
                    />
                </Card>
            </Space>

            <style>{`
                .error-row {
                    background-color: rgba(255, 77, 79, 0.05) !important;
                }
                .error-row:hover {
                    background-color: rgba(255, 77, 79, 0.08) !important;
                }
            `}</style>
        </div>
    );
};

export default BulkUploadDetailView;
