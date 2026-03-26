/**
 * Job Posts List View (PRV-02)
 *
 * Recruitment Desk > Job Posts tab.
 */

import { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Card,
    Descriptions,
    Drawer,
    Input,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import {
    CopyOutlined,
    EditOutlined,
    ExportOutlined,
    GlobalOutlined,
    LockOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShareAltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useShallow } from 'zustand/react/shallow';

import { useResponsive } from '../../../hooks/useResponsive';
import {
    recruitmentApi,
    type JobOpening,
    type PublicJobLinks,
} from '../../../services/api/recruitment';
import useRecruitmentJobPostsStore from '../../../stores/modules/recruitmentJobPostsStore';

const { Text } = Typography;

type JobLinksState = {
    jobs_list_url?: string;
    job_detail_url?: string;
};

type PublicLinkKind = 'list' | 'detail';

interface Props {
    navigateToRoute: (route: string, id?: string) => void;
    selectedJobId?: string;
}

interface JobOpeningDetail extends JobOpening {
    applicant_count?: number;
}

const STATUS_COLORS: Record<string, string> = {
    Open: 'green',
    Closed: 'red',
    Hold: 'orange',
};

const getNormalizedOrigin = (parsed?: URL): string | undefined => {
    if (typeof window === 'undefined') {
        return parsed?.origin;
    }
    if (!parsed) {
        return window.location.origin;
    }

    const currentOrigin = window.location.origin;
    const sameHostDifferentOrigin = parsed.hostname === window.location.hostname && parsed.origin !== currentOrigin;
    const localHostSource = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (sameHostDifferentOrigin || localHostSource) {
        return currentOrigin;
    }
    return parsed.origin;
};

const extractSlugFromPath = (pathname: string): string | undefined => {
    const normalizedPath = pathname.replace(/\/+$/, '');
    if (normalizedPath.startsWith('/jobs/')) {
        return decodeURIComponent(normalizedPath.slice('/jobs/'.length)).trim() || undefined;
    }
    if (normalizedPath.startsWith('/job-detail/')) {
        return decodeURIComponent(normalizedPath.slice('/job-detail/'.length)).trim() || undefined;
    }
    return undefined;
};

const extractSlugFromLegacyDetailUrl = (parsed: URL): string | undefined => {
    const fromPath = extractSlugFromPath(parsed.pathname);
    if (fromPath) return fromPath;

    const querySlug = parsed.searchParams.get('job_slug') || parsed.searchParams.get('slug');
    const normalized = (querySlug || '').trim();
    return normalized || undefined;
};

const normalizePublicUrl = (
    rawUrl?: string,
    options?: { kind?: PublicLinkKind; fallbackSlug?: string },
): string | undefined => {
    const input = (rawUrl || '').trim();
    const fallbackSlug = (options?.fallbackSlug || '').trim() || undefined;

    let parsed: URL | undefined;
    if (input) {
        try {
            parsed = typeof window !== 'undefined'
                ? new URL(input, window.location.origin)
                : new URL(input);
        } catch {
            // Continue with fallback handling below.
        }
    }

    const origin = getNormalizedOrigin(parsed);
    const kind = options?.kind;

    if (kind === 'list') {
        if (!origin) return '/jobs';
        return `${origin}/jobs`;
    }

    if (kind === 'detail') {
        const slug = fallbackSlug || (parsed ? extractSlugFromLegacyDetailUrl(parsed) : undefined);
        if (!origin) {
            return slug ? `/jobs/${encodeURIComponent(slug)}` : '/jobs';
        }
        return slug ? `${origin}/jobs/${encodeURIComponent(slug)}` : `${origin}/jobs`;
    }

    if (!parsed) return input || undefined;

    return `${origin || parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
};

const normalizePublicLinks = (links?: Partial<PublicJobLinks> | null): JobLinksState => {
    const fallbackSlug = typeof links?.slug === 'string' ? links.slug : undefined;
    const jobsListUrl = normalizePublicUrl(links?.jobs_list_url, { kind: 'list' });
    const detailUrlFromPayload = normalizePublicUrl(links?.job_detail_url, { kind: 'detail', fallbackSlug });
    const detailUrlFromList = fallbackSlug
        ? normalizePublicUrl(jobsListUrl, { kind: 'detail', fallbackSlug })
        : undefined;

    return {
        jobs_list_url: jobsListUrl,
        job_detail_url: detailUrlFromPayload || detailUrlFromList,
    };
};

export default function JobPostsListView({ navigateToRoute, selectedJobId }: Props) {
    const { isMobile } = useResponsive();

    const {
        jobs,
        loading,
        total,
        filters,
        statusOptions,
        initializeJobPosts,
        refreshJobs,
        setJobPage,
        setStoreSearchInput,
        setStoreSearchQuery,
        setStoreStatusFilter,
    } = useRecruitmentJobPostsStore(
        useShallow((state) => ({
            jobs: state.jobs,
            loading: state.loading,
            total: state.total,
            filters: state.filters,
            statusOptions: state.statusOptions,
            initializeJobPosts: state.initialize,
            refreshJobs: state.refreshJobs,
            setJobPage: state.setPage,
            setStoreSearchInput: state.setSearchInput,
            setStoreSearchQuery: state.setSearchQuery,
            setStoreStatusFilter: state.setStatusFilter,
        })),
    );

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobOpeningDetail | null>(null);
    const [selectedJobLinks, setSelectedJobLinks] = useState<JobLinksState>({});

    const {
        page: currentPage,
        pageSize,
        statusFilter,
        searchInput,
    } = filters;

    const resolvedStatusOptions = (statusOptions.length ? statusOptions : ['Open', 'Closed'])
        .map((value) => ({ value, label: value }));

    useEffect(() => {
        const bootstrap = async () => {
            try {
                await initializeJobPosts();
            } catch {
                message.error('Failed to load recruitment job posts');
            }
        };
        void bootstrap();
    }, [initializeJobPosts]);

    const resolveJobLinks = useCallback(async (jobId: string, notifyOnError = true): Promise<JobLinksState | null> => {
        try {
            const linksResp = await recruitmentApi.getPublicJobLinks(jobId);
            const normalized = normalizePublicLinks(linksResp || {});
            setSelectedJobLinks(normalized);
            return normalized;
        } catch {
            if (notifyOnError) {
                message.error('Failed to load public links');
            }
            return null;
        }
    }, []);

    const fetchJobDetail = useCallback(async (jobId: string) => {
        setDetailLoading(true);
        try {
            const detailResp = await recruitmentApi.getJobOpeningDetail(jobId);
            setSelectedJob((detailResp?.data as JobOpeningDetail) || null);
            setSelectedJobLinks({});
            setDetailOpen(true);
            void resolveJobLinks(jobId, false);
        } catch {
            message.error('Failed to load job detail');
            setSelectedJob(null);
            setSelectedJobLinks({});
            setDetailOpen(false);
        } finally {
            setDetailLoading(false);
        }
    }, [resolveJobLinks]);

    useEffect(() => {
        if (!selectedJobId) {
            setDetailOpen(false);
            setSelectedJob(null);
            setSelectedJobLinks({});
            return;
        }
        void fetchJobDetail(selectedJobId);
    }, [fetchJobDetail, selectedJobId]);

    const openJobDetail = (jobId: string) => {
        navigateToRoute('recruitment/job-posts', jobId);
    };

    const closeJobDetail = () => {
        setDetailOpen(false);
        setSelectedJob(null);
        setSelectedJobLinks({});
        navigateToRoute('recruitment/job-posts');
    };

    const openJobCreate = () => {
        navigateToRoute('recruitment/job-posts/new');
    };

    const openJobEdit = (jobId: string) => {
        navigateToRoute('recruitment/job-posts/edit', jobId);
    };

    const copyToClipboard = async (value: string, successText: string) => {
        const text = (value || '').trim();
        if (!text) {
            message.error('Nothing to copy');
            return;
        }

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                message.success(successText);
                return;
            }
        } catch {
            // Continue to fallback below.
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);
            const copied = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (copied) {
                message.success(successText);
                return;
            }
        } catch {
            // No-op, handled below.
        }

        if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
            window.prompt('Copy this link:', text);
            message.warning('Automatic copy was blocked. Copy manually from the prompt.');
            return;
        }

        message.error('Could not copy automatically. Browser blocked clipboard access.');
    };

    const openExternalLink = (value: string | undefined, label: string) => {
        const url = normalizePublicUrl(value);
        if (!url) {
            message.error(`${label} URL is not available`);
            return;
        }

        try {
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.click();
        } catch {
            window.location.assign(url);
        }
    };

    const handleShareLink = async (record: JobOpening) => {
        try {
            const links = await resolveJobLinks(record.name, true);
            if (links?.job_detail_url || links?.jobs_list_url) {
                await copyToClipboard(
                    links.job_detail_url || links.jobs_list_url,
                    links.job_detail_url ? 'Public job link copied to clipboard' : 'Jobs board link copied to clipboard',
                );
                return;
            }
            message.error('Public links are not available for this job');
        } catch {
            message.error('Failed to generate share link');
        }
    };

    const columns: ColumnsType<JobOpening> = [
        {
            title: 'Job Title',
            dataIndex: 'job_title',
            key: 'job_title',
            render: (text: string, record) => (
                <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto' }}
                    onClick={() => openJobDetail(record.name)}
                >
                    <Text strong style={{ fontSize: 13 }}>{text || record.designation}</Text>
                </Button>
            ),
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            width: 160,
            render: (text: string) => <Text style={{ fontSize: 12 }}>{text}</Text>,
        },
        {
            title: 'Facility / Location',
            key: 'facility_location',
            width: 220,
            render: (_: unknown, record: JobOpening) => {
                const facilityText = record.health_facility_name || record.health_facility;
                return (
                    <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: 12 }}>{facilityText || '—'}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.location || '—'}</Text>
                    </Space>
                );
            },
        },
        {
            title: 'Type',
            dataIndex: 'employment_type',
            key: 'employment_type',
            width: 120,
            render: (text: string) => (text ? <Tag style={{ fontSize: 11 }}>{text}</Tag> : '—'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 95,
            render: (status: string) => (
                <Tag color={STATUS_COLORS[status] || 'default'} style={{ fontSize: 11 }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Published',
            dataIndex: 'publish',
            key: 'publish',
            width: 100,
            align: 'center',
            render: (val: number, record: JobOpening) => (
                <Tooltip title={val ? 'Published — click to unpublish' : 'Draft — click to publish'}>
                    <Button
                        type="text"
                        size="small"
                        icon={val
                            ? <GlobalOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                            : <LockOutlined style={{ color: '#bfbfbf', fontSize: 14 }} />
                        }
                        onClick={async (event) => {
                            event.stopPropagation();
                            try {
                                await recruitmentApi.toggleJobPublish(record.name);
                                message.success(val ? 'Job unpublished' : 'Job published');
                                await refreshJobs();
                            } catch {
                                message.error('Failed to update publish state');
                            }
                        }}
                    />
                </Tooltip>
            ),
        },
        {
            title: '',
            key: 'actions',
            width: 120,
            render: (_: unknown, record: JobOpening) => (
                <Space size={4}>
                    <Tooltip title="Edit Job Post">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                openJobEdit(record.name);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Share Public Link">
                        <Button
                            type="text"
                            size="small"
                            icon={<ShareAltOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                void handleShareLink(record);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Copy Job ID">
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={async (event) => {
                                event.stopPropagation();
                                await copyToClipboard(record.name, 'Job ID copied');
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: isMobile ? 12 : 24 }}>
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: isMobile ? 12 : 24 } }}
                title={
                    isMobile ? (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Text strong style={{ fontSize: 16 }}>Job Posts</Text>
                            <Input
                                placeholder="Search jobs, location, facility..."
                                prefix={<SearchOutlined />}
                                style={{ width: '100%', borderRadius: 8 }}
                                value={searchInput}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setStoreSearchInput(next);
                                    if (!next.trim()) {
                                        void setStoreSearchQuery('');
                                    }
                                }}
                                onPressEnter={() => {
                                    void setStoreSearchQuery(searchInput);
                                }}
                                allowClear
                            />
                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                <Select
                                    placeholder="Status"
                                    style={{ minWidth: 0, flex: 1 }}
                                    allowClear
                                    value={statusFilter}
                                    onChange={(value) => {
                                        void setStoreStatusFilter(value);
                                    }}
                                    options={resolvedStatusOptions}
                                />
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        void setStoreSearchQuery(searchInput);
                                    }}
                                />
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openJobCreate}
                                block
                                style={{ minHeight: 42 }}
                            >
                                New Job Post
                            </Button>
                        </Space>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 16 }}>Job Posts</Text>
                            <Space>
                                <Input
                                    placeholder="Search jobs, location, facility..."
                                    prefix={<SearchOutlined />}
                                    size="small"
                                    style={{ width: 250, borderRadius: 8 }}
                                    value={searchInput}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setStoreSearchInput(next);
                                        if (!next.trim()) {
                                            void setStoreSearchQuery('');
                                        }
                                    }}
                                    onPressEnter={() => {
                                        void setStoreSearchQuery(searchInput);
                                    }}
                                    allowClear
                                />
                                <Select
                                    placeholder="Status"
                                    size="small"
                                    style={{ width: 140 }}
                                    allowClear
                                    value={statusFilter}
                                    onChange={(value) => {
                                        void setStoreStatusFilter(value);
                                    }}
                                    options={resolvedStatusOptions}
                                />
                                <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        void setStoreSearchQuery(searchInput);
                                    }}
                                />
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={openJobCreate}
                                >
                                    New Job Post
                                </Button>
                            </Space>
                        </div>
                    )
                }
            >
                <Table<JobOpening>
                    columns={columns}
                    dataSource={jobs}
                    rowKey="name"
                    loading={loading}
                    size={isMobile ? 'middle' : 'small'}
                    scroll={isMobile ? { x: 980 } : undefined}
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (count) => `${count} jobs`,
                        onChange: (page, size) => {
                            void setJobPage(page, size);
                        },
                    }}
                    onRow={(record) => ({
                        onClick: () => openJobDetail(record.name),
                        style: { cursor: 'pointer' },
                    })}
                />
            </Card>

            <Drawer
                title={selectedJob?.job_title || selectedJob?.designation || 'Job Detail'}
                open={detailOpen}
                onClose={closeJobDetail}
                placement={isMobile ? 'bottom' : 'right'}
                width={isMobile ? undefined : 520}
                height={isMobile ? '100%' : undefined}
                destroyOnClose
                extra={selectedJob ? (
                    <Button icon={<EditOutlined />} onClick={() => openJobEdit(selectedJob.name)}>
                        Edit
                    </Button>
                ) : null}
            >
                {detailLoading ? (
                    <div style={{ textAlign: 'center', paddingTop: 48 }}>
                        <Spin />
                    </div>
                ) : selectedJob ? (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Job ID">{selectedJob.name || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Designation">{selectedJob.designation || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Company">{selectedJob.company || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Health Facility">{selectedJob.health_facility_name || selectedJob.health_facility || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Location">{selectedJob.location || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Status">{selectedJob.status || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Published">{selectedJob.publish ? 'Yes' : 'No'}</Descriptions.Item>
                            <Descriptions.Item label="Applicants">{selectedJob.applicant_count ?? '—'}</Descriptions.Item>
                        </Descriptions>
                        <Space wrap>
                            <Button
                                icon={<ExportOutlined />}
                                onClick={async () => {
                                    if (selectedJobLinks.jobs_list_url) {
                                        openExternalLink(selectedJobLinks.jobs_list_url, 'Jobs board');
                                        return;
                                    }
                                    const links = await resolveJobLinks(selectedJob.name, true);
                                    if (links?.jobs_list_url) {
                                        window.location.assign(links.jobs_list_url);
                                    }
                                }}
                            >
                                Open Job Board
                            </Button>
                            <Button
                                icon={<GlobalOutlined />}
                                onClick={async () => {
                                    if (selectedJobLinks.job_detail_url) {
                                        openExternalLink(selectedJobLinks.job_detail_url, 'Public job');
                                        return;
                                    }
                                    const links = await resolveJobLinks(selectedJob.name, true);
                                    if (links?.job_detail_url) {
                                        window.location.assign(links.job_detail_url);
                                    } else {
                                        message.error('Public job URL is not available');
                                    }
                                }}
                            >
                                Open Public Job
                            </Button>
                            <Button
                                icon={<ShareAltOutlined />}
                                onClick={async () => {
                                    const links = selectedJobLinks.job_detail_url
                                        ? selectedJobLinks
                                        : await resolveJobLinks(selectedJob.name, true);
                                    if (!links?.job_detail_url && !links?.jobs_list_url) {
                                        message.error('Public detail URL is not available');
                                        return;
                                    }
                                    await copyToClipboard(
                                        links.job_detail_url || links.jobs_list_url,
                                        links.job_detail_url ? 'Public detail link copied' : 'Jobs board link copied',
                                    );
                                }}
                            >
                                Copy Public Job Link
                            </Button>
                            <Button
                                icon={<CopyOutlined />}
                                onClick={async () => {
                                    const links = selectedJobLinks.jobs_list_url
                                        ? selectedJobLinks
                                        : await resolveJobLinks(selectedJob.name, true);
                                    if (!links?.jobs_list_url) {
                                        message.error('Jobs list URL is not available');
                                        return;
                                    }
                                    await copyToClipboard(links.jobs_list_url, 'Jobs board link copied');
                                }}
                            >
                                Copy Jobs Board Link
                            </Button>
                        </Space>
                    </Space>
                ) : (
                    <Text type="secondary">Unable to load job detail.</Text>
                )}
            </Drawer>
        </div>
    );
}
