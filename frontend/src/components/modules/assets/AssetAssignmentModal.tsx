import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    DatePicker,
    Empty,
    Form,
    Modal,
    Select,
    Space,
    Spin,
    Typography,
    message,
} from 'antd';
import { UserSwitchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import { erpnextAssetsApi } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    assetName: string;
    company: string;
    currentCustodian?: string;
    currentCustodianName?: string;
}

interface EmployeeSearchOption {
    name: string;
    employee_name: string;
    designation?: string;
    department?: string;
}

const AssetAssignmentModal: React.FC<Props> = ({
    open,
    onClose,
    assetName,
    company,
    currentCustodian,
    currentCustodianName,
}) => {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const { reassignAssetCustodian } = useERPNextAssetStore();
    const [submitting, setSubmitting] = useState(false);
    const [employees, setEmployees] = useState<EmployeeSearchOption[]>([]);
    const [employeeSearching, setEmployeeSearching] = useState(false);
    const employeeSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const employeeSearchRequestSeqRef = useRef(0);

    const handleEmployeeSearch = useCallback((value: string) => {
        if (employeeSearchRef.current) {
            clearTimeout(employeeSearchRef.current);
        }
        if (!value || value.length < 2) {
            employeeSearchRequestSeqRef.current += 1;
            setEmployees([]);
            setEmployeeSearching(false);
            return;
        }

        const requestSeq = ++employeeSearchRequestSeqRef.current;
        setEmployeeSearching(true);
        employeeSearchRef.current = setTimeout(async () => {
            try {
                const response = await erpnextAssetsApi.searchEmployees(value, company);
                if (requestSeq !== employeeSearchRequestSeqRef.current || !open) {
                    return;
                }
                setEmployees(response.success ? (response.data?.items || []) : []);
            } finally {
                if (requestSeq === employeeSearchRequestSeqRef.current) {
                    setEmployeeSearching(false);
                }
            }
        }, 300);
    }, [company, open]);

    useEffect(() => () => {
        if (employeeSearchRef.current) {
            clearTimeout(employeeSearchRef.current);
        }
        employeeSearchRequestSeqRef.current += 1;
    }, []);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const result = await reassignAssetCustodian({
                asset_name: assetName,
                to_employee: values.to_employee,
                transaction_date: values.transaction_date?.format('YYYY-MM-DD HH:mm:ss'),
            });

            if (result.success) {
                if (result.warning) {
                    message.warning(result.warning);
                } else {
                    message.success('Assigned employee updated');
                }
                onClose();
            } else {
                message.error(result.error || 'Failed to update assigned employee');
            }
        } catch {
            // antd validation handles field feedback
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={<Space><UserSwitchOutlined /><span>Edit Assigned Employee</span></Space>}
            open={open}
            onCancel={onClose}
            width={isMobile ? '100%' : 620}
            style={{ top: isMobile ? 0 : 24 }}
            destroyOnClose
            afterOpenChange={(isOpen) => {
                if (!isOpen) {
                    if (employeeSearchRef.current) {
                        clearTimeout(employeeSearchRef.current);
                    }
                    employeeSearchRequestSeqRef.current += 1;
                    setEmployees([]);
                    setEmployeeSearching(false);
                    form.resetFields();
                    return;
                }
                setEmployees([]);
                form.setFieldsValue({
                    to_employee: currentCustodian || undefined,
                    transaction_date: dayjs(),
                });
            }}
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
                    Save Assignment
                </Button>,
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Card size="small" style={{ borderRadius: 8 }}>
                    <Space direction="vertical" size={2}>
                        <Text strong>{assetName}</Text>
                        <Text type="secondary">
                            Current assignee: {currentCustodianName || currentCustodian || 'Unassigned'}
                        </Text>
                    </Space>
                </Card>

                <Alert
                    type="info"
                    showIcon
                    message="Submitted assets are reassigned through Asset Movement (Issue) for audit integrity."
                />

                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Assigned Employee"
                        name="to_employee"
                        rules={[{ required: true, message: 'Select employee' }]}
                    >
                        <Select
                            placeholder="Search employee name... (min 2 characters)"
                            showSearch
                            filterOption={false}
                            onSearch={handleEmployeeSearch}
                            loading={employeeSearching}
                            allowClear
                            notFoundContent={
                                employeeSearching
                                    ? <Spin size="small" />
                                    : <Empty description="Type 2+ characters to search employees" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            }
                            options={[
                                ...(currentCustodian && !employees.some((employee) => employee.name === currentCustodian)
                                    ? [{
                                        value: currentCustodian,
                                        label: currentCustodianName || currentCustodian,
                                    }]
                                    : []),
                                ...employees.map((employee) => ({
                                    value: employee.name,
                                    label: `${employee.employee_name} (${employee.name})`,
                                })),
                            ]}
                        />
                    </Form.Item>

                    <Form.Item label="Transaction Date" name="transaction_date">
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Space>
        </Modal>
    );
};

export default AssetAssignmentModal;
