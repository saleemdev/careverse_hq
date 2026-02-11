import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Statistic,
  Row,
  Col,
  Input,
  Select,
  Space,
  Spin,
  Empty,
  Badge,
  Button,
} from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, BarChart, Bar, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useFacilityStore from '../../../stores/facilityStore';
import { licensesApi } from '../../../services/api';
import {
  getExpiryBadge,
  getStatusBadge,
  getPaymentStatusColor,
  formatCurrency,
  formatDate,
} from '../../../utils/licenseHelpers';

interface LicensesListViewProps {
  navigateToRoute?: (route: string, id?: string) => void;
}

interface LicenseRecord {
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
  regulatory_body: string;
  license_fee: number;
  license_fee_paid: number;
  days_to_expiry: number | null;
}

interface Statistics {
  total: number;
  by_status: Record<string, number>;
  by_regulatory_body: Record<string, number>;
  expiry_alerts: {
    expiring_30_days: number;
    expiring_60_days: number;
    expiring_90_days: number;
    expired: number;
  };
  payment_status: {
    paid: number;
    pending: number;
  };
}

const LicensesListView: React.FC<LicensesListViewProps> = ({ navigateToRoute }) => {
  const { selectedFacilityIds } = useFacilityStore();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<LicenseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Fetch licenses overview
  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const result = await licensesApi.getOverview(selectedFacilityIds);
      const apiResponse = result.message || result;
      const data = apiResponse.data || apiResponse;

      if (data.statistics && data.licenses) {
        setStatistics(data.statistics);
        setLicenses(data.licenses);
        applyFilters(data.licenses, searchTerm, statusFilter);
      }
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [selectedFacilityIds]);

  // Apply search and status filters
  const applyFilters = (
    licenseList: LicenseRecord[],
    search: string,
    status?: string
  ) => {
    let filtered = licenseList;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.license_number?.toLowerCase().includes(lowerSearch) ||
          l.facility_name?.toLowerCase().includes(lowerSearch) ||
          l.license_type_name?.toLowerCase().includes(lowerSearch)
      );
    }

    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }

    setFilteredLicenses(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFilters(licenses, value, statusFilter);
  };

  const handleStatusFilter = (value: string | undefined) => {
    setStatusFilter(value);
    applyFilters(licenses, searchTerm, value);
  };

  // Prepare chart data
  const statusChartData = Object.entries(statistics?.by_status || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const regulatoryChartData = Object.entries(statistics?.by_regulatory_body || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 regulators

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2', '#eb2f96', '#722ed1', '#fa8c16'];

  // Table columns
  const columns = [
    {
      title: 'License #',
      dataIndex: 'license_number',
      key: 'license_number',
      width: 140,
      render: (text: string) => <span className="font-weight-600">{text}</span>,
    },
    {
      title: 'Facility',
      dataIndex: 'facility_name',
      key: 'facility_name',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'license_type_name',
      key: 'license_type_name',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Badge color={getStatusBadge(status)} text={status} />
      ),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 130,
      render: (date: string, record: LicenseRecord) => {
        const badge = getExpiryBadge(date);
        return (
          <Badge color={badge.color} text={badge.text} />
        );
      },
    },
    {
      title: 'Payment',
      dataIndex: 'license_fee_paid',
      key: 'license_fee_paid',
      width: 100,
      render: (isPaid: number) => (
        <Badge
          color={getPaymentStatusColor(isPaid as any)}
          text={isPaid ? 'Paid' : 'Pending'}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record: LicenseRecord) => (
        <Button
          type="link"
          onClick={() => navigateToRoute?.('licenses', record.name)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Overview Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Licenses"
              value={statistics?.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Expiring Soon (≤90 days)"
              value={
                (statistics?.expiry_alerts.expiring_30_days || 0) +
                (statistics?.expiry_alerts.expiring_60_days || 0) +
                (statistics?.expiry_alerts.expiring_90_days || 0)
              }
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Payment"
              value={statistics?.payment_status.pending || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Expired"
              value={statistics?.expiry_alerts.expired || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="License Status Breakdown" loading={loading}>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Licenses by Regulatory Body" loading={loading}>
            {regulatoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regulatoryChartData}>
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#1890ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Input.Search
              placeholder="Search by license #, facility, or type..."
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: 180 }}
              onChange={handleStatusFilter}
              options={Object.keys(statistics?.by_status || {}).map((status) => ({
                label: status,
                value: status,
              }))}
            />
          </Space>
        </Space>
      </Card>

      {/* Licenses Table */}
      <Card title="Licenses" loading={loading}>
        {filteredLicenses.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredLicenses}
            rowKey="name"
            pagination={{
              pageSize: 10,
              total: filteredLicenses.length,
              showTotal: (total) => `Total ${total} licenses`,
            }}
            scroll={{ x: 1200 }}
          />
        ) : (
          <Empty
            description={
              licenses.length === 0
                ? 'No licenses found for your facilities'
                : 'No licenses match your filters'
            }
          />
        )}
      </Card>
    </div>
  );
};

export default LicensesListView;
