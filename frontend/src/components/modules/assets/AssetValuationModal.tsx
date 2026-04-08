import React from 'react';
import {
    Alert,
    Button,
    Card,
    DatePicker,
    Form,
    InputNumber,
    Modal,
    Select,
    Space,
    Typography,
    message,
} from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text } = Typography;

interface FinanceBookOption {
    finance_book?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    assetName: string;
    currentValuation: number;
    calculateDepreciation: boolean;
    financeBooks: FinanceBookOption[];
}

const AssetValuationModal: React.FC<Props> = ({
    open,
    onClose,
    assetName,
    currentValuation,
    calculateDepreciation,
    financeBooks,
}) => {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = React.useState(false);
    const { updateAssetCurrentValuation } = useERPNextAssetStore();

    const financeBookOptions = React.useMemo(
        () => financeBooks
            .map((row) => row.finance_book || '')
            .filter((value): value is string => Boolean(value.trim()))
            .map((value) => ({ value, label: value })),
        [financeBooks],
    );

    const defaultFinanceBook = financeBookOptions[0]?.value;
    const requireFinanceBook = calculateDepreciation && financeBookOptions.length > 1;

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const result = await updateAssetCurrentValuation({
                asset_name: assetName,
                new_asset_value: values.new_asset_value,
                date: values.date?.format('YYYY-MM-DD'),
                finance_book: values.finance_book || undefined,
            });
            if (result.success) {
                if (result.warning) {
                    message.warning(result.warning);
                } else {
                    message.success('Current valuation updated');
                }
                onClose();
            } else {
                message.error(result.error || 'Failed to update current valuation');
            }
        } catch {
            // antd validation handles field feedback
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={<Space><DollarOutlined /><span>Edit Current Valuation</span></Space>}
            open={open}
            onCancel={onClose}
            width={isMobile ? '100%' : 620}
            style={{ top: isMobile ? 0 : 24 }}
            destroyOnClose
            afterOpenChange={(isOpen) => {
                if (!isOpen) {
                    form.resetFields();
                    return;
                }
                form.setFieldsValue({
                    new_asset_value: currentValuation,
                    date: dayjs(),
                    finance_book: defaultFinanceBook,
                });
            }}
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
                    Save Valuation
                </Button>,
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Card size="small" style={{ borderRadius: 8 }}>
                    <Space direction="vertical" size={2}>
                        <Text strong>{assetName}</Text>
                        <Text type="secondary">
                            Current valuation: {(currentValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                    </Space>
                </Card>

                <Alert
                    type="info"
                    showIcon
                    message="Valuation updates are posted via Asset Value Adjustment for audit-safe accounting."
                />

                <Form form={form} layout="vertical">
                    {calculateDepreciation && (
                        <Form.Item
                            label="Finance Book"
                            name="finance_book"
                            rules={requireFinanceBook ? [{ required: true, message: 'Select finance book' }] : undefined}
                        >
                            <Select
                                options={financeBookOptions}
                                placeholder={financeBookOptions.length ? 'Select finance book' : 'No finance books configured'}
                                disabled={financeBookOptions.length <= 1}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        label="New Current Valuation"
                        name="new_asset_value"
                        rules={[{ required: true, message: 'Enter valuation amount' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            placeholder="0.00"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => {
                                const normalized = (value || '').replace(/,/g, '').trim();
                                if (!normalized) return undefined;
                                const parsed = Number(normalized);
                                return Number.isNaN(parsed) ? undefined : parsed;
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Adjustment Date"
                        name="date"
                        rules={[{ required: true, message: 'Select adjustment date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Space>
        </Modal>
    );
};

export default AssetValuationModal;
