import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Divider, theme, message, Space, Progress } from 'antd';
import {
    BankOutlined,
    CreditCardOutlined,
    PieChartOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { financeApi } from '../services/api';
import CurrencyDisplay from './modules/shared/CurrencyDisplay';

const { Text } = Typography;

interface AccountTypesMetricsProps {
    company: string;
}

const AccountTypesMetrics: React.FC<AccountTypesMetricsProps> = ({ company }) => {
    const { token } = theme.useToken();
    const [loading, setLoading] = useState(false);
    const [balances, setBalances] = useState<any>(null);

    useEffect(() => {
        if (company) {
            fetchAccountBalances();
        }
    }, [company]);

    const fetchAccountBalances = async () => {
        setLoading(true);
        try {
            const response = await financeApi.getAccountBalances(company);
            if (response.success) {
                setBalances(response.data);
            }
        } catch (error) {
            console.error('Failed to load account balances:', error);
            message.error('Failed to load account balances');
        } finally {
            setLoading(false);
        }
    };

    // Helper to find balance by type from the array response
    const getBalanceByType = (type: string) => {
        if (!balances || !Array.isArray(balances)) return 0;
        return balances
            .filter((a: any) => a.type === type)
            .reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
    };

    const getCountByType = (type: string) => {
        if (!balances || !Array.isArray(balances)) return 0;
        return balances.filter((a: any) => a.type === type).length;
    };

    const assetTotal = getBalanceByType('Asset');
    const liabilityTotal = getBalanceByType('Liability');
    const incomeTotal = getBalanceByType('Income');
    const expenseTotal = getBalanceByType('Expense');
    const equityTotal = getBalanceByType('Equity');

    return (
        <Card
            title={
                <Space>
                    <BankOutlined />
                    <span>Account Types Overview</span>
                </Space>
            }
            loading={loading}
            style={{
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: 'none',
            }}
        >
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                    <Statistic
                        title="Total Assets"
                        value={assetTotal}
                        formatter={(val) => <CurrencyDisplay value={val as number} size="large" />}
                        prefix={<BankOutlined style={{ color: '#1890ff' }} />}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {getCountByType('Asset')} Managed Accounts
                    </Text>
                </Col>
                <Col xs={24} sm={8}>
                    <Statistic
                        title="Total Liabilities"
                        value={Math.abs(liabilityTotal)}
                        formatter={(val) => <CurrencyDisplay value={val as number} size="large" />}
                        prefix={<CreditCardOutlined style={{ color: '#faad14' }} />}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {getCountByType('Liability')} Outstanding Accounts
                    </Text>
                </Col>
                <Col xs={24} sm={8}>
                    <Statistic
                        title="Equity"
                        value={equityTotal}
                        formatter={(val) => <CurrencyDisplay value={val as number} size="large" />}
                        prefix={<PieChartOutlined style={{ color: '#722ed1' }} />}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {getCountByType('Equity')} Capital Accounts
                    </Text>
                </Col>
            </Row>

            <Divider style={{ margin: '24px 0' }} />

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12}>
                    <div style={{ padding: '16px', borderRadius: '8px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Statistic
                            title={<span style={{ color: '#3f8600' }}>Annual Income</span>}
                            value={incomeTotal}
                            formatter={(val) => <CurrencyDisplay value={val as number} size="large" />}
                            prefix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
                        />
                        <div style={{ marginTop: '8px' }}>
                            <Progress percent={100} size="small" showInfo={false} strokeColor="#52c41a" />
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12}>
                    <div style={{ padding: '16px', borderRadius: '8px', background: '#fff1f0', border: '1px solid #ffa39e' }}>
                        <Statistic
                            title={<span style={{ color: '#cf1322' }}>Operating Expenses</span>}
                            value={Math.abs(expenseTotal)}
                            formatter={(val) => <CurrencyDisplay value={val as number} size="large" />}
                            prefix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
                        />
                        <div style={{ marginTop: '8px' }}>
                            <Progress percent={70} size="small" showInfo={false} strokeColor="#ff4d4f" />
                        </div>
                    </div>
                </Col>
            </Row>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InfoCircleOutlined style={{ color: token.colorTextSecondary, fontSize: '12px' }} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Data aggregated from Chart of Accounts. Last updated in real-time.
                </Text>
            </div>
        </Card>
    );
};

export default AccountTypesMetrics;
