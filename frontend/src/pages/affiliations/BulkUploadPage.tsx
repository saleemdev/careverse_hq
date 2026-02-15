import React, { useState, useCallback } from 'react';
import {
    Card,
    Steps,
    Button,
    Upload,
    Table,
    Select,
    message,
    Space,
    Typography,
    Alert,
    Row,
    Col,
    Statistic,
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
    HomeOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import Papa from 'papaparse';
import useFacilityStore from '../../stores/facilityStore';
import { useResponsive } from '../../hooks/useResponsive';

const { Title, Text } = Typography;
const { Step } = Steps;

interface CSVRecord {
    identification_type: string;
    identification_number: string;
    registration_number?: string;
    regulator?: string;
    employment_type: string;
    designation: string;
    start_date: string;
    end_date?: string;
}

interface BulkUploadPageProps {
    navigateToRoute: (route: string, id?: string) => void;
}

const BulkUploadPage: React.FC<BulkUploadPageProps> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile, isTablet } = useResponsive();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
    const [csvFile, setCsvFile] = useState<UploadFile | null>(null);
    const [csvRecords, setCsvRecords] = useState<CSVRecord[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const { facilities } = useFacilityStore();
    const primaryCtaStyle: React.CSSProperties = {
        backgroundColor: '#1677ff',
        borderColor: '#1677ff',
        boxShadow: '0 4px 10px rgba(22, 119, 255, 0.2)'
    };

    // Required CSV columns
    const requiredColumns = [
        'identification_type',
        'identification_number',
        'employment_type',
        'designation',
        'start_date'
    ];

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
            'Full-time Employee',
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

    // Validate CSV structure
    const validateCSV = (records: any[]): string[] => {
        const errors: string[] = [];

        if (records.length === 0) {
            errors.push('CSV file is empty');
            return errors;
        }

        if (records.length > 500) {
            errors.push('Maximum 500 records allowed per upload');
        }

        // Check required columns
        const firstRecord = records[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRecord));

        if (missingColumns.length > 0) {
            errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        // Validate each record
        records.forEach((record, index) => {
            if (!record.identification_type) {
                errors.push(`Row ${index + 1}: identification_type is required`);
            }
            if (!record.identification_number) {
                errors.push(`Row ${index + 1}: identification_number is required`);
            }
            if (!record.employment_type) {
                errors.push(`Row ${index + 1}: employment_type is required`);
            }
            if (!record.designation) {
                errors.push(`Row ${index + 1}: designation is required`);
            }
            if (!record.start_date) {
                errors.push(`Row ${index + 1}: start_date is required`);
            }
        });

        return errors.slice(0, 10); // Show only first 10 errors
    };

    // Handle file upload
    const handleFileUpload = useCallback((file: UploadFile) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;

            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const records = results.data as CSVRecord[];
                    const errors = validateCSV(records);

                    if (errors.length > 0) {
                        setValidationErrors(errors);
                        setCsvRecords([]);
                        message.error('CSV validation failed');
                    } else {
                        setCsvRecords(records);
                        setValidationErrors([]);
                        message.success(`Successfully parsed ${records.length} records`);
                    }
                }
            });
        };

        if (file.originFileObj) {
            reader.readAsText(file.originFileObj);
        }

        return false; // Prevent auto upload
    }, []);

    // Submit bulk upload
    const handleSubmit = async () => {
        if (!selectedFacility) {
            message.error('Please select a facility');
            return;
        }

        if (csvRecords.length === 0) {
            message.error('Please upload a valid CSV file');
            return;
        }

        setSubmitting(true);

        try {
            // Create Bulk Health Worker Upload document
            const response = await fetch('/api/method/frappe.client.insert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token
                },
                body: JSON.stringify({
                    doc: {
                        doctype: 'Bulk Health Worker Upload',
                        facility: selectedFacility,
                        uploaded_by: (window as any).frappe?.session?.user,
                        status: 'Queued',
                        items: csvRecords.map(record => ({
                            identification_type: record.identification_type,
                            identification_number: record.identification_number,
                            registration_number: record.registration_number || '',
                            regulator: record.regulator || '',
                            employment_type: record.employment_type,
                            designation: record.designation,
                            start_date: record.start_date,
                            end_date: record.end_date || ''
                        }))
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit bulk upload');
            }

            const result = await response.json();
            const jobId = result.data.name;

            message.success('Bulk upload submitted successfully!');

            // Navigate to status dashboard
            setTimeout(() => {
                navigateToRoute('bulk-upload/status', jobId);
            }, 1000);

        } catch (error: any) {
            console.error('Bulk upload error:', error);
            message.error(error.message || 'Failed to submit bulk upload');
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
            case 0: // Upload CSV
                return (
                    <Row gutter={[16, 16]}>
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
                                        message="Use the official template and keep to max 500 rows."
                                        type="info"
                                        showIcon
                                        style={{ borderRadius: 8 }}
                                    />
                                    <ul style={{ margin: 0, paddingLeft: 18, color: token.colorTextSecondary, fontSize: 13 }}>
                                        <li>Fill all required columns</li>
                                        <li>Use valid identification numbers</li>
                                        <li>Use date format `YYYY-MM-DD`</li>
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

            case 1: // Select Facility & Review
                return (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Row gutter={[16, 12]}>
                            <Col xs={24} lg={16}>
                                <Card title="Select Health Facility" size="small" style={{ borderRadius: 12, height: '100%' }}>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Text type="secondary">
                                            Choose the destination facility for these affiliations.
                                        </Text>
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Select a facility"
                                            size="large"
                                            value={selectedFacility}
                                            onChange={setSelectedFacility}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={facilities.map(f => ({
                                                label: f.facility_name,
                                                value: f.name
                                            }))}
                                        />
                                    </Space>
                                </Card>
                            </Col>
                            <Col xs={24} lg={8}>
                                <Card title="Ready to Submit" size="small" style={{ borderRadius: 12, height: '100%' }}>
                                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                        <Row gutter={8}>
                                            <Col span={8}>
                                                <Statistic title="Total" value={csvRecords.length} />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic title="Full-time" value={csvRecords.filter(r => r.employment_type === 'Full-time').length} />
                                            </Col>
                                            <Col span={8}>
                                                <Statistic title="Other" value={csvRecords.filter(r => r.employment_type !== 'Full-time').length} />
                                            </Col>
                                        </Row>
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            onClick={handleSubmit}
                                            disabled={!selectedFacility || csvRecords.length === 0}
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
                            title={<Text strong style={{ fontSize: 15 }}>Data Preview</Text>}
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
                    <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
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
                            disabled={csvRecords.length === 0}
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
                            disabled={!selectedFacility || csvRecords.length === 0}
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
                    font-size: 15px !important;
                    font-weight: 600 !important;
                    height: 44px !important;
                    padding-inline: 18px !important;
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
