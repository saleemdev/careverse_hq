import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    Form,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Switch,
    Typography,
    message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import useERPNextAssetStore, { type AssetDetail } from '../../../stores/modules/erpnextAssetStore';
import { erpnextAssetsApi } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text } = Typography;

const DEPRECIATION_METHODS = [
    { value: 'Straight Line', label: 'Straight Line' },
    { value: 'Double Declining Balance', label: 'Double Declining Balance' },
    { value: 'Written Down Value', label: 'Written Down Value' },
    { value: 'Manual', label: 'Manual' },
];

interface Props {
    asset: AssetDetail;
    open: boolean;
    onClose: () => void;
}

interface PurchaseDocumentOption {
    name: string;
    posting_date: string;
    company: string;
    supplier?: string;
    item_name?: string;
    item_qty: number;
    item_rate: number;
    item_amount: number;
    linked_asset_qty?: number;
    available_asset_qty?: number;
    doctype: string;
    desk_url: string;
}

interface AssetFinanceBookFormValue {
    finance_book?: string;
    depreciation_method?: string;
    total_number_of_depreciations?: number;
    frequency_of_depreciation?: number;
    expected_value_after_useful_life?: number;
    depreciation_start_date?: Dayjs | null;
    rate_of_depreciation?: number;
}

interface AssetDraftSetupValues {
    is_existing_asset: boolean;
    purchase_date?: Dayjs | null;
    available_for_use_date?: Dayjs | null;
    gross_purchase_amount: number;
    purchase_receipt?: string;
    purchase_invoice?: string;
    calculate_depreciation: boolean;
    finance_books?: AssetFinanceBookFormValue[];
    opening_accumulated_depreciation?: number;
    opening_number_of_booked_depreciations?: number;
}

const parseCurrencyInput = (value: string | undefined) => {
    const normalized = (value || '').replace(/,/g, '').trim();
    if (!normalized) {
        return undefined;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const createInitialPurchaseDocument = (
    doctype: 'Purchase Receipt' | 'Purchase Invoice',
    name: string,
    postingDate?: string,
    company?: string,
    itemRate?: number,
): PurchaseDocumentOption => ({
    name,
    posting_date: postingDate || '',
    company: company || '',
    item_qty: 0,
    item_rate: itemRate || 0,
    item_amount: 0,
    doctype,
    desk_url: doctype === 'Purchase Receipt' ? `/app/purchase-receipt/${name}` : `/app/purchase-invoice/${name}`,
});

const AssetDraftSetupModal: React.FC<Props> = ({ asset, open, onClose }) => {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm<AssetDraftSetupValues>();
    const { updateAsset } = useERPNextAssetStore();

    const [saving, setSaving] = useState(false);
    const [financeBooksLoading, setFinanceBooksLoading] = useState(false);
    const [financeBookOptions, setFinanceBookOptions] = useState<Array<{ name: string; finance_book_name?: string }>>([]);

    const [purchaseReceiptOptions, setPurchaseReceiptOptions] = useState<PurchaseDocumentOption[]>([]);
    const [purchaseInvoiceOptions, setPurchaseInvoiceOptions] = useState<PurchaseDocumentOption[]>([]);
    const [purchaseReceiptSearching, setPurchaseReceiptSearching] = useState(false);
    const [purchaseInvoiceSearching, setPurchaseInvoiceSearching] = useState(false);
    const [selectedPurchaseReceipt, setSelectedPurchaseReceipt] = useState<PurchaseDocumentOption | null>(null);
    const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<PurchaseDocumentOption | null>(null);

    const purchaseReceiptSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const purchaseInvoiceSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isExistingAsset = Form.useWatch('is_existing_asset', form);
    const calculateDepreciation = Form.useWatch('calculate_depreciation', form);
    const financeBookRows = Form.useWatch('finance_books', form) || [];

    useEffect(() => {
        if (!open) {
            return;
        }

        form.setFieldsValue({
            is_existing_asset: Boolean(asset.is_existing_asset),
            purchase_date: asset.purchase_date ? dayjs(asset.purchase_date) : null,
            available_for_use_date: asset.available_for_use_date ? dayjs(asset.available_for_use_date) : null,
            gross_purchase_amount: asset.gross_purchase_amount || asset.net_purchase_amount || 0,
            purchase_receipt: asset.purchase_receipt || undefined,
            purchase_invoice: asset.purchase_invoice || undefined,
            calculate_depreciation: Boolean(asset.calculate_depreciation),
            finance_books: asset.finance_books?.length
                ? asset.finance_books.map((row) => ({
                    finance_book: row.finance_book || undefined,
                    depreciation_method: row.depreciation_method || 'Straight Line',
                    total_number_of_depreciations: row.total_number_of_depreciations || undefined,
                    frequency_of_depreciation: row.frequency_of_depreciation || undefined,
                    expected_value_after_useful_life: row.expected_value_after_useful_life ?? 0,
                    depreciation_start_date: row.depreciation_start_date ? dayjs(row.depreciation_start_date) : null,
                    rate_of_depreciation: row.rate_of_depreciation || undefined,
                }))
                : [],
            opening_accumulated_depreciation: asset.opening_accumulated_depreciation || 0,
            opening_number_of_booked_depreciations: asset.opening_number_of_booked_depreciations || 0,
        });

        setSelectedPurchaseReceipt(
            asset.purchase_receipt
                ? createInitialPurchaseDocument(
                    'Purchase Receipt',
                    asset.purchase_receipt,
                    asset.purchase_date,
                    asset.company,
                    asset.gross_purchase_amount,
                )
                : null,
        );
        setSelectedPurchaseInvoice(
            asset.purchase_invoice
                ? createInitialPurchaseDocument(
                    'Purchase Invoice',
                    asset.purchase_invoice,
                    asset.purchase_date,
                    asset.company,
                    asset.gross_purchase_amount,
                )
                : null,
        );
        setPurchaseReceiptOptions([]);
        setPurchaseInvoiceOptions([]);

        setFinanceBooksLoading(true);
        erpnextAssetsApi.getFinanceBooks().then((response) => {
            if (response.success) {
                setFinanceBookOptions(response.data?.items || []);
            }
        }).finally(() => setFinanceBooksLoading(false));
    }, [asset, form, open]);

    useEffect(() => {
        if (calculateDepreciation && financeBookRows.length === 0) {
            form.setFieldValue('finance_books', [{
                depreciation_method: 'Straight Line',
                expected_value_after_useful_life: 0,
            }]);
        }
    }, [calculateDepreciation, financeBookRows.length, form]);

    const handlePurchaseReceiptSearch = useCallback((value: string) => {
        if (purchaseReceiptSearchRef.current) {
            clearTimeout(purchaseReceiptSearchRef.current);
        }

        setPurchaseReceiptSearching(true);
        purchaseReceiptSearchRef.current = setTimeout(async () => {
            try {
                const response = await erpnextAssetsApi.searchPurchaseReceiptsForAsset(asset.item_code, asset.company, value, asset.name);
                setPurchaseReceiptOptions(response.success ? (response.data?.items || []) : []);
            } finally {
                setPurchaseReceiptSearching(false);
            }
        }, 300);
    }, [asset.company, asset.item_code, asset.name]);

    const handlePurchaseInvoiceSearch = useCallback((value: string) => {
        if (purchaseInvoiceSearchRef.current) {
            clearTimeout(purchaseInvoiceSearchRef.current);
        }

        setPurchaseInvoiceSearching(true);
        purchaseInvoiceSearchRef.current = setTimeout(async () => {
            try {
                const response = await erpnextAssetsApi.searchPurchaseInvoicesForAsset(asset.item_code, asset.company, value, asset.name);
                setPurchaseInvoiceOptions(response.success ? (response.data?.items || []) : []);
            } finally {
                setPurchaseInvoiceSearching(false);
            }
        }, 300);
    }, [asset.company, asset.item_code, asset.name]);

    const applySelectedPurchaseDocument = useCallback((document: PurchaseDocumentOption, fieldName: 'purchase_receipt' | 'purchase_invoice') => {
        const otherField = fieldName === 'purchase_receipt' ? 'purchase_invoice' : 'purchase_receipt';
        form.setFieldsValue({
            [fieldName]: document.name,
            [otherField]: undefined,
            purchase_date: document.posting_date ? dayjs(document.posting_date) : null,
            gross_purchase_amount: document.item_rate || undefined,
        });
    }, [form]);

    const handlePurchaseReceiptSelect = (name: string) => {
        const document = purchaseReceiptOptions.find((entry) => entry.name === name) || null;
        setSelectedPurchaseReceipt(document);
        setSelectedPurchaseInvoice(null);
        setPurchaseInvoiceOptions([]);
        if (document) {
            applySelectedPurchaseDocument(document, 'purchase_receipt');
        }
    };

    const handlePurchaseInvoiceSelect = (name: string) => {
        const document = purchaseInvoiceOptions.find((entry) => entry.name === name) || null;
        setSelectedPurchaseInvoice(document);
        setSelectedPurchaseReceipt(null);
        setPurchaseReceiptOptions([]);
        if (document) {
            applySelectedPurchaseDocument(document, 'purchase_invoice');
        }
    };

    const confirmExistingAssetSwitch = () => new Promise<boolean>((resolve) => {
        Modal.confirm({
            title: 'Confirm asset source',
            content: 'Use Existing Asset only when the asset was already owned or already in service before this record. Use New Purchase when the asset must remain linked to a Purchase Receipt or Purchase Invoice.',
            okText: 'Use Existing Asset',
            cancelText: 'Back',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
        });
    });

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            if (!values.is_existing_asset && !values.purchase_receipt && !values.purchase_invoice) {
                message.error('Link a Purchase Receipt or Purchase Invoice for a non-existing asset.');
                return;
            }

            if (values.purchase_receipt && values.purchase_invoice) {
                message.error('Link either a Purchase Receipt or a Purchase Invoice, not both.');
                return;
            }

            if (values.is_existing_asset && !asset.is_existing_asset) {
                const confirmed = await confirmExistingAssetSwitch();
                if (!confirmed) {
                    return;
                }
            }

            if (values.calculate_depreciation && !values.available_for_use_date) {
                message.error('Available-for-use date is required before depreciation can be configured.');
                return;
            }

            if (values.calculate_depreciation && !values.finance_books?.length) {
                message.error('Add at least one finance book row for depreciation setup.');
                return;
            }

            const payload: Record<string, unknown> = {
                is_existing_asset: values.is_existing_asset ? 1 : 0,
                purchase_date: values.purchase_date?.format('YYYY-MM-DD'),
                available_for_use_date: values.available_for_use_date?.format('YYYY-MM-DD'),
                gross_purchase_amount: values.gross_purchase_amount,
                purchase_receipt: values.is_existing_asset ? '' : values.purchase_receipt,
                purchase_invoice: values.is_existing_asset ? '' : values.purchase_invoice,
                calculate_depreciation: values.calculate_depreciation ? 1 : 0,
            };

            if (values.calculate_depreciation) {
                payload.finance_books = (values.finance_books || []).map((row) => ({
                    finance_book: row.finance_book,
                    depreciation_method: row.depreciation_method,
                    total_number_of_depreciations: row.total_number_of_depreciations,
                    frequency_of_depreciation: row.frequency_of_depreciation,
                    expected_value_after_useful_life: row.expected_value_after_useful_life || 0,
                    depreciation_start_date: row.depreciation_start_date?.format('YYYY-MM-DD'),
                    rate_of_depreciation: row.rate_of_depreciation || 0,
                }));

                if (values.is_existing_asset) {
                    payload.opening_accumulated_depreciation = values.opening_accumulated_depreciation || 0;
                    payload.opening_number_of_booked_depreciations = values.opening_number_of_booked_depreciations || 0;
                }
            }

            setSaving(true);
            const result = await updateAsset(asset.name, payload);
            if (result.success) {
                message.success('Draft asset updated');
                onClose();
            } else {
                message.error(result.error || 'Failed to update draft asset');
            }
        } catch {
            // antd validation handles field feedback
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Complete Draft Asset Setup"
            open={open}
            onCancel={onClose}
            onOk={handleSave}
            okText="Save Draft Details"
            confirmLoading={saving}
            width={isMobile ? '100%' : 860}
            style={{ top: isMobile ? 0 : 24 }}
            destroyOnClose
            styles={{
                body: {
                    maxHeight: isMobile ? 'calc(100vh - 140px)' : '72vh',
                    overflowY: 'auto',
                },
            }}
        >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                    type="info"
                    showIcon
                    message="Complete draft details"
                    description="Add purchase traceability, available-for-use date, and finance-book depreciation details before submitting the asset."
                />

                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Existing Asset"
                                name="is_existing_asset"
                                valuePropName="checked"
                                tooltip="Use for assets already owned or already in service."
                            >
                                <Switch checkedChildren="Existing" unCheckedChildren="New Purchase" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Enable Depreciation"
                                name="calculate_depreciation"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Enabled" unCheckedChildren="Later" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Purchase Date"
                                name="purchase_date"
                                rules={[{ required: true, message: 'Purchase date is required' }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Available-for-use Date"
                                name="available_for_use_date"
                                tooltip="Required before the asset can be submitted."
                                rules={calculateDepreciation
                                    ? [{ required: true, message: 'Available-for-use date is required for depreciation setup' }]
                                    : undefined}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Asset Value"
                        name="gross_purchase_amount"
                        rules={[{ required: true, message: 'Asset value is required' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            placeholder="0.00"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={parseCurrencyInput}
                        />
                    </Form.Item>

                    {!isExistingAsset && (
                        <Card size="small" title="Purchase Traceability" style={{ borderRadius: 10, marginBottom: 16 }}>
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="New purchase flow"
                                description="Select one submitted purchase document for this item. The draft will align its purchase date and unit value with that document."
                            />

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Purchase Receipt"
                                        name="purchase_receipt"
                                        extra="Use this when the asset came in through stock receipt."
                                    >
                                        <Select
                                            showSearch
                                            allowClear
                                            placeholder="Search submitted Purchase Receipts"
                                            filterOption={false}
                                            onSearch={handlePurchaseReceiptSearch}
                                            onSelect={handlePurchaseReceiptSelect}
                                            onClear={() => setSelectedPurchaseReceipt(null)}
                                            loading={purchaseReceiptSearching}
                                            notFoundContent={purchaseReceiptSearching
                                                ? <Spin size="small" />
                                                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching Purchase Receipts" />}
                                            options={[
                                                ...(selectedPurchaseReceipt ? [{
                                                    value: selectedPurchaseReceipt.name,
                                                    label: selectedPurchaseReceipt.name,
                                                }] : []),
                                                ...purchaseReceiptOptions.map((document) => ({
                                                    value: document.name,
                                                    label: `${document.name} • ${document.supplier || 'No supplier'} • ${document.posting_date ? dayjs(document.posting_date).format('DD MMM YYYY') : 'No date'} • ${document.available_asset_qty ?? document.item_qty} available`,
                                                })),
                                            ]}
                                        />
                                    </Form.Item>
                                    {selectedPurchaseReceipt && (
                                        <Alert
                                            type="info"
                                            showIcon
                                            message={`Receipt ${selectedPurchaseReceipt.name} selected`}
                                            description={
                                                <Space direction="vertical" size={0}>
                                                    <Text type="secondary">
                                                        Qty {selectedPurchaseReceipt.item_qty || 0} • Available for asset creation {(selectedPurchaseReceipt.available_asset_qty ?? selectedPurchaseReceipt.item_qty) || 0} • Unit value {selectedPurchaseReceipt.item_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </Text>
                                                    <a href={selectedPurchaseReceipt.desk_url} target="_blank" rel="noreferrer">Open Purchase Receipt</a>
                                                </Space>
                                            }
                                        />
                                    )}
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Purchase Invoice"
                                        name="purchase_invoice"
                                        extra="Use this instead when the invoice is the stock-updating source document."
                                    >
                                        <Select
                                            showSearch
                                            allowClear
                                            placeholder="Search submitted stock Purchase Invoices"
                                            filterOption={false}
                                            onSearch={handlePurchaseInvoiceSearch}
                                            onSelect={handlePurchaseInvoiceSelect}
                                            onClear={() => setSelectedPurchaseInvoice(null)}
                                            loading={purchaseInvoiceSearching}
                                            notFoundContent={purchaseInvoiceSearching
                                                ? <Spin size="small" />
                                                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching Purchase Invoices" />}
                                            options={[
                                                ...(selectedPurchaseInvoice ? [{
                                                    value: selectedPurchaseInvoice.name,
                                                    label: selectedPurchaseInvoice.name,
                                                }] : []),
                                                ...purchaseInvoiceOptions.map((document) => ({
                                                    value: document.name,
                                                    label: `${document.name} • ${document.supplier || 'No supplier'} • ${document.posting_date ? dayjs(document.posting_date).format('DD MMM YYYY') : 'No date'} • ${document.available_asset_qty ?? document.item_qty} available`,
                                                })),
                                            ]}
                                        />
                                    </Form.Item>
                                    {selectedPurchaseInvoice && (
                                        <Alert
                                            type="info"
                                            showIcon
                                            message={`Invoice ${selectedPurchaseInvoice.name} selected`}
                                            description={
                                                <Space direction="vertical" size={0}>
                                                    <Text type="secondary">
                                                        Qty {selectedPurchaseInvoice.item_qty || 0} • Available for asset creation {(selectedPurchaseInvoice.available_asset_qty ?? selectedPurchaseInvoice.item_qty) || 0} • Unit value {selectedPurchaseInvoice.item_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </Text>
                                                    <a href={selectedPurchaseInvoice.desk_url} target="_blank" rel="noreferrer">Open Purchase Invoice</a>
                                                </Space>
                                            }
                                        />
                                    )}
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {calculateDepreciation ? (
                        <Card size="small" title="Finance Book Setup" style={{ borderRadius: 10 }}>
                            <Alert
                                type="success"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="Depreciation setup"
                                description="Edit every finance-book row that applies to this asset. Existing rows are preserved; you can also add another finance book when needed."
                            />

                            <Form.List name="finance_books">
                                {(fields, { add, remove }) => (
                                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                        {fields.map((field, index) => (
                                            <Card
                                                key={field.key}
                                                size="small"
                                                title={`Finance Book ${index + 1}`}
                                                extra={fields.length > 1 ? (
                                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                                                        Remove
                                                    </Button>
                                                ) : null}
                                                style={{ borderRadius: 8 }}
                                            >
                                                <Row gutter={16}>
                                                    <Col xs={24} sm={12}>
                                                        <Form.Item
                                                            label="Finance Book"
                                                            name={[field.name, 'finance_book']}
                                                            rules={fields.length > 1
                                                                ? [{ required: true, message: 'Finance book is required when multiple rows exist' }]
                                                                : undefined}
                                                        >
                                                            <Select
                                                                allowClear
                                                                showSearch
                                                                loading={financeBooksLoading}
                                                                placeholder={financeBooksLoading ? 'Loading finance books...' : 'Default finance book'}
                                                                optionFilterProp="label"
                                                                notFoundContent={financeBooksLoading
                                                                    ? <Spin size="small" />
                                                                    : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No finance books found" />}
                                                                options={financeBookOptions.map((book) => ({
                                                                    value: book.name,
                                                                    label: book.finance_book_name || book.name,
                                                                }))}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <Form.Item
                                                            label="Depreciation Method"
                                                            name={[field.name, 'depreciation_method']}
                                                            rules={[{ required: true, message: 'Choose a depreciation method' }]}
                                                        >
                                                            <Select options={DEPRECIATION_METHODS} />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>

                                                <Row gutter={16}>
                                                    <Col xs={24} sm={12}>
                                                        <Form.Item
                                                            label="Total Depreciations"
                                                            name={[field.name, 'total_number_of_depreciations']}
                                                            rules={[{ required: true, message: 'Enter the total number of depreciations' }]}
                                                        >
                                                            <InputNumber style={{ width: '100%' }} min={1} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <Form.Item
                                                            label="Frequency (months)"
                                                            name={[field.name, 'frequency_of_depreciation']}
                                                            rules={[{ required: true, message: 'Enter the depreciation frequency' }]}
                                                        >
                                                            <InputNumber style={{ width: '100%' }} min={1} />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>

                                                <Row gutter={16}>
                                                    <Col xs={24} sm={12}>
                                                        <Form.Item label="Salvage Value" name={[field.name, 'expected_value_after_useful_life']}>
                                                            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <Form.Item
                                                            label="Depreciation Start Date"
                                                            name={[field.name, 'depreciation_start_date']}
                                                            rules={[{ required: true, message: 'Depreciation start date is required' }]}
                                                        >
                                                            <DatePicker style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>

                                                <Form.Item noStyle shouldUpdate={(prev, curr) => (
                                                    prev.finance_books?.[field.name]?.depreciation_method !== curr.finance_books?.[field.name]?.depreciation_method
                                                )}>
                                                    {({ getFieldValue }) => {
                                                        const method = getFieldValue(['finance_books', field.name, 'depreciation_method']);
                                                        if (method !== 'Written Down Value') {
                                                            return null;
                                                        }

                                                        return (
                                                            <Form.Item
                                                                label="Rate of Depreciation (%)"
                                                                name={[field.name, 'rate_of_depreciation']}
                                                                rules={[{ required: true, message: 'Rate of depreciation is required for Written Down Value' }]}
                                                            >
                                                                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                            </Card>
                                        ))}

                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={() => add({ depreciation_method: 'Straight Line', expected_value_after_useful_life: 0 })}
                                            block
                                        >
                                            Add Finance Book
                                        </Button>
                                    </Space>
                                )}
                            </Form.List>

                            {isExistingAsset && (
                                <>
                                    <Alert
                                        type="info"
                                        showIcon
                                        style={{ marginTop: 16, marginBottom: 16 }}
                                        message="Existing asset opening balances"
                                        description="Only fill these when the asset had already been depreciated before entering this system."
                                    />
                                    <Row gutter={16}>
                                        <Col xs={24} sm={12}>
                                            <Form.Item label="Opening Accumulated Depreciation" name="opening_accumulated_depreciation">
                                                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item label="Opening Booked Depreciations" name="opening_number_of_booked_depreciations">
                                                <InputNumber style={{ width: '100%' }} min={0} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </Card>
                    ) : (
                        <Alert
                            type="info"
                            showIcon
                            message="Depreciation is still deferred"
                            description={<Text>You can keep the draft simple now and add depreciation later before submission.</Text>}
                        />
                    )}
                </Form>
            </Space>
        </Modal>
    );
};

export default AssetDraftSetupModal;
