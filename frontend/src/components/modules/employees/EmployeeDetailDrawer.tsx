import React, { useState, useEffect } from 'react';
import { Descriptions, Tabs, Tag, Space, Typography, Alert, Divider } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    CalendarOutlined,
    AuditOutlined,
    SafetyCertificateOutlined,
    MedicineBoxOutlined,
    BankOutlined,
    WarningOutlined
} from '@ant-design/icons';
import ModuleDetailDrawer from '../shared/ModuleDetailDrawer';
import StatusTag from '../shared/StatusTag';
import { AffiliationsTable } from '../health-professionals/AffiliationsTable';
import { LicenseStatusBadge } from '../health-professionals/LicenseStatusBadge';
import type { Employee } from '../../../types/modules';
import { employeesApi } from '../../../services/api';

const { TabPane } = Tabs;
const { Text } = Typography;

interface EmployeeDetailDrawerProps {
    visible: boolean;
    employeeId: string | null;
    onClose: () => void;
}

const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
    visible,
    employeeId,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);
    const [employee, setEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        if (visible && employeeId) {
            fetchEmployeeDetails();
        }
    }, [visible, employeeId]);

    const fetchEmployeeDetails = async () => {
        setLoading(true);
        try {
            const response = await employeesApi.getDetail(employeeId);
            if (response.success) {
                setEmployee(response.data);
            }
        } catch (error) {
            console.error('Failed to load employee details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const hp = employee?.health_professional_data;

    // Calculate license expiry warning
    const getLicenseExpiryAlert = () => {
        if (!hp?.license_end) return null;

        const today = new Date();
        const licenseEnd = new Date(hp.license_end);
        const daysUntilExpiry = Math.ceil((licenseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return (
                <Alert
                    message="License Expired"
                    description={`License expired on ${formatDate(hp.license_end)}`}
                    type="error"
                    icon={<WarningOutlined />}
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            );
        } else if (daysUntilExpiry <= 30) {
            return (
                <Alert
                    message="License Expiring Soon"
                    description={`License expires in ${daysUntilExpiry} days (${formatDate(hp.license_end)})`}
                    type="warning"
                    icon={<WarningOutlined />}
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            );
        }

        return null;
    };

    return (
        <ModuleDetailDrawer
            title={`Employee Details: ${employee?.employee_name || 'Loading...'}`}
            visible={visible}
            onClose={onClose}
            loading={loading}
        >
            {employee && (
                <Tabs defaultActiveKey="1">
                    {/* Tab 1: Employment Info */}
                    <TabPane
                        tab={<Space><BankOutlined />Employment</Space>}
                        key="1"
                    >
                        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Employee Name" span={2}>
                                <Text strong>{employee.employee_name}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Employee ID">
                                <Tag color="blue">{employee.employee_number || employee.name}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <StatusTag status={employee.status} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Company">
                                {employee.company}
                            </Descriptions.Item>
                            <Descriptions.Item label="Department">
                                {employee.department}
                            </Descriptions.Item>
                            <Descriptions.Item label="Designation">
                                {employee.designation || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Employment Type">
                                {employee.employment_type || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Date of Joining">
                                <Space>
                                    <CalendarOutlined />
                                    {formatDate(employee.date_of_joining)}
                                </Space>
                            </Descriptions.Item>
                            {employee.date_of_leaving && (
                                <Descriptions.Item label="Date of Leaving">
                                    <Space>
                                        <CalendarOutlined />
                                        {formatDate(employee.date_of_leaving)}
                                    </Space>
                                </Descriptions.Item>
                            )}
                            {employee.custom_facility_name && (
                                <Descriptions.Item label="Facility" span={2}>
                                    <Tag color="geekblue">{employee.custom_facility_name}</Tag>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </TabPane>

                    {/* Tab 2: Personal Info */}
                    <TabPane
                        tab={<Space><UserOutlined />Personal Info</Space>}
                        key="2"
                    >
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Gender">
                                {employee.gender || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Date of Birth">
                                {formatDate(employee.date_of_birth)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cell Number">
                                {(employee.cell_number || hp?.phone) ? (
                                    <Space>
                                        <PhoneOutlined style={{ color: '#52c41a' }} />
                                        <a href={`tel:${employee.cell_number || hp?.phone}`}>
                                            {employee.cell_number || hp?.phone}
                                        </a>
                                    </Space>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Company Email">
                                {(employee.company_email || hp?.official_email) ? (
                                    <Space>
                                        <MailOutlined style={{ color: '#1890ff' }} />
                                        <a href={`mailto:${employee.company_email || hp?.official_email}`}>
                                            {employee.company_email || hp?.official_email}
                                        </a>
                                    </Space>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Personal Email">
                                {(employee.personal_email || hp?.email) ? (
                                    <a href={`mailto:${employee.personal_email || hp?.email}`}>
                                        {employee.personal_email || hp?.email}
                                    </a>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            {employee.custom_identification_type && (
                                <>
                                    <Descriptions.Item label="Identification Type">
                                        {employee.custom_identification_type}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Identification Number">
                                        {employee.custom_identification_number || 'N/A'}
                                    </Descriptions.Item>
                                </>
                            )}
                        </Descriptions>
                    </TabPane>

                    {/* Tab 3: Professional Details (if HP linked) */}
                    {hp && (
                        <TabPane
                            tab={<Space><MedicineBoxOutlined />Professional</Space>}
                            key="3"
                        >
                            <Descriptions bordered column={1}>
                                <Descriptions.Item label="Professional Cadre">
                                    <Tag color="blue">{hp.professional_cadre || 'N/A'}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Professional Specialty">
                                    {hp.professional_specialty || 'N/A'}
                                </Descriptions.Item>
                                {hp.sub_specialty && (
                                    <Descriptions.Item label="Sub Specialty">
                                        {hp.sub_specialty}
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="Registration Number">
                                    <Tag color="green">{hp.registration_number || 'N/A'}</Tag>
                                </Descriptions.Item>
                                {hp.educational_qualifications && (
                                    <Descriptions.Item label="Qualifications">
                                        {hp.educational_qualifications}
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </TabPane>
                    )}

                    {/* Tab 4: Licensing (if HP linked) */}
                    {hp && (
                        <TabPane
                            tab={<Space><SafetyCertificateOutlined />Licensing</Space>}
                            key="4"
                        >
                            {getLicenseExpiryAlert()}

                            <Descriptions bordered column={1}>
                                <Descriptions.Item label="License Status">
                                    <LicenseStatusBadge record={hp} />
                                </Descriptions.Item>
                                <Descriptions.Item label="License ID">
                                    {hp.license_id || 'N/A'}
                                </Descriptions.Item>
                                <Descriptions.Item label="License Type">
                                    {hp.license_type || 'N/A'}
                                </Descriptions.Item>
                                <Descriptions.Item label="License Start Date">
                                    {formatDate(hp.license_start)}
                                </Descriptions.Item>
                                <Descriptions.Item label="License End Date">
                                    {formatDate(hp.license_end)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Licensing Body">
                                    {hp.licensing_body || 'N/A'}
                                </Descriptions.Item>
                            </Descriptions>
                        </TabPane>
                    )}

                    {/* Tab 5: Affiliations */}
                    {employee.professional_affiliations && employee.professional_affiliations.length > 0 && (
                        <TabPane
                            tab={<Space><BankOutlined />Affiliations ({employee.professional_affiliations.length})</Space>}
                            key="5"
                        >
                            <AffiliationsTable data={employee.professional_affiliations} />
                        </TabPane>
                    )}

                    {/* Tab 6: Audit Log */}
                    <TabPane
                        tab={<Space><AuditOutlined />Audit Log</Space>}
                        key="6"
                    >
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Created On">
                                {formatDate(employee.creation)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Last Modified">
                                {formatDate(employee.modified)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Modified By">
                                {employee.modified_by}
                            </Descriptions.Item>
                            <Descriptions.Item label="Owner">
                                {employee.owner}
                            </Descriptions.Item>
                            {employee.custom_health_professional && (
                                <>
                                    <Divider />
                                    <Descriptions.Item label="Legacy Health Professional Record">
                                        <Tag color="orange">{employee.custom_health_professional}</Tag>
                                    </Descriptions.Item>
                                </>
                            )}
                        </Descriptions>
                    </TabPane>
                </Tabs>
            )}
        </ModuleDetailDrawer>
    );
};

export default EmployeeDetailDrawer;
