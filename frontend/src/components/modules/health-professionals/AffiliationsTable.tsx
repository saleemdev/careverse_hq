import { Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProfessionalAffiliation } from '../../../types/modules';
import { StatusTag } from '../shared/StatusTag';
import dayjs from 'dayjs';

interface AffiliationsTableProps {
    data?: ProfessionalAffiliation[];
    loading?: boolean;
}

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
            render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
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
