import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
    Table,
    Card,
    Row,
    Col,
    Statistic,
    Tag,
    Input,
    Space,
    Typography,
    Button,
    Select,
    theme,
    DatePicker,
    Tooltip,
    Modal,
    Avatar,
    Form,
    message,
    Upload,
    Spin,
    Descriptions,
    Tabs,
    Alert,
    Progress,
    Steps,
} from 'antd';
import {
    LinkOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    MedicineBoxOutlined,
    FilterOutlined,
    ClearOutlined,
    PaperClipOutlined,
    UploadOutlined,
    DeleteOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatDateHuman, formatDateRemaining } from '../../../utils/dateHelpers';
import useAffiliationsModuleStore from '../../../stores/modules/affiliationsModuleStore';
import useFacilityStore from '../../../stores/facilityStore';
import { affiliationsApi, healthProfessionalsApi } from '../../../services/api';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Title } = Typography;
type TerminationAttachment = {
    id: string;
    fileName: string;
    url?: string;
    storedAsReference?: boolean;
};
type TerminationOtpSession = {
    otpId: string;
    maskedDestination: string;
    expiresInSeconds: number;
    destinationSource?: string;
};

const AffiliationsListView: React.FC = () => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const { availableFacilities, selectedFacilityIds } = useFacilityStore();
    const facilityNameById = useMemo(
        () =>
            availableFacilities.reduce<Record<string, string>>((acc, facility) => {
                if (facility.hie_id) {
                    acc[facility.hie_id] = facility.facility_name;
                }
                return acc;
            }, {}),
        [availableFacilities]
    );

    // Detail modal state (UI-only state, not filter state)
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedAffiliation, setSelectedAffiliation] = useState<any>(null);
    const [terminateModalVisible, setTerminateModalVisible] = useState(false);
    const [terminateTarget, setTerminateTarget] = useState<any>(null);
    const [terminateStep, setTerminateStep] = useState<'details' | 'otp'>('details');
    const [submittingTerminate, setSubmittingTerminate] = useState(false);
    const [requestingOtp, setRequestingOtp] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [terminateForm] = Form.useForm();
    const [uploadedFiles, setUploadedFiles] = useState<TerminationAttachment[]>([]);
    const [otpSession, setOtpSession] = useState<TerminationOtpSession | null>(null);
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [otpPrereqError, setOtpPrereqError] = useState('');
    const [hpDetail, setHpDetail] = useState<any | null>(null);
    const [hpLoading, setHpLoading] = useState(false);

    // Debounce timer ref for search input
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        affiliations,
        loading,
        total,
        statusAggregates,  // NEW: Status aggregates from backend
        filters,
        fetchAffiliations,
        setFilters
    } = useAffiliationsModuleStore();

    const handleRefresh = useCallback(() => {
        fetchAffiliations(filters.facilities);
    }, [fetchAffiliations, filters.facilities]);

    const handleFacilityFilterChange = (selectedIds: string[]) => {
        setFilters({ facilities: selectedIds });
    };

    const loadHealthProfessionalDetail = useCallback(async (healthProfessionalId?: string) => {
        if (!healthProfessionalId) {
            setHpDetail(null);
            return;
        }
        setHpLoading(true);
        try {
            const resp = await healthProfessionalsApi.getDetail(healthProfessionalId);
            if (resp.success) {
                setHpDetail(resp.data);
            } else {
                setHpDetail(null);
            }
        } catch (error) {
            console.error('Failed to load health professional detail', error);
            setHpDetail(null);
        } finally {
            setHpLoading(false);
        }
    }, []);

    const handleViewDetails = (record: any) => {
        setSelectedAffiliation(record);
        setDetailModalVisible(true);
        loadHealthProfessionalDetail(record.health_professional);
    };

    const handleOpenTerminate = (record: any) => {
        setTerminateTarget(record);
        // Always hide the review/details modal before opening the terminate dialog
        setDetailModalVisible(false);
        setTerminateStep('details');
        setOtpSession(null);
        setOtpCountdown(0);
        setOtpPrereqError('');
        terminateForm.resetFields();
        setUploadedFiles([]);
        setTerminateModalVisible(true);
    };

    useEffect(() => {
        if (!terminateModalVisible || terminateStep !== 'otp' || otpCountdown <= 0) return;
        const timer = window.setInterval(() => {
            setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [terminateModalVisible, terminateStep, otpCountdown]);

    const handleRequestTerminationOtp = async () => {
        if (!terminateTarget?.name) {
            message.error('Invalid affiliation selected.');
            return;
        }

        try {
            await terminateForm.validateFields(['termination_reason']);
            setRequestingOtp(true);
            const response = await affiliationsApi.requestTerminationOtp(terminateTarget.name);
            if (!response.success || !response.data) {
                const err = response.error || 'Failed to send OTP.';
                if (err.includes('No OTP phone found for current user')) {
                    setOtpPrereqError(err);
                    Modal.warning({
                        title: 'OTP setup required',
                        content: 'No mobile number is configured for your logged-in user account. Please update User.mobile_no, then click "Re-check OTP setup".',
                    });
                } else {
                    setOtpPrereqError('');
                }
                message.error(err);
                return;
            }

            const session: TerminationOtpSession = {
                otpId: response.data.otp_id,
                maskedDestination: response.data.masked_destination,
                expiresInSeconds: response.data.expires_in_seconds || 300,
                destinationSource: response.data.destination_source,
            };
            setOtpSession(session);
            setOtpPrereqError('');
            setOtpCountdown(session.expiresInSeconds);
            setTerminateStep('otp');
            message.success(`Verification code sent to ${session.maskedDestination}.`);
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(error?.message || 'Failed to send OTP.');
        } finally {
            setRequestingOtp(false);
        }
    };

    // Custom upload handler to integrate with Frappe's /api/method/upload_file
    const handleUploadAttachment = async (options: any) => {
        const { file, onSuccess, onError } = options;

        if (!terminateTarget?.name) {
            const error = new Error('No affiliation selected for upload');
            onError?.(error);
            message.error('Please select an affiliation before uploading documents.');
            return;
        }
        try {
            setUploadingAttachment(true);
            const toBase64 = (f: File | Blob) =>
                new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ''));
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                });

            const fileObj = (file as any).originFileObj || file;
            const dataUrl = await toBase64(fileObj as File);
            const base64Content = dataUrl.includes(',') ? dataUrl.split(',', 2)[1] : dataUrl;
            const uploadResult = await affiliationsApi.uploadTerminationAttachmentBase64(
                terminateTarget.name,
                (file as any).name || 'attachment.bin',
                base64Content
            );
            if (!uploadResult.success || !uploadResult.data) {
                const err = uploadResult.error || 'Failed to upload file.';
                onError?.(new Error(err));
                message.error(err);
                return;
            }
            const resp = uploadResult.data;

            if (resp) {
                const next = {
                    id: resp.name || resp.file_name || resp.file_url,
                    fileName: resp.file_name || (file as any).name || 'Attachment',
                    url: resp.file_url || undefined,
                    storedAsReference: !!resp.stored_as_reference,
                };
                setUploadedFiles((prev) => {
                    const exists = prev.find((f) => f.id === next.id);
                    if (exists) return prev;
                    return [...prev, next];
                });
                message.success(`${(file as any).name || 'File'} uploaded successfully.`);
                if (resp.stored_as_reference) {
                    message.warning('Attachment captured as reference due server file-library limitations.');
                }
            } else {
                message.success(`${(file as any).name || 'File'} uploaded.`);
            }

            onSuccess?.(resp, file);
        } catch (err: any) {
            onError?.(err);
            message.error('Failed to upload file. Please check your connection and try again.');
        } finally {
            setUploadingAttachment(false);
        }
    };

    const handleSubmitTerminate = async () => {
        try {
            const values = await terminateForm.validateFields();
            if (!terminateTarget?.name) {
                message.error('Invalid affiliation selected.');
                return;
            }
            if (!otpSession?.otpId) {
                message.error('Please request and verify OTP before confirming termination.');
                return;
            }

            setSubmittingTerminate(true);
            const response = await affiliationsApi.terminateAffiliation(
                terminateTarget.name,
                values.termination_reason,
                uploadedFiles.map((f) => f.id),
                values.otp_code,
                otpSession.otpId
            );

            if (!response.success) {
                message.error(response.error || 'Failed to terminate affiliation.');
                return;
            }

            message.success('Affiliation terminated successfully. Employee has been deactivated.');
            setTerminateModalVisible(false);
            setTerminateTarget(null);
            setTerminateStep('details');
            setOtpSession(null);
            setOtpCountdown(0);
            setUploadedFiles([]);
            terminateForm.resetFields();
            setDetailModalVisible(false);
            fetchAffiliations(filters.facilities);
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(error?.message || 'Failed to terminate affiliation.');
        } finally {
            setSubmittingTerminate(false);
        }
    };

    const getRelativeTagColor = (dateStr?: string) => {
        if (!dateStr) return 'default';
        const diff = dayjs(dateStr).startOf('day').diff(dayjs().startOf('day'), 'day');
        if (diff > 30) return 'green';
        if (diff >= 0) return 'blue';
        return 'red';
    };

    const renderDateValue = (dateStr?: string) => (
        <Space direction="vertical" size={0}>
            <Text style={{ fontWeight: 600, fontSize: 12 }}>{formatDateHuman(dateStr)}</Text>
            {dateStr && (
                <Tag color={getRelativeTagColor(dateStr)} style={{ marginRight: 0, width: 'fit-content' }}>
                    {formatDateRemaining(dateStr)}
                </Tag>
            )}
        </Space>
    );

    const getExpiryProgress = (startDate?: string, endDate?: string) => {
        const today = dayjs().startOf('day');
        const end = endDate ? dayjs(endDate).startOf('day') : null;
        const start = startDate ? dayjs(startDate).startOf('day') : null;

        if (!end || !end.isValid()) {
            return {
                percent: 0,
                status: 'normal' as const,
                strokeColor: token.colorBorder,
                label: 'No valid end date',
            };
        }

        const remainingDays = end.diff(today, 'day');
        if (remainingDays < 0) {
            return {
                percent: 100,
                status: 'exception' as const,
                strokeColor: '#ff4d4f',
                label: `${Math.abs(remainingDays)} day${Math.abs(remainingDays) === 1 ? '' : 's'} expired`,
            };
        }

        if (!start || !start.isValid()) {
            return {
                percent: remainingDays === 0 ? 100 : 50,
                status: 'active' as const,
                strokeColor: remainingDays <= 30 ? '#faad14' : '#52c41a',
                label: formatDateRemaining(endDate),
            };
        }

        const totalDays = Math.max(end.diff(start, 'day'), 1);
        const elapsedDays = Math.max(today.diff(start, 'day'), 0);
        const rawPercent = Math.round((elapsedDays / totalDays) * 100);
        const percent = Math.max(0, Math.min(100, rawPercent));

        return {
            percent,
            status: 'active' as const,
            strokeColor: remainingDays <= 30 ? '#faad14' : '#52c41a',
            label: formatDateRemaining(endDate),
        };
    };

    // Initial load - fetch with either store filters or global selected facilities
    useEffect(() => {
        const initialFacilities = filters.facilities && filters.facilities.length > 0
            ? filters.facilities
            : selectedFacilityIds;
        if (initialFacilities !== filters.facilities) {
            setFilters({ facilities: initialFacilities });
        } else {
            fetchAffiliations(initialFacilities);
        }
    }, [selectedFacilityIds]); // Only run on mount or when global facilities change

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            case 'inactive': return 'default';
            default: return 'processing';
        }
    };

    const columns = [
        {
            title: 'Professional',
            key: 'professional',
            fixed: 'left' as const,
            width: 250,
            render: (record: any) => (
                <Space>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: token.colorFillAlter,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorPrimary
                    }}>
                        <UserOutlined />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px' }}>{record.health_professional_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.employment_type || 'Contract'}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Health Facility',
            dataIndex: 'health_facility',
            key: 'facility',
            width: 250,
            render: (facility: string, record: any) => {
                const explicitName = (record.facility_name || '').trim();
                const mappedName = (record.facility_id && facilityNameById[record.facility_id]) || (facility ? facilityNameById[facility] : '');
                const facilityName = explicitName || mappedName || 'Unknown Facility';
                const facilityId = (record.facility_id || (!explicitName && facility ? facility : '') || '').trim();

                return (
                    <Space direction="vertical" size={0}>
                        <Space>
                            <MedicineBoxOutlined style={{ color: token.colorTextDescription }} />
                            <Text strong style={{ fontSize: '14px' }}>
                                {facilityName}
                            </Text>
                        </Space>
                        {facilityId && (
                            <Text type="secondary" style={{ fontSize: '11px', marginLeft: 22 }}>
                                ID: {facilityId}
                            </Text>
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'Requested Date',
            dataIndex: 'requested_date',
            key: 'date',
            width: 150,
            render: (date: string) => (
                <Text style={{ fontSize: '13px' }}>{formatDateHuman(date)}</Text>
            )
        },
        {
            title: 'Affiliation Progress',
            key: 'affiliation_progress',
            width: 210,
            render: (_: any, record: any) => {
                const progress = getExpiryProgress(record.start_date, record.expiry_date);
                return (
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Progress
                            percent={progress.percent}
                            size="small"
                            showInfo={false}
                            status={progress.status}
                            strokeColor={progress.strokeColor}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {progress.label}
                        </Text>
                    </Space>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'affiliation_status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Tag color={getStatusColor(status)} style={{ borderRadius: 12, padding: '0 12px' }}>
                    {status || 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 170,
            render: (record: any) => (
                <Space size="small">
                    <Button
                        type="link"
                        onClick={() => handleViewDetails(record)}
                    >
                        Review
                    </Button>
                    {['Active', 'Confirmed'].includes((record.affiliation_status || '').trim()) && (
                        <Button
                            danger
                            type="link"
                            onClick={() => handleOpenTerminate(record)}
                        >
                            Terminate
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Metric Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL REQUESTS</Text>}
                            value={statusAggregates?.total || total}
                            prefix={<LinkOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>PENDING REVIEW</Text>}
                            value={statusAggregates?.pending || 0}
                            prefix={<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>CONFIRMED</Text>}
                            value={statusAggregates?.confirmed || 0}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>REJECTION RATE</Text>}
                            value={statusAggregates?.rejection_rate || 0}
                            suffix="%"
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>REJECTED</Text>}
                            value={statusAggregates?.rejected || 0}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>CONFIRMATION RATE</Text>}
                            value={statusAggregates?.confirmation_rate ?? statusAggregates?.approval_rate ?? 0}
                            suffix="%"
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table Section */}
            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: 0 }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '16px 24px' }}>
                        <Title level={4} style={{ margin: 0 }}>Affiliation Requests</Title>
                        <Space wrap size="small">
                            {/* Status Filter - NEW: Connect to store */}
                            <Select
                                placeholder="All Status"
                                value={filters.status || undefined}
                                onChange={(status) => setFilters({ status: status || '' })}
                                style={{ width: 150, borderRadius: 8 }}
                                allowClear
                                suffixIcon={<FilterOutlined style={{ color: token.colorTextPlaceholder }} />}
                            >
                                <Select.Option value="Pending">
                                    <Tag color="orange" style={{ fontSize: '11px' }}>Pending</Tag>
                                </Select.Option>
                                <Select.Option value="Confirmed">
                                    <Tag color="green" style={{ fontSize: '11px' }}>Confirmed (Active + Confirmed)</Tag>
                                </Select.Option>
                                <Select.Option value="Rejected">
                                    <Tag color="red" style={{ fontSize: '11px' }}>Rejected</Tag>
                                </Select.Option>
                                <Select.Option value="Expired">
                                    <Tag color="default" style={{ fontSize: '11px' }}>Expired</Tag>
                                </Select.Option>
                                <Select.Option value="Inactive">
                                    <Tag color="default" style={{ fontSize: '11px' }}>Inactive</Tag>
                                </Select.Option>
                            </Select>

                            {/* Facility Filter */}
                            <Select
                                mode="multiple"
                                placeholder="All Facilities"
                                value={filters.facilities || []}
                                onChange={handleFacilityFilterChange}
                                style={{ minWidth: isMobile ? 180 : 250, borderRadius: 8 }}
                                maxTagCount="responsive"
                                allowClear
                                suffixIcon={<MedicineBoxOutlined style={{ color: token.colorTextPlaceholder }} />}
                                options={availableFacilities.map(facility => ({
                                    label: facility.facility_name,
                                    value: facility.hie_id
                                }))}
                            />

                            {/* Requested Date Range Filter */}
                            <DatePicker.RangePicker
                                placeholder={['Requested from', 'Requested to']}
                                value={filters.dateFrom && filters.dateTo ? [
                                    dayjs(filters.dateFrom),
                                    dayjs(filters.dateTo)
                                ] : null}
                                onChange={(dates) => {
                                    if (dates) {
                                        setFilters({
                                            dateFrom: dates[0]?.format('YYYY-MM-DD'),
                                            dateTo: dates[1]?.format('YYYY-MM-DD')
                                        });
                                    } else {
                                        setFilters({ dateFrom: '', dateTo: '' });
                                    }
                                }}
                                style={{ borderRadius: 8 }}
                                allowClear
                            />

                            {/* Affiliation Expiry Date Range Filter */}
                            <DatePicker.RangePicker
                                placeholder={['Expiry from', 'Expiry to']}
                                value={filters.expiryFrom && filters.expiryTo ? [
                                    dayjs(filters.expiryFrom),
                                    dayjs(filters.expiryTo)
                                ] : null}
                                onChange={(dates) => {
                                    if (dates) {
                                        setFilters({
                                            expiryFrom: dates[0]?.format('YYYY-MM-DD'),
                                            expiryTo: dates[1]?.format('YYYY-MM-DD')
                                        });
                                    } else {
                                        setFilters({ expiryFrom: '', expiryTo: '' });
                                    }
                                }}
                                style={{ borderRadius: 8 }}
                                allowClear
                            />

                            {/* Professional Search - FIX: Wire to store */}
                            <Input
                                placeholder="Search professional..."
                                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                                value={filters.professional_name || ''}
                                onChange={(e) => {
                                    const searchValue = e.target.value;
                                    clearTimeout(searchTimeoutRef.current!);
                                    searchTimeoutRef.current = setTimeout(() => {
                                        setFilters({ professional_name: searchValue });
                                    }, 300);
                                }}
                                style={{ width: isMobile ? 180 : 250, borderRadius: 8 }}
                                allowClear
                            />

                            {/* Clear All Filters Button */}
                            <Tooltip title="Clear all filters">
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={() => {
                                        setFilters({
                                            status: '',
                                            professional_name: '',
                                            dateFrom: '',
                                            dateTo: '',
                                            expiryFrom: '',
                                            expiryTo: '',
                                            facilities: []
                                        });
                                    }}
                                />
                            </Tooltip>

                            {/* Refresh Button */}
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />

                            {/* Active Filter Count Badge */}
                            {(filters.status || (filters.facilities && filters.facilities.length > 0) || filters.professional_name || filters.dateFrom || filters.expiryFrom) && (
                                <Tag color="blue" style={{ marginLeft: 4 }}>
                                    {[
                                        filters.status && '1 status',
                                        (filters.facilities && filters.facilities.length > 0) && `${filters.facilities.length} facilities`,
                                        filters.professional_name && '1 search',
                                        (filters.dateFrom || filters.dateTo) && '1 requested date range',
                                        (filters.expiryFrom || filters.expiryTo) && '1 expiry range',
                                    ].filter(Boolean).join(', ')}
                                </Tag>
                            )}
                        </Space>
                    </div>
                }
            >
                {loading ? (
                    <TableSkeleton rows={filters.pageSize} />
                ) : affiliations.length > 0 ? (
                    <Table
                        dataSource={affiliations}
                        columns={columns}
                        rowKey="name"
                        pagination={{
                            current: filters.page,
                            pageSize: filters.pageSize,
                            total: total,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => setFilters({ page, pageSize })
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Affiliations Found"
                        description="There are currently no staff recruitment or facility affiliation requests."
                        onAction={handleRefresh}
                        actionText="Reload Requests"
                    />
                )}
            </Card>

            {/* Detail Modal */}
            <Modal
                title={<Space><UserOutlined /><span>Affiliation Details</span></Space>}
                open={detailModalVisible}
                onCancel={() => {
                    setDetailModalVisible(false);
                    setHpDetail(null);
                }}
                footer={[
                    selectedAffiliation && ['Active', 'Confirmed'].includes((selectedAffiliation.affiliation_status || '').trim()) ? (
                        <Button
                            key="terminate"
                            danger
                            onClick={() => handleOpenTerminate(selectedAffiliation)}
                        >
                            Terminate Affiliation
                        </Button>
                    ) : null,
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>Close</Button>,
                ]}
                width={isMobile ? '100%' : 1040}
                style={{ top: isMobile ? 0 : 24, paddingBottom: 0 }}
                bodyStyle={{
                    padding: isMobile ? 12 : 18,
                }}
                destroyOnClose
            >
                {selectedAffiliation && (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Card
                            size="small"
                            bordered={false}
                            style={{
                                borderRadius: 10,
                                background: token.colorFillQuaternary
                            }}
                            bodyStyle={{ padding: isMobile ? 10 : 12 }}
                        >
                            <Row align="middle" justify="space-between" gutter={[12, 12]}>
                                <Col flex="auto">
                                    <Space align="center" size={10}>
                                        <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>Health Professional</Text>
                                            <Title level={5} style={{ margin: 0 }}>
                                                {selectedAffiliation.health_professional_name}
                                            </Title>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                Affiliation ID: {selectedAffiliation.name}
                                            </Text>
                                        </Space>
                                    </Space>
                                </Col>
                                <Col>
                                    <Space size={6} wrap>
                                        <Tag color={getStatusColor(selectedAffiliation.affiliation_status)}>
                                            {selectedAffiliation.affiliation_status}
                                        </Tag>
                                        <Tag color="purple">
                                            {selectedAffiliation.employment_type || 'N/A'}
                                        </Tag>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        <Row gutter={[10, 10]}>
                            <Col xs={12} md={6}>
                                <Card size="small" style={{ borderRadius: 10 }}>
                                    <Statistic title="Current Status" value={selectedAffiliation.affiliation_status || '-'} valueStyle={{ fontSize: 16 }} />
                                </Card>
                            </Col>
                            <Col xs={12} md={6}>
                                <Card size="small" style={{ borderRadius: 10 }}>
                                    <Statistic title="Employment Type" value={selectedAffiliation.employment_type || 'N/A'} valueStyle={{ fontSize: 16 }} />
                                </Card>
                            </Col>
                            <Col xs={12} md={6}>
                                <Card size="small" style={{ borderRadius: 10 }}>
                                    <Statistic
                                        title="License Expiry"
                                        value={formatDateRemaining(hpDetail?.license_end) || '-'}
                                        valueStyle={{ fontSize: 16 }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[10, 10]}>
                            <Col xs={24} md={12}>
                                {(() => {
                                    const affiliationProgress = getExpiryProgress(selectedAffiliation.start_date, selectedAffiliation.expiry_date);
                                    return (
                                        <Card size="small" style={{ borderRadius: 10 }} bodyStyle={{ padding: 12 }}>
                                            <Text strong style={{ fontSize: 12 }}>Affiliation Expiry Progress</Text>
                                            <div style={{ marginTop: 8 }}>
                                                <Progress
                                                    percent={affiliationProgress.percent}
                                                    size="small"
                                                    showInfo={false}
                                                    status={affiliationProgress.status}
                                                    strokeColor={affiliationProgress.strokeColor}
                                                />
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {affiliationProgress.label}
                                                </Text>
                                            </div>
                                        </Card>
                                    );
                                })()}
                            </Col>
                            <Col xs={24} md={12}>
                                {(() => {
                                    const licenseProgress = getExpiryProgress(hpDetail?.license_start, hpDetail?.license_end);
                                    return (
                                        <Card size="small" style={{ borderRadius: 10 }} bodyStyle={{ padding: 12 }}>
                                            <Text strong style={{ fontSize: 12 }}>License Expiry Progress</Text>
                                            <div style={{ marginTop: 8 }}>
                                                <Progress
                                                    percent={licenseProgress.percent}
                                                    size="small"
                                                    showInfo={false}
                                                    status={licenseProgress.status}
                                                    strokeColor={licenseProgress.strokeColor}
                                                />
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {licenseProgress.label}
                                                </Text>
                                            </div>
                                        </Card>
                                    );
                                })()}
                            </Col>
                        </Row>

                        <Card size="small" style={{ borderRadius: 10 }} bodyStyle={{ padding: isMobile ? 10 : 14 }}>
                            <Tabs
                                defaultActiveKey="overview"
                                items={[
                                    {
                                        key: 'overview',
                                        label: 'Affiliation Overview',
                                        children: (
                                            <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                                <Descriptions bordered size="small" column={isMobile ? 1 : 2}>
                                                    <Descriptions.Item label="Facility">
                                                        {selectedAffiliation.facility_name || facilityNameById[selectedAffiliation.facility_id || selectedAffiliation.health_facility] || 'Unknown Facility'}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Facility ID">
                                                        {selectedAffiliation.facility_id || selectedAffiliation.health_facility || '-'}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Affiliation ID">{selectedAffiliation.name}</Descriptions.Item>
                                                    <Descriptions.Item label="Requested By">{selectedAffiliation.requested_by || '-'}</Descriptions.Item>
                                                    <Descriptions.Item label="Requested">{renderDateValue(selectedAffiliation.requested_date)}</Descriptions.Item>
                                                    <Descriptions.Item label="Start">{renderDateValue(selectedAffiliation.start_date)}</Descriptions.Item>
                                                    <Descriptions.Item label="End">{renderDateValue(selectedAffiliation.end_date)}</Descriptions.Item>
                                                    <Descriptions.Item label="Expiry">{renderDateValue(selectedAffiliation.expiry_date)}</Descriptions.Item>
                                                    {selectedAffiliation.termination_date && (
                                                        <Descriptions.Item label="Termination">{renderDateValue(selectedAffiliation.termination_date)}</Descriptions.Item>
                                                    )}
                                                    {selectedAffiliation.terminated_by && (
                                                        <Descriptions.Item label="Terminated By">{selectedAffiliation.terminated_by}</Descriptions.Item>
                                                    )}
                                                </Descriptions>
                                                {selectedAffiliation.termination_reason && (
                                                    <Alert
                                                        type="warning"
                                                        showIcon
                                                        message="Termination context"
                                                        description={selectedAffiliation.termination_reason}
                                                    />
                                                )}
                                            </Space>
                                        ),
                                    },
                                    {
                                        key: 'professional',
                                        label: 'Professional Profile',
                                        children: hpLoading ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                                                <Spin />
                                            </div>
                                        ) : (
                                            <Descriptions bordered size="small" column={isMobile ? 1 : 2}>
                                                <Descriptions.Item label="Full Name">{hpDetail?.full_name || selectedAffiliation.health_professional_name || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="Registration #">{hpDetail?.registration_number || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="Professional Cadre">{hpDetail?.professional_cadre || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="Specialty">{hpDetail?.professional_specialty || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="County">{hpDetail?.county || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="License Type">{hpDetail?.license_type || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="Phone">{hpDetail?.phone || hpDetail?.official_phone || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="Email">{hpDetail?.email || hpDetail?.official_email || '-'}</Descriptions.Item>
                                                <Descriptions.Item label="License Start">{renderDateValue(hpDetail?.license_start)}</Descriptions.Item>
                                                <Descriptions.Item label="License End">{renderDateValue(hpDetail?.license_end)}</Descriptions.Item>
                                                <Descriptions.Item label="License Expiry Progress" span={isMobile ? 1 : 2}>
                                                    {(() => {
                                                        const licenseProgress = getExpiryProgress(hpDetail?.license_start, hpDetail?.license_end);
                                                        return (
                                                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                                <Progress
                                                                    percent={licenseProgress.percent}
                                                                    size="small"
                                                                    showInfo={false}
                                                                    status={licenseProgress.status}
                                                                    strokeColor={licenseProgress.strokeColor}
                                                                />
                                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                                    {licenseProgress.label}
                                                                </Text>
                                                            </Space>
                                                        );
                                                    })()}
                                                </Descriptions.Item>
                                                {hpDetail?.licensing_body && (
                                                    <Descriptions.Item label="Licensing Body" span={isMobile ? 1 : 2}>
                                                        {hpDetail.licensing_body}
                                                    </Descriptions.Item>
                                                )}
                                            </Descriptions>
                                        ),
                                    },
                                ]}
                            />
                        </Card>
                    </Space>
                )}
            </Modal>

            <Modal
                title="Terminate Affiliation"
                open={terminateModalVisible}
                onCancel={() => {
                    setTerminateModalVisible(false);
                    setTerminateTarget(null);
                    setTerminateStep('details');
                    setOtpSession(null);
                    setOtpCountdown(0);
                    setOtpPrereqError('');
                    setUploadedFiles([]);
                    terminateForm.resetFields();
                }}
                onOk={terminateStep === 'details' ? handleRequestTerminationOtp : handleSubmitTerminate}
                confirmLoading={requestingOtp || submittingTerminate}
                okButtonProps={{
                    danger: terminateStep === 'otp',
                    disabled:
                        uploadingAttachment
                        || (terminateStep === 'details' && !!otpPrereqError)
                        || (terminateStep === 'otp' && otpCountdown <= 0),
                }}
                okText={terminateStep === 'details' ? 'Send OTP' : 'Verify OTP & Terminate'}
                destroyOnClose
                zIndex={1100}
                width={isMobile ? '100%' : 700}
                style={{ top: isMobile ? 0 : 24, paddingBottom: 0 }}
                bodyStyle={{
                    padding: isMobile ? 12 : 20,
                    maxHeight: isMobile ? 'calc(100vh - 150px)' : undefined,
                    overflowY: isMobile ? 'auto' : undefined,
                }}
            >
                {terminateTarget && (
                    <Card
                        size="small"
                        style={{ marginBottom: 16, borderRadius: 8 }}
                        bodyStyle={{ padding: 12 }}
                    >
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                            <Space align="start">
                                <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                                <Space direction="vertical" size={0}>
                                    <Text strong>{terminateTarget.health_professional_name}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {terminateTarget.employment_type || 'N/A'} •{' '}
                                        {terminateTarget.facility_name ||
                                            facilityNameById[terminateTarget.facility_id || terminateTarget.health_facility] ||
                                            'Unknown Facility'}
                                    </Text>
                                </Space>
                            </Space>
                            <Tag color="red">This action cannot be undone</Tag>
                        </Space>
                    </Card>
                )}
                <Steps
                    size="small"
                    current={terminateStep === 'details' ? 0 : 1}
                    style={{ marginBottom: 16 }}
                    items={[
                        { title: 'Review details' },
                        { title: 'Verify OTP' },
                    ]}
                />
                {otpPrereqError && (
                    <Alert
                        type="error"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message="OTP cannot be sent"
                        description={
                            <Space direction="vertical" size={8}>
                                <Text>{otpPrereqError}</Text>
                                <Button
                                    size="small"
                                    onClick={handleRequestTerminationOtp}
                                    loading={requestingOtp}
                                    disabled={uploadingAttachment}
                                    style={{ alignSelf: 'flex-start' }}
                                >
                                    Re-check OTP setup
                                </Button>
                            </Space>
                        }
                    />
                )}
                <Form form={terminateForm} layout="vertical">
                    <Form.Item
                        label="Termination reason"
                        name="termination_reason"
                        rules={[
                            { required: true, message: 'Please provide a termination reason.' },
                            { min: 5, message: 'Reason should be at least 5 characters.' },
                        ]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="e.g. End of employment contract."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                    <Form.Item label="Attach supporting document(s)">
                        <Upload
                            multiple
                            name="file"
                            customRequest={handleUploadAttachment}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />} loading={uploadingAttachment}>
                                Upload File
                            </Button>
                        </Upload>
                        {uploadedFiles.length > 0 && (
                            <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
                                {uploadedFiles.map((file) => (
                                    <Space key={file.id} size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Space size={4}>
                                        <PaperClipOutlined />
                                            <Text style={{ fontSize: 12 }}>
                                                {file.fileName}
                                                {file.storedAsReference ? ' (reference only)' : ''}
                                            </Text>
                                        </Space>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                                        />
                                    </Space>
                                ))}
                            </Space>
                        )}
                    </Form.Item>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        This will set affiliation to Inactive and deactivate the linked employee from active directory visibility.
                    </Text>

                    {terminateStep === 'otp' && (
                        <Card size="small" style={{ marginTop: 14, borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
                            <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                <Space size={8}>
                                    <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
                                    <Text strong>OTP Verification</Text>
                                </Space>
                                <Alert
                                    type="info"
                                    showIcon
                                    message={`Enter the code sent to ${otpSession?.maskedDestination || 'your phone'}`}
                                    description={
                                        otpCountdown > 0
                                            ? `Code expires in ${otpCountdown}s`
                                            : 'Code expired. Request a new code.'
                                    }
                                />
                                {otpSession?.maskedDestination && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        OTP recipient (masked): {otpSession.maskedDestination}
                                    </Text>
                                )}
                                <Form.Item
                                    label="Verification code"
                                    name="otp_code"
                                    rules={[
                                        { required: true, message: 'Enter OTP code.' },
                                        { len: 5, message: 'OTP should be 5 digits.' },
                                    ]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input
                                        placeholder="Enter 5-digit code"
                                        maxLength={5}
                                        inputMode="numeric"
                                    />
                                </Form.Item>
                                <Button
                                    onClick={handleRequestTerminationOtp}
                                    loading={requestingOtp}
                                    disabled={uploadingAttachment}
                                    style={{ alignSelf: 'flex-start' }}
                                >
                                    Resend OTP
                                </Button>
                            </Space>
                        </Card>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default AffiliationsListView;
