import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Steps,
    Button,
    Input,
    Table,
    Form,
    Select,
    Segmented,
    DatePicker,
    Descriptions,
    Tag,
    Space,
    Typography,
    Alert,
    Spin,
    Row,
    Col,
    theme,
    Breadcrumb,
    Flex,
    message,
    Result,
    Avatar,
    Divider,
} from 'antd';
import {
    SearchOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    UserOutlined,
    HomeOutlined,
    MedicineBoxOutlined,
    TeamOutlined,
    LoadingOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';
import { affiliationsApi } from '../../services/api';
import { ALLOWED_EMPLOYMENT_TYPES } from '../../utils/bulkUploadCsv';
import useAffiliationsModuleStore from '../../stores/modules/affiliationsModuleStore';

const { Title, Text } = Typography;

interface SingleAffiliationPageProps {
    navigateToRoute: (route: string, id?: string) => void;
}

interface HPResult {
    name?: string;
    full_name: string;
    registration_number: string;
    external_reference_id: string;
    cadre: string;
    specialty: string;
    gender: string;
    phone: string;
    email: string;
    status: string;
    source: 'local' | 'hwr';
    cache_key?: string; // Server-side cache key for HWR results
}

interface FacilityOption {
    hie_id: string;
    facility_name: string;
}

type SearchBy = 'national_id' | 'alien_id' | 'registration_number';

const EMPLOYMENT_TYPES = ALLOWED_EMPLOYMENT_TYPES;
const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    'Full-time Employee': 'Full-time',
    'Part-time Employee': 'Part-time',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SingleAffiliationPage: React.FC<SingleAffiliationPageProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();

    // Zustand stores — for refreshing list after creation
    const fetchAffiliations = useAffiliationsModuleStore((s) => s.fetchAffiliations);

    // Wizard: 2 steps only (Search → Details + Submit)
    const [currentStep, setCurrentStep] = useState(0);

    // Step 1: Search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<HPResult[]>([]);
    const [searchSource, setSearchSource] = useState<'local' | 'hwr' | 'none' | ''>('');
    const [searchBy, setSearchBy] = useState<SearchBy>('national_id');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedHP, setSelectedHP] = useState<HPResult | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Step 2: Employment details + submit
    const [facilities, setFacilities] = useState<FacilityOption[]>([]);
    const [facilitiesLoading, setFacilitiesLoading] = useState(false);
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
    const [employmentType, setEmploymentType] = useState<string | null>(null);
    const [designation, setDesignation] = useState('');
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; isNewHp?: boolean } | null>(null);

    // Preload facilities on mount so step 2 is instant
    useEffect(() => {
        setFacilitiesLoading(true);
        affiliationsApi.getAffiliationFacilities()
            .then((resp) => {
                if (!resp.success) {
                    throw new Error(resp.error || 'Could not load facilities');
                }
                const data: FacilityOption[] = Array.isArray(resp.data) ? resp.data : [];
                setFacilities(data);
                if (data.length === 1) setSelectedFacilityId(data[0].hie_id);
            })
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : 'Could not load facilities';
                message.error(msg);
            })
            .finally(() => setFacilitiesLoading(false));
    }, []);

    // Search handler
    const handleSearch = useCallback(async (value?: string) => {
        const term = (value ?? searchTerm).trim();
        if (!term) return;

        setSearchLoading(true);
        setSearchResults([]);
        setSearchError(null);
        setSelectedHP(null);
        setSearchPerformed(true);

        try {
            const resp = await affiliationsApi.searchHealthProfessional(term, searchBy);
            if (!resp.success) {
                const errorMessage = resp.error || 'Search failed';
                setSearchSource('none');
                setSearchError(errorMessage);
                return;
            }

            const results = Array.isArray(resp.data?.results) ? resp.data.results : [];
            const source = resp.data?.source;
            setSearchResults(results);
            setSearchSource(
                source === 'local' || source === 'hwr' || source === 'none' ? source : 'none'
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Search failed';
            setSearchSource('none');
            setSearchError(msg);
        } finally {
            setSearchLoading(false);
        }
    }, [searchBy, searchTerm]);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (!selectedHP || !selectedFacilityId || !employmentType || !designation || !startDate) return;

        setSubmitting(true);
        setSubmitResult(null);

        const employmentDetails = {
            fid: selectedFacilityId,
            employment_type: employmentType,
            designation: designation.trim(),
            start_date: startDate.format('YYYY-MM-DD'),
            end_date: endDate ? endDate.format('YYYY-MM-DD') : undefined,
        };

        try {
            const params: Record<string, unknown> = { employment_details: employmentDetails };

            if (selectedHP.source === 'local' && selectedHP.name) {
                params.hp_name = selectedHP.name;
            } else if (selectedHP.source === 'hwr' && selectedHP.cache_key) {
                params.hwr_cache_key = selectedHP.cache_key;
            }

            const resp = await affiliationsApi.createSingleAffiliation(params as {
                hp_name?: string;
                hwr_cache_key?: string;
                employment_details: {
                    fid: string;
                    employment_type: string;
                    designation: string;
                    start_date: string;
                    end_date?: string;
                };
            });

            if (resp.success) {
                setSubmitResult({
                    success: true,
                    message: 'Affiliation created successfully.',
                    isNewHp: resp.data?.is_new_hp,
                });

                // Refresh using current module filters so users stay in-context.
                fetchAffiliations();
            } else {
                setSubmitResult({
                    success: false,
                    message: resp.error || 'Failed to create affiliation.',
                });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setSubmitResult({ success: false, message: msg });
        } finally {
            setSubmitting(false);
        }
    }, [selectedHP, selectedFacilityId, employmentType, designation, startDate, endDate, fetchAffiliations]);

    // Derived
    const selectedFacility = facilities.find((f) => f.hie_id === selectedFacilityId);
    const canProceedStep1 = !!selectedHP;
    const hasInvalidDateRange = !!(startDate && endDate && endDate.isBefore(startDate, 'day'));
    const canSubmit = !!selectedFacilityId && !!employmentType && !!designation.trim() && !!startDate && !hasInvalidDateRange;

    // Reset form for "Add Another"
    const resetForm = () => {
        setCurrentStep(0);
        setSearchTerm('');
        setSearchResults([]);
        setSearchSource('');
        setSearchBy('national_id');
        setSearchError(null);
        setSelectedHP(null);
        setSearchPerformed(false);
        setSelectedFacilityId(facilities.length === 1 ? facilities[0].hie_id : null);
        setEmploymentType(null);
        setDesignation('');
        setStartDate(null);
        setEndDate(null);
        setSubmitResult(null);
    };

    // ---------- Step 1: Search & Select ----------
    const renderSearchStep = () => (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                    <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                        Search by
                    </Text>
                    <Segmented
                        options={[
                            { label: 'National ID', value: 'national_id' },
                            { label: 'Alien ID', value: 'alien_id' },
                            { label: 'Registration Number', value: 'registration_number' },
                        ]}
                        value={searchBy}
                        onChange={(value) => {
                            setSearchBy(value as SearchBy);
                            setSearchError(null);
                            setSearchResults([]);
                            setSearchSource('');
                            setSelectedHP(null);
                            setSearchPerformed(false);
                        }}
                        disabled={searchLoading}
                        style={{ marginBottom: 12 }}
                    />

                    <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                        {searchBy === 'national_id'
                            ? 'Enter a National ID number. We check local records first, then HWR if not found.'
                            : searchBy === 'alien_id'
                                ? 'Enter an Alien ID number. We check local records first, then HWR if not found.'
                                : 'Enter a Registration Number. We check local records first, then HWR if not found.'}
                    </Text>
                    <Input.Search
                        placeholder={
                            searchBy === 'national_id'
                                ? 'e.g. 22334289'
                                : searchBy === 'alien_id'
                                    ? 'e.g. A1234567'
                                    : 'e.g. A7000'
                        }
                        enterButton="Search"
                        size="large"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onSearch={handleSearch}
                        loading={searchLoading}
                        style={{ maxWidth: 600 }}
                        autoFocus
                    />
                </div>

                {searchLoading && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} />} />
                        <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                            Searching local database first, then Health Worker Registry if needed...
                        </Text>
                    </div>
                )}

                {!searchLoading && searchPerformed && !!searchError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Search Failed"
                        description={searchError}
                    />
                )}

                {!searchLoading && searchPerformed && !searchError && searchResults.length === 0 && (
                    <Alert
                        type="warning"
                        showIcon
                        message="No Results Found"
                        description={
                            searchBy === 'national_id'
                                ? 'No health professionals matched this National ID in local records or HWR.'
                                : searchBy === 'alien_id'
                                    ? 'No health professionals matched this Alien ID in local records or HWR.'
                                    : 'No health professionals matched this Registration Number in local records or HWR.'
                        }
                    />
                )}

                {!searchLoading && searchResults.length > 0 && (
                    <>
                        <Alert
                            type={searchSource === 'hwr' ? 'warning' : 'success'}
                            showIcon
                            message={
                                searchSource === 'local'
                                    ? `Found ${searchResults.length} result(s) in local database`
                                    : `Found ${searchResults.length} result(s) from Health Worker Registry (new to this system)`
                            }
                            style={{ marginBottom: 0 }}
                        />
                        <Table
                            dataSource={searchResults}
                            rowKey={(r) => r.name || r.registration_number || r.external_reference_id}
                            pagination={false}
                            size="middle"
                            scroll={{ x: 'max-content' }}
                            rowSelection={{
                                type: 'radio',
                                selectedRowKeys: selectedHP
                                    ? [selectedHP.name || selectedHP.registration_number || selectedHP.external_reference_id]
                                    : [],
                                onChange: (_, rows) => setSelectedHP(rows[0] || null),
                            }}
                            onRow={(record) => ({
                                onClick: () => setSelectedHP(record),
                                style: { cursor: 'pointer' },
                            })}
                            columns={[
                                {
                                    title: 'Name',
                                    dataIndex: 'full_name',
                                    key: 'full_name',
                                    render: (name: string, record: HPResult) => (
                                        <Space>
                                            <Avatar
                                                size="small"
                                                icon={<UserOutlined />}
                                                style={{
                                                    backgroundColor: record.source === 'hwr'
                                                        ? token.colorWarning
                                                        : token.colorPrimary,
                                                }}
                                            />
                                            <div>
                                                <Text strong>{name}</Text>
                                                {record.gender && (
                                                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                                        {record.gender}
                                                    </Text>
                                                )}
                                            </div>
                                        </Space>
                                    ),
                                },
                                {
                                    title: 'Reg. Number',
                                    key: 'reg',
                                    render: (_: unknown, r: HPResult) => (
                                        <Text copyable={{ text: r.external_reference_id || r.registration_number }}>
                                            {r.external_reference_id || r.registration_number || '-'}
                                        </Text>
                                    ),
                                },
                                {
                                    title: 'Cadre / Specialty',
                                    key: 'cadre',
                                    render: (_: unknown, r: HPResult) => (
                                        <div>
                                            {r.cadre && <Tag>{r.cadre}</Tag>}
                                            {r.specialty && (
                                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                                                    {r.specialty}
                                                </Text>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Source',
                                    dataIndex: 'source',
                                    key: 'source',
                                    width: 100,
                                    render: (source: string) => (
                                        <Tag color={source === 'local' ? 'green' : 'orange'}>
                                            {source === 'local' ? 'Local' : 'HWR'}
                                        </Tag>
                                    ),
                                },
                                {
                                    title: 'Status',
                                    dataIndex: 'status',
                                    key: 'status',
                                    width: 100,
                                    render: (status: string) => (
                                        <Tag color={status === 'Licensed' || status === 'Active' ? 'green' : 'default'}>
                                            {status || '-'}
                                        </Tag>
                                    ),
                                },
                            ]}
                        />
                    </>
                )}
            </Space>
        </div>
    );

    // ---------- Step 2: Details + Review + Submit ----------
    const renderDetailsStep = () => {
        // Success state
        if (submitResult?.success) {
            return (
                <Result
                    status="success"
                    title="Affiliation Created"
                    subTitle={submitResult.message}
                    extra={[
                        <Button
                            type="primary"
                            key="list"
                            onClick={() => navigateToRoute('affiliations')}
                        >
                            Back to Affiliations
                        </Button>,
                        <Button key="another" onClick={resetForm}>
                            Add Another
                        </Button>,
                    ]}
                />
            );
        }

        return (
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                {/* Error banner */}
                {submitResult?.success === false && (
                    <Alert
                        type="error"
                        showIcon
                        message="Failed to Create Affiliation"
                        description={submitResult.message}
                        style={{ marginBottom: 20 }}
                        closable
                        onClose={() => setSubmitResult(null)}
                    />
                )}

                {/* Selected HP summary */}
                {selectedHP && (
                    <Card
                        size="small"
                        style={{
                            marginBottom: 24,
                            borderRadius: 'var(--radius-lg)',
                            border: `1px solid ${token.colorPrimaryBorder}`,
                            background: token.colorPrimaryBg,
                        }}
                    >
                        <Space>
                            <Avatar
                                size={40}
                                icon={<UserOutlined />}
                                style={{ backgroundColor: token.colorPrimary }}
                            />
                            <div>
                                <Text strong style={{ fontSize: 15 }}>{selectedHP.full_name}</Text>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {selectedHP.external_reference_id || selectedHP.registration_number}
                                        {selectedHP.cadre ? ` \u00B7 ${selectedHP.cadre}` : ''}
                                        {selectedHP.specialty ? ` \u00B7 ${selectedHP.specialty}` : ''}
                                    </Text>
                                </div>
                            </div>
                            <Tag color={selectedHP.source === 'local' ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                                {selectedHP.source === 'local' ? 'Existing' : 'New from HWR'}
                            </Tag>
                        </Space>
                    </Card>
                )}

                {selectedHP?.source === 'hwr' && (
                    <Alert
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        message="This health worker is not yet in the system. They will be registered as a new Health Professional when you submit."
                        style={{ marginBottom: 20 }}
                    />
                )}

                {/* Form */}
                <Form layout="vertical">
                    <Form.Item
                        label="Health Facility"
                        required
                        help={facilitiesLoading ? 'Loading facilities...' : undefined}
                    >
                        <Select
                            placeholder="Select a facility"
                            value={selectedFacilityId}
                            onChange={setSelectedFacilityId}
                            loading={facilitiesLoading}
                            showSearch
                            optionFilterProp="label"
                            size="large"
                            options={facilities.map((f) => ({
                                value: f.hie_id,
                                label: f.facility_name,
                            }))}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Employment Type" required>
                                <Select
                                    placeholder="Select type"
                                    value={employmentType}
                                    onChange={setEmploymentType}
                                    size="large"
                                    options={EMPLOYMENT_TYPES.map((t) => ({
                                        value: t,
                                        label: EMPLOYMENT_TYPE_LABELS[t] || t,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Designation" required>
                                <Input
                                    placeholder="e.g. Nurse, Surgeon, Pharmacist"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Start Date" required>
                                <DatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    style={{ width: '100%' }}
                                    size="large"
                                    format="YYYY-MM-DD"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="End Date"
                                help={
                                    hasInvalidDateRange
                                        ? 'End date cannot be before the start date.'
                                        : 'Optional — leave blank for ongoing'
                                }
                                validateStatus={hasInvalidDateRange ? 'error' : undefined}
                            >
                                <DatePicker
                                    value={endDate}
                                    onChange={setEndDate}
                                    style={{ width: '100%' }}
                                    size="large"
                                    format="YYYY-MM-DD"
                                    disabledDate={(current) => {
                                        if (!startDate || !current) return false;
                                        return current.isBefore(startDate, 'day');
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                {/* Inline review summary */}
                {canSubmit && (
                    <>
                        <Divider style={{ margin: '16px 0' }} />
                        <Card
                            size="small"
                            style={{
                                borderRadius: 'var(--radius-md)',
                                background: token.colorBgLayout,
                                marginBottom: 8,
                            }}
                        >
                            <Descriptions
                                column={isMobile ? 1 : 2}
                                size="small"
                                title={
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Summary
                                    </Text>
                                }
                            >
                                <Descriptions.Item label="Professional">{selectedHP?.full_name}</Descriptions.Item>
                                <Descriptions.Item label="Facility">{selectedFacility?.facility_name}</Descriptions.Item>
                                <Descriptions.Item label="Type">
                                    {employmentType ? (EMPLOYMENT_TYPE_LABELS[employmentType] || employmentType) : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Designation">{designation}</Descriptions.Item>
                                <Descriptions.Item label="Start">{startDate?.format('YYYY-MM-DD')}</Descriptions.Item>
                                {endDate && <Descriptions.Item label="End">{endDate.format('YYYY-MM-DD')}</Descriptions.Item>}
                                <Descriptions.Item label="Initial Status">
                                    <Tag color="orange">Pending</Tag>
                                    <Text type="secondary" style={{ fontSize: 11 }}> — awaiting HP confirmation</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </>
                )}
            </div>
        );
    };

    const steps = [
        { title: 'Find Professional', icon: <SearchOutlined /> },
        { title: 'Affiliation Details', icon: <MedicineBoxOutlined /> },
    ];

    return (
        <div style={{ padding: isMobile ? 12 : 24 }}>
            {/* Breadcrumb */}
            <Breadcrumb
                style={{ marginBottom: 16 }}
                items={[
                    {
                        title: (
                            <Button
                                type="link"
                                onClick={() => navigateToRoute('dashboard')}
                                style={{ padding: 0, height: 'auto' }}
                            >
                                <Flex align="center" gap={4}>
                                    <HomeOutlined />
                                    Home
                                </Flex>
                            </Button>
                        ),
                    },
                    {
                        title: (
                            <Button
                                type="link"
                                onClick={() => navigateToRoute('affiliations')}
                                style={{ padding: 0, height: 'auto' }}
                            >
                                <Flex align="center" gap={4}>
                                    <TeamOutlined />
                                    Affiliations
                                </Flex>
                            </Button>
                        ),
                    },
                    { title: 'Add Affiliation' },
                ]}
            />

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Space align="center">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigateToRoute('affiliations')}
                        type="text"
                    />
                    <Title level={3} style={{ margin: 0 }}>
                        Add Facility Affiliation
                    </Title>
                </Space>
                <Text type="secondary" style={{ display: 'block', marginTop: 4, marginLeft: 40 }}>
                    Search for a health professional and assign them to a facility
                </Text>
            </div>

            {/* Wizard */}
            <Card
                style={{
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    boxShadow: 'var(--shadow-md)',
                    marginBottom: 24,
                }}
            >
                <Steps
                    current={currentStep}
                    size={isMobile ? 'small' : 'default'}
                    style={{ marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}
                    items={steps.map((s) => ({
                        title: isMobile ? undefined : s.title,
                        icon: s.icon,
                    }))}
                />

                {currentStep === 0 && renderSearchStep()}
                {currentStep === 1 && renderDetailsStep()}

                {/* Navigation */}
                {!submitResult?.success && (
                    <>
                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                onClick={() => {
                                    if (currentStep === 0) {
                                        navigateToRoute('affiliations');
                                    } else {
                                        setCurrentStep(0);
                                        setSubmitResult(null);
                                    }
                                }}
                                icon={<ArrowLeftOutlined />}
                            >
                                {currentStep === 0 ? 'Cancel' : 'Back'}
                            </Button>

                            {currentStep === 0 && (
                                <Button
                                    type="primary"
                                    onClick={() => setCurrentStep(1)}
                                    disabled={!canProceedStep1}
                                >
                                    Next: Affiliation Details
                                </Button>
                            )}

                            {currentStep === 1 && (
                                <Button
                                    type="primary"
                                    onClick={handleSubmit}
                                    loading={submitting}
                                    icon={<CheckCircleOutlined />}
                                    disabled={!canSubmit || submitting}
                                >
                                    Create Affiliation
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default SingleAffiliationPage;
