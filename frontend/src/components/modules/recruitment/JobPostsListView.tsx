/**
 * Job Posts List View (PRV-02)
 *
 * Recruitment Desk > Job Posts tab.
 * Lists Job Openings with status pills, publish state, share controls,
 * and conversion summary.
 */

import dayjs, { type Dayjs } from 'dayjs';
import { useState, useEffect, useCallback } from 'react';
import {
    Card, Table, Tag, Input, Button, Space, Tooltip, message, Select, Typography,
    Drawer, Descriptions, Spin, Form, Row, Col, DatePicker, InputNumber, Switch, Divider, AutoComplete,
} from 'antd';
import {
    PlusOutlined, SearchOutlined, ShareAltOutlined, CopyOutlined,
    GlobalOutlined, LockOutlined, ReloadOutlined, EditOutlined, ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
    recruitmentApi,
    type JobOpening,
    type PublicJobLinks,
    type JobOpeningUpsertPayload,
} from '../../../services/api/recruitment';
import { useShallow } from 'zustand/react/shallow';
import useFacilityStore from '../../../stores/facilityStore';
import useRecruitmentJobPostsStore from '../../../stores/modules/recruitmentJobPostsStore';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Link } = Typography;

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

interface JobOpeningFormValues {
    job_title: string;
    designation: string;
    company: string;
    location?: string;
    employment_type?: string;
    status: string;
    description?: string;
    publish?: boolean;
    posted_on?: Dayjs;
    closes_on?: Dayjs;
    lower_range?: number;
    upper_range?: number;
    currency?: string;
    salary_per?: string;
}

const STATUS_COLORS: Record<string, string> = {
    Open: 'green',
    Closed: 'red',
    'On Hold': 'orange',
};

const SALARY_PERIOD_OPTIONS = [
    { value: 'Month', label: 'Month' },
    { value: 'Year', label: 'Year' },
    { value: 'Hour', label: 'Hour' },
];

const parseOptionalDate = (value?: string): Dayjs | undefined => {
    if (!value) return undefined;
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : undefined;
};

const parseOptionalNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
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
    const { isMobile, width } = useResponsive();
    const isVerySmallScreen = isMobile && width <= 375;
    const company = useFacilityStore((state) => state.company);
    const {
        jobs,
        loading,
        total,
        filters,
        designationOptions,
        designationLoading,
        employmentTypeOptions,
        locationOptions,
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
            designationOptions: state.designationOptions,
            designationLoading: state.designationLoading,
            employmentTypeOptions: state.employmentTypeOptions,
            locationOptions: state.locationOptions,
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

    const [editorOpen, setEditorOpen] = useState(false);
    const [editorLoading, setEditorLoading] = useState(false);
    const [editorSaving, setEditorSaving] = useState(false);
    const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
    const [editingJobId, setEditingJobId] = useState<string | null>(null);
    const [mobileKeyboardInset, setMobileKeyboardInset] = useState(0);
    const [jobForm] = Form.useForm<JobOpeningFormValues>();
    const organizationValue = Form.useWatch('company', jobForm);
    const organizationLabel = company?.company_name || company?.name || 'Organization';
    const organizationDisplayValue = organizationValue
        ? (company && organizationValue === company.name ? (company.company_name || company.name) : organizationValue)
        : organizationLabel;
    const formGutter = isVerySmallScreen ? 6 : (isMobile ? 8 : 12);
    const pagePadding = isVerySmallScreen ? 8 : (isMobile ? 12 : 24);
    const cardBodyPadding = isVerySmallScreen ? 10 : (isMobile ? 12 : 24);
    const mobileFooterPaddingX = isVerySmallScreen ? 10 : 12;
    const mobileFooterPaddingY = isVerySmallScreen ? 10 : 12;
    const mobileFooterGap = isVerySmallScreen ? 6 : 8;
    const editorBodyBottomInset = isVerySmallScreen ? 152 : 144;
    const mobileEditorBodyPadding = `${isVerySmallScreen ? 10 : 12}px ${isVerySmallScreen ? 10 : 12}px calc(${editorBodyBottomInset}px + env(safe-area-inset-bottom))`;
    const mobileDetailBodyPadding = `${isVerySmallScreen ? 10 : 12}px ${isVerySmallScreen ? 10 : 12}px calc(20px + env(safe-area-inset-bottom))`;
    const mobileFooterPadding = `${mobileFooterPaddingY}px max(${mobileFooterPaddingX}px, env(safe-area-inset-right)) calc(${mobileFooterPaddingY}px + env(safe-area-inset-bottom) + ${mobileKeyboardInset}px) max(${mobileFooterPaddingX}px, env(safe-area-inset-left))`;
    const controlSize = isMobile ? 'large' : 'middle';

    const {
        page: currentPage,
        pageSize,
        statusFilter,
        searchInput,
    } = filters;
    const employmentTypeSelectOptions = employmentTypeOptions
        .map((value) => ({ value, label: value }));
    const locationSelectOptions = locationOptions.map((value) => ({ value, label: value }));

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

    useEffect(() => {
        if (!editorOpen || editorMode !== 'create' || !company?.name) {
            return;
        }
        const currentCompany = jobForm.getFieldValue('company');
        if (!currentCompany) {
            jobForm.setFieldsValue({ company: company.name });
        }
    }, [company?.name, editorMode, editorOpen, jobForm]);

    useEffect(() => {
        if (!isMobile || typeof window === 'undefined' || !window.visualViewport) {
            setMobileKeyboardInset(0);
            return;
        }

        const viewport = window.visualViewport;
        const updateInset = () => {
            const keyboardInset = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
            setMobileKeyboardInset((prevInset) => (Math.abs(prevInset - keyboardInset) < 2 ? prevInset : keyboardInset));
        };

        updateInset();
        viewport.addEventListener('resize', updateInset);
        viewport.addEventListener('scroll', updateInset);
        return () => {
            viewport.removeEventListener('resize', updateInset);
            viewport.removeEventListener('scroll', updateInset);
        };
    }, [isMobile]);

    const scrollFocusedElementIntoView = useCallback((target: HTMLElement | null) => {
        if (!isMobile || !target?.scrollIntoView) return;
        const delay = mobileKeyboardInset > 0 ? 90 : 140;
        window.setTimeout(() => {
            target.scrollIntoView({
                block: isVerySmallScreen ? 'nearest' : 'center',
                inline: 'nearest',
                behavior: isVerySmallScreen ? 'auto' : 'smooth',
            });
        }, delay);
    }, [isMobile, isVerySmallScreen, mobileKeyboardInset]);

    const openCreateForm = useCallback(() => {
        setDetailOpen(false);
        setSelectedJob(null);
        setSelectedJobLinks({});

        setEditorMode('create');
        setEditingJobId(null);
        setEditorLoading(false);
        setEditorOpen(true);
        jobForm.resetFields();
        jobForm.setFieldsValue({
            status: 'Open',
            publish: false,
            currency: 'KES',
            salary_per: 'Month',
            company: company?.name || '',
        });
    }, [company?.name, jobForm]);

    const openEditForm = useCallback(async (jobId: string) => {
        setDetailOpen(false);
        setSelectedJob(null);
        setSelectedJobLinks({});

        setEditorMode('edit');
        setEditingJobId(jobId);
        setEditorOpen(true);
        setEditorLoading(true);
        jobForm.resetFields();

        try {
            const detailResp = await recruitmentApi.getJobOpeningDetail(jobId);
            const job = (detailResp?.data as JobOpeningDetail) || null;
            if (!job) {
                throw new Error('Missing job payload');
            }

            jobForm.setFieldsValue({
                job_title: job.job_title || '',
                designation: job.designation || '',
                company: job.company || '',
                location: job.location || undefined,
                employment_type: job.employment_type || undefined,
                status: job.status || 'Open',
                description: job.description || undefined,
                publish: !!job.publish,
                posted_on: parseOptionalDate(job.posted_on),
                closes_on: parseOptionalDate(job.closes_on),
                lower_range: parseOptionalNumber(job.lower_range),
                upper_range: parseOptionalNumber(job.upper_range),
                currency: job.currency || 'KES',
                salary_per: job.salary_per || 'Month',
            });
        } catch {
            message.error('Failed to load job post for editing');
            setEditorOpen(false);
            setEditingJobId(null);
            navigateToRoute('recruitment/job-posts');
        } finally {
            setEditorLoading(false);
        }
    }, [jobForm, navigateToRoute]);

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
        setEditorOpen(false);
        setEditingJobId(null);

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
            setEditorOpen(false);
            setEditingJobId(null);
            return;
        }

        if (selectedJobId === 'new') {
            if (!(editorOpen && editorMode === 'create')) {
                openCreateForm();
            }
            return;
        }

        if (selectedJobId.startsWith('edit:') || selectedJobId.startsWith('edit/')) {
            const editId = selectedJobId.slice(5);
            if (!editId) {
                message.error('Invalid job identifier for editing');
                navigateToRoute('recruitment/job-posts');
                return;
            }
            if (editorOpen && editorMode === 'edit' && editingJobId === editId && !editorLoading) {
                return;
            }
            void openEditForm(editId);
            return;
        }

        void fetchJobDetail(selectedJobId);
    }, [
        selectedJobId,
        editorLoading,
        editorMode,
        editorOpen,
        editingJobId,
        fetchJobDetail,
        navigateToRoute,
        openCreateForm,
        openEditForm,
    ]);

    const openJobDetail = (jobId: string) => {
        navigateToRoute('recruitment/job-posts', jobId);
    };

    const openJobCreate = () => {
        navigateToRoute('recruitment/job-posts', 'new');
    };

    const openJobEdit = (jobId: string) => {
        navigateToRoute('recruitment/job-posts', `edit:${jobId}`);
    };

    const closeJobDetail = () => {
        setDetailOpen(false);
        navigateToRoute('recruitment/job-posts');
    };

    const closeJobEditor = () => {
        setEditorOpen(false);
        setEditingJobId(null);
        jobForm.resetFields();
        navigateToRoute('recruitment/job-posts');
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
            // Continue to legacy fallback.
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

    const toPayload = (values: JobOpeningFormValues): JobOpeningUpsertPayload => {
        const resolvedCompany = (values.company || company?.name || '').trim();
        const requiredTrimmed = {
            job_title: (values.job_title || '').trim(),
            designation: (values.designation || '').trim(),
            company: resolvedCompany,
        };

        return {
            ...requiredTrimmed,
            status: values.status,
            location: values.location?.trim() || '',
            employment_type: values.employment_type || '',
            description: values.description?.trim() || '',
            publish: values.publish ? 1 : 0,
            posted_on: values.posted_on ? values.posted_on.format('YYYY-MM-DD') : '',
            closes_on: values.closes_on ? values.closes_on.format('YYYY-MM-DD') : '',
            lower_range: values.lower_range ?? null,
            upper_range: values.upper_range ?? null,
            currency: values.currency?.trim() || '',
            salary_per: values.salary_per || '',
        };
    };

    const handleSaveJob = async (values: JobOpeningFormValues) => {
        setEditorSaving(true);
        try {
            const payload = toPayload(values);
            if (!payload.job_title || !payload.designation) {
                message.error('Job title and designation are required.');
                return;
            }
            if (!payload.company) {
                message.error('Organization context is missing. Reload the page and try again.');
                return;
            }
            let targetJobId: string | undefined;

            if (editorMode === 'create') {
                const created = await recruitmentApi.createJobOpening(payload);
                targetJobId = created?.name;
                message.success('Job post created successfully');
            } else {
                if (!editingJobId) {
                    message.error('Missing job identifier for update');
                    return;
                }
                const updated = await recruitmentApi.updateJobOpening(editingJobId, payload);
                targetJobId = updated?.name || editingJobId;
                message.success('Job post updated successfully');
            }

            await refreshJobs();
            setEditorOpen(false);
            setEditingJobId(null);

            if (targetJobId) {
                navigateToRoute('recruitment/job-posts', targetJobId);
            } else {
                navigateToRoute('recruitment/job-posts');
            }
        } catch (err) {
            const error = err as Error;
            message.error(error?.message || 'Failed to save job post');
        } finally {
            setEditorSaving(false);
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
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            width: 140,
            render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text || '—'}</Text>,
        },
        {
            title: 'Type',
            dataIndex: 'employment_type',
            key: 'employment_type',
            width: 110,
            render: (text: string) => (text ? <Tag style={{ fontSize: 11 }}>{text}</Tag> : '—'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 90,
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
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await recruitmentApi.toggleJobPublish(record.name);
                                message.success(val ? 'Job unpublished' : 'Job published');
                                void refreshJobs();
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
                            onClick={(e) => {
                                e.stopPropagation();
                                openJobEdit(record.name);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Share Public Link">
                        <Button
                            type="text"
                            size="small"
                            icon={<ShareAltOutlined />}
                            onClick={(e) => { e.stopPropagation(); void handleShareLink(record); }}
                        />
                    </Tooltip>
                    <Tooltip title="Copy Job ID">
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={async (e) => {
                                e.stopPropagation();
                                await copyToClipboard(record.name, 'Job ID copied');
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: pagePadding }}>
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: cardBodyPadding } }}
                title={
                    isMobile ? (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Text strong style={{ fontSize: isVerySmallScreen ? 15 : 16 }}>Job Posts</Text>
                            <Input
                                placeholder="Search jobs..."
                                prefix={<SearchOutlined />}
                                size={controlSize}
                                style={{ width: '100%', borderRadius: 8 }}
                                value={searchInput}
                                onChange={(e) => {
                                    const next = e.target.value;
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
                                    size={controlSize}
                                    style={{ minWidth: 0, flex: 1 }}
                                    allowClear
                                    value={statusFilter}
                                    onChange={(v) => {
                                        void setStoreStatusFilter(v);
                                    }}
                                    options={[
                                        { value: 'Open', label: 'Open' },
                                        { value: 'Closed', label: 'Closed' },
                                    ]}
                                />
                                <Button
                                    size={controlSize}
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        void setStoreSearchQuery(searchInput);
                                    }}
                                    style={{ minWidth: 44 }}
                                />
                            </div>
                            <Button
                                type="primary"
                                size={controlSize}
                                icon={<PlusOutlined />}
                                onClick={openJobCreate}
                                block
                                style={{ minHeight: 44 }}
                            >
                                New Job Post
                            </Button>
                        </Space>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 16 }}>Job Posts</Text>
                            <Space>
                                <Input
                                    placeholder="Search jobs..."
                                    prefix={<SearchOutlined />}
                                    size="small"
                                    style={{ width: 200, borderRadius: 8 }}
                                    value={searchInput}
                                    onChange={(e) => {
                                        const next = e.target.value;
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
                                    style={{ width: 120 }}
                                    allowClear
                                    value={statusFilter}
                                    onChange={(v) => {
                                        void setStoreStatusFilter(v);
                                    }}
                                    options={[
                                        { value: 'Open', label: 'Open' },
                                        { value: 'Closed', label: 'Closed' },
                                    ]}
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
                    scroll={isMobile ? { x: 860 } : undefined}
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} jobs`,
                        onChange: (page, pageSizeValue) => {
                            void setJobPage(page, pageSizeValue);
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
                styles={{
                    header: {
                        padding: isVerySmallScreen ? '10px 12px' : undefined,
                    },
                    body: {
                        padding: isMobile ? mobileDetailBodyPadding : undefined,
                        overscrollBehavior: isMobile ? 'contain' : undefined,
                        WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
                    },
                }}
                extra={selectedJob ? (
                    <Button
                        icon={<EditOutlined />}
                        size={controlSize}
                        onClick={() => openJobEdit(selectedJob.name)}
                    >
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
                        {selectedJobLinks.jobs_list_url && (
                            <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                Job Board URL:{' '}
                                <Link href={selectedJobLinks.jobs_list_url} target="_blank" rel="noopener noreferrer">
                                    {selectedJobLinks.jobs_list_url}
                                </Link>
                            </Text>
                        )}
                        {selectedJobLinks.job_detail_url && (
                            <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                Public Job URL:{' '}
                                <Link href={selectedJobLinks.job_detail_url} target="_blank" rel="noopener noreferrer">
                                    {selectedJobLinks.job_detail_url}
                                </Link>
                            </Text>
                        )}
                    </Space>
                ) : (
                    <Text type="secondary">Unable to load job detail.</Text>
                )}
            </Drawer>

            <Drawer
                title={editorMode === 'create' ? 'New Job Post' : 'Edit Job Post'}
                open={editorOpen}
                onClose={closeJobEditor}
                placement={isMobile ? 'bottom' : 'right'}
                width={isMobile ? undefined : 680}
                height={isMobile ? '100%' : undefined}
                footer={(
                    isMobile ? (
                        <Space direction="vertical" size={mobileFooterGap} style={{ display: 'flex', width: '100%' }}>
                            <Button
                                type="primary"
                                onClick={() => jobForm.submit()}
                                loading={editorSaving}
                                block
                                size={controlSize}
                                style={{ minHeight: 44, fontWeight: 600 }}
                            >
                                {editorMode === 'create' ? 'Create Job Post' : 'Save Changes'}
                            </Button>
                            <Button
                                onClick={closeJobEditor}
                                disabled={editorSaving}
                                block
                                size={controlSize}
                                style={{ minHeight: 42 }}
                            >
                                Cancel
                            </Button>
                        </Space>
                    ) : (
                        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button onClick={closeJobEditor} disabled={editorSaving}>Cancel</Button>
                            <Button type="primary" onClick={() => jobForm.submit()} loading={editorSaving}>
                                {editorMode === 'create' ? 'Create Job Post' : 'Save Changes'}
                            </Button>
                        </Space>
                    )
                )}
                styles={{
                    header: {
                        padding: isVerySmallScreen ? '12px 12px 10px' : undefined,
                    },
                    body: {
                        padding: isMobile ? mobileEditorBodyPadding : undefined,
                        overscrollBehavior: isMobile ? 'contain' : undefined,
                        WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
                    },
                    footer: {
                        padding: isMobile ? mobileFooterPadding : undefined,
                        borderTop: isMobile ? '1px solid #f0f0f0' : undefined,
                        background: isMobile ? '#fff' : undefined,
                        position: isMobile ? 'sticky' : undefined,
                        bottom: isMobile ? 0 : undefined,
                        zIndex: isMobile ? 2 : undefined,
                        boxShadow: isMobile ? '0 -8px 18px rgba(15, 23, 42, 0.08)' : undefined,
                    },
                }}
            >
                {editorLoading ? (
                    <div style={{ textAlign: 'center', paddingTop: 48 }}>
                        <Spin />
                    </div>
                ) : (
                    <Form<JobOpeningFormValues>
                        form={jobForm}
                        layout="vertical"
                        onFinish={handleSaveJob}
                        onFocusCapture={(event) => {
                            const target = event.target as HTMLElement | null;
                            scrollFocusedElementIntoView(target);
                        }}
                    >
                        <Row gutter={formGutter}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Job Title"
                                    name="job_title"
                                    rules={[{ required: true, whitespace: true, message: 'Job title is required' }]}
                                >
                                    <Input placeholder="e.g. Registered Nurse" maxLength={140} size={controlSize} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Designation"
                                    name="designation"
                                    rules={[{ required: true, whitespace: true, message: 'Designation is required' }]}
                                >
                                    <AutoComplete
                                        options={designationOptions}
                                        notFoundContent={designationLoading ? <Spin size="small" /> : null}
                                        popupMatchSelectWidth
                                        filterOption={(inputValue, option) => {
                                            const optionText = String(option?.label || option?.value || '').toLowerCase();
                                            return optionText.includes(inputValue.toLowerCase());
                                        }}
                                    >
                                        <Input placeholder="Search designation or type a new one" maxLength={140} size={controlSize} />
                                    </AutoComplete>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="company" hidden>
                            <Input />
                        </Form.Item>

                        <div
                            style={{
                                marginBottom: 8,
                                padding: isMobile ? '8px 10px' : '9px 12px',
                                borderRadius: 8,
                                border: '1px solid #f0f0f0',
                                background: '#fafafa',
                            }}
                        >
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
                                Posting under organization: <Text>{organizationDisplayValue}</Text>
                            </Text>
                        </div>

                        <Row gutter={formGutter}>
                            <Col xs={24} md={24}>
                                <Form.Item label="Location" name="location">
                                    <Select
                                        allowClear
                                        showSearch
                                        optionFilterProp="label"
                                        options={locationSelectOptions}
                                        size={controlSize}
                                        placeholder={locationSelectOptions.length ? 'Select location' : 'No locations configured'}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={formGutter}>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="Status"
                                    name="status"
                                    rules={[{ required: true, message: 'Status is required' }]}
                                >
                                    <Select
                                        size={controlSize}
                                        options={[
                                            { value: 'Open', label: 'Open' },
                                            { value: 'Closed', label: 'Closed' },
                                            { value: 'On Hold', label: 'On Hold' },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Employment Type" name="employment_type">
                                    <Select
                                        allowClear
                                        showSearch
                                        optionFilterProp="label"
                                        options={employmentTypeSelectOptions}
                                        size={controlSize}
                                        placeholder={employmentTypeSelectOptions.length ? 'Select employment type' : 'No employment types configured'}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Published" name="publish" valuePropName="checked">
                                    <div style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>
                                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                                    </div>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={formGutter}>
                            <Col xs={24} md={12}>
                                <Form.Item label="Posting Date" name="posted_on">
                                    <DatePicker style={{ width: '100%' }} size={controlSize} inputReadOnly={isMobile} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Closing Date"
                                    name="closes_on"
                                    dependencies={['posted_on']}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value: Dayjs | undefined) {
                                                const postedOn = getFieldValue('posted_on') as Dayjs | undefined;
                                                if (!postedOn || !value || !value.isBefore(postedOn, 'day')) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Closing date must be on or after posting date'));
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker style={{ width: '100%' }} size={controlSize} inputReadOnly={isMobile} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '8px 0 16px' }} />

                        <Row gutter={formGutter}>
                            <Col xs={24} md={8}>
                                <Form.Item label="Minimum Salary" name="lower_range">
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        precision={0}
                                        placeholder="0"
                                        size={controlSize}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="Maximum Salary"
                                    name="upper_range"
                                    dependencies={['lower_range']}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value: number | null | undefined) {
                                                const minValue = getFieldValue('lower_range') as number | null | undefined;
                                                if (
                                                    minValue === null
                                                    || minValue === undefined
                                                    || value === null
                                                    || value === undefined
                                                    || value >= minValue
                                                ) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Maximum salary must be greater than or equal to minimum salary'));
                                            },
                                        }),
                                    ]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        precision={0}
                                        placeholder="0"
                                        size={controlSize}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Currency" name="currency">
                                    <Input placeholder="e.g. KES" maxLength={10} size={controlSize} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={formGutter}>
                            <Col xs={24} md={8}>
                                <Form.Item label="Salary Period" name="salary_per">
                                    <Select allowClear options={SALARY_PERIOD_OPTIONS} size={controlSize} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Description" name="description">
                            <Input.TextArea rows={isVerySmallScreen ? 4 : 5} maxLength={4000} showCount />
                        </Form.Item>
                    </Form>
                )}
            </Drawer>
        </div>
    );
}
