import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Card, Steps, Form, Input, Select, DatePicker, InputNumber, Switch,
    Button, Space, Typography, Descriptions, Alert, message, theme,
    Divider, Modal, Tag, Empty, Spin, Row, Col, Result, Tooltip,
} from 'antd';
import {
    ArrowLeftOutlined, CheckCircleOutlined, PlusOutlined,
    SearchOutlined, AppstoreOutlined, InfoCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import useFacilityStore from '../../../stores/facilityStore';
import { erpnextAssetsApi } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

interface Props {
    navigateToRoute?: (route: string, id?: string) => void;
}

const DEPRECIATION_METHODS = [
    { value: 'Straight Line', label: 'Straight Line — equal amount each period' },
    { value: 'Double Declining Balance', label: 'Double Declining — higher early, lower later' },
    { value: 'Written Down Value', label: 'Written Down Value — fixed % of remaining value' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Create Item Modal — for when the item doesn't exist yet
// ═══════════════════════════════════════════════════════════════════════════

interface CreateItemModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (item: { item_code: string; item_name: string; asset_category: string; item_group: string }) => void;
    categories: any[];
    initialSearch?: string;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({ open, onClose, onCreated, categories, initialSearch }) => {
    const { isMobile } = useResponsive();
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [itemGroups, setItemGroups] = useState<any[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [error, setError] = useState('');
    const [usesNamingSeries, setUsesNamingSeries] = useState<boolean | null>(null);

    useEffect(() => {
        if (open) {
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
                    // Default to naming series = false so item_code field shows
                    setUsesNamingSeries(false);
                }
                setGroupsLoading(false);
            }).catch(() => {
                setError('Network error loading form data.');
                setGroupsLoading(false);
            });
            if (initialSearch) {
                form.setFieldsValue({ item_name: initialSearch });
            }
        }
    }, [open, initialSearch]);

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            setError('');

            const payload: Record<string, any> = {
                item_name: values.item_name,
                item_group: values.item_group,
                asset_category: values.asset_category,
                stock_uom: values.stock_uom || 'Nos',
                description: values.description || '',
            };
            // Only send item_code when naming is manual
            if (!usesNamingSeries && values.item_code) {
                payload.item_code = values.item_code;
            }

            const res = await erpnextAssetsApi.createFixedAssetItem(payload);

            if (res.success) {
                message.success(`Item "${res.data?.item_name}" created successfully`);
                onCreated({
                    item_code: res.data?.item_code,
                    item_name: res.data?.item_name,
                    asset_category: res.data?.asset_category,
                    item_group: values.item_group,
                });
                form.resetFields();
                onClose();
            } else {
                setError(res.message || res.error || 'Failed to create item. Please check the details and try again.');
            }
        } catch {
            // form validation — handled by antd
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
            styles={{ body: { padding: isMobile ? 12 : 20, maxHeight: isMobile ? 'calc(100vh - 150px)' : undefined, overflowY: isMobile ? 'auto' : undefined } }}
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
                            An Item represents a <strong>type</strong> of asset — like "Lenovo ThinkPad X1 Carbon 32GB".
                            You can create many individual asset records from one item (one per physical unit you own).
                        </Text>
                    </div>
                </Space>
            </Card>

            {error && (
                <Alert type="error" message={error} showIcon closable onClose={() => setError('')}
                    style={{ marginBottom: 16 }} />
            )}

            <Form form={form} layout="vertical" validateTrigger="onBlur">
                {usesNamingSeries === false && (
                    <Form.Item
                        label="Item Code"
                        name="item_code"
                        rules={[{ required: true, message: 'A unique code is required' }]}
                        tooltip="Unique identifier used in purchase orders and reports (e.g. LENOVO-X1-GEN11)"
                    >
                        <Input placeholder="e.g. LENOVO-X1-GEN11" />
                    </Form.Item>
                )}

                <Form.Item
                    label="Item Name"
                    name="item_name"
                    rules={[{ required: true, message: 'A descriptive name is required' }]}
                    tooltip="Human-readable name shown everywhere"
                >
                    <Input placeholder="e.g. Lenovo ThinkPad X1 Carbon Gen 11" />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Item Group"
                            name="item_group"
                            rules={[{ required: true, message: 'Select a classification group' }]}
                            tooltip="How this item is classified (e.g. IT Equipment, Medical Devices, Furniture)"
                        >
                            <Select
                                placeholder={groupsLoading ? 'Loading...' : 'Select group'}
                                loading={groupsLoading}
                                showSearch
                                optionFilterProp="children"
                                notFoundContent={groupsLoading ? <Spin size="small" /> : <Empty description="No groups found" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                            >
                                {itemGroups.map((g) => (
                                    <Select.Option key={g.name} value={g.name}>{g.item_group_name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Asset Category"
                            name="asset_category"
                            rules={[{ required: true, message: 'Determines depreciation and accounting rules' }]}
                            tooltip="Controls how depreciation is calculated and which GL accounts are used"
                        >
                            <Select
                                placeholder="Select category"
                                showSearch
                                optionFilterProp="children"
                                notFoundContent={categories.length === 0 ? <Empty description="No categories. Create one in ERPNext first." image={Empty.PRESENTED_IMAGE_SIMPLE} /> : undefined}
                            >
                                {categories.map((c) => (
                                    <Select.Option key={c.name} value={c.name}>{c.asset_category_name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Unit of Measure" name="stock_uom" initialValue="Nos"
                    tooltip="How individual units are counted. Almost always 'Nos' for fixed assets.">
                    <Select style={{ width: 200 }}>
                        <Select.Option value="Nos">Nos (Number)</Select.Option>
                        <Select.Option value="Unit">Unit</Select.Option>
                        <Select.Option value="Set">Set</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Description" name="description">
                    <Input.TextArea rows={2} placeholder="Optional specs or notes about this item type" maxLength={500} showCount />
                </Form.Item>
            </Form>
        </Modal>
    );
};


// ═══════════════════════════════════════════════════════════════════════════
// Main Asset Create Form
// ═══════════════════════════════════════════════════════════════════════════

const AssetCreateForm: React.FC<Props> = ({ navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [calcDepreciation, setCalcDepreciation] = useState(false);
    const [createdAssetName, setCreatedAssetName] = useState<string | null>(null);
    const { createAsset } = useERPNextAssetStore();
    const { availableFacilities } = useFacilityStore();

    // Item search
    const [itemSearchResults, setItemSearchResults] = useState<any[]>([]);
    const [itemSearching, setItemSearching] = useState(false);
    const [itemSearchError, setItemSearchError] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [createItemModalOpen, setCreateItemModalOpen] = useState(false);
    const [lastSearchTerm, setLastSearchTerm] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reference data
    const [categories, setCategories] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [refDataLoading, setRefDataLoading] = useState(true);

    // Load reference data
    useEffect(() => {
        Promise.all([
            erpnextAssetsApi.getCategories(),
            erpnextAssetsApi.getUserCompanies(),
        ]).then(([catRes, compRes]) => {
            if (catRes.success) setCategories(catRes.data?.items || []);
            if (compRes.success) setCompanies(compRes.data?.items || []);
            setRefDataLoading(false);
        }).catch(() => setRefDataLoading(false));
    }, []);

    // Load departments when company changes
    const selectedCompany = Form.useWatch('company', form);
    useEffect(() => {
        if (selectedCompany) {
            erpnextAssetsApi.getDepartments(selectedCompany).then((res) => {
                if (res.success) setDepartments(res.data?.items || []);
            });
        } else {
            setDepartments([]);
        }
    }, [selectedCompany]);

    // Item search with debounce
    const handleItemSearch = useCallback((value: string) => {
        setLastSearchTerm(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!value || value.length < 2) {
            setItemSearchResults([]);
            setItemSearchError(false);
            return;
        }
        setItemSearching(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const res = await erpnextAssetsApi.searchFixedAssetItems(value);
                if (res.success) {
                    setItemSearchResults(res.data?.items || []);
                    setItemSearchError(false);
                } else {
                    setItemSearchResults([]);
                    setItemSearchError(true);
                }
            } catch {
                setItemSearchResults([]);
                setItemSearchError(true);
            }
            setItemSearching(false);
        }, 350);
    }, []);

    // Employee search with debounce
    const employeeSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleEmployeeSearch = useCallback((value: string) => {
        if (employeeSearchRef.current) clearTimeout(employeeSearchRef.current);
        if (!value || value.length < 2) return;
        employeeSearchRef.current = setTimeout(async () => {
            const res = await erpnextAssetsApi.searchEmployees(value, selectedCompany);
            if (res.success) setEmployees(res.data?.items || []);
        }, 350);
    }, [selectedCompany]);

    const handleItemSelect = (itemCode: string) => {
        const item = itemSearchResults.find((i) => i.item_code === itemCode);
        if (item) {
            setSelectedItem(item);
            form.setFieldsValue({ item_code: item.item_code, asset_category: item.asset_category });
        }
    };

    const handleItemCreated = (item: { item_code: string; item_name: string; asset_category: string; item_group: string }) => {
        setSelectedItem(item);
        form.setFieldsValue({ item_code: item.item_code, asset_category: item.asset_category });
    };

    const clearSelectedItem = () => {
        Modal.confirm({
            title: 'Change item type?',
            content: 'The asset category will be reset. Other fields you entered will be kept.',
            onOk: () => {
                setSelectedItem(null);
                form.setFieldsValue({ item_code: '', asset_category: '' });
                setItemSearchResults([]);
            },
        });
    };

    // Wizard navigation
    const steps = [
        { title: 'Item & Asset' },
        { title: 'Location' },
        { title: 'Purchase' },
        { title: 'Depreciation' },
        { title: 'Review' },
    ];

    const next = async () => {
        try {
            const stepFields: Record<number, string[]> = {
                0: ['asset_name', 'item_code', 'company'],
                1: ['facility_id'],
                2: ['purchase_date', 'gross_purchase_amount'],
                3: calcDepreciation ? ['depreciation_method', 'total_number_of_depreciations', 'frequency_of_depreciation'] : [],
            };
            const fields = stepFields[currentStep] || [];
            if (fields.length) await form.validateFields(fields);
            setCurrentStep(currentStep + 1);
        } catch {
            message.warning('Please fill in the required fields before continuing.');
        }
    };

    const prev = () => setCurrentStep(currentStep - 1);

    const handleBackToAssets = () => {
        const values = form.getFieldsValue(true);
        const hasData = values.asset_name || values.item_code || values.company;
        if (hasData) {
            Modal.confirm({
                title: 'Discard changes?',
                content: 'You have unsaved data. Are you sure you want to leave?',
                okText: 'Leave',
                okType: 'danger',
                onOk: () => navigateToRoute?.('assets'),
            });
        } else {
            navigateToRoute?.('assets');
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const values = form.getFieldsValue(true);
            const data: Record<string, any> = {
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
                calculate_depreciation: calcDepreciation ? 1 : 0,
            };
            if (calcDepreciation) {
                data.depreciation_method = values.depreciation_method;
                data.total_number_of_depreciations = values.total_number_of_depreciations;
                data.frequency_of_depreciation = values.frequency_of_depreciation;
                data.expected_value_after_useful_life = values.expected_value_after_useful_life || 0;
                data.depreciation_start_date = values.depreciation_start_date?.format('YYYY-MM-DD');
            }

            const result = await createAsset(data);
            if (result.success && result.name) {
                setCreatedAssetName(result.name);
            } else {
                message.error(result.error || 'Failed to create asset. Please check all fields and try again.');
            }
        } catch {
            message.error('Unexpected error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // Success state
    // ═══════════════════════════════════════════════════════════════════════
    if (createdAssetName) {
        return (
            <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: 600, margin: '0 auto' }}>
                <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <Result
                        status="success"
                        title="Asset Created"
                        subTitle={
                            <Space direction="vertical" size={4} style={{ textAlign: 'center' }}>
                                <Text>Asset <Tag color="blue">{createdAssetName}</Tag> has been created as a <Tag>Draft</Tag>.</Text>
                                <Text type="secondary">Submit the asset from its detail page to activate depreciation and GL entries.</Text>
                            </Space>
                        }
                        extra={[
                            <Button type="primary" key="view" onClick={() => navigateToRoute?.('assets', createdAssetName)}>
                                View Asset
                            </Button>,
                            <Button key="another" onClick={() => {
                                setCreatedAssetName(null);
                                setCurrentStep(0);
                                setSelectedItem(null);
                                setCalcDepreciation(false);
                                form.resetFields();
                            }}>
                                Create Another
                            </Button>,
                            <Button key="list" onClick={() => navigateToRoute?.('assets')}>
                                Back to List
                            </Button>,
                        ]}
                    />
                </Card>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Step renderers
    // ═══════════════════════════════════════════════════════════════════════

    const renderStep = () => {
        switch (currentStep) {
            // ─── Step 0: Item & Asset ────────────────────────────────────
            case 0:
                return (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {/* Item Selection */}
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
                                        <Tooltip title="An Item represents the product model (e.g. 'Lenovo ThinkPad X1'). Multiple asset records can be created from one item — one per physical unit.">
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
                                            Search for an existing item, or create a new one if it doesn't exist.
                                        </Paragraph>

                                        <Select
                                            showSearch
                                            placeholder="Type to search items... (min 2 characters)"
                                            filterOption={false}
                                            onSearch={handleItemSearch}
                                            onSelect={handleItemSelect}
                                            loading={itemSearching}
                                            notFoundContent={
                                                itemSearching ? (
                                                    <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /><br /><Text type="secondary">Searching...</Text></div>
                                                ) : itemSearchError ? (
                                                    <Alert type="error" message="Search failed. Check your connection." showIcon />
                                                ) : lastSearchTerm.length < 2 ? (
                                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Type at least 2 characters to search" />
                                                ) : (
                                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No items matching "${lastSearchTerm}"`}>
                                                        <Button type="primary" size="small" icon={<PlusOutlined />}
                                                            onClick={() => setCreateItemModalOpen(true)}>
                                                            Create "{lastSearchTerm}" as new item
                                                        </Button>
                                                    </Empty>
                                                )
                                            }
                                            style={{ width: '100%' }}
                                            suffixIcon={<SearchOutlined />}
                                            dropdownRender={(menu) => (
                                                <>
                                                    {menu}
                                                    <Divider style={{ margin: '4px 0' }} />
                                                    <div style={{ padding: '4px 8px 8px' }}>
                                                        <Button type="text" icon={<PlusOutlined />} onClick={() => setCreateItemModalOpen(true)} block>
                                                            Create new fixed asset item
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        >
                                            {itemSearchResults.map((item) => (
                                                <Select.Option key={item.item_code} value={item.item_code}>
                                                    <div style={{ padding: '4px 0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Text strong>{item.item_name || item.item_code}</Text>
                                                            <Tag style={{ marginLeft: 8 }}>{item.asset_category}</Tag>
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {item.item_code} &bull; {item.item_group}
                                                            {item.description && ` &bull; ${item.description.substring(0, 60)}...`}
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
                                                {selectedItem.description && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{selectedItem.description}</Text>
                                                )}
                                            </Space>
                                            <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
                                        </div>
                                    </Card>
                                )}
                            </Space>
                        </Card>

                        <Form.Item name="item_code" rules={[{ required: true, message: 'Select or create an item type first' }]} hidden><Input /></Form.Item>
                        <Form.Item name="asset_category" hidden><Input /></Form.Item>

                        <Divider style={{ margin: '4px 0' }} />

                        {/* Asset fields */}
                        <Text strong style={{ fontSize: 14 }}>
                            Asset Details
                            <Tooltip title="These fields are specific to this physical unit — not the item type above.">
                                <InfoCircleOutlined style={{ marginLeft: 6, color: token.colorTextDescription }} />
                            </Tooltip>
                        </Text>

                        <Form.Item
                            label="Asset Name"
                            name="asset_name"
                            rules={[{ required: true, message: 'Name this specific asset unit' }]}
                            tooltip="A unique name for THIS physical unit (e.g. 'CT Scanner #3 — Radiology Wing')"
                        >
                            <Input placeholder="e.g. CT Scanner #3 — Radiology Wing" />
                        </Form.Item>

                        <Form.Item
                            label="Company"
                            name="company"
                            rules={[{ required: true, message: 'Select the owning company' }]}
                        >
                            <Select
                                placeholder={refDataLoading ? 'Loading...' : 'Select company'}
                                loading={refDataLoading}
                                showSearch
                                optionFilterProp="children"
                                notFoundContent={companies.length === 0 && !refDataLoading
                                    ? <Empty description="No companies accessible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    : undefined}
                            >
                                {companies.map((c) => (
                                    <Select.Option key={c.name} value={c.name}>
                                        {c.company_name} ({c.abbr})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Space>
                );

            // ─── Step 1: Location & Assignment ───────────────────────────
            case 1:
                return (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Form.Item
                            label="Facility"
                            name="facility_id"
                            rules={[{ required: true, message: 'Select the facility where this asset will be located' }]}
                        >
                            <Select placeholder="Select facility" showSearch optionFilterProp="children"
                                notFoundContent={availableFacilities.length === 0
                                    ? <Empty description="No facilities accessible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    : undefined}>
                                {availableFacilities.map((f) => (
                                    <Select.Option key={f.hie_id} value={f.hie_id}>{f.facility_name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Department" name="department">
                            <Select
                                placeholder={departments.length === 0 ? 'Select company first' : 'Select department (optional)'}
                                allowClear
                                showSearch
                                optionFilterProp="children"
                                disabled={departments.length === 0}
                            >
                                {departments.map((d) => (
                                    <Select.Option key={d.name} value={d.name}>{d.department_name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Custodian"
                            name="custodian"
                            tooltip="The employee responsible for this asset"
                        >
                            <Select
                                placeholder="Search by name..."
                                showSearch
                                filterOption={false}
                                onSearch={handleEmployeeSearch}
                                allowClear
                                notFoundContent={<Empty description="Type to search employees" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
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
                    </Space>
                );

            // ─── Step 2: Purchase ────────────────────────────────────────
            case 2:
                return (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Form.Item name="is_existing_asset" valuePropName="checked" label="Is Existing Asset?"
                            tooltip="Check this if you're registering an asset that was already in use before this system">
                            <Switch />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item label="Purchase Date" name="purchase_date" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label="Available-for-use Date" name="available_for_use_date"
                                    tooltip="When this asset was/will be put into service. Required before submitting.">
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Gross Purchase Amount" name="gross_purchase_amount" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value?.replace(/,/g, '') as unknown as number} />
                        </Form.Item>
                    </Space>
                );

            // ─── Step 3: Depreciation ────────────────────────────────────
            case 3:
                return (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Card size="small" style={{ borderRadius: 10, background: token.colorFillQuaternary }} bodyStyle={{ padding: 12 }}>
                            <Space>
                                <Switch checked={calcDepreciation} onChange={setCalcDepreciation} />
                                <div>
                                    <Text strong>Enable Depreciation</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Track the declining value of this asset over its useful life.
                                    </Text>
                                </div>
                            </Space>
                        </Card>

                        {calcDepreciation && (
                            <>
                                <Form.Item label="Depreciation Method" name="depreciation_method" rules={[{ required: true }]}>
                                    <Select options={DEPRECIATION_METHODS} />
                                </Form.Item>
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Total Depreciations" name="total_number_of_depreciations" rules={[{ required: true }]}
                                            tooltip="How many depreciation entries over the asset's useful life">
                                            <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 5" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Frequency (months)" name="frequency_of_depreciation" rules={[{ required: true }]}
                                            tooltip="Months between each depreciation entry">
                                            <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 12" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Salvage Value" name="expected_value_after_useful_life"
                                            tooltip="Estimated value at end of useful life">
                                            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Depreciation Start Date" name="depreciation_start_date">
                                            <DatePicker style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {!calcDepreciation && (
                            <Alert type="info" showIcon message="You can enable depreciation later from the asset detail page." />
                        )}
                    </Space>
                );

            // ─── Step 4: Review ──────────────────────────────────────────
            case 4: {
                const v = form.getFieldsValue(true);
                const facilityName = availableFacilities.find((f) => f.hie_id === v.facility_id)?.facility_name || v.facility_id;
                const companyName = companies.find((c) => c.name === v.company)?.company_name || v.company;
                const deptName = departments.find((d) => d.name === v.department)?.department_name || v.department;
                const empName = employees.find((e) => e.name === v.custodian)?.employee_name || v.custodian;

                return (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {/* Item summary */}
                        <Card size="small" style={{ borderRadius: 10, background: token.colorFillQuaternary }} bodyStyle={{ padding: 12 }}>
                            <Space>
                                <AppstoreOutlined style={{ color: token.colorPrimary }} />
                                <Text strong>Item: </Text>
                                <Text>{selectedItem?.item_name || v.item_code}</Text>
                                <Tag color="blue">{v.item_code}</Tag>
                                {v.asset_category && <Tag color="purple">{v.asset_category}</Tag>}
                            </Space>
                        </Card>

                        <Descriptions bordered size="small" column={isMobile ? 1 : 2} title="Asset Details">
                            <Descriptions.Item label="Asset Name">{v.asset_name}</Descriptions.Item>
                            <Descriptions.Item label="Company">{companyName}</Descriptions.Item>
                            <Descriptions.Item label="Facility">{facilityName}</Descriptions.Item>
                            <Descriptions.Item label="Department">{deptName || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Custodian">{empName || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Existing Asset?">{v.is_existing_asset ? 'Yes' : 'No'}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions bordered size="small" column={isMobile ? 1 : 2} title="Purchase & Valuation">
                            <Descriptions.Item label="Purchase Date">{v.purchase_date?.format('DD MMM YYYY') || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Available-for-use">{v.available_for_use_date?.format('DD MMM YYYY') || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Purchase Amount">{v.gross_purchase_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Depreciation">{calcDepreciation ? v.depreciation_method : 'Disabled'}</Descriptions.Item>
                            {calcDepreciation && (
                                <>
                                    <Descriptions.Item label="Depreciations">{v.total_number_of_depreciations} periods</Descriptions.Item>
                                    <Descriptions.Item label="Frequency">Every {v.frequency_of_depreciation} months</Descriptions.Item>
                                    <Descriptions.Item label="Salvage Value">{v.expected_value_after_useful_life?.toLocaleString() || '0'}</Descriptions.Item>
                                    <Descriptions.Item label="Start Date">{v.depreciation_start_date?.format('DD MMM YYYY') || 'Auto'}</Descriptions.Item>
                                </>
                            )}
                        </Descriptions>

                        <Alert
                            type="info"
                            showIcon
                            icon={<ExclamationCircleOutlined />}
                            message="Asset will be created as Draft"
                            description="After creation, open the asset and click 'Submit' to activate it. Submission triggers depreciation scheduling and GL entries."
                        />
                    </Space>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: 800, margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToAssets} style={{ marginBottom: 16 }}>
                Back to Assets
            </Button>

            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Title level={4} style={{ marginBottom: 24 }}>Create New Asset</Title>

                <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} size={isMobile ? 'small' : 'default'} />

                <Form form={form} layout="vertical" validateTrigger="onBlur">
                    {renderStep()}
                </Form>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                    {currentStep > 0 ? <Button onClick={prev}>Previous</Button> : <div />}
                    {currentStep < steps.length - 1 ? (
                        <Button type="primary" onClick={next}>Next</Button>
                    ) : (
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            Create Asset
                        </Button>
                    )}
                </div>
            </Card>

            <CreateItemModal
                open={createItemModalOpen}
                onClose={() => setCreateItemModalOpen(false)}
                onCreated={handleItemCreated}
                categories={categories}
                initialSearch={lastSearchTerm}
            />
        </div>
    );
};

export default AssetCreateForm;
