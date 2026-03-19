import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal, Form, Select, DatePicker, Button, Space, Card, Typography,
    Alert, message, theme, Empty, Spin,
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
    currentLocationName: string;
    currentCustodian: string;
    currentCustodianName: string;
    company: string;
}

const PURPOSES = [
    { value: 'Transfer', label: 'Transfer (Move to another location)' },
    { value: 'Issue', label: 'Issue (Assign to employee)' },
    { value: 'Receipt', label: 'Receipt (Receive at location)' },
];

const AssetMovementModal: React.FC<Props> = ({
    open, onClose, assetName,
    currentLocation, currentLocationName,
    currentCustodian, currentCustodianName,
    company,
}) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [purpose, setPurpose] = useState('Transfer');
    const { createMovement } = useERPNextAssetStore();
    const { availableFacilities } = useFacilityStore();

    // Employee search for Issue purpose
    const [employees, setEmployees] = useState<any[]>([]);
    const [employeeSearching, setEmployeeSearching] = useState(false);
    const employeeSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEmployeeSearch = useCallback((value: string) => {
        if (employeeSearchRef.current) clearTimeout(employeeSearchRef.current);
        if (!value || value.length < 2) {
            setEmployees([]);
            return;
        }
        setEmployeeSearching(true);
        employeeSearchRef.current = setTimeout(async () => {
            const res = await erpnextAssetsApi.searchEmployees(value, company);
            if (res.success) setEmployees(res.data?.items || []);
            setEmployeeSearching(false);
        }, 350);
    }, [company]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const success = await createMovement({
                asset_name: assetName,
                purpose: values.purpose,
                target_facility_id: values.target_facility_id,
                to_employee: values.to_employee,
                transaction_date: values.transaction_date?.format('YYYY-MM-DD HH:mm:ss'),
            });

            if (success) {
                message.success(`Asset ${values.purpose.toLowerCase()} completed`);
                form.resetFields();
                onClose();
            } else {
                message.error('Failed to create movement');
            }
        } catch (err) {
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

            <Form form={form} layout="vertical" initialValues={{ purpose: 'Transfer', transaction_date: dayjs() }}>
                <Form.Item
                    label="Purpose"
                    name="purpose"
                    rules={[{ required: true }]}
                >
                    <Select options={PURPOSES} onChange={(val) => setPurpose(val)} />
                </Form.Item>

                {(purpose === 'Transfer' || purpose === 'Receipt') && (
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
                            {availableFacilities.map((f) => (
                                <Select.Option key={f.hie_id} value={f.hie_id}>
                                    {f.facility_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                {purpose === 'Issue' && (
                    <Form.Item
                        label="Assign To Employee"
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
