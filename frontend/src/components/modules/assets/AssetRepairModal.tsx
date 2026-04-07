import React, { useState } from 'react';
import {
    Modal, Form, Input, DatePicker, Checkbox, Button, Space, Card, Tag,
    Typography, Alert, message,
} from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import { useResponsive } from '../../../hooks/useResponsive';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    assetName: string;
}

const AssetRepairModal: React.FC<Props> = ({ open, onClose, assetName }) => {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const { createRepairRequest } = useERPNextAssetStore();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const result = await createRepairRequest({
                asset_name: assetName,
                failure_date: values.failure_date?.format('YYYY-MM-DD'),
                description: values.description,
                actions_performed: values.actions_performed || '',
                capitalize_repair_cost: values.capitalize_repair_cost ? 1 : 0,
            });

            if (result.success) {
                if (result.warning) {
                    message.warning(result.warning);
                } else {
                    message.success('Repair request created');
                }
                form.resetFields();
                onClose();
            } else {
                message.error(result.error || 'Failed to create repair request');
            }
        } catch {
            // validation error
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /><span>Report Issue</span></Space>}
            open={open}
            onCancel={onClose}
            width={isMobile ? '100%' : 700}
            style={{ top: isMobile ? 0 : 24 }}
            bodyStyle={{ padding: isMobile ? 12 : 20 }}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="submit" type="primary" danger loading={submitting} onClick={handleSubmit}>
                    Submit Report
                </Button>,
            ]}
        >
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                    <Text strong>{assetName}</Text>
                    <Tag color="red">Asset will be marked Out of Order</Tag>
                </Space>
            </Card>

            <Form form={form} layout="vertical" initialValues={{ failure_date: dayjs() }}>
                <Form.Item
                    label="Failure Date"
                    name="failure_date"
                    rules={[{ required: true, message: 'Failure date is required' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    label="Error Description"
                    name="description"
                    rules={[{ required: true, message: 'Description is required' }]}
                >
                    <Input.TextArea rows={4} placeholder="Describe what happened..." maxLength={1000} showCount />
                </Form.Item>

                <Form.Item label="Actions Already Performed" name="actions_performed">
                    <Input.TextArea rows={3} placeholder="Any troubleshooting steps taken (optional)" />
                </Form.Item>

                <Form.Item name="capitalize_repair_cost" valuePropName="checked">
                    <Checkbox>Capitalize repair cost to asset value</Checkbox>
                </Form.Item>
            </Form>

            <Alert
                type="warning"
                showIcon
                message="This will set the asset status to Out of Order until repair is completed."
            />
        </Modal>
    );
};

export default AssetRepairModal;
