import React, { useState, useEffect } from 'react';
import { Descriptions, Tabs, Tag, Space, Typography, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, AuditOutlined } from '@ant-design/icons';
import ModuleDetailDrawer from '../shared/ModuleDetailDrawer';
import StatusTag from '../shared/StatusTag';
import type { Employee } from '../../../types/modules';
// We'll fix the API import later or use a generic one
import { dashboardApi } from '../../../services/api';

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
            // Using a generic way to call detail API
            const response = await (dashboardApi as any).getEmployeeDetail(employeeId);
            if (response.success) {
                setEmployee(response.data);
            }
        } catch (error) {
            console.error('Failed to load employee details:', error);
            // message.error('Failed to load employee details');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
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
                    <TabPane
                        tab={<Space><UserOutlined />Basic Info</Space>}
                        key="1"
                    >
                        <Descriptions bordered column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Full Name" span={2}>
                                <Text strong>{employee.employee_name}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Employee ID">
                                <Tag color="blue">{employee.employee_number}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Designation">
                                {employee.designation}
                            </Descriptions.Item>
                            <Descriptions.Item label="Department">
                                {employee.department}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <StatusTag status={employee.status} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Gender">
                                {employee.gender}
                            </Descriptions.Item>
                            <Descriptions.Item label="Date of Joining">
                                <Space>
                                    <CalendarOutlined />
                                    {formatDate(employee.date_of_joining)}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Health Facility">
                                {employee.health_facility || 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </TabPane>

                    <TabPane
                        tab={<Space><MailOutlined />Contact Details</Space>}
                        key="2"
                    >
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Company Email">
                                {employee.company_email ? (
                                    <Space>
                                        <MailOutlined style={{ color: '#1890ff' }} />
                                        <a href={`mailto:${employee.company_email}`}>{employee.company_email}</a>
                                    </Space>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Personal Email">
                                {employee.personal_email || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phone Number">
                                {employee.cell_number ? (
                                    <Space>
                                        <PhoneOutlined style={{ color: '#52c41a' }} />
                                        {employee.cell_number}
                                    </Space>
                                ) : 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </TabPane>

                    <TabPane
                        tab={<Space><AuditOutlined />Audit Log</Space>}
                        key="3"
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
                        </Descriptions>
                    </TabPane>
                </Tabs>
            )}
        </ModuleDetailDrawer>
    );
};

export default EmployeeDetailDrawer;
