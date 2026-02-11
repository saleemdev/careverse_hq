import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Spin,
  Table,
  Badge,
  Descriptions,
  Empty,
  Space,
  Alert,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { licensesApi } from '../../../services/api';
import {
  getExpiryBadge,
  getStatusBadge,
  getPaymentStatusColor,
  formatCurrency,
  formatDate,
} from '../../../utils/licenseHelpers';

interface LicenseDetailViewProps {
  licenseId: string;
  navigateToRoute?: (route: string, id?: string) => void;
}

interface LicenseDetail {
  name: string;
  health_facility: string;
  facility_name: string;
  license_type: string;
  license_type_name: string;
  license_number: string;
  application_type: string;
  status: string;
  issue_date: string;
  expiry_date: string;
  service_point: string;
  department: string;
  issuing_authority: string;
  regulatory_body: string;
  license_fee: number;
  license_fee_paid: number;
  payment_reference: string;
  mpesa_checkout_request_id: string;
  conditions: string;
  remarks: string;
  days_to_expiry: number | null;
  expiry_status: string | null;
}

interface AvailableService {
  available_services: string;
  is_available: number;
}

interface AdditionalInfo {
  title: string;
  request_comment: string;
  status: string;
  requested_on: string;
  provided_on: string;
  response: string;
}

interface ComplianceDocument {
  document_type: string;
  document_file: string;
}

interface DetailData {
  license: LicenseDetail;
  services: AvailableService[];
  additional_information: AdditionalInfo[];
  compliance_documents: ComplianceDocument[];
}

const LicenseDetailView: React.FC<LicenseDetailViewProps> = ({ licenseId, navigateToRoute }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await licensesApi.getDetail(licenseId);
        const apiResponse = result.message || result;

        // Check if response was successful
        if (apiResponse.status === 'error') {
          setError(apiResponse.message || 'Failed to load license details');
          setDetail(null);
          return;
        }

        // Extract data from successful response
        const data = apiResponse.data || apiResponse;

        // Verify the response has the expected structure
        if (data && data.license) {
          setDetail(data);
        } else {
          setError('Invalid response format from server');
          setDetail(null);
        }
      } catch (err) {
        console.error('Failed to fetch license detail:', err);
        setError('Failed to load license details. Please try again.');
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    if (licenseId) {
      fetchDetail();
    }
  }, [licenseId]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Error" description={error} type="error" showIcon />
        <Button
          type="primary"
          style={{ marginTop: '16px' }}
          onClick={() => navigateToRoute?.('licenses')}
        >
          Back to Licenses
        </Button>
      </div>
    );
  }

  if (!detail || !detail.license) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="License not found" />
        <Button
          type="primary"
          style={{ marginTop: '16px' }}
          onClick={() => navigateToRoute?.('licenses')}
        >
          Back to Licenses
        </Button>
      </div>
    );
  }

  const { license, services, additional_information, compliance_documents } = detail;
  const expiryBadge = getExpiryBadge(license.expiry_date || null);
  const statusColor = getStatusBadge(license.status || '');
  const paymentColor = getPaymentStatusColor(license.license_fee_paid as any);

  // Services table columns
  const servicesColumns = [
    {
      title: 'Service',
      dataIndex: 'available_services',
      key: 'available_services',
    },
    {
      title: 'Available',
      dataIndex: 'is_available',
      key: 'is_available',
      render: (value: number) => (value ? '✓' : '-'),
    },
  ];

  // Additional Information table columns
  const infoColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge color={status === 'Submitted' ? 'success' : 'processing'} text={status} />
      ),
    },
    {
      title: 'Requested',
      dataIndex: 'requested_on',
      key: 'requested_on',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Provided',
      dataIndex: 'provided_on',
      key: 'provided_on',
      render: (date: string) => formatDate(date),
    },
  ];

  // Compliance Documents table columns
  const docsColumns = [
    {
      title: 'Document Type',
      dataIndex: 'document_type',
      key: 'document_type',
    },
    {
      title: 'File',
      dataIndex: 'document_file',
      key: 'document_file',
      render: (file: string | null | undefined) => (
        file ? (
          <a href={file} target="_blank" rel="noopener noreferrer">
            Download
          </a>
        ) : (
          '-'
        )
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigateToRoute?.('licenses')}
        style={{ marginBottom: '16px' }}
      >
        Back to Licenses
      </Button>

      {/* Main License Info Card */}
      <Card
        title={
          <Space>
            <span>{license.license_number}</span>
            <Badge color={statusColor} text={license.status} />
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Facility">
                {license.facility_name}
              </Descriptions.Item>
              <Descriptions.Item label="License Type">
                {license.license_type_name}
              </Descriptions.Item>
              <Descriptions.Item label="Application Type">
                {license.application_type}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Issue Date">
                {formatDate(license.issue_date)}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                <Space>
                  <span>{formatDate(license.expiry_date)}</span>
                  <Badge color={expiryBadge.color} text={expiryBadge.text} />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Days Remaining">
                {license.days_to_expiry !== null
                  ? `${license.days_to_expiry} days`
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Status">
                {license.status}
              </Descriptions.Item>
              <Descriptions.Item label="License Fee">
                {formatCurrency(license.license_fee)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Badge
                  color={paymentColor}
                  text={license.license_fee_paid ? 'Paid' : 'Pending'}
                />
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Issuance Details */}
      <Card title="Issuance Details" style={{ marginBottom: '24px' }}>
        <Descriptions size="small" column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label="Regulatory Body">
            {license.regulatory_body || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Issuing Authority">
            {license.issuing_authority || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Service Point">
            {license.service_point || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            {license.department || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Payment Information */}
      {license.license_fee && (
        <Card title="Payment Information" style={{ marginBottom: '24px' }}>
          <Descriptions size="small" column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
            <Descriptions.Item label="License Fee">
              {formatCurrency(license.license_fee)}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Badge
                color={paymentColor}
                text={license.license_fee_paid ? 'Paid ✓' : 'Pending'}
              />
            </Descriptions.Item>
            {license.license_fee_paid && (
              <>
                <Descriptions.Item label="Payment Reference">
                  {license.payment_reference || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="M-Pesa Checkout ID">
                  {license.mpesa_checkout_request_id || '-'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Available Services */}
      {Array.isArray(services) && services.length > 0 && (
        <Card title="Available Services" style={{ marginBottom: '24px' }}>
          <Table
            columns={servicesColumns}
            dataSource={services}
            rowKey={(_, index) => `service-${index}`}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Additional Information Requests */}
      {Array.isArray(additional_information) && additional_information.length > 0 && (
        <Card title="Information Requests" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {additional_information.map((info, index) => (
              <Card
                key={index}
                size="small"
                style={{
                  backgroundColor:
                    info.status === 'Submitted' ? '#f6ffed' : '#e6f7ff',
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <Space>
                      <strong>{info.title}</strong>
                      <Badge
                        color={
                          info.status === 'Submitted'
                            ? 'success'
                            : 'processing'
                        }
                        text={info.status}
                      />
                    </Space>
                  </Col>
                  <Col xs={24}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="Request">
                        {info.request_comment || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Requested On">
                        {formatDate(info.requested_on)}
                      </Descriptions.Item>
                      {info.provided_on && (
                        <Descriptions.Item label="Provided On">
                          {formatDate(info.provided_on)}
                        </Descriptions.Item>
                      )}
                      {info.response && (
                        <Descriptions.Item label="Response">
                          {info.response}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* Compliance Documents */}
      {Array.isArray(compliance_documents) && compliance_documents.length > 0 && (
        <Card title="Compliance Documents" style={{ marginBottom: '24px' }}>
          <Table
            columns={docsColumns}
            dataSource={compliance_documents}
            rowKey={(_, index) => `doc-${index}`}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* License Conditions */}
      {license.conditions && (
        <Card title="License Conditions" style={{ marginBottom: '24px' }}>
          <div
            dangerouslySetInnerHTML={{ __html: license.conditions }}
            style={{
              padding: '12px',
              backgroundColor: '#fafafa',
              borderRadius: '4px',
            }}
          />
        </Card>
      )}

      {/* Remarks */}
      {license.remarks && (
        <Card title="Remarks">
          <p>{license.remarks}</p>
        </Card>
      )}

      {/* Back Button at Bottom */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigateToRoute?.('licenses')}
        >
          Back to Licenses
        </Button>
      </div>
    </div>
  );
};

export default LicenseDetailView;
