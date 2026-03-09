import React, { useState, useCallback, useEffect } from 'react';
import {
    Card,
    Steps,
    Button,
    Upload,
    Table,
    message,
    Space,
    Typography,
    Alert,
    Row,
    Col,
    Statistic,
    Select,
    theme,
    Breadcrumb
} from 'antd';
import {
    UploadOutlined,
    FileExcelOutlined,
    DownloadOutlined,
    CheckCircleOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CloudUploadOutlined,
    HomeOutlined,
    MedicineBoxOutlined
} from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import Papa from 'papaparse';
import { useResponsive } from '../../hooks/useResponsive';
import { bulkUploadApi } from '../../services/api';
import {
    validateBulkUploadRecords,
    normalizeRecordsForSubmit,
    type CSVRecord,
    BULK_UPLOAD_MAX_RECORDS,
    ALLOWED_EMPLOYMENT_TYPES,
} from '../../utils/bulkUploadCsv';

const { Title, Text } = Typography;
const { Step } = Steps;

interface BulkUploadPageProps {
    navigateToRoute: (route: string, id?: string) => void;
}

const BulkUploadPage: React.FC<BulkUploadPageProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile, isTablet } = useResponsive();
    const [currentStep, setCurrentStep] = useState(0);
    const [csvFile, setCsvFile] = useState<UploadFile | null>(null);
    const [csvRecords, setCsvRecords] = useState<CSVRecord[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Facility selector
    const [facilities, setFacilities] = useState<{ hie_id: string; facility_name: string }[]>([]);
    const [facilitiesLoading, setFacilitiesLoading] = useState(false);
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
    const selectedFacility = facilities.find((f) => f.hie_id === selectedFacilityId) ?? null;

    useEffect(() => {
        setFacilitiesLoading(true);
        fetch('/api/method/careverse_hq.api.bulk_health_worker_onboarding.get_facilities', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((json) => {
                const data: { hie_id: string; facility_name: string }[] =
                    json?.message?.data ?? json?.data ?? [];
                setFacilities(data);
                // Auto-select when there is exactly one facility
                if (data.length === 1) setSelectedFacilityId(data[0].hie_id);
            })
            .catch(() => message.error('Could not load facilities'))
            .finally(() => setFacilitiesLoading(false));
    }, []);

    const primaryCtaStyle: React.CSSProperties = {
        backgroundColor: '#1677ff',
        borderColor: '#1677ff',
        boxShadow: '0 4px 10px rgba(22, 119, 255, 0.2)'
    };

    // Generate CSV template
    const generateCSVTemplate = () => {
        const headers = [
            'identification_type',
            'identification_number',
            'registration_number',
            'regulator',
            'employment_type',
            'designation',
            'start_date',
            'end_date'
        ];

        const exampleRow = [
            'National ID',
            '12345678',
            'A12345',
            'NCK',
            ALLOWED_EMPLOYMENT_TYPES[0],
            'Nurse',
            '2025-03-01',
            '2026-03-01'
        ];

        const csv = [headers.join(','), exampleRow.join(',')].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `affiliation_template_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('CSV template downloaded successfully');
    };

    // Handle file upload
    const handleFileUpload = useCallback((file: RcFile) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;

            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const records = (results.data || []) as Record<string, unknown>[];
                    const errors = validateBulkUploadRecords(records);

                    if (errors.length > 0) {
                        setValidationErrors(errors);
                        setCsvRecords([]);
                        message.error('CSV validation failed');
                    } else {
                        setCsvRecords(normalizeRecordsForSubmit(records));
                        setValidationErrors([]);
                        message.success(`Successfully parsed ${records.length} records`);
                    }
                }
            });
        };

        reader.readAsText(file);

        return false; // Prevent auto upload
    }, []);

    // Submit bulk upload (canonical API; duplicate submit guarded)
    const handleSubmit = async () => {
        if (submitting) return;
        if (!selectedFacilityId) {
            message.error('Please select a facility before submitting.');
            return;
        }
        if (csvRecords.length === 0) {
            message.error('Please upload a valid CSV file');
            return;
        }

        setSubmitting(true);
        try {
            const payload = normalizeRecordsForSubmit(
                csvRecords as unknown as Record<string, unknown>[]
            );

            const result = await bulkUploadApi.createUpload({
                facility_fid: selectedFacilityId!,
                records: payload,
            });

            if (!result.success) {
                message.error(result.error || 'Failed to submit bulk upload');
                return;
            }

            const jobId = result.data?.job_id;
            if (!jobId) {
                message.error('Server did not return job ID');
                return;
            }

            message.success('Bulk upload submitted successfully!');
            navigateToRoute('bulk-upload/status', jobId);
        } catch (error: any) {
            console.error('Bulk upload error:', error);
            message.error(error?.message || 'Failed to submit bulk upload');
        } finally {
            setSubmitting(false);
        }
    };

    // Table columns for CSV preview
    const previewColumns = [
        {
            title: 'Row',
            key: 'index',
            width: 60,
            render: (_: any, __: any, index: number) => index + 1
        },
        {
            title: 'ID Type',
            dataIndex: 'identification_type',
            key: 'id_type',
            width: 120
        },
        {
            title: 'ID Number',
            dataIndex: 'identification_number',
            key: 'id_number',
            width: 150
        },
        {
            title: 'Employment Type',
            dataIndex: 'employment_type',
            key: 'employment',
            width: 130
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            width: 130
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120
        }
    ];

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Select Facility + Upload CSV
                return (
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Card
                                title={<Space><MedicineBoxOutlined />Select Facility</Space>}
                                size="small"
                                style={{ borderRadius: 12 }}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select a facility"
                                    value={selectedFacilityId ?? undefined}
                                    onChange={(val: string) => setSelectedFacilityId(val)}
                                    loading={facilitiesLoading}
                                    filterOption={(input, option) =>
                                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={facilities.map((f) => ({ value: f.hie_id, label: f.facility_name }))}
                                    style={{ width: '100%', maxWidth: 480 }}
                                    size="large"
                                    notFoundContent={facilitiesLoading ? 'Loading…' : 'No facilities found'}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} lg={9}>
                            <Card
                                title={<Space><FileExcelOutlined />Template & Requirements</Space>}
                                size="small"
                                style={{
                                    borderRadius: 12,
                                    height: '100%'
                                }}
                            >
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Alert
                                        message={`Use the official template. Max ${BULK_UPLOAD_MAX_RECORDS} rows per file.`}
                                        type="info"
                                        showIcon
                                        style={{ borderRadius: 8 }}
                                    />
                                    <ul style={{ margin: 0, paddingLeft: 18, color: token.colorTextSecondary, fontSize: 13 }}>
                                        <li>Fill all required columns</li>
                                        <li>employment_type: e.g. {ALLOWED_EMPLOYMENT_TYPES.slice(0, 3).join(', ')}</li>
                                        <li>Dates in YYYY-MM-DD format</li>
                                    </ul>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        onClick={generateCSVTemplate}
                                        type="primary"
                                        style={primaryCtaStyle}
                                        block
                                    >
                                        Download CSV Template
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} lg={15}>
                            <Card
                                title={<Space><CloudUploadOutlined />Upload CSV</Space>}
                                size="small"
                                style={{
                                    borderRadius: 12,
                                    border: csvRecords.length > 0
                                        ? `1px solid ${token.colorSuccessBorder}`
                                        : `1px solid ${token.colorBorderSecondary}`
                                }}
                            >
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Text type="secondary">
                                        Select a prepared CSV file. Validation runs immediately after selection.
                                    </Text>
                                    <Upload
                                        accept=".csv"
                                        maxCount={1}
                                        beforeUpload={handleFileUpload}
                                        fileList={csvFile ? [csvFile] : []}
                                        onChange={(info) => setCsvFile(info.fileList[0] || null)}
                                    >
                                        <Button icon={<UploadOutlined />} type="primary" style={primaryCtaStyle} size="large">
                                            Select CSV File
                                        </Button>
                                    </Upload>

                                    {csvFile && (
                                        <Text style={{ fontSize: 12 }}>
                                            File: <Text strong>{csvFile.name}</Text>
                                        </Text>
                                    )}

                                    {csvRecords.length > 0 && (
                                        <Alert
                                            message={`Validated successfully: ${csvRecords.length} records ready.`}
                                            type="success"
                                            showIcon
                                            style={{ borderRadius: 8 }}
                                        />
                                    )}

                                    {validationErrors.length > 0 && (
                                        <Alert
                                            message="Validation Errors"
                                            description={
                                                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                                    {validationErrors.map((error, index) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            }
                                            type="error"
                                            showIcon
                                            style={{ borderRadius: 8 }}
                                        />
                                    )}
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                );

            case 1: // Review & Submit
                return (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Row gutter={[16, 12]}>
                            <Col xs={24} lg={16}>
                                {selectedFacility && (
                                    <Alert
                                        type="info"
                                        message={`Upload destination: ${selectedFacility.facility_name}`}
                                        showIcon
                                        style={{ marginBottom: 12, borderRadius: 8 }}
                                    />
                                )}
                            </Col>
                            <Col xs={24} lg={8}>
                                <Card title="Ready to Submit" size="small" style={{ borderRadius: 12, height: '100%' }}>
                                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                        <Row gutter={8}>
                                            <Col span={8}>
                                                <Statistic title="Total" value={csvRecords.length} />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic title="Full-time" value={csvRecords.filter(r => r.employment_type === 'Full-time Employee').length} />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic title="Other" value={csvRecords.filter(r => r.employment_type !== 'Full-time Employee').length} />
                                            </Col>
                                        </Row>
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            onClick={handleSubmit}
                                            disabled={!selectedFacilityId || csvRecords.length === 0}
                                            loading={submitting}
                                            block
                                            size="large"
                                            style={primaryCtaStyle}
                                        >
                                            Submit Upload
                                        </Button>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>

                        <Card
                            title={<Text strong style={{ fontSize: 13 }}>Data Preview</Text>}
                            size="small"
                            style={{ borderRadius: 12 }}
                        >
                            <Alert
                                message="Preview of first 8 records"
                                type="info"
                                showIcon
                                style={{ marginBottom: 12, borderRadius: 8 }}
                            />
                            <Table
                                dataSource={csvRecords.slice(0, 8)}
                                columns={previewColumns}
                                rowKey={(record, index) => `${record.identification_number}-${index}`}
                                pagination={false}
                                scroll={{ x: 'max-content', y: isMobile ? 220 : 260 }}
                                size="small"
                            />
                            {csvRecords.length > 8 && (
                                <Text type="secondary" style={{ marginTop: 10, display: 'block' }}>
                                    ...and {csvRecords.length - 8} more records
                                </Text>
                            )}
                        </Card>
                    </Space>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ padding: isMobile ? '12px' : '20px' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <a onClick={() => navigateToRoute('bulk-upload')}>
                        <CloudUploadOutlined /> Bulk Upload
                    </a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>New Upload</Breadcrumb.Item>
            </Breadcrumb>
            {/* Main Card */}
            <Card
                style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                }}
                bodyStyle={{ padding: isMobile ? 14 : 18 }}
            >
                {/* Header */}
                <div style={{ marginBottom: 16 }}>
                    <Title level={isMobile ? 4 : 3} style={{ marginBottom: 6 }}>
                        <CloudUploadOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                        Bulk Facility Affiliation Upload
                    </Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
                        Upload multiple health worker affiliations at once using a CSV file
                    </Text>
                </div>

                {/* Steps */}
                <Steps
                    current={currentStep}
                    size="small"
                    style={{ marginBottom: 16 }}
                    responsive
                >
                    <Step title="Upload CSV" description={isTablet ? undefined : "Select and validate file"} />
                    <Step title="Review & Submit" description={isTablet ? undefined : "Verify data and submit"} />
                </Steps>

                {/* Step Content */}
                <div style={{ minHeight: isMobile ? 320 : 280, marginBottom: 12 }}>
                    {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `1px solid ${token.colorBorder}`,
                    paddingTop: 12,
                    paddingBottom: 4,
                    position: 'sticky',
                    bottom: 0,
                    background: token.colorBgContainer,
                    zIndex: 2
                }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => {
                            if (currentStep > 0) {
                                setCurrentStep(currentStep - 1);
                            } else {
                                navigateToRoute('bulk-upload');
                            }
                        }}
                    >
                        {currentStep === 0 ? 'Back to Upload List' : 'Previous'}
                    </Button>

                    {currentStep === 0 && (
                        <Button
                            type="primary"
                            icon={<ArrowRightOutlined />}
                            onClick={() => setCurrentStep(1)}
                            disabled={!selectedFacilityId || csvRecords.length === 0}
                            className="bulk-upload-action-cta"
                            size="large"
                            style={primaryCtaStyle}
                        >
                            Next: Review
                        </Button>
                    )}

                    {currentStep === 1 && (
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={handleSubmit}
                            disabled={!selectedFacilityId || csvRecords.length === 0}
                            loading={submitting}
                            className="bulk-upload-action-cta"
                            size="large"
                            style={primaryCtaStyle}
                        >
                            Submit Upload
                        </Button>
                    )}
                </div>
            </Card>
            <style>{`
                .bulk-upload-action-cta.ant-btn-primary {
                    background: #1f7ae0 !important;
                    border-color: #1f7ae0 !important;
                    color: #ffffff !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    height: 40px !important;
                    padding-inline: 16px !important;
                    box-shadow: 0 4px 10px rgba(31, 122, 224, 0.25) !important;
                }
                .bulk-upload-action-cta.ant-btn-primary:hover,
                .bulk-upload-action-cta.ant-btn-primary:focus {
                    background: #2d8cf0 !important;
                    border-color: #2d8cf0 !important;
                }
                .bulk-upload-action-cta.ant-btn-primary:disabled,
                .bulk-upload-action-cta.ant-btn-primary[disabled] {
                    background: #8fb9ee !important;
                    border-color: #8fb9ee !important;
                    color: #ffffff !important;
                    opacity: 1 !important;
                    box-shadow: none !important;
                }
            `}</style>
        </div>
    );
};

export default BulkUploadPage;
