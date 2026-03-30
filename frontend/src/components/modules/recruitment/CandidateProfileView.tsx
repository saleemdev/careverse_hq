/**
 * Candidate Profile View (PRV-04)
 *
 * Detailed candidate workspace showing:
 * - Interview outcomes
 * - Offer state
 * - Affiliation trace
 * - Complete Hire action
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    Card, Descriptions, Tag, Button, Space, Timeline, Typography, Divider,
    Modal, Form, Input, DatePicker, Select, message, Spin, Alert, Badge, List,
} from 'antd';
import {
    ArrowLeftOutlined, CheckCircleOutlined, LinkOutlined,
    UserOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useShallow } from 'zustand/react/shallow';
import useRecruitmentCandidateProfileStore from '../../../stores/modules/recruitmentCandidateProfileStore';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Title } = Typography;

interface Props {
    candidateId: string;
    navigateToRoute: (route: string, id?: string) => void;
}

interface CompleteHireFormValues {
    fid: string;
    employment_type: string;
    designation: string;
    start_date?: Dayjs;
    end_date?: Dayjs;
}

const STATUS_COLORS: Record<string, string> = {
    Open: 'blue',
    Replied: 'cyan',
    Accepted: 'green',
    Rejected: 'red',
    Hold: 'orange',
};

export default function CandidateProfileView({ candidateId, navigateToRoute }: Props) {
    const { isMobile, width } = useResponsive();
    const isVerySmallScreen = isMobile && width <= 375;
    const [completeHireVisible, setCompleteHireVisible] = useState(false);
    const [linkHpVisible, setLinkHpVisible] = useState(false);
    const [form] = Form.useForm<CompleteHireFormValues>();
    const {
        candidate,
        hireStatus,
        loading,
        completing,
        optionsLoading,
        employmentTypeOptions,
        hpSearchTerm,
        hpSearchBy,
        hpSearchResults,
        hpSearching,
        hpLinking,
        loadCandidate,
        loadEmploymentTypeOptions,
        completeHire,
        setHpSearchTerm,
        setHpSearchBy,
        searchHpForApplicant,
        linkHpToApplicant,
        clearHpSearch,
    } = useRecruitmentCandidateProfileStore(
        useShallow((state) => ({
            candidate: state.candidate,
            hireStatus: state.hireStatus,
            loading: state.loading,
            completing: state.completing,
            optionsLoading: state.optionsLoading,
            employmentTypeOptions: state.employmentTypeOptions,
            hpSearchTerm: state.hpSearchTerm,
            hpSearchBy: state.hpSearchBy,
            hpSearchResults: state.hpSearchResults,
            hpSearching: state.hpSearching,
            hpLinking: state.hpLinking,
            loadCandidate: state.loadCandidate,
            loadEmploymentTypeOptions: state.loadEmploymentTypeOptions,
            completeHire: state.completeHire,
            setHpSearchTerm: state.setHpSearchTerm,
            setHpSearchBy: state.setHpSearchBy,
            searchHpForApplicant: state.searchHpForApplicant,
            linkHpToApplicant: state.linkHpToApplicant,
            clearHpSearch: state.clearHpSearch,
        })),
    );

    useEffect(() => {
        const bootstrap = async () => {
            try {
                await Promise.all([
                    loadCandidate(candidateId),
                    loadEmploymentTypeOptions(),
                ]);
            } catch (err) {
                const error = err as Error;
                message.error(error?.message || 'Failed to load candidate details');
            }
        };
        void bootstrap();

        return () => {
            clearHpSearch();
        };
    }, [candidateId, clearHpSearch, loadCandidate, loadEmploymentTypeOptions]);

    const handleCompleteHire = async (values: CompleteHireFormValues) => {
        if (!values.start_date) {
            message.error('Start date is required');
            return;
        }

        try {
            const result = await completeHire(candidateId, {
                fid: values.fid.trim(),
                employment_type: values.employment_type,
                designation: values.designation.trim(),
                start_date: values.start_date.format('YYYY-MM-DD'),
                end_date: values.end_date?.format('YYYY-MM-DD'),
            });
            message.success(
                result.idempotent_replay
                    ? 'Affiliation request already exists (replay)'
                    : 'Affiliation request created successfully',
            );
            setCompleteHireVisible(false);
        } catch (err) {
            const error = err as Error;
            message.error(error?.message || 'Failed to complete hire');
        }
    };

    const handleHpSearch = async () => {
        if (hpSearchTerm.trim().length < 2) {
            message.warning('Enter at least 2 characters to search');
            return;
        }
        try {
            const resultCount = await searchHpForApplicant();
            if (!resultCount) {
                message.info('No matching Health Professionals found');
            }
        } catch (err) {
            const error = err as Error;
            message.error(error?.message || 'Search failed');
        }
    };

    const handleLinkHp = async (hpName: string) => {
        try {
            await linkHpToApplicant(candidateId, hpName);
            message.success(`Health Professional ${hpName} linked successfully`);
            setLinkHpVisible(false);
        } catch (err) {
            const error = err as Error;
            message.error(error?.message || 'Failed to link Health Professional');
        }
    };

    const timelineItems = useMemo<Array<{ color?: string; children: ReactNode }>>(() => {
        if (!candidate) return [];

        const items: Array<{ color?: string; children: ReactNode }> = [
            {
                color: 'blue',
                children: (
                    <div>
                        <Text strong style={{ fontSize: 12 }}>Application Received</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {candidate.creation ? new Date(candidate.creation).toLocaleString() : ''}
                        </Text>
                    </div>
                ),
            },
        ];

        for (const interview of candidate.interviews || []) {
            items.push({
                color: interview.status === 'Cleared' ? 'green' : interview.status === 'Rejected' ? 'red' : 'blue',
                children: (
                    <div>
                        <Text strong style={{ fontSize: 12 }}>Interview: {interview.interview_round || 'Round'}</Text>
                        <br />
                        <Tag style={{ fontSize: 10 }}>{interview.status}</Tag>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                            {interview.scheduled_on ? new Date(interview.scheduled_on).toLocaleDateString() : ''}
                        </Text>
                    </div>
                ),
            });
        }

        for (const offer of candidate.job_offers || []) {
            items.push({
                color: offer.status === 'Accepted' ? 'green' : offer.status === 'Rejected' ? 'red' : 'blue',
                children: (
                    <div>
                        <Text strong style={{ fontSize: 12 }}>Offer: {offer.status}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {offer.offer_date || ''} — {offer.name}
                        </Text>
                    </div>
                ),
            });
        }

        if (candidate.hiring_log) {
            const colorByStatus: Record<string, string> = {
                Created: 'blue',
                Hired: 'green',
                Rejected: 'red',
                Failed: 'red',
                Expired: 'orange',
                Closed: 'gray',
            };
            items.push({
                color: colorByStatus[candidate.hiring_log.status] || 'blue',
                children: (
                    <div>
                        <Text strong style={{ fontSize: 12 }}>Affiliation Request: {candidate.hiring_log.status}</Text>
                        <br />
                        {candidate.hiring_log.facility_affiliation && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                <LinkOutlined /> {candidate.hiring_log.facility_affiliation}
                                {candidate.hiring_log.affiliation_status && ` — ${candidate.hiring_log.affiliation_status}`}
                            </Text>
                        )}
                    </div>
                ),
            });
        }

        return items;
    }, [candidate]);

    if (loading) {
        return (
            <div style={{ padding: isMobile ? 12 : 24, textAlign: 'center', paddingTop: isMobile ? 56 : 80 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div style={{ padding: isMobile ? 12 : 24 }}>
                <Alert message="Candidate not found" type="error" showIcon />
            </div>
        );
    }

    const hasHpLink = !!candidate.health_professional;
    const hasAcceptedOffer = candidate.job_offers?.some((offer) => offer.status === 'Accepted');
    const canCompleteHire = hasHpLink && hasAcceptedOffer;
    const registeringBody = candidate.registering_body_label || candidate.registering_body || '';
    const registrationSummary = candidate.registration_number
        ? `${candidate.registration_number}${registeringBody ? ` (${registeringBody})` : ''}`
        : '—';

    return (
        <div style={{ padding: isVerySmallScreen ? 8 : (isMobile ? 12 : 24) }}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                size={isMobile ? 'large' : 'middle'}
                onClick={() => navigateToRoute('recruitment/candidates')}
                style={{ marginBottom: isMobile ? 10 : 16, fontSize: 13, paddingInline: isMobile ? 6 : undefined }}
            >
                Back to Pipeline
            </Button>

            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 16 }}
                styles={{ body: { padding: isVerySmallScreen ? 10 : (isMobile ? 12 : 24) } }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 10 : 0,
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'flex-start',
                    }}
                >
                    <div>
                        <Title level={isMobile ? 5 : 4} style={{ marginBottom: 4 }}>
                            <UserOutlined style={{ marginRight: 8 }} />
                            {candidate.applicant_name}
                        </Title>
                        <Text type="secondary">{candidate.email_id}</Text>
                        {candidate.phone && <Text type="secondary"> | {candidate.phone}</Text>}
                    </div>
                    <Space wrap>
                        <Tag color={STATUS_COLORS[candidate.status || ''] || 'default'} style={{ fontSize: 12 }}>
                            {candidate.status}
                        </Tag>
                        {hasHpLink && (
                            <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 11 }}>
                                HP Linked
                            </Tag>
                        )}
                    </Space>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="Position">{candidate.job_title || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Designation">{candidate.designation || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Source">{candidate.source || '—'}</Descriptions.Item>
                    <Descriptions.Item label="HP Reference">{candidate.health_professional || 'Not linked'}</Descriptions.Item>
                    <Descriptions.Item label="Health Worker">{candidate.is_health_worker ? 'Yes' : 'No'}</Descriptions.Item>
                    <Descriptions.Item label="Registration">{candidate.is_health_worker ? registrationSummary : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Applied">{candidate.creation ? new Date(candidate.creation).toLocaleDateString() : '—'}</Descriptions.Item>
                </Descriptions>

                {hireStatus && hireStatus.status !== 'No Affiliation Request' && (
                    <>
                        <Divider style={{ margin: '16px 0' }} />
                        <Space wrap>
                            <Text strong style={{ fontSize: 12 }}>Hiring Status:</Text>
                            <Badge
                                status={hireStatus.status === 'Hired' ? 'success' : hireStatus.status.includes('Awaiting') ? 'processing' : 'warning'}
                                text={<Text style={{ fontSize: 12 }}>{hireStatus.status}</Text>}
                            />
                        </Space>
                    </>
                )}

                {canCompleteHire && (!hireStatus || hireStatus.status === 'No Affiliation Request') && (
                    <>
                        <Divider style={{ margin: '16px 0' }} />
                        <Button
                            type="primary"
                            size={isMobile ? 'large' : 'middle'}
                            onClick={() => {
                                form.setFieldsValue({
                                    designation: candidate.designation || undefined,
                                });
                                setCompleteHireVisible(true);
                            }}
                            icon={<CheckCircleOutlined />}
                        >
                            Complete Hire
                        </Button>
                    </>
                )}

                {!hasHpLink && (
                    <>
                        <Divider style={{ margin: '16px 0' }} />
                        <Button
                            icon={<LinkOutlined />}
                            size={isMobile ? 'large' : 'middle'}
                            onClick={() => setLinkHpVisible(true)}
                        >
                            Link Health Professional
                        </Button>
                        {hasAcceptedOffer && (
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginTop: 12 }}
                                message="Health Professional not linked"
                                description="Link this candidate to a Health Professional before completing the hire."
                            />
                        )}
                    </>
                )}
            </Card>

            <Card
                title={<Text strong style={{ fontSize: 14 }}>Hiring Timeline</Text>}
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: isVerySmallScreen ? 10 : (isMobile ? 12 : 24) } }}
            >
                <Timeline items={timelineItems} />
            </Card>

            <Modal
                title="Complete Hire — Create Affiliation Request"
                open={completeHireVisible}
                onCancel={() => setCompleteHireVisible(false)}
                footer={null}
                width={isMobile ? '100%' : 520}
                style={isMobile ? { top: 8, maxWidth: 'calc(100vw - 16px)' } : undefined}
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="This will create a Facility Affiliation via the shared Add Single Affiliation flow. The candidate will need to confirm in their app."
                />
                <Form form={form} layout="vertical" onFinish={handleCompleteHire}>
                    <Form.Item
                        name="fid"
                        label="Facility ID"
                        rules={[{ required: true, whitespace: true, message: 'Facility ID is required' }]}
                    >
                        <Input placeholder="e.g., HF-00001" maxLength={140} />
                    </Form.Item>
                    <Form.Item name="employment_type" label="Employment Type" rules={[{ required: true, message: 'Employment type is required' }]}>
                        <Select
                            placeholder={employmentTypeOptions.length ? 'Select type' : 'No employment types configured'}
                            showSearch
                            optionFilterProp="label"
                            loading={optionsLoading}
                            notFoundContent={optionsLoading ? <Spin size="small" /> : null}
                            options={employmentTypeOptions.map((value) => ({ value, label: value }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="designation"
                        label="Designation"
                        rules={[{ required: true, whitespace: true, message: 'Designation is required' }]}
                    >
                        <Input placeholder="e.g., Primary Nurse" maxLength={140} />
                    </Form.Item>
                    <Form.Item
                        name="start_date"
                        label="Start Date"
                        rules={[{ required: true, message: 'Start date is required' }]}
                    >
                        <DatePicker style={{ width: '100%' }} inputReadOnly={isMobile} />
                    </Form.Item>
                    <Form.Item
                        name="end_date"
                        label="End Date (optional)"
                        dependencies={['start_date']}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value: Dayjs | undefined) {
                                    const startDate = getFieldValue('start_date') as Dayjs | undefined;
                                    if (!startDate || !value || !value.isBefore(startDate, 'day')) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('End date must be on or after start date'));
                                },
                            }),
                        ]}
                    >
                        <DatePicker style={{ width: '100%' }} inputReadOnly={isMobile} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={completing} block size={isMobile ? 'large' : 'middle'}>
                            Create Affiliation Request
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Link Health Professional"
                open={linkHpVisible}
                onCancel={() => {
                    setLinkHpVisible(false);
                    clearHpSearch();
                }}
                footer={null}
                width={isMobile ? '100%' : 560}
                style={isMobile ? { top: 8, maxWidth: 'calc(100vw - 16px)' } : undefined}
            >
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Search for and link a Health Professional to this candidate. This is required before completing the hire (BRD §9.2)."
                />
                <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                    <Select
                        value={hpSearchBy}
                        onChange={setHpSearchBy}
                        style={{ width: isMobile ? 140 : 180 }}
                        options={[
                            { value: 'registration_number', label: 'Registration No.' },
                            { value: 'national_id', label: 'National ID' },
                            { value: 'alien_id', label: 'Alien ID' },
                        ]}
                    />
                    <Input
                        placeholder="Enter search term..."
                        value={hpSearchTerm}
                        onChange={(e) => setHpSearchTerm(e.target.value)}
                        onPressEnter={handleHpSearch}
                        style={{ flex: 1 }}
                    />
                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={handleHpSearch}
                        loading={hpSearching}
                    >
                        Search
                    </Button>
                </Space.Compact>

                {hpSearchResults.length > 0 && (
                    <List
                        size="small"
                        bordered
                        dataSource={hpSearchResults}
                        renderItem={(hp) => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="link"
                                        type="primary"
                                        size="small"
                                        icon={<LinkOutlined />}
                                        loading={hpLinking}
                                        onClick={() => handleLinkHp(hp.name)}
                                    >
                                        Link
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={<Text strong style={{ fontSize: 13 }}>{hp.full_name || hp.name}</Text>}
                                    description={(
                                        <Space size={8} wrap>
                                            {hp.registration_number && <Tag style={{ fontSize: 10 }}>Reg: {hp.registration_number}</Tag>}
                                            {hp.status && <Tag color={hp.status === 'Active' ? 'green' : 'default'} style={{ fontSize: 10 }}>{hp.status}</Tag>}
                                            <Text type="secondary" style={{ fontSize: 11 }}>{hp.name}</Text>
                                        </Space>
                                    )}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Modal>
        </div>
    );
}
