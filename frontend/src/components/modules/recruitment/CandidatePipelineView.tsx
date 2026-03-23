/**
 * Candidate Pipeline View (PRV-01)
 *
 * Recruitment Desk > Candidate Pipeline tab.
 * Lists Job Applicants with stage indicators and quick actions.
 */

import { useEffect } from 'react';
import {
    Card, Table, Tag, Input, Button, Space, Select, Typography,
    message,
} from 'antd';
import {
    SearchOutlined, ReloadOutlined, UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useShallow } from 'zustand/react/shallow';
import { type JobApplicant } from '../../../services/api/recruitment';
import useRecruitmentCandidatePipelineStore from '../../../stores/modules/recruitmentCandidatePipelineStore';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text } = Typography;

interface Props {
    navigateToRoute: (route: string, id?: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    Open: 'blue',
    Replied: 'cyan',
    Accepted: 'green',
    Rejected: 'red',
    Hold: 'orange',
};

export default function CandidatePipelineView({ navigateToRoute }: Props) {
    const { isMobile, width } = useResponsive();
    const isVerySmallScreen = isMobile && width <= 375;
    const {
        applicants,
        loading,
        total,
        filters,
        initialize,
        setPage,
        setSearchInput,
        setSearchQuery,
        setStatusFilter,
    } = useRecruitmentCandidatePipelineStore(
        useShallow((state) => ({
            applicants: state.applicants,
            loading: state.loading,
            total: state.total,
            filters: state.filters,
            initialize: state.initialize,
            setPage: state.setPage,
            setSearchInput: state.setSearchInput,
            setSearchQuery: state.setSearchQuery,
            setStatusFilter: state.setStatusFilter,
        })),
    );
    const {
        page: currentPage,
        pageSize,
        statusFilter,
        searchInput,
    } = filters;

    useEffect(() => {
        const bootstrap = async () => {
            try {
                await initialize();
            } catch {
                message.error('Failed to load candidates');
            }
        };
        void bootstrap();
    }, [initialize]);

    const columns: ColumnsType<JobApplicant> = [
        {
            title: 'Candidate',
            key: 'candidate',
            render: (_: unknown, record: JobApplicant) => (
                <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto', textAlign: 'left' }}
                    onClick={() => navigateToRoute('recruitment/candidates', record.name)}
                >
                    <div>
                        <Text strong style={{ fontSize: 13 }}>{record.applicant_name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.email_id}</Text>
                    </div>
                </Button>
            ),
        },
        {
            title: 'Position',
            dataIndex: 'job_title',
            key: 'job_title',
            width: 180,
            render: (text: string) => <Text style={{ fontSize: 12 }}>{text || '—'}</Text>,
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            width: 140,
            render: (text: string) => <Text style={{ fontSize: 12 }}>{text || '—'}</Text>,
        },
        {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            width: 100,
            render: (text: string) => text
                ? <Tag style={{ fontSize: 11 }}>{text}</Tag>
                : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={STATUS_COLORS[status] || 'default'} style={{ fontSize: 11 }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'HP Linked',
            dataIndex: 'health_professional',
            key: 'health_professional',
            width: 90,
            align: 'center',
            render: (val: string) => val
                ? <UserOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
        },
        {
            title: 'Applied',
            dataIndex: 'creation',
            key: 'creation',
            width: 100,
            render: (val: string) => (
                <Text type="secondary" style={{ fontSize: 11 }}>
                    {val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </Text>
            ),
        },
    ];

    const controlSize = isMobile ? 'large' : 'small';

    return (
        <div style={{ padding: isVerySmallScreen ? 8 : (isMobile ? 12 : 24) }}>
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: isVerySmallScreen ? 10 : (isMobile ? 12 : 24) } }}
                title={
                    isMobile ? (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Text strong style={{ fontSize: isVerySmallScreen ? 15 : 16 }}>Candidate Pipeline</Text>
                            <Input
                                placeholder="Search candidates..."
                                prefix={<SearchOutlined />}
                                size={controlSize}
                                style={{ width: '100%', borderRadius: 8 }}
                                value={searchInput}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setSearchInput(next);
                                    if (!next.trim()) {
                                        void setSearchQuery('');
                                    }
                                }}
                                onPressEnter={() => {
                                    void setSearchQuery(searchInput);
                                }}
                                allowClear
                            />
                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                <Select
                                    placeholder="Stage"
                                    size={controlSize}
                                    style={{ minWidth: 0, flex: 1 }}
                                    allowClear
                                    value={statusFilter}
                                    onChange={(v) => {
                                        void setStatusFilter(v);
                                    }}
                                    options={[
                                        { value: 'Open', label: 'New' },
                                        { value: 'Replied', label: 'Screened' },
                                        { value: 'Accepted', label: 'Accepted' },
                                        { value: 'Rejected', label: 'Rejected' },
                                        { value: 'Hold', label: 'On Hold' },
                                    ]}
                                />
                                <Button
                                    size={controlSize}
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        void setSearchQuery(searchInput);
                                    }}
                                    style={{ minWidth: 44 }}
                                />
                            </div>
                        </Space>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 16 }}>Candidate Pipeline</Text>
                            <Space>
                                <Input
                                    placeholder="Search candidates..."
                                    prefix={<SearchOutlined />}
                                    size={controlSize}
                                    style={{ width: 200, borderRadius: 8 }}
                                    value={searchInput}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setSearchInput(next);
                                        if (!next.trim()) {
                                            void setSearchQuery('');
                                        }
                                    }}
                                    onPressEnter={() => {
                                        void setSearchQuery(searchInput);
                                    }}
                                    allowClear
                                />
                                <Select
                                    placeholder="Stage"
                                    size={controlSize}
                                    style={{ width: 120 }}
                                    allowClear
                                    value={statusFilter}
                                    onChange={(v) => {
                                        void setStatusFilter(v);
                                    }}
                                    options={[
                                        { value: 'Open', label: 'New' },
                                        { value: 'Replied', label: 'Screened' },
                                        { value: 'Accepted', label: 'Accepted' },
                                        { value: 'Rejected', label: 'Rejected' },
                                        { value: 'Hold', label: 'On Hold' },
                                    ]}
                                />
                                <Button
                                    size={controlSize}
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        void setSearchQuery(searchInput);
                                    }}
                                />
                            </Space>
                        </div>
                    )
                }
            >
                <Table<JobApplicant>
                    columns={columns}
                    dataSource={applicants}
                    rowKey="name"
                    loading={loading}
                    size={isMobile ? 'middle' : 'small'}
                    scroll={isMobile ? { x: 860 } : undefined}
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (currentTotal) => `${currentTotal} candidates`,
                        onChange: (page, pageSizeValue) => {
                            void setPage(page, pageSizeValue);
                        },
                    }}
                    onRow={(record) => ({
                        onClick: () => navigateToRoute('recruitment/candidates', record.name),
                        style: { cursor: 'pointer' },
                    })}
                />
            </Card>
        </div>
    );
}
