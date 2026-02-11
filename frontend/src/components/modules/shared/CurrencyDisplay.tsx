import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface CurrencyDisplayProps {
    value: number;
    currency?: string;
    size?: 'small' | 'medium' | 'large';
    bold?: boolean;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
    value,
    currency = 'KES',
    size = 'medium',
    bold = true
}) => {
    const formatted = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency,
    }).format(value);

    let fontSize = '14px';
    if (size === 'small') fontSize = '12px';
    if (size === 'large') fontSize = '18px';

    return (
        <Text strong={bold} style={{ fontSize, fontFamily: 'monospace' }}>
            {formatted}
        </Text>
    );
};

export default CurrencyDisplay;
