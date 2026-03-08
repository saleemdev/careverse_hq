import React from 'react';
import { Descriptions, Typography, Tag, Space, theme } from 'antd';
import {
    UserOutlined,
    BankOutlined,
    CalendarOutlined,
    FileTextOutlined,
    MedicineBoxOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import ModuleDetailDrawer from '../shared/ModuleDetailDrawer';
import type { FacilityClaim } from '../../../types/modules';

const { Text } = Typography;

interface ClaimDetailDrawerProps {
    visible: boolean;
    claim: FacilityClaim | null;
    onClose: () => void;
}

const ClaimDetailDrawer: React.FC<ClaimDetailDrawerProps> = ({
    visible,
    claim,
    onClose,
}) => {
    const { token } = theme.useToken();

    const period =
        claim?.date_start && claim?.date_end
            ? claim.date_start === claim.date_end
                ? claim.date_start
                : `${claim.date_start} – ${claim.date_end}`
            : '—';

    return (
        <ModuleDetailDrawer
            title={claim ? `Claim: ${claim.claim_id?.slice(0, 8)}…` : 'Claim details'}
            visible={visible}
            onClose={onClose}
            loading={false}
        >
            {!claim ? (
                <Text type="secondary">No claim selected.</Text>
            ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item
                            label={
                                <Space>
                                    <UserOutlined style={{ color: token.colorTextSecondary }} />
                                    Client
                                </Space>
                            }
                        >
                            <Text strong>{claim.client_name ?? '—'}</Text>
                            {claim.client && (
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{claim.client}</Text>
                                </div>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={
                                <Space>
                                    <FileTextOutlined style={{ color: token.colorTextSecondary }} />
                                    Claim ID
                                </Space>
                            }
                        >
                            <Text code>{claim.claim_id || '—'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Claim type">
                            <Tag color="blue">{claim.claim_type || '—'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Use">
                            <Tag>{claim.use || 'claim'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Claim subtype">
                            {claim.claim_subtype || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={
                                <Space>
                                    <CalendarOutlined style={{ color: token.colorTextSecondary }} />
                                    Period
                                </Space>
                            }
                        >
                            {period}
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={
                                <Space>
                                    <BankOutlined style={{ color: token.colorTextSecondary }} />
                                    Insurer
                                </Space>
                            }
                        >
                            {claim.insurer || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Scheme ID">
                            {claim.scheme_id || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag
                                color={
                                    claim.claim_status === 'approved'
                                        ? 'green'
                                        : claim.claim_status === 'rejected'
                                        ? 'red'
                                        : 'orange'
                                }
                            >
                                {claim.claim_status || '—'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Claim Upstream Error Group">
                            {claim.claim_upstream_error_group ?? '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Claim Upstream Response">
                            {claim.claim_upstream_response ?? '—'}
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={
                                <Space>
                                    <DollarOutlined style={{ color: token.colorTextSecondary }} />
                                    Amount (KES)
                                </Space>
                            }
                        >
                            <Text strong>
                                {new Intl.NumberFormat('en-KE').format(claim.claim_amount ?? 0)}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={
                                <Space>
                                    <MedicineBoxOutlined style={{ color: token.colorTextSecondary }} />
                                    Facility
                                </Space>
                            }
                        >
                            {claim.facility_name || '—'}
                            {(claim.county || claim.sub_county) && (
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {[claim.sub_county, claim.county].filter(Boolean).join(', ')}
                                    </Text>
                                </div>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Diagnoses">
                            {claim.diagnoses || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Interventions">
                            {claim.interventions || '—'}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            )}
        </ModuleDetailDrawer>
    );
};

export default ClaimDetailDrawer;
