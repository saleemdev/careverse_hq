import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Modal, Form, Select, DatePicker, Button, Space, Card, Typography,
    Alert, message, Empty, Spin,
} from 'antd';
import { SwapOutlined, EnvironmentOutlined } from '@ant-design/icons';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import useFacilityStore from '../../../stores/facilityStore';
import { erpnextAssetsApi } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    assetName: string;
    currentLocation: string;
    currentFacilityId?: string;
    currentLocationName: string;
    currentCustodian?: string;
    currentCustodianName: string;
    company: string;
}

interface EmployeeSearchOption {
    name: string;
    employee_name: string;
    designation?: string;
    department?: string;
}

const AssetMovementModal: React.FC<Props> = ({
    open, onClose, assetName,
    currentLocation, currentFacilityId, currentLocationName,
    currentCustodian,
    currentCustodianName,
    company,
}) => {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const { createMovement } = useERPNextAssetStore();
    const { availableFacilities } = useFacilityStore();

    // Employee search for Issue purpose
    const [employees, setEmployees] = useState<EmployeeSearchOption[]>([]);
    const [employeeSearching, setEmployeeSearching] = useState(false);
    const employeeSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const employeeSearchRequestSeqRef = useRef(0);
    const purpose = Form.useWatch('purpose', form) || 'Transfer';
    const hasCurrentCustodian = Boolean((currentCustodian || '').trim());
    const movementPurposeOptions = [
        { value: 'Transfer', label: 'Transfer (Move to another location)' },
        { value: 'Transfer and Issue', label: 'Transfer + Reassign Employee', disabled: !hasCurrentCustodian },
        { value: 'Issue', label: 'Issue (Assign to employee)' },
        { value: 'Receipt', label: 'Receipt (Receive at location)' },
    ];

    const handleEmployeeSearch = useCallback((value: string) => {
        if (employeeSearchRef.current) {
            clearTimeout(employeeSearchRef.current);
        }
        const requestSeq = ++employeeSearchRequestSeqRef.current;
        if (!value || value.length < 2) {
            setEmployees([]);
            setEmployeeSearching(false);
            return;
        }
        setEmployeeSearching(true);
        employeeSearchRef.current = setTimeout(async () => {
            try {
                const res = await erpnextAssetsApi.searchEmployees(value, company);
                if (requestSeq !== employeeSearchRequestSeqRef.current || !open) {
                    return;
                }
                setEmployees(res.success ? (res.data?.items || []) : []);
            } finally {
                if (requestSeq === employeeSearchRequestSeqRef.current) {
                    setEmployeeSearching(false);
                }
            }
        }, 350);
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

            const result = await createMovement({
                asset_name: assetName,
                purpose: values.purpose,
                target_facility_id: values.purpose === 'Issue' ? undefined : values.target_facility_id,
                to_employee: (values.purpose === 'Issue' || values.purpose === 'Transfer and Issue')
                    ? values.to_employee
                    : undefined,
                transaction_date: values.transaction_date?.format('YYYY-MM-DD HH:mm:ss'),
            });

            if (result.success) {
                if (result.warning) {
                    message.warning(result.warning);
                } else {
                    message.success(`Asset ${values.purpose.toLowerCase()} completed`);
                }
                form.resetFields();
                onClose();
            } else {
                message.error(result.error || 'Failed to create movement');
            }
        } catch {
            // validation error
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={<Space><SwapOutlined /><span>Asset Movement</span></Space>}
            open={open}
            onCancel={onClose}
            afterOpenChange={(isOpen) => {
                if (!isOpen) {
                    if (employeeSearchRef.current) {
                        clearTimeout(employeeSearchRef.current);
                    }
                    employeeSearchRequestSeqRef.current += 1;
                    setEmployeeSearching(false);
                    setEmployees([]);
                    form.resetFields();
                    return;
                }
                setEmployees([]);
                form.setFieldsValue({
                    purpose: 'Transfer',
                    target_facility_id: undefined,
                    to_employee: undefined,
                    transaction_date: dayjs(),
                });
            }}
            width={isMobile ? '100%' : 700}
            style={{ top: isMobile ? 0 : 24 }}
            bodyStyle={{ padding: isMobile ? 12 : 20 }}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
                    Execute Movement
                </Button>,
            ]}
        >
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
                <Space direction="vertical" size={4}>
                    <Text strong>{assetName}</Text>
                    <Text type="secondary">
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        Current: {currentLocationName || currentLocation || 'No location'}
                        {currentCustodianName && ` • ${currentCustodianName}`}
                    </Text>
                </Space>
            </Card>

            <Form
                form={form}
                layout="vertical"
                initialValues={{ purpose: 'Transfer', transaction_date: dayjs() }}
                onValuesChange={(changedValues) => {
                    if (!changedValues.purpose) {
                        return;
                    }

                    if (changedValues.purpose === 'Issue') {
                        form.setFieldValue('target_facility_id', undefined);
                        return;
                    }

                    if (changedValues.purpose === 'Transfer and Issue') {
                        return;
                    }

                    form.setFieldValue('to_employee', undefined);
                    employeeSearchRequestSeqRef.current += 1;
                    setEmployeeSearching(false);
                    setEmployees([]);
                }}
            >
                <Form.Item
                    label="Purpose"
                    name="purpose"
                    rules={[{ required: true }]}
                >
                    <Select options={movementPurposeOptions} />
                </Form.Item>

                {(purpose === 'Transfer' || purpose === 'Receipt' || purpose === 'Transfer and Issue') && (
                    <Form.Item
                        label="Target Facility"
                        name="target_facility_id"
                        rules={[{ required: true, message: 'Select target facility' }]}
                    >
                        <Select
                            placeholder="Select facility"
                            showSearch
                            optionFilterProp="children"
                        >
                            {availableFacilities
                                .filter((f) => f.hie_id !== currentFacilityId)
                                .map((f) => (
                                    <Select.Option key={f.hie_id} value={f.hie_id}>
                                        {f.facility_name}
                                    </Select.Option>
                                ))}
                        </Select>
                    </Form.Item>
                )}

                {(purpose === 'Issue' || purpose === 'Transfer and Issue') && (
                    <Form.Item
                        label={purpose === 'Transfer and Issue' ? 'Reassign To Employee' : 'Assign To Employee'}
                        name="to_employee"
                        rules={[{ required: true, message: 'Select employee' }]}
                    >
                        <Select
                            placeholder="Search by name... (min 2 characters)"
                            showSearch
                            filterOption={false}
                            onSearch={handleEmployeeSearch}
                            loading={employeeSearching}
                            allowClear
                            notFoundContent={
                                employeeSearching
                                    ? <Spin size="small" />
                                    : <Empty description="Type to search employees" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            }
                        >
                            {employees.map((e) => (
                                <Select.Option key={e.name} value={e.name}>
                                    <div>
                                        <Text strong>{e.employee_name}</Text>
                                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                            {e.name} &bull; {e.designation || e.department || ''}
                                        </Text>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                <Form.Item label="Transaction Date" name="transaction_date">
                    <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>

                {!hasCurrentCustodian && (
                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message="Transfer + Reassign is disabled"
                        description="This asset has no current custodian. Transfer first, then use Issue to assign an employee."
                    />
                )}
            </Form>

            <Alert
                type="info"
                showIcon
                message="Movement will be auto-submitted and the asset's location/custodian updated immediately."
            />
        </Modal>
    );
};

export default AssetMovementModal;
