import React, { useEffect, useState } from 'react';
import {
    Card, Row, Col, Statistic, Tabs, Table, Button, Space, Typography,
    Descriptions, Tag, Badge, Progress, Timeline, Empty, Spin, theme, message, Alert, Result, Tooltip,
} from 'antd';
import type { BadgeProps } from 'antd';
import {
    ArrowLeftOutlined, LaptopOutlined, ToolOutlined, WarningOutlined,
    SwapOutlined, CheckCircleOutlined, EditOutlined, DollarOutlined,
} from '@ant-design/icons';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import { useResponsive } from '../../../hooks/useResponsive';
import AssetStatusBadge from './AssetStatusBadge';
import AssetMaintenanceModal from './AssetMaintenanceModal';
import AssetRepairModal from './AssetRepairModal';
import AssetMovementModal from './AssetMovementModal';
import AssetDraftSetupModal from './AssetDraftSetupModal';
import AssetAssignmentModal from './AssetAssignmentModal';
import AssetValuationModal from './AssetValuationModal';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface Props {
    assetId: string;
    navigateToRoute: (route: string, id?: string) => void;
}

type BadgeStatus = NonNullable<BadgeProps['status']>;

interface MovementRecord {
    name: string;
    purpose: string;
    transaction_date: string;
    source_location?: string;
    source_location_name?: string;
    target_location?: string;
    target_location_name?: string;
    from_employee_name?: string;
    to_employee_name?: string;
}

interface DepreciationScheduleEntry {
    schedule_date: string;
    depreciation_amount: number;
    accumulated_depreciation_amount: number;
    journal_entry?: string;
}

interface DepreciationScheduleGroup {
    name: string;
    finance_book?: string;
    entries: DepreciationScheduleEntry[];
}

const AssetDetailView: React.FC<Props> = ({ assetId, navigateToRoute }) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();

    const {
        selectedAsset, selectedAssetLoading, detailError,
        maintenanceData, repairRecords, movementRecords, depreciationSummary,
        refreshAssetBundle, clearSelectedAsset,
        submitAsset,
    } = useERPNextAssetStore();

    const [loadedAssetId, setLoadedAssetId] = useState<string | null>(null);
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [repairModalOpen, setRepairModalOpen] = useState(false);
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [draftSetupOpen, setDraftSetupOpen] = useState(false);
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [valuationModalOpen, setValuationModalOpen] = useState(false);
    const detailAttempted = loadedAssetId === assetId;

    const navigateToAssetsList = () => {
        navigateToRoute('assets');
    };

    useEffect(() => {
        let isActive = true;
        void (async () => {
            await refreshAssetBundle(assetId);
            if (isActive) {
                setLoadedAssetId(assetId);
            }
        })();
        return () => {
            isActive = false;
            clearSelectedAsset();
        };
    }, [
        assetId,
        clearSelectedAsset,
        refreshAssetBundle,
    ]);

    const handleSubmit = async () => {
        const result = await submitAsset(assetId);
        if (result.success) {
            if (result.warning) {
                message.warning(result.warning);
            } else {
                message.success('Asset submitted successfully');
            }
        } else {
            message.error(result.error || 'Failed to submit asset');
        }
    };

    if (selectedAssetLoading || !detailAttempted) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!selectedAsset) {
        const hasPermissionIssue = /permission/i.test(detailError || '');
        return (
            <div style={{ padding: isMobile ? '16px' : '24px' }}>
                <Result
                    status={hasPermissionIssue ? '403' : 'warning'}
                    title={hasPermissionIssue ? 'Access Denied' : 'Asset Not Available'}
                    subTitle={
                        detailError
                            || `Asset ${assetId} could not be loaded. It may not exist, or your session may not be allowed to access it.`
                    }
                    extra={
                        <Button type="primary" onClick={navigateToAssetsList}>
                            Back to Assets
                        </Button>
                    }
                />
            </div>
        );
    }

    const asset = selectedAsset;
    const depPct = asset.gross_purchase_amount
        ? Math.round(((asset.gross_purchase_amount - (asset.value_after_depreciation || 0)) / asset.gross_purchase_amount) * 100)
        : 0;
    const depreciationSchedules: DepreciationScheduleGroup[] = depreciationSummary?.schedules || [];
    const canSubmitDraft = Boolean(asset.available_for_use_date);
    const canEditAssignment = !['Draft', 'Sold', 'Scrapped', 'Cancelled'].includes(asset.status);
    const canEditValuation = !['Draft', 'Sold', 'Scrapped', 'Cancelled'].includes(asset.status);

    // ----- Overview Tab -----
    const overviewTab = (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={isMobile ? 1 : 2}>
                <Descriptions.Item label="Asset Name">{asset.asset_name}</Descriptions.Item>
                <Descriptions.Item label="Item Code">{asset.item_code}</Descriptions.Item>
                <Descriptions.Item label="Item Name">{asset.item_name}</Descriptions.Item>
                <Descriptions.Item label="Category">{asset.asset_category}</Descriptions.Item>
                <Descriptions.Item label="Company">{asset.company}</Descriptions.Item>
                <Descriptions.Item label="Department">{asset.department || '-'}</Descriptions.Item>
                <Descriptions.Item label="Location">{asset.facility_name || asset.location}</Descriptions.Item>
                <Descriptions.Item label="Custodian">{asset.custodian_name || asset.custodian || '-'}</Descriptions.Item>
                <Descriptions.Item label="Purchase Date">{asset.purchase_date ? dayjs(asset.purchase_date).format('DD MMM YYYY') : '-'}</Descriptions.Item>
                <Descriptions.Item label="Available-for-use Date">{asset.available_for_use_date ? dayjs(asset.available_for_use_date).format('DD MMM YYYY') : '-'}</Descriptions.Item>
                <Descriptions.Item label="Gross Purchase Amount">{(asset.gross_purchase_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                <Descriptions.Item label="Net Purchase Amount">{(asset.net_purchase_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                <Descriptions.Item label="Current Value">{(asset.value_after_depreciation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                <Descriptions.Item label="Is Existing Asset">{asset.is_existing_asset ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label="Purchase Receipt">{asset.purchase_receipt || '-'}</Descriptions.Item>
                <Descriptions.Item label="Purchase Invoice">{asset.purchase_invoice || '-'}</Descriptions.Item>
            </Descriptions>

            {asset.status === 'Draft' && (
                <Alert
                    type="info"
                    showIcon
                    message="Draft asset"
                    description="Use Edit Draft Details to complete purchase traceability, available-for-use date, and depreciation or finance-book settings before submission."
                />
            )}

            {asset.insurance?.policy_number && (
                <Card size="small" style={{ borderRadius: 10 }} title="Insurance">
                    <Descriptions bordered size="small" column={isMobile ? 1 : 2}>
                        <Descriptions.Item label="Policy Number">{asset.insurance.policy_number}</Descriptions.Item>
                        <Descriptions.Item label="Insurer">{asset.insurance.insurer}</Descriptions.Item>
                        <Descriptions.Item label="Insured Value">{(asset.insurance.insured_value || 0).toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="Period">
                            {asset.insurance.insurance_start_date && asset.insurance.insurance_end_date
                                ? `${dayjs(asset.insurance.insurance_start_date).format('DD MMM YYYY')} – ${dayjs(asset.insurance.insurance_end_date).format('DD MMM YYYY')}`
                                : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            )}
        </Space>
    );

    // ----- Maintenance Tab -----
    const maintenanceTab = (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<ToolOutlined />} onClick={() => setMaintenanceModalOpen(true)}>
                    Schedule Maintenance
                </Button>
            </div>
            {maintenanceData?.tasks?.length ? (
                <Table
                    dataSource={maintenanceData.tasks}
                    rowKey="name"
                    size="small"
                    pagination={false}
                    columns={[
                        { title: 'Task', dataIndex: 'maintenance_task', key: 'task' },
                        { title: 'Type', dataIndex: 'maintenance_type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
                        { title: 'Periodicity', dataIndex: 'periodicity', key: 'periodicity' },
                        { title: 'Next Due', dataIndex: 'next_due_date', key: 'next_due', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
                        { title: 'Assigned To', dataIndex: 'assign_to', key: 'assign' },
                    ]}
                />
            ) : (
                <Empty description="No maintenance schedule" />
            )}

            {(maintenanceData?.logs?.length ?? 0) > 0 && (
                <>
                    <Title level={5}>Maintenance Logs</Title>
                    <Table
                        dataSource={maintenanceData.logs}
                        rowKey="name"
                        size="small"
                        pagination={false}
                        columns={[
                            { title: 'Due Date', dataIndex: 'due_date', key: 'due', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
                            { title: 'Status', dataIndex: 'maintenance_status', key: 'status', render: (s: string) => {
                                const color: BadgeStatus = s === 'Completed' ? 'success' : s === 'Overdue' ? 'error' : s === 'Cancelled' ? 'default' : 'warning';
                                return <Badge status={color} text={s} />;
                            }},
                            { title: 'Completion', dataIndex: 'completion_date', key: 'completion', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
                            { title: 'Actions Performed', dataIndex: 'actions_performed', key: 'actions', ellipsis: true },
                        ]}
                    />
                </>
            )}
        </Space>
    );

    // ----- Repairs Tab -----
    const repairsTab = (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" danger icon={<WarningOutlined />} onClick={() => setRepairModalOpen(true)}>
                    Report Issue
                </Button>
            </div>
            {repairRecords.length > 0 ? (
                <Table
                    dataSource={repairRecords}
                    rowKey="name"
                    size="small"
                    pagination={false}
                    columns={[
                        { title: 'Failure Date', dataIndex: 'failure_date', key: 'failure', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
                        { title: 'Description', dataIndex: 'description', key: 'desc', ellipsis: true },
                        { title: 'Status', dataIndex: 'repair_status', key: 'status', render: (s: string) => {
                            const color: BadgeStatus = s === 'Completed' ? 'success' : s === 'Cancelled' ? 'default' : 'error';
                            return <Badge status={color} text={s} />;
                        }},
                        { title: 'Completion', dataIndex: 'completion_date', key: 'completion', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
                        { title: 'Cost', dataIndex: 'total_repair_cost', key: 'cost', render: (v: number) => v ? v.toLocaleString() : '-' },
                    ]}
                />
            ) : (
                <Empty description="No repairs recorded" />
            )}
        </Space>
    );

    // ----- Movements Tab -----
    const movementsTab = (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<SwapOutlined />} onClick={() => setMovementModalOpen(true)}>
                    Transfer Asset
                </Button>
            </div>
            {movementRecords.length > 0 ? (
                <Timeline
                    items={movementRecords.map((mov: MovementRecord) => {
                        const color = mov.purpose === 'Receipt' ? 'green' : mov.purpose === 'Transfer' ? 'blue' : 'orange';
                        return {
                            color,
                            children: (
                                <Space direction="vertical" size={2}>
                                    <Text strong>{dayjs(mov.transaction_date).format('DD MMM YYYY')} — {mov.purpose}</Text>
                                    <Text type="secondary">
                                        {mov.source_location_name || mov.source_location || '—'} → {mov.target_location_name || mov.target_location || '—'}
                                    </Text>
                                    {(mov.from_employee_name || mov.to_employee_name) && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {mov.from_employee_name || '—'} → {mov.to_employee_name || '—'}
                                        </Text>
                                    )}
                                </Space>
                            ),
                        };
                    })}
                />
            ) : (
                <Empty description="No movements recorded" />
            )}
        </Space>
    );

    // ----- Depreciation Tab -----
    const depreciationTab = (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {!asset.calculate_depreciation ? (
                <Empty description="Depreciation not enabled for this asset" />
            ) : (
                <>
                    <Row gutter={[10, 10]}>
                        <Col xs={12} md={6}>
                            <Card size="small" style={{ borderRadius: 10 }}>
                                <Statistic title="Original Value" value={asset.net_purchase_amount || 0} precision={2} />
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small" style={{ borderRadius: 10 }}>
                                <Statistic title="Accumulated" value={(asset.net_purchase_amount || 0) - (asset.value_after_depreciation || 0)} precision={2} />
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small" style={{ borderRadius: 10 }}>
                                <Statistic title="Current Value" value={asset.value_after_depreciation || 0} precision={2} />
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small" style={{ borderRadius: 10 }}>
                                <Statistic title="Depreciated" suffix="%" value={depPct} />
                            </Card>
                        </Col>
                    </Row>
                    <Progress percent={depPct} strokeColor={depPct > 80 ? '#52c41a' : '#1890ff'} />

                    {depreciationSchedules.map((sched) => (
                        <Card key={sched.name} size="small" title={`Schedule: ${sched.finance_book || 'Default'}`} style={{ borderRadius: 10 }}>
                            <Table
                                dataSource={sched.entries}
                                rowKey="schedule_date"
                                size="small"
                                pagination={false}
                                columns={[
                                    { title: 'Date', dataIndex: 'schedule_date', key: 'date', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
                                    { title: 'Amount', dataIndex: 'depreciation_amount', key: 'amount', render: (v: number) => v?.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                                    { title: 'Accumulated', dataIndex: 'accumulated_depreciation_amount', key: 'accumulated', render: (v: number) => v?.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                                    { title: 'Journal Entry', dataIndex: 'journal_entry', key: 'je', render: (v: string) => v || '-' },
                                ]}
                            />
                        </Card>
                    ))}
                </>
            )}
        </Space>
    );

    const tabItems = [
        { key: 'overview', label: 'Overview', children: overviewTab },
        { key: 'maintenance', label: 'Maintenance', children: maintenanceTab },
        { key: 'repairs', label: 'Repairs', children: repairsTab },
        { key: 'movements', label: 'Movements', children: movementsTab },
        { key: 'depreciation', label: 'Depreciation', children: depreciationTab },
    ];

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {/* Back button */}
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={navigateToAssetsList}
                style={{ marginBottom: 16 }}
            >
                Back to Assets
            </Button>

            {/* Header Card */}
            <Card
                size="small"
                bordered={false}
                className="profile-section-card"
                style={{ borderRadius: 12, marginBottom: 16 }}
                bodyStyle={{ padding: isMobile ? 12 : 16 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Space>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: token.colorFillAlter,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: token.colorPrimary, fontSize: 20,
                        }}>
                            <LaptopOutlined />
                        </div>
                        <Space direction="vertical" size={0}>
                            <Title level={4} style={{ margin: 0 }}>{asset.asset_name}</Title>
                            <Text type="secondary">{asset.item_code} • {asset.name}</Text>
                        </Space>
                    </Space>
                    <Space wrap>
                        <AssetStatusBadge status={asset.status} />
                        <Tag>{asset.asset_category}</Tag>
                        {asset.status === 'Draft' && (
                            <Button icon={<EditOutlined />} onClick={() => setDraftSetupOpen(true)}>
                                Edit Draft Details
                            </Button>
                        )}
                        {canEditAssignment && (
                            <Button icon={<EditOutlined />} onClick={() => setAssignmentModalOpen(true)}>
                                Edit Assignment
                            </Button>
                        )}
                        {canEditValuation && (
                            <Button icon={<DollarOutlined />} onClick={() => setValuationModalOpen(true)}>
                                Edit Valuation
                            </Button>
                        )}
                        {asset.status === 'Draft' && (
                            canSubmitDraft ? (
                                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSubmit}>
                                    Submit Asset
                                </Button>
                            ) : (
                                <Tooltip title="Set Available-for-use Date before submitting the asset.">
                                    <Button type="primary" icon={<CheckCircleOutlined />} disabled>
                                        Submit Asset
                                    </Button>
                                </Tooltip>
                            )
                        )}
                    </Space>
                </div>
            </Card>

            {/* Quick Stats */}
            <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
                <Col xs={12} md={6}>
                    <Card size="small" style={{ borderRadius: 10 }}>
                        <Statistic title="Purchase Value" value={asset.gross_purchase_amount || 0} precision={2} valueStyle={{ fontSize: 16 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card size="small" style={{ borderRadius: 10 }}>
                        <Statistic title="Current Value" value={asset.value_after_depreciation || 0} precision={2} valueStyle={{ fontSize: 16 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card size="small" style={{ borderRadius: 10 }}>
                        <Statistic title="Depreciation" suffix="%" value={depPct} valueStyle={{ fontSize: 16 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card size="small" style={{ borderRadius: 10 }}>
                        <Statistic title="Company" value={asset.company || '-'} valueStyle={{ fontSize: 14 }} />
                    </Card>
                </Col>
            </Row>

            {/* Tabs */}
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Tabs defaultActiveKey="overview" items={tabItems} />
            </Card>

            {/* Modals */}
            <AssetMaintenanceModal
                open={maintenanceModalOpen}
                onClose={() => setMaintenanceModalOpen(false)}
                assetName={assetId}
                company={asset.company}
            />
            <AssetRepairModal
                open={repairModalOpen}
                onClose={() => setRepairModalOpen(false)}
                assetName={assetId}
            />
            <AssetMovementModal
                open={movementModalOpen}
                onClose={() => setMovementModalOpen(false)}
                assetName={assetId}
                currentLocation={asset.location}
                currentFacilityId={asset.facility_id}
                currentLocationName={asset.facility_name || asset.location}
                currentCustodian={asset.custodian}
                currentCustodianName={asset.custodian_name}
                company={asset.company}
            />
            <AssetAssignmentModal
                open={assignmentModalOpen}
                onClose={() => setAssignmentModalOpen(false)}
                assetName={assetId}
                company={asset.company}
                currentCustodian={asset.custodian}
                currentCustodianName={asset.custodian_name}
            />
            <AssetValuationModal
                open={valuationModalOpen}
                onClose={() => setValuationModalOpen(false)}
                assetName={assetId}
                currentValuation={asset.value_after_depreciation || 0}
                calculateDepreciation={Boolean(asset.calculate_depreciation)}
                financeBooks={asset.finance_books || []}
            />
            <AssetDraftSetupModal
                open={draftSetupOpen}
                onClose={() => setDraftSetupOpen(false)}
                asset={asset}
            />
        </div>
    );
};

export default AssetDetailView;
