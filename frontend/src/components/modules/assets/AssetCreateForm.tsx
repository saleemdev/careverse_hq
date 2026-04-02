import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Result,
    Row,
    Select,
    Space,
    Spin,
    Switch,
    Tag,
    Tooltip,
    Typography,
    message,
    theme,
} from 'antd';
import type { FormProps } from 'antd';
import {
    ArrowLeftOutlined,
    AppstoreOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import useFacilityStore from '../../../stores/facilityStore';
import { erpnextAssetsApi } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

interface Props {
    navigateToRoute: (route: string, id?: string) => void;
}

interface CreateItemModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (item: { item_code: string; item_name: string; asset_category: string; item_group: string }) => void;
    categories: Array<{ name: string; asset_category_name: string }>;
    initialSearch?: string;
}

interface AssetCategoryOption {
    name: string;
    asset_category_name: string;
}

interface ItemGroupOption {
    name: string;
    item_group_name: string;
    parent_item_group?: string;
}

interface CompanyOption {
    name: string;
    company_name: string;
    abbr: string;
}

interface DepartmentOption {
    name: string;
    department_name: string;
    company?: string;
}

interface EmployeeOption {
    name: string;
    employee_name: string;
    designation?: string;
    department?: string;
    company?: string;
}

interface AssetItemSearchOption {
    item_code: string;
    item_name?: string;
    item_group?: string;
    asset_category?: string;
    description?: string;
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

interface CreateItemFormValues {
    item_code?: string;
    item_name: string;
    item_group: string;
    asset_category: string;
    stock_uom?: string;
    description?: string;
}

interface AssetCreateFormValues {
    asset_name: string;
    item_code: string;
    asset_category?: string;
    company: string;
    facility_id: string;
    department?: string;
    custodian?: string;
    purchase_date?: Dayjs;
    available_for_use_date?: Dayjs;
    gross_purchase_amount: number;
    is_existing_asset: boolean;
    purchase_receipt?: string;
    purchase_invoice?: string;
}

type AssetCreateFormFinishFailed = NonNullable<FormProps<AssetCreateFormValues>['onFinishFailed']>;

interface ConfirmationDialogState {
    title: string;
    content: string;
    okText?: string;
    cancelText?: string;
    okDanger?: boolean;
    resolve: (confirmed: boolean) => void;
}

const parseCurrencyInput = (value: string | undefined) => {
    const normalized = (value || '').replace(/,/g, '').trim();
    if (!normalized) {
        return undefined;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const CreateItemModal: React.FC<CreateItemModalProps> = ({ open, onClose, onCreated, categories, initialSearch }) => {
    const { isMobile } = useResponsive();
    const { token } = theme.useToken();
    const [form] = Form.useForm<CreateItemFormValues>();
    const [submitting, setSubmitting] = useState(false);
    const [itemGroups, setItemGroups] = useState<ItemGroupOption[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [error, setError] = useState('');
    const [usesNamingSeries, setUsesNamingSeries] = useState<boolean | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        setError('');
        setGroupsLoading(true);
        Promise.all([
            erpnextAssetsApi.getItemGroups(),
            erpnextAssetsApi.getItemNamingConfig(),
        ]).then(([groupsRes, namingRes]) => {
            if (groupsRes.success) {
                setItemGroups(groupsRes.data?.items || []);
            } else {
                setError(groupsRes.error || 'Failed to load item groups.');
            }

            if (namingRes.success) {
                setUsesNamingSeries(namingRes.data?.item_naming_by === 'Naming Series');
            } else {
                setUsesNamingSeries(false);
            }
        }).catch(() => {
            setError('Network error loading form data.');
            setUsesNamingSeries(false);
        }).finally(() => setGroupsLoading(false));

        form.resetFields();
        if (initialSearch) {
            form.setFieldValue('item_name', initialSearch);
        }
    }, [form, initialSearch, open]);

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            setError('');

            const payload: Record<string, unknown> = {
                item_name: values.item_name,
                item_group: values.item_group,
                asset_category: values.asset_category,
                stock_uom: values.stock_uom || 'Nos',
                description: values.description || '',
            };

            if (!usesNamingSeries && values.item_code) {
                payload.item_code = values.item_code;
            }

            const response = await erpnextAssetsApi.createFixedAssetItem(payload);
            if (response.success) {
                message.success(`Item "${response.data?.item_name}" created successfully`);
                onCreated({
                    item_code: response.data?.item_code,
                    item_name: response.data?.item_name,
                    asset_category: response.data?.asset_category,
                    item_group: values.item_group,
                });
                onClose();
            } else {
                setError(response.message || response.error || 'Failed to create item. Please check the details and try again.');
            }
        } catch {
            // antd validation handles field feedback
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Create New Fixed Asset Item"
            open={open}
            onCancel={onClose}
            width={isMobile ? '100%' : 640}
            style={{ top: isMobile ? 0 : 24 }}
            styles={{
                body: {
                    padding: isMobile ? 12 : 20,
                    maxHeight: isMobile ? 'calc(100vh - 150px)' : undefined,
                    overflowY: isMobile ? 'auto' : undefined,
                },
            }}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="create" type="primary" loading={submitting} onClick={handleCreate} icon={<CheckCircleOutlined />}>
                    Create Item
                </Button>,
            ]}
        >
            <Card
                size="small"
                style={{ marginBottom: 16, borderRadius: 8, background: token.colorInfoBg, border: `1px solid ${token.colorInfoBorder}` }}
                bodyStyle={{ padding: 12 }}
            >
                <Space>
                    <InfoCircleOutlined style={{ color: token.colorInfo }} />
                    <div>
                        <Text strong style={{ display: 'block' }}>What is an Item?</Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            An item is the asset model or type. You create one asset record per physical unit after this step.
                        </Text>
                    </div>
                </Space>
            </Card>

            {error && (
                <Alert
                    type="error"
                    message={error}
                    showIcon
                    closable
                    onClose={() => setError('')}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form form={form} layout="vertical" validateTrigger="onBlur">
                {usesNamingSeries === false && (
                    <Form.Item
                        label="Item Code"
                        name="item_code"
                        rules={[{ required: true, message: 'A unique code is required' }]}
                        tooltip="Unique identifier used in purchases and reports."
                    >
                        <Input placeholder="e.g. LENOVO-X1-GEN11" />
                    </Form.Item>
                )}

                <Form.Item
                    label="Item Name"
                    name="item_name"
                    rules={[{ required: true, message: 'A descriptive name is required' }]}
                >
                    <Input placeholder="e.g. Lenovo ThinkPad X1 Carbon Gen 11" />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Item Group"
                            name="item_group"
                            rules={[{ required: true, message: 'Select a classification group' }]}
                        >
                            <Select
                                placeholder={groupsLoading ? 'Loading...' : 'Select group'}
                                loading={groupsLoading}
                                showSearch
                                optionFilterProp="children"
                                notFoundContent={groupsLoading
                                    ? <Spin size="small" />
                                    : <Empty description="No groups found" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                            >
                                {itemGroups.map((group) => (
                                    <Select.Option key={group.name} value={group.name}>{group.item_group_name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Asset Category"
                            name="asset_category"
                            rules={[{ required: true, message: 'Select an asset category' }]}
                            tooltip="This drives ERPNext accounting and depreciation defaults."
                        >
                            <Select
                                placeholder="Select category"
                                showSearch
                                optionFilterProp="children"
                                notFoundContent={categories.length === 0
                                    ? <Empty description="No categories found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    : undefined}
                            >
                                {categories.map((category) => (
                                    <Select.Option key={category.name} value={category.name}>
                                        {category.asset_category_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Unit of Measure" name="stock_uom" initialValue="Nos">
                    <Select style={{ width: 200 }}>
                        <Select.Option value="Nos">Nos (Number)</Select.Option>
                        <Select.Option value="Unit">Unit</Select.Option>
                        <Select.Option value="Set">Set</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Description" name="description">
                    <Input.TextArea rows={2} placeholder="Optional notes about this item type" maxLength={500} showCount />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const AssetCreateForm: React.FC<Props> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const [form] = Form.useForm<AssetCreateFormValues>();
    const { createAsset } = useERPNextAssetStore();
    const { availableFacilities } = useFacilityStore();

    const [submitting, setSubmitting] = useState(false);
    const [createdAssetName, setCreatedAssetName] = useState<string | null>(null);

    const [itemSearchResults, setItemSearchResults] = useState<AssetItemSearchOption[]>([]);
    const [itemSearching, setItemSearching] = useState(false);
    const [itemSearchError, setItemSearchError] = useState(false);
    const [selectedItem, setSelectedItem] = useState<AssetItemSearchOption | null>(null);
    const [createItemModalOpen, setCreateItemModalOpen] = useState(false);
    const [lastSearchTerm, setLastSearchTerm] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const purchaseReceiptSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const purchaseInvoiceSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [categories, setCategories] = useState<AssetCategoryOption[]>([]);
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [refDataLoading, setRefDataLoading] = useState(true);
    const [purchaseReceiptOptions, setPurchaseReceiptOptions] = useState<PurchaseDocumentOption[]>([]);
    const [purchaseInvoiceOptions, setPurchaseInvoiceOptions] = useState<PurchaseDocumentOption[]>([]);
    const [purchaseReceiptSearching, setPurchaseReceiptSearching] = useState(false);
    const [purchaseInvoiceSearching, setPurchaseInvoiceSearching] = useState(false);
    const [selectedPurchaseReceipt, setSelectedPurchaseReceipt] = useState<PurchaseDocumentOption | null>(null);
    const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<PurchaseDocumentOption | null>(null);
    const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState | null>(null);

    const selectedCompany = Form.useWatch('company', form);
    const isExistingAsset = Form.useWatch('is_existing_asset', form);
    const selectedItemCode = Form.useWatch('item_code', form);

    useEffect(() => {
        Promise.all([
            erpnextAssetsApi.getCategories(),
            erpnextAssetsApi.getUserCompanies(),
        ]).then(([catRes, compRes]) => {
            if (catRes.success) {
                setCategories(catRes.data?.items || []);
            }
            if (compRes.success) {
                setCompanies(compRes.data?.items || []);
            }
        }).finally(() => setRefDataLoading(false));
    }, []);

    useEffect(() => {
        setEmployees([]);
        form.setFieldsValue({
            department: undefined,
            custodian: undefined,
        });

        if (!selectedCompany) {
            setDepartments([]);
            return;
        }

        erpnextAssetsApi.getDepartments(selectedCompany).then((response) => {
            if (response.success) {
                setDepartments(response.data?.items || []);
            }
        });
    }, [form, selectedCompany]);

    useEffect(() => {
        setPurchaseReceiptOptions([]);
        setPurchaseInvoiceOptions([]);
        setSelectedPurchaseReceipt(null);
        setSelectedPurchaseInvoice(null);
        form.setFieldsValue({
            purchase_receipt: undefined,
            purchase_invoice: undefined,
        });
    }, [form, selectedCompany, selectedItemCode]);

    const handleItemSearch = useCallback((value: string) => {
        setLastSearchTerm(value);
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        if (!value || value.length < 2) {
            setItemSearchResults([]);
            setItemSearchError(false);
            return;
        }

        setItemSearching(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const response = await erpnextAssetsApi.searchFixedAssetItems(value);
                if (response.success) {
                    setItemSearchResults(response.data?.items || []);
                    setItemSearchError(false);
                } else {
                    setItemSearchResults([]);
                    setItemSearchError(true);
                }
            } catch {
                setItemSearchResults([]);
                setItemSearchError(true);
            } finally {
                setItemSearching(false);
            }
        }, 300);
    }, []);

    const employeeSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleEmployeeSearch = useCallback((value: string) => {
        if (employeeSearchRef.current) {
            clearTimeout(employeeSearchRef.current);
        }
        if (!value || value.length < 2) {
            return;
        }

        employeeSearchRef.current = setTimeout(async () => {
            const response = await erpnextAssetsApi.searchEmployees(value, selectedCompany);
            if (response.success) {
                setEmployees(response.data?.items || []);
            }
        }, 300);
    }, [selectedCompany]);

    const handlePurchaseReceiptSearch = useCallback((value: string) => {
        if (purchaseReceiptSearchRef.current) {
            clearTimeout(purchaseReceiptSearchRef.current);
        }

        if (!selectedItemCode || !selectedCompany) {
            setPurchaseReceiptOptions([]);
            return;
        }

        setPurchaseReceiptSearching(true);
        purchaseReceiptSearchRef.current = setTimeout(async () => {
            try {
                const response = await erpnextAssetsApi.searchPurchaseReceiptsForAsset(selectedItemCode, selectedCompany, value);
                setPurchaseReceiptOptions(response.success ? (response.data?.items || []) : []);
            } finally {
                setPurchaseReceiptSearching(false);
            }
        }, 300);
    }, [selectedCompany, selectedItemCode]);

    const handlePurchaseInvoiceSearch = useCallback((value: string) => {
        if (purchaseInvoiceSearchRef.current) {
            clearTimeout(purchaseInvoiceSearchRef.current);
        }

        if (!selectedItemCode || !selectedCompany) {
            setPurchaseInvoiceOptions([]);
            return;
        }

        setPurchaseInvoiceSearching(true);
        purchaseInvoiceSearchRef.current = setTimeout(async () => {
            try {
                const response = await erpnextAssetsApi.searchPurchaseInvoicesForAsset(selectedItemCode, selectedCompany, value);
                setPurchaseInvoiceOptions(response.success ? (response.data?.items || []) : []);
            } finally {
                setPurchaseInvoiceSearching(false);
            }
        }, 300);
    }, [selectedCompany, selectedItemCode]);

    const applySelectedPurchaseDocument = useCallback((document: PurchaseDocumentOption, fieldName: 'purchase_receipt' | 'purchase_invoice') => {
        const otherField = fieldName === 'purchase_receipt' ? 'purchase_invoice' : 'purchase_receipt';
        form.setFieldsValue({
            [fieldName]: document.name,
            [otherField]: undefined,
            purchase_date: document.posting_date ? dayjs(document.posting_date) : undefined,
            gross_purchase_amount: document.item_rate || undefined,
        });
    }, [form]);

    const requestConfirmation = useCallback((options: Omit<ConfirmationDialogState, 'resolve'>) => (
        new Promise<boolean>((resolve) => {
            setConfirmationDialog({ ...options, resolve });
        })
    ), []);

    const resolveConfirmation = useCallback((confirmed: boolean) => {
        setConfirmationDialog((current) => {
            if (current) {
                current.resolve(confirmed);
            }
            return null;
        });
    }, []);

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

    const handleItemSelect = (itemCode: string) => {
        const item = itemSearchResults.find((entry) => entry.item_code === itemCode);
        if (!item) {
            return;
        }

        setSelectedItem(item);
        form.setFieldsValue({
            item_code: item.item_code,
            asset_category: item.asset_category,
        });
    };

    const handleItemCreated = (item: { item_code: string; item_name: string; asset_category: string; item_group: string }) => {
        setSelectedItem(item);
        form.setFieldsValue({
            item_code: item.item_code,
            asset_category: item.asset_category,
        });
    };

    const clearSelectedItem = () => {
        requestConfirmation({
            title: 'Change item type?',
            content: 'The selected item will be cleared. Asset details you already entered will stay.',
            okText: 'Change Item',
            cancelText: 'Keep Item',
        }).then((confirmed) => {
            if (!confirmed) {
                return;
            }

            setSelectedItem(null);
            setItemSearchResults([]);
            setPurchaseReceiptOptions([]);
            setPurchaseInvoiceOptions([]);
            setSelectedPurchaseReceipt(null);
            setSelectedPurchaseInvoice(null);
            form.setFieldsValue({
                item_code: '',
                asset_category: '',
                purchase_receipt: undefined,
                purchase_invoice: undefined,
            });
        });
    };

    const handleBackToAssets = async () => {
        const values = form.getFieldsValue(true);
        const hasData = values.asset_name || values.item_code || values.company || values.facility_id;

        if (!hasData) {
            navigateToRoute('assets');
            return;
        }

        const leave = await requestConfirmation({
            title: 'Discard draft details?',
            content: 'You have unsaved asset details. Leave without saving?',
            okText: 'Leave',
            cancelText: 'Stay',
            okDanger: true,
        });
        if (leave) {
            navigateToRoute('assets');
        }
    };

    const handleSubmit = async (values: AssetCreateFormValues) => {
        if (!values.is_existing_asset && !values.purchase_receipt && !values.purchase_invoice) {
            message.error('Link a Purchase Receipt or Purchase Invoice when the asset is not existing.');
            return;
        }

        if (values.purchase_receipt && values.purchase_invoice) {
            message.error('Link either a Purchase Receipt or a Purchase Invoice, not both.');
            return;
        }

        if (values.is_existing_asset) {
            const confirmed = await requestConfirmation({
                title: 'Confirm asset source',
                content: 'Use Existing Asset only when this unit was already owned or already in service before this record. Use New Purchase when it must remain linked to a Purchase Receipt or Purchase Invoice.',
                okText: 'Use Existing Asset',
                cancelText: 'Review',
            });
            if (!confirmed) {
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                asset_name: values.asset_name,
                item_code: values.item_code,
                company: values.company,
                facility_id: values.facility_id,
                asset_category: values.asset_category,
                purchase_date: values.purchase_date?.format('YYYY-MM-DD'),
                gross_purchase_amount: values.gross_purchase_amount,
                available_for_use_date: values.available_for_use_date?.format('YYYY-MM-DD'),
                is_existing_asset: values.is_existing_asset ? 1 : 0,
                custodian: values.custodian,
                department: values.department,
                purchase_receipt: values.is_existing_asset ? '' : values.purchase_receipt,
                purchase_invoice: values.is_existing_asset ? '' : values.purchase_invoice,
                calculate_depreciation: 0,
            };

            const result = await createAsset(payload);
            if (result.success && result.name) {
                setCreatedAssetName(result.name);
            } else {
                message.error(result.error || 'Failed to create asset. Please review the fields and try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitFailed: AssetCreateFormFinishFailed = ({ errorFields }) => {
        const hasItemError = errorFields.some((field) => field.name.includes('item_code'));
        if (hasItemError) {
            message.error('Select or create an item before saving the asset draft.');
            return;
        }

        if (errorFields.length > 0) {
            form.scrollToField(errorFields[0].name);
            message.error('Complete the required asset details and try again.');
        }
    };

    const handleSaveAssetDraftClick = () => {
        form.submit();
    };

    if (createdAssetName) {
        return (
            <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: 680, margin: '0 auto' }}>
                <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <Result
                        status="success"
                        title="Asset Draft Saved"
                        subTitle={
                            <Space direction="vertical" size={4} style={{ textAlign: 'center' }}>
                                <Text>Asset <Tag color="blue">{createdAssetName}</Tag> has been created as a draft.</Text>
                                <Text type="secondary">
                                    Open it to add depreciation, finance-book setup, purchase traceability, maintenance team, and then submit when ready.
                                </Text>
                            </Space>
                        }
                        extra={[
                            <Button type="primary" key="view" onClick={() => navigateToRoute('assets', createdAssetName)}>
                                Open Asset
                            </Button>,
                            <Button key="another" onClick={() => {
                                setCreatedAssetName(null);
                                setSelectedItem(null);
                                setItemSearchResults([]);
                                setPurchaseReceiptOptions([]);
                                setPurchaseInvoiceOptions([]);
                                setSelectedPurchaseReceipt(null);
                                setSelectedPurchaseInvoice(null);
                                form.resetFields();
                                form.setFieldValue('is_existing_asset', true);
                            }}>
                                Add Another Asset
                            </Button>,
                            <Button key="list" onClick={() => navigateToRoute('assets')}>
                                Back to Assets
                            </Button>,
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: 920, margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToAssets} style={{ marginBottom: 16 }}>
                Back to Assets
            </Button>

            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Space direction="vertical" size={20} style={{ width: '100%' }}>
                    <div>
                        <Title level={4} style={{ marginBottom: 8 }}>Add Asset</Title>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            Select the item, record the basic asset details, and save the draft. Existing asset is on by default so purchase receipt and purchase invoice stay out of the way unless you explicitly switch to a new purchase flow.
                        </Paragraph>
                    </div>

                    <Alert
                        type="info"
                        showIcon
                        message="Fast path"
                        description="1. Select item. 2. Confirm the basic asset details. 3. Save the draft. Depreciation, finance book setup, and other technical details can be completed later from the asset page."
                    />

                    <Form
                        form={form}
                        layout="vertical"
                        validateTrigger="onBlur"
                        initialValues={{ is_existing_asset: true }}
                        onFinish={handleSubmit}
                        onFinishFailed={handleSubmitFailed}
                    >
                        <Space direction="vertical" size={20} style={{ width: '100%' }}>
                            <Card
                                size="small"
                                style={{ borderRadius: 10, background: token.colorFillQuaternary }}
                                bodyStyle={{ padding: isMobile ? 12 : 16 }}
                            >
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space>
                                            <AppstoreOutlined style={{ color: token.colorPrimary }} />
                                            <Text strong>Item Type</Text>
                                            <Tooltip title="The item is the asset model or product type. One asset record represents one physical unit.">
                                                <InfoCircleOutlined style={{ color: token.colorTextDescription, cursor: 'help' }} />
                                            </Tooltip>
                                        </Space>
                                        {selectedItem && (
                                            <Button type="link" size="small" onClick={clearSelectedItem}>Change</Button>
                                        )}
                                    </div>

                                    {!selectedItem ? (
                                        <>
                                            <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                                                Search for the fixed asset item you want. If it does not exist yet, create it here first.
                                            </Paragraph>

                                            <Select
                                                showSearch
                                                placeholder="Search fixed asset items... (minimum 2 characters)"
                                                filterOption={false}
                                                onSearch={handleItemSearch}
                                                onSelect={handleItemSelect}
                                                loading={itemSearching}
                                                suffixIcon={<SearchOutlined />}
                                                notFoundContent={
                                                    itemSearching ? (
                                                        <div style={{ textAlign: 'center', padding: 16 }}>
                                                            <Spin size="small" />
                                                            <br />
                                                            <Text type="secondary">Searching items...</Text>
                                                        </div>
                                                    ) : itemSearchError ? (
                                                        <Alert type="error" message="Item search failed. Try again." showIcon />
                                                    ) : lastSearchTerm.length < 2 ? (
                                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Type at least 2 characters to search" />
                                                    ) : (
                                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No item matches "${lastSearchTerm}"`}>
                                                            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setCreateItemModalOpen(true)}>
                                                                Create "{lastSearchTerm}" as a new item
                                                            </Button>
                                                        </Empty>
                                                    )
                                                }
                                                dropdownRender={(menu) => (
                                                    <>
                                                        {menu}
                                                        <div style={{ padding: '8px 8px 4px' }}>
                                                            <Button type="text" icon={<PlusOutlined />} block onClick={() => setCreateItemModalOpen(true)}>
                                                                Create new fixed asset item
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                                style={{ width: '100%' }}
                                            >
                                                {itemSearchResults.map((item) => (
                                                    <Select.Option key={item.item_code} value={item.item_code}>
                                                        <div style={{ padding: '4px 0' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Text strong>{item.item_name || item.item_code}</Text>
                                                                {item.asset_category && <Tag style={{ marginLeft: 8 }}>{item.asset_category}</Tag>}
                                                            </div>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {item.item_code} • {item.item_group}
                                                            </Text>
                                                        </div>
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </>
                                    ) : (
                                        <Card size="small" style={{ borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Space direction="vertical" size={4}>
                                                    <Text strong style={{ fontSize: 15 }}>{selectedItem.item_name || selectedItem.item_code}</Text>
                                                    <Space wrap size={4}>
                                                        <Tag color="blue">{selectedItem.item_code}</Tag>
                                                        {selectedItem.asset_category && <Tag color="purple">{selectedItem.asset_category}</Tag>}
                                                        {selectedItem.item_group && <Tag>{selectedItem.item_group}</Tag>}
                                                    </Space>
                                                </Space>
                                                <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
                                            </div>
                                        </Card>
                                    )}
                                </Space>
                            </Card>

                            <Form.Item
                                name="item_code"
                                hidden
                                rules={[{ required: true, message: 'Select or create an item first' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item name="asset_category" hidden>
                                <Input />
                            </Form.Item>

                            <Card size="small" title="Basic Asset Details" style={{ borderRadius: 10 }}>
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            label="Asset Name"
                                            name="asset_name"
                                            rules={[{ required: true, message: 'Name this asset unit' }]}
                                            tooltip="This is the unique name for the physical unit you are adding."
                                        >
                                            <Input placeholder="e.g. CT Scanner #3 - Radiology Wing" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            label="Company"
                                            name="company"
                                            rules={[{ required: true, message: 'Select the owning company' }]}
                                        >
                                            <Select
                                                placeholder={refDataLoading ? 'Loading companies...' : 'Select company'}
                                                loading={refDataLoading}
                                                showSearch
                                                optionFilterProp="children"
                                                notFoundContent={companies.length === 0 && !refDataLoading
                                                    ? <Empty description="No companies accessible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                                    : undefined}
                                            >
                                                {companies.map((company) => (
                                                    <Select.Option key={company.name} value={company.name}>
                                                        {company.company_name} ({company.abbr})
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            label="Facility"
                                            name="facility_id"
                                            rules={[{ required: true, message: 'Select the facility where this asset sits' }]}
                                        >
                                            <Select
                                                placeholder="Select facility"
                                                showSearch
                                                optionFilterProp="children"
                                                notFoundContent={availableFacilities.length === 0
                                                    ? <Empty description="No facilities accessible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                                    : undefined}
                                            >
                                                {availableFacilities.map((facility) => (
                                                    <Select.Option key={facility.hie_id} value={facility.hie_id}>
                                                        {facility.facility_name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Department" name="department">
                                            <Select
                                                placeholder={departments.length === 0 ? 'Select company first' : 'Select department (optional)'}
                                                allowClear
                                                showSearch
                                                optionFilterProp="children"
                                                disabled={departments.length === 0}
                                            >
                                                {departments.map((department) => (
                                                    <Select.Option key={department.name} value={department.name}>
                                                        {department.department_name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="Custodian" name="custodian" tooltip="The employee currently responsible for the asset.">
                                    <Select
                                        placeholder="Search employee name..."
                                        showSearch
                                        filterOption={false}
                                        onSearch={handleEmployeeSearch}
                                        allowClear
                                        notFoundContent={<Empty description="Type 2+ characters to search employees" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                                    >
                                        {employees.map((employee) => (
                                            <Select.Option key={employee.name} value={employee.name}>
                                                <div>
                                                    <Text strong>{employee.employee_name}</Text>
                                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                                        {employee.name} • {employee.designation || employee.department || ''}
                                                    </Text>
                                                </div>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Card>

                            <Card size="small" title="Source and Value" style={{ borderRadius: 10 }}>
                                <Form.Item
                                    label="Existing Asset"
                                    name="is_existing_asset"
                                    valuePropName="checked"
                                    tooltip="Use for assets already owned or already in service."
                                >
                                    <Switch checkedChildren="Existing" unCheckedChildren="New Purchase" />
                                </Form.Item>
                                <Paragraph type="secondary" style={{ marginTop: -8 }}>
                                    Use Existing Asset for assets already owned or already in service. Use New Purchase to link a submitted Purchase Receipt or Purchase Invoice.
                                </Paragraph>

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
                                            tooltip="You can leave this empty now and fill it in later before submitting the asset."
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
                                    <>
                                        <Alert
                                            type="warning"
                                            showIcon
                                            style={{ marginBottom: 16 }}
                                            message="New purchase flow"
                                            description="Select one submitted purchase document for this item. The asset value and purchase date will be pulled from that document so the draft matches ERPNext asset rules."
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
                                                        disabled={!selectedItemCode || !selectedCompany}
                                                        placeholder={!selectedItemCode || !selectedCompany
                                                            ? 'Select item and company first'
                                                            : 'Search submitted Purchase Receipts'}
                                                        filterOption={false}
                                                        onSearch={handlePurchaseReceiptSearch}
                                                        onSelect={handlePurchaseReceiptSelect}
                                                        onClear={() => setSelectedPurchaseReceipt(null)}
                                                        loading={purchaseReceiptSearching}
                                                        notFoundContent={purchaseReceiptSearching
                                                            ? <Spin size="small" />
                                                            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching Purchase Receipts" />}
                                                        options={purchaseReceiptOptions.map((document) => ({
                                                            value: document.name,
                                                            label: `${document.name} • ${document.supplier || 'No supplier'} • ${dayjs(document.posting_date).format('DD MMM YYYY')} • ${document.available_asset_qty ?? document.item_qty} available`,
                                                        }))}
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
                                                                    Qty {selectedPurchaseReceipt.item_qty} • Available for asset creation {selectedPurchaseReceipt.available_asset_qty ?? selectedPurchaseReceipt.item_qty} • Unit value {selectedPurchaseReceipt.item_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                                    extra="Use this instead when the invoice is the source document."
                                                >
                                                    <Select
                                                        showSearch
                                                        allowClear
                                                        disabled={!selectedItemCode || !selectedCompany}
                                                        placeholder={!selectedItemCode || !selectedCompany
                                                            ? 'Select item and company first'
                                                            : 'Search submitted stock Purchase Invoices'}
                                                        filterOption={false}
                                                        onSearch={handlePurchaseInvoiceSearch}
                                                        onSelect={handlePurchaseInvoiceSelect}
                                                        onClear={() => setSelectedPurchaseInvoice(null)}
                                                        loading={purchaseInvoiceSearching}
                                                        notFoundContent={purchaseInvoiceSearching
                                                            ? <Spin size="small" />
                                                            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching Purchase Invoices" />}
                                                        options={purchaseInvoiceOptions.map((document) => ({
                                                            value: document.name,
                                                            label: `${document.name} • ${document.supplier || 'No supplier'} • ${dayjs(document.posting_date).format('DD MMM YYYY')} • ${document.available_asset_qty ?? document.item_qty} available`,
                                                        }))}
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
                                                                    Qty {selectedPurchaseInvoice.item_qty} • Available for asset creation {selectedPurchaseInvoice.available_asset_qty ?? selectedPurchaseInvoice.item_qty} • Unit value {selectedPurchaseInvoice.item_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </Text>
                                                                <a href={selectedPurchaseInvoice.desk_url} target="_blank" rel="noreferrer">Open Purchase Invoice</a>
                                                            </Space>
                                                        }
                                                    />
                                                )}
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </Card>

                            <Alert
                                type="success"
                                showIcon
                                message="Asset draft ready"
                                description="Core asset details will be saved now. Purchase traceability, depreciation, finance books, and maintenance setup can be completed later from the asset record."
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="primary"
                                    htmlType="button"
                                    onClick={handleSaveAssetDraftClick}
                                    icon={<CheckCircleOutlined />}
                                    loading={submitting}
                                >
                                    Save Asset Draft
                                </Button>
                            </div>
                        </Space>
                    </Form>
                </Space>
            </Card>

            <CreateItemModal
                open={createItemModalOpen}
                onClose={() => setCreateItemModalOpen(false)}
                onCreated={handleItemCreated}
                categories={categories}
                initialSearch={lastSearchTerm}
            />

            <Modal
                open={Boolean(confirmationDialog)}
                title={confirmationDialog?.title}
                onOk={() => resolveConfirmation(true)}
                onCancel={() => resolveConfirmation(false)}
                okText={confirmationDialog?.okText || 'Confirm'}
                cancelText={confirmationDialog?.cancelText || 'Cancel'}
                okButtonProps={confirmationDialog?.okDanger ? { danger: true } : undefined}
                destroyOnClose
            >
                <Paragraph style={{ marginBottom: 0 }}>{confirmationDialog?.content}</Paragraph>
            </Modal>
        </div>
    );
};

export default AssetCreateForm;
