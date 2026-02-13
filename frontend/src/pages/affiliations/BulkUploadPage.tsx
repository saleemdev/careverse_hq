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
    Spin,
    Row,
    Col,
    Statistic,
    Tag,
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
    LinkOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import Papa from 'papaparse';
import useFacilityStore from '../../stores/facilityStore';

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
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
    const [csvFile, setCsvFile] = useState<UploadFile | null>(null);
    const [csvRecords, setCsvRecords] = useState<CSVRecord[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const { facilities } = useFacilityStore();

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
                    <div>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <Alert
                                message="Before you begin"
                                description={
                                    <div>
                                        <p>Please ensure you have:</p>
                                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                            <li>Downloaded the CSV template</li>
                                            <li>Filled in all required fields correctly</li>
                                            <li>Maximum 500 records per upload</li>
                                            <li>Valid health worker identification numbers</li>
                                        </ul>
                                    </div>
                                }
                                type="info"
                                showIcon
                                style={{ borderRadius: 8 }}
                            />

                            <Card
                                style={{
                                    borderRadius: 12,
                                    border: `2px dashed ${token.colorBorder}`,
                                    background: token.colorBgContainer
                                }}
                            >
                                <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                                    <FileExcelOutlined style={{ fontSize: 64, color: token.colorPrimary }} />

                                    <div>
                                        <Title level={4}>Download CSV Template</Title>
                                        <Text type="secondary">
                                            Start by downloading our template with the correct column structure
                                        </Text>
                                    </div>

                                    <Button
                                        icon={<DownloadOutlined />}
                                        onClick={generateCSVTemplate}
                                        size="large"
                                        type="primary"
                                    >
                                        Download Template
                                    </Button>
                                </Space>
                            </Card>

                            <Card
                                style={{
                                    borderRadius: 12,
                                    border: `2px dashed ${csvRecords.length > 0 ? token.colorSuccess : token.colorBorder}`,
                                    background: token.colorBgContainer
                                }}
                            >
                                <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                                    <CloudUploadOutlined
                                        style={{
                                            fontSize: 64,
                                            color: csvRecords.length > 0 ? token.colorSuccess : token.colorTextDescription
                                        }}
                                    />

                                    <div>
                                        <Title level={4}>Upload CSV File</Title>
                                        <Text type="secondary">
                                            Select your filled CSV file to upload
                                        </Text>
                                    </div>

                                    <Upload
                                        accept=".csv"
                                        maxCount={1}
                                        beforeUpload={handleFileUpload}
                                        fileList={csvFile ? [csvFile] : []}
                                        onChange={(info) => setCsvFile(info.fileList[0] || null)}
                                    >
                                        <Button icon={<UploadOutlined />} size="large">
                                            Select CSV File
                                        </Button>
                                    </Upload>

                                    {csvRecords.length > 0 && (
                                        <Alert
                                            message={`Successfully loaded ${csvRecords.length} records`}
                                            type="success"
                                            showIcon
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
                                        />
                                    )}
                                </Space>
                            </Card>
                        </Space>
                    </div>
                );

            case 1: // Select Facility & Review
                return (
                    <div>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {/* Facility Selection */}
                            <Card title="Select Health Facility" style={{ borderRadius: 12 }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Text type="secondary">
                                        Choose the health facility where these workers will be affiliated
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

                            {/* Summary Statistics */}
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Card style={{ borderRadius: 12 }}>
                                        <Statistic
                                            title="Total Records"
                                            value={csvRecords.length}
                                            prefix={<FileExcelOutlined />}
                                            valueStyle={{ color: token.colorPrimary }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card style={{ borderRadius: 12 }}>
                                        <Statistic
                                            title="Full-time"
                                            value={csvRecords.filter(r => r.employment_type === 'Full-time').length}
                                            valueStyle={{ color: token.colorSuccess }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card style={{ borderRadius: 12 }}>
                                        <Statistic
                                            title="Part-time / Contract"
                                            value={csvRecords.filter(r => r.employment_type !== 'Full-time').length}
                                            valueStyle={{ color: token.colorWarning }}
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            {/* Data Preview */}
                            <Card title="Data Preview" style={{ borderRadius: 12 }}>
                                <Alert
                                    message="Preview of first 10 records"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                                <Table
                                    dataSource={csvRecords.slice(0, 10)}
                                    columns={previewColumns}
                                    rowKey={(record, index) => `${record.identification_number}-${index}`}
                                    pagination={false}
                                    scroll={{ x: 'max-content' }}
                                    size="small"
                                />
                                {csvRecords.length > 10 && (
                                    <Text type="secondary" style={{ marginTop: 12, display: 'block' }}>
                                        ...and {csvRecords.length - 10} more records
                                    </Text>
                                )}
                            </Card>
                        </Space>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: 24 }}>
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
            >
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ marginBottom: 8 }}>
                        <CloudUploadOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                        Bulk Facility Affiliation Upload
                    </Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Upload multiple health worker affiliations at once using a CSV file
                    </Text>
                </div>

                {/* Steps */}
                <Steps current={currentStep} style={{ marginBottom: 32 }}>
                    <Step title="Upload CSV" description="Select and validate file" />
                    <Step title="Review & Submit" description="Verify data and submit" />
                </Steps>

                {/* Step Content */}
                <div style={{ minHeight: 400, marginBottom: 24 }}>
                    {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: `1px solid ${token.colorBorder}`,
                    paddingTop: 24
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
                        >
                            Submit Upload
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default BulkUploadPage;
