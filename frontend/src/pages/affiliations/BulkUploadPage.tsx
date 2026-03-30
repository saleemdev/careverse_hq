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
    Breadcrumb,
    Tag
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
import { getCsrfToken } from '../../utils/csrf';
import {
    BULK_UPLOAD_FIELD_GUIDE,
    validateBulkUploadRecords,
    normalizeRecordsForSubmit,
    type CSVRecord,
    ALLOWED_EMPLOYMENT_TYPES,
} from '../../utils/bulkUploadCsv';
import {
    downloadBulkUploadCsvTemplate,
    downloadBulkUploadExcelTemplate,
    parseBulkUploadWorkbook,
} from '../../utils/bulkUploadSpreadsheet';

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
    const requiredFields = BULK_UPLOAD_FIELD_GUIDE.filter((field) => field.required);
    const optionalFields = BULK_UPLOAD_FIELD_GUIDE.filter((field) => !field.required);

    useEffect(() => {
        setFacilitiesLoading(true);
        fetch('/api/method/careverse_hq.api.bulk_health_worker_onboarding.get_facilities', {
            credentials: 'include',
            headers: { Accept: 'application/json', 'X-Frappe-CSRF-Token': getCsrfToken() },
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

    const generateCsvTemplate = useCallback(() => {
        downloadBulkUploadCsvTemplate();
        message.success('CSV template downloaded successfully');
    }, []);

    const generateExcelTemplate = useCallback(async () => {
        try {
            await downloadBulkUploadExcelTemplate();
            message.success('Excel template downloaded successfully');
        } catch (error: any) {
            message.error(error?.message || 'Failed to generate Excel template');
        }
    }, []);

    const applyParsedRecords = useCallback((records: Record<string, unknown>[]) => {
        const errors = validateBulkUploadRecords(records);

        if (errors.length > 0) {
            setValidationErrors(errors);
            setCsvRecords([]);
            message.error('Spreadsheet validation failed');
            return;
        }

        setCsvRecords(normalizeRecordsForSubmit(records));
        setValidationErrors([]);
        message.success(`Validated ${records.length} records successfully`);
    }, []);

    // Handle CSV or Excel upload
    const handleFileUpload = useCallback(async (file: RcFile) => {
        try {
            if (file.name.toLowerCase().endsWith('.xlsx')) {
                const records = await parseBulkUploadWorkbook(file as File);
                applyParsedRecords(records);
                return false;
            }

            const text = await file.text();
            await new Promise<void>((resolve, reject) => {
                Papa.parse(text, {
                    header: true,
                    comments: '#',
                    skipEmptyLines: 'greedy',
                    transformHeader: (header: string) => header.trim(),
                    complete: (results) => {
                        try {
                            applyParsedRecords((results.data || []) as Record<string, unknown>[]);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    },
                    error: (error) => reject(error),
                });
            });
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to parse the selected file';
            setValidationErrors([errorMessage]);
            setCsvRecords([]);
            message.error(errorMessage);
        }

        return false; // Prevent auto upload
    }, [applyParsedRecords]);

    // Submit bulk upload (canonical API; duplicate submit guarded)
    const handleSubmit = async () => {
        if (submitting) return;
        if (!selectedFacilityId) {
            message.error('Please select a facility before submitting.');
            return;
        }
        if (csvRecords.length === 0) {
            message.error('Please upload a valid CSV or Excel file');
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

            message.success('Upload queued successfully.');
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
            case 0: // Select Facility + Upload File
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
                                        message="Use the official template so required columns and formatting stay intact."
                                        type="info"
                                        showIcon
                                        style={{ borderRadius: 8 }}
                                    />
                                    <div
                                        style={{
                                            padding: 14,
                                            borderRadius: 12,
                                            background: 'linear-gradient(145deg, rgba(22, 119, 255, 0.08), rgba(22, 119, 255, 0.02))',
                                            border: `1px solid ${token.colorPrimaryBorder}`,
                                        }}
                                    >
                                        <Text strong style={{ display: 'block', marginBottom: 10 }}>
                                            Required columns
                                        </Text>
                                        <Space size={[6, 8]} wrap>
                                            {requiredFields.map((field) => (
                                                <Tag
                                                    key={field.key}
                                                    color="blue"
                                                    style={{ marginInlineEnd: 0, borderRadius: 999 }}
                                                >
                                                    {field.key}
                                                </Tag>
                                            ))}
                                        </Space>
                                        <Text type="secondary" style={{ display: 'block', marginTop: 10, fontSize: 12 }}>
                                            Optional columns: {optionalFields.map((field) => field.key).join(', ')}
                                        </Text>
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gap: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                                background: token.colorBgContainer,
                                            }}
                                        >
                                            <Text strong style={{ display: 'block', marginBottom: 4 }}>
                                                Employment type
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Use exact values such as {ALLOWED_EMPLOYMENT_TYPES.slice(0, 3).join(', ')}.
                                            </Text>
                                        </div>
                                        <div
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                                background: token.colorBgContainer,
                                            }}
                                        >
                                            <Text strong style={{ display: 'block', marginBottom: 4 }}>
                                                Date format
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                `start_date` and `end_date` must use YYYY-MM-DD.
                                            </Text>
                                        </div>
                                    </div>

                                    <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
                                        <Button
                                            icon={<FileExcelOutlined />}
                                            onClick={generateExcelTemplate}
                                            type="primary"
                                            style={primaryCtaStyle}
                                            block={isMobile}
                                        >
                                            Download Excel Template
                                        </Button>
                                        <Button
                                            icon={<DownloadOutlined />}
                                            onClick={generateCsvTemplate}
                                            block={isMobile}
                                        >
                                            Download CSV Template
                                        </Button>
                                    </Space>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} lg={15}>
                            <Card
                                title={<Space><CloudUploadOutlined />Upload File</Space>}
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
                                        Upload a prepared CSV file or the Excel template. Validation runs immediately after selection.
                                    </Text>
                                    <Upload
                                        accept=".csv,.xlsx"
                                        maxCount={1}
                                        beforeUpload={handleFileUpload}
                                        fileList={csvFile ? [csvFile] : []}
                                        onChange={(info) => setCsvFile(info.fileList[0] || null)}
                                    >
                                        <Button icon={<UploadOutlined />} type="primary" style={primaryCtaStyle} size="large">
                                            Select CSV or Excel File
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
                        Upload multiple health worker affiliations at once using the CSV or Excel template
                    </Text>
                </div>

                {/* Steps */}
                <Steps
                    current={currentStep}
                    size="small"
                    style={{ marginBottom: 16 }}
                    responsive
                >
                    <Step title="Upload File" description={isTablet ? undefined : "Select and validate file"} />
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
                .bulk-upload-action-cta.ant-btn-primary[disabled],
                .bulk-upload-action-cta.ant-btn-primary.ant-btn-disabled {
                    background: var(--btn-primary-disabled-bg) !important;
                    background-image: none !important;
                    border-color: var(--btn-primary-disabled-border) !important;
                    color: var(--btn-primary-disabled-text) !important;
                    text-shadow: none !important;
                    opacity: 1 !important;
                    box-shadow: none !important;
                    transform: none !important;
                }
                .bulk-upload-action-cta.ant-btn-primary:disabled:hover,
                .bulk-upload-action-cta.ant-btn-primary[disabled]:hover,
                .bulk-upload-action-cta.ant-btn-primary.ant-btn-disabled:hover,
                .bulk-upload-action-cta.ant-btn-primary:disabled:active,
                .bulk-upload-action-cta.ant-btn-primary[disabled]:active,
                .bulk-upload-action-cta.ant-btn-primary.ant-btn-disabled:active {
                    background: var(--btn-primary-disabled-bg) !important;
                    border-color: var(--btn-primary-disabled-border) !important;
                    box-shadow: none !important;
                    transform: none !important;
                }
            `}</style>
        </div>
    );
};

export default BulkUploadPage;
