/**
 * Facility Context Switcher Component
 * Multiselect dropdown for health facilities scoped to user's company
 */

import { useState, useEffect } from 'react';
import {
	Select,
	Tag,
	Space,
	Tooltip,
	Typography,
	Spin,
	theme,
	Badge,
} from 'antd';
import {
	MedicineBoxOutlined,
	BankOutlined,
	EnvironmentOutlined,
	ClearOutlined,
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';
import useFacilityStore from '../stores/facilityStore';
import type { Facility } from '../stores/facilityStore';
import { COMPONENT_WIDTHS } from '../styles/tokens';

const { Text } = Typography;

interface FacilityContextSwitcherProps {
	variant?: 'default' | 'compact' | 'minimal';
	showLabel?: boolean;
}

const FacilityContextSwitcher: React.FC<FacilityContextSwitcherProps> = ({
	variant = 'default',
	showLabel = true,
}) => {
	const { token } = theme.useToken();
	const { isMobile, getResponsiveValue } = useResponsive();

	const {
		company,
		availableFacilities,
		selectedFacilities,
		loading,
		setSelectedFacilities,
		clearFacilities,
	} = useFacilityStore();

	const handleChange = (selectedIds: string[]) => {
		if (selectedIds.length === 0) {
			clearFacilities();
		} else {
			const selected = availableFacilities.filter((f) =>
				selectedIds.includes(f.hie_id)
			);
			setSelectedFacilities(selected);
		}
	};

	const handleClear = () => {
		clearFacilities();
	};

	// Get selected facility IDs for Select value
	const selectedValues = selectedFacilities.map((f) => f.hie_id);

	// Minimal variant
	if (variant === 'minimal') {
		return (
			<Select
				mode="multiple"
				value={selectedValues}
				onChange={handleChange}
				placeholder="All Facilities"
				allowClear
				loading={loading}
				style={{ width: getResponsiveValue(COMPONENT_WIDTHS.facilitySelector) }}
				size={isMobile ? 'small' : 'middle'}
				maxTagCount="responsive"
			>
				{availableFacilities.map((facility) => (
					<Select.Option key={facility.hie_id} value={facility.hie_id}>
						<Space>
							<MedicineBoxOutlined />
							{facility.facility_name}
						</Space>
					</Select.Option>
				))}
			</Select>
		);
	}

	// Compact variant
	if (variant === 'compact') {
		return (
			<Space size="small">
				{showLabel && !isMobile && (
					<Tooltip title="Filter by Health Facility">
						<EnvironmentOutlined style={{ color: token.colorTextSecondary }} />
					</Tooltip>
				)}
				<Select
					mode="multiple"
					value={selectedValues}
					onChange={handleChange}
					placeholder="All Facilities"
					allowClear
					loading={loading}
					style={{ width: getResponsiveValue(COMPONENT_WIDTHS.facilitySelector) }}
					maxTagCount="responsive"
					popupMatchSelectWidth={false}
					notFoundContent={loading ? <Spin size="small" /> : 'No facilities found'}
				>
					{availableFacilities.map((facility) => (
						<Select.Option key={facility.hie_id} value={facility.hie_id}>
							<Space>
								<MedicineBoxOutlined style={{ fontSize: '12px' }} />
								<span>{facility.facility_name}</span>
								{facility.facility_mfl && (
									<Tag style={{ fontSize: '10px', margin: 0 }}>
										{facility.facility_mfl}
									</Tag>
								)}
							</Space>
						</Select.Option>
					))}
				</Select>
			</Space>
		);
	}

	// Default variant - full featured
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				flexWrap: isMobile ? 'wrap' : 'nowrap',
				gap: isMobile ? '8px' : '12px',
				padding: isMobile ? '6px 12px' : '8px 16px',
				background: token.colorBgElevated,
				borderRadius: '10px',
				border: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
				width: '100%',
			}}
		>
			{showLabel && (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div
						style={{
							width: '32px',
							height: '32px',
							borderRadius: '8px',
							background: `linear-gradient(135deg, #52c41a 0%, #1890ff 100%)`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#fff',
						}}
					>
						<MedicineBoxOutlined style={{ fontSize: '16px' }} />
					</div>
					{!isMobile && (
						<div style={{ lineHeight: 1.2 }}>
							<Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
								Viewing Data For
							</Text>
							<Text strong style={{ fontSize: '13px' }}>
								{company?.company_name || 'County'}
							</Text>
						</div>
					)}
				</div>
			)}

			<Select
				mode="multiple"
				value={selectedValues}
				onChange={handleChange}
				placeholder={loading ? 'Loading facilities...' : 'Select Facilities'}
				allowClear
				showSearch
				loading={loading}
				filterOption={(input, option) =>
					(option?.label as string)?.toLowerCase().includes(input.toLowerCase())
				}
				style={{
					minWidth: isMobile ? 120 : 280,
					flex: 1,
				}}
				maxTagCount="responsive"
				dropdownStyle={{ minWidth: 320 }}
				notFoundContent={loading ? <Spin size="small" /> : 'No facilities found'}
				optionLabelProp="label"
			>
				{availableFacilities.map((facility) => (
					<Select.Option
						key={facility.hie_id}
						value={facility.hie_id}
						label={facility.facility_name}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<MedicineBoxOutlined style={{ color: token.colorPrimary }} />
							<div style={{ flex: 1 }}>
								<Text strong>{facility.facility_name}</Text>
								<div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
									{facility.facility_mfl && (
										<Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
											MFL: {facility.facility_mfl}
										</Tag>
									)}
									<Tag color="default" style={{ fontSize: '10px', margin: 0 }}>
										{facility.facility_type}
									</Tag>
								</div>
							</div>
						</div>
					</Select.Option>
				))}
			</Select>

			{selectedFacilities.length > 0 && !isMobile && (
				<Tooltip title="Clear all selections (All facilities mode)">
					<Badge count={selectedFacilities.length} showZero={false}>
						<Tag
							color="green"
							closable
							onClose={handleClear}
							style={{ margin: 0, cursor: 'pointer' }}
							icon={<ClearOutlined />}
						>
							{selectedFacilities.length} Selected
						</Tag>
					</Badge>
				</Tooltip>
			)}
		</div>
	);
};

export default FacilityContextSwitcher;
