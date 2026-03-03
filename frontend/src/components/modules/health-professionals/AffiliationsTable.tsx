import { Table, Empty, Tooltip, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProfessionalAffiliation } from '../../../types/modules';
import { StatusTag } from '../shared/StatusTag';
import { formatDateHuman } from '../../../utils/dateHelpers';

interface AffiliationsTableProps {
    data?: ProfessionalAffiliation[];
    loading?: boolean;
}

const { Text } = Typography;

export const AffiliationsTable = ({ data, loading }: AffiliationsTableProps) => {
    const columns: ColumnsType<ProfessionalAffiliation> = [
        {
            title: 'Health Facility',
            dataIndex: 'health_facility_name',
            key: 'health_facility_name',
            width: 250,
            render: (name) => name || '-',
        },
        {
            title: 'Role / Designation',
            dataIndex: 'designation',
            key: 'designation',
            width: 180,
            render: (designation, record) => designation || record.role || '-',
        },
        {
            title: 'Employment Type',
            dataIndex: 'employment_type',
            key: 'employment_type',
            width: 150,
            render: (type) => type || '-',
        },
        {
            title: 'Status',
            dataIndex: 'affiliation_status',
            key: 'affiliation_status',
            width: 120,
            render: (status) => <StatusTag status={status} />,
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (date) => formatDateHuman(date),
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            width: 120,
            render: (date) => formatDateHuman(date),
        },
        {
            title: 'Termination',
            key: 'termination',
            width: 220,
            render: (_, record) => {
                if (!record.termination_date && !record.termination_reason) {
                    return <Text type="secondary">-</Text>;
                }
                const dateLabel = record.termination_date
                    ? formatDateHuman(record.termination_date)
                    : 'Date not set';
                return (
                    <Space direction="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {dateLabel}
                            {record.terminated_by ? ` • by ${record.terminated_by}` : ''}
                        </Text>
                        {record.termination_reason && (
                            <Tooltip title={record.termination_reason}>
                                <Text style={{ fontSize: 11 }} ellipsis>
                                    {record.termination_reason}
                                </Text>
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    if (!data || data.length === 0) {
        return (
            <Empty
                description="No facility affiliations found"
                style={{ padding: '40px 0' }}
            />
        );
    }

    return (
        <Table
            columns={columns}
            dataSource={data}
            rowKey="name"
            pagination={false}
            size="small"
            loading={loading}
            scroll={{ x: 800 }}
        />
    );
};
