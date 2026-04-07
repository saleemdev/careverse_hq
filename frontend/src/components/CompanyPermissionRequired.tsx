/**
 * Organization Access Required Component
 * Shown when user is authenticated but lacks Company permission
 * Glassmorphic design with warm, guided next-steps flow
 */

import React from 'react';
import { Button, Typography, Avatar, Dropdown, theme } from 'antd';
import {
	ReloadOutlined,
	LogoutOutlined,
	UserOutlined,
	BellOutlined,
	LinkOutlined,
	SafetyCertificateOutlined,
	CheckCircleFilled,
	ArrowRightOutlined,
	TeamOutlined,
	MessageOutlined,
	SyncOutlined,
} from '@ant-design/icons';
import useAuthStore from '../stores/authStore';
import { useResponsive } from '../hooks/useResponsive';
import useFacilityStore from '../stores/facilityStore';

const { Title, Paragraph, Text } = Typography;
const FEATURE_ENABLED = import.meta.env.VITE_ENABLE_FACILITY_ONBOARDING !== 'false';

interface CompanyPermissionRequiredProps {
	onNavigate?: (route: string, id?: string) => void;
}

const CompanyPermissionRequired: React.FC<CompanyPermissionRequiredProps> = ({ onNavigate }) => {
	const { user, logout } = useAuthStore();
	const { company } = useFacilityStore();
	const { isMobile, isTablet } = useResponsive();
	const { token } = theme.useToken();

	const handleUserMenuClick = ({ key }: { key: string }) => {
		if (key === 'logout') {
			void logout();
			return;
		}
		if (key === 'switch-desk') {
			window.location.assign('/app');
			return;
		}
		onNavigate?.(key);
	};

	const cardMaxWidth = isMobile ? '100%' : isTablet ? '560px' : '620px';
	const cardPadding = isMobile ? '28px 20px' : isTablet ? '36px 32px' : '40px 36px';

	const getInitials = () => {
		if (user?.full_name) {
			return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		return user?.email?.charAt(0).toUpperCase() || 'U';
	};

	const steps = [
		{
			icon: <MessageOutlined style={{ fontSize: '16px' }} />,
			title: 'Contact your administrator',
			description: 'Ask them to assign an Organization Permission to your account from User Management.',
		},
		{
			icon: <TeamOutlined style={{ fontSize: '16px' }} />,
			title: 'Administrator assigns access',
			description: 'They will link your account to the appropriate organization with the correct access level.',
		},
		{
			icon: <SyncOutlined style={{ fontSize: '16px' }} />,
			title: 'Refresh and you\'re in',
			description: 'Once assigned, simply refresh this page to access the dashboard.',
		},
	];

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '100vh',
				maxHeight: '100vh',
				background: 'linear-gradient(160deg, #f0f4ff 0%, #e8ecf8 30%, #f3eef8 60%, #f8fafc 100%)',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* Ambient background orbs */}
			<div
				style={{
					position: 'absolute',
					top: '-15%',
					right: '-8%',
					width: isMobile ? '300px' : '550px',
					height: isMobile ? '300px' : '550px',
					background: 'radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, rgba(139, 92, 246, 0.04) 50%, transparent 70%)',
					borderRadius: '50%',
					filter: 'blur(80px)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					bottom: '-12%',
					left: '-8%',
					width: isMobile ? '320px' : '600px',
					height: isMobile ? '320px' : '600px',
					background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.04) 50%, transparent 70%)',
					borderRadius: '50%',
					filter: 'blur(80px)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: '40%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: isMobile ? '200px' : '400px',
					height: isMobile ? '200px' : '400px',
					background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 60%)',
					borderRadius: '50%',
					filter: 'blur(60px)',
				}}
			/>

			{/* Header */}
			<div
				style={{
					position: 'relative',
					zIndex: 10,
					background: 'rgba(255, 255, 255, 0.72)',
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
					boxShadow: '0 1px 12px rgba(0, 0, 0, 0.04)',
					padding: isMobile ? '12px 16px' : '14px 24px',
				}}
			>
				<div
					style={{
						maxWidth: '1400px',
						margin: '0 auto',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					{/* Logo */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<div
							style={{
								width: '36px',
								height: '36px',
								borderRadius: '10px',
								background: 'rgba(24, 144, 255, 0.12)',
								backdropFilter: 'blur(12px)',
								WebkitBackdropFilter: 'blur(12px)',
								border: '1px solid rgba(24, 144, 255, 0.20)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								overflow: 'hidden',
							}}
						>
							{company?.company_logo ? (
								<img
									src={company.company_logo}
									alt={`${company.company_name || company.name} logo`}
									style={{ width: '100%', height: '100%', objectFit: 'cover' }}
								/>
							) : (
								<SafetyCertificateOutlined style={{ fontSize: '16px', color: token.colorPrimary }} />
							)}
						</div>
						{!isMobile && (
							<Text strong style={{ fontSize: '14px', color: '#1e293b' }}>
								F360 Central
							</Text>
						)}
					</div>

					{/* User Menu */}
					<div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
						{!isMobile && (
							<Button
								type="text"
								icon={<BellOutlined />}
								style={{
									width: '36px',
									height: '36px',
									fontSize: '15px',
									borderRadius: '10px',
									background: 'rgba(255, 255, 255, 0.5)',
									border: '1px solid rgba(0, 0, 0, 0.04)',
								}}
							/>
						)}

						<Dropdown
							menu={{
								items: [
									{ key: 'profile', icon: <UserOutlined />, label: 'My Profile' },
									{ key: 'switch-desk', icon: <LinkOutlined />, label: 'Switch to Desk' },
									{ type: 'divider' },
									{ key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
								],
								onClick: handleUserMenuClick,
							}}
							placement="bottomRight"
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									cursor: 'pointer',
									padding: '6px 12px',
									borderRadius: '10px',
									background: 'rgba(255, 255, 255, 0.6)',
									backdropFilter: 'blur(12px)',
									WebkitBackdropFilter: 'blur(12px)',
									border: '1px solid rgba(0, 0, 0, 0.06)',
									transition: 'all 0.2s',
								}}
							>
								<Avatar
									size={isMobile ? 28 : 30}
									style={{
										background: 'rgba(24, 144, 255, 0.12)',
										color: '#1890ff',
										fontWeight: 600,
										fontSize: '12px',
									}}
									src={user?.user_image}
								>
									{!user?.user_image && getInitials()}
								</Avatar>
								{!isMobile && (
									<Text
										strong
										style={{
											fontSize: '12px',
											color: '#1e293b',
											maxWidth: '120px',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
									</Text>
								)}
							</div>
						</Dropdown>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: isMobile ? '20px 16px' : '24px',
					position: 'relative',
					zIndex: 1,
					overflow: 'auto',
				}}
			>
				<div
					style={{
						maxWidth: cardMaxWidth,
						width: '100%',
						borderRadius: '20px',
						background: 'rgba(255, 255, 255, 0.55)',
						backdropFilter: 'blur(24px)',
						WebkitBackdropFilter: 'blur(24px)',
						boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.6) inset',
						border: '1px solid rgba(255, 255, 255, 0.6)',
						padding: cardPadding,
						position: 'relative',
						animation: 'slideUp 0.5s ease-out',
					}}
				>
					{/* Greeting */}
					<div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '24px' }}>
						<div
							style={{
								width: '56px',
								height: '56px',
								borderRadius: '16px',
								background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
								backdropFilter: 'blur(8px)',
								WebkitBackdropFilter: 'blur(8px)',
								border: '1px solid rgba(99, 102, 241, 0.15)',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: '16px',
							}}
						>
							<SafetyCertificateOutlined style={{ fontSize: '24px', color: '#6366f1' }} />
						</div>

						<Title
							level={isMobile ? 4 : 3}
							style={{
								marginBottom: '8px',
								marginTop: 0,
								fontSize: isMobile ? '20px' : isTablet ? '24px' : '26px',
								fontWeight: 700,
								color: '#1e293b',
								letterSpacing: '-0.02em',
								lineHeight: 1.2,
							}}
						>
							Almost there, {user?.full_name?.split(' ')[0] || 'there'}!
						</Title>

						{/* Status pill */}
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px',
								background: 'rgba(16, 185, 129, 0.10)',
								backdropFilter: 'blur(8px)',
								WebkitBackdropFilter: 'blur(8px)',
								padding: '5px 14px',
								borderRadius: '100px',
								border: '1px solid rgba(16, 185, 129, 0.20)',
								marginBottom: '12px',
							}}
						>
							<CheckCircleFilled style={{ fontSize: '12px', color: '#10b981' }} />
							<Text style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>
								Signed in successfully
							</Text>
						</div>

						<Paragraph
							style={{
								fontSize: isMobile ? '13px' : '14px',
								lineHeight: 1.7,
								color: '#64748b',
								maxWidth: '440px',
								margin: '0 auto',
							}}
						>
							Your account needs to be linked to an organization before you can access the dashboard. Follow the steps below to get started.
						</Paragraph>
					</div>

					{/* Steps */}
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '0px',
							marginBottom: isMobile ? '24px' : '28px',
						}}
					>
						{steps.map((step, index) => (
							<div
								key={index}
								style={{
									display: 'flex',
									gap: isMobile ? '14px' : '16px',
									alignItems: 'flex-start',
								}}
							>
								{/* Step connector */}
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										flexShrink: 0,
									}}
								>
									<div
										style={{
											width: '36px',
											height: '36px',
											borderRadius: '12px',
											background: index === 0
												? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
												: 'rgba(99, 102, 241, 0.08)',
											border: index === 0
												? 'none'
												: '1px solid rgba(99, 102, 241, 0.15)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: index === 0 ? '#fff' : '#6366f1',
											flexShrink: 0,
										}}
									>
										{step.icon}
									</div>
									{index < steps.length - 1 && (
										<div
											style={{
												width: '2px',
												height: '24px',
												background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)',
												borderRadius: '1px',
											}}
										/>
									)}
								</div>

								{/* Step content */}
								<div style={{ flex: 1, paddingBottom: index < steps.length - 1 ? '12px' : '0' }}>
									<Text
										strong
										style={{
											fontSize: isMobile ? '13px' : '14px',
											color: '#1e293b',
											display: 'block',
											marginBottom: '2px',
											lineHeight: '36px',
										}}
									>
										{step.title}
									</Text>
									<Paragraph
										style={{
											margin: 0,
											fontSize: isMobile ? '12px' : '13px',
											lineHeight: 1.6,
											color: '#64748b',
										}}
									>
										{step.description}
									</Paragraph>
								</div>
							</div>
						))}
					</div>

					{/* Actions */}
					<div
						style={{
							display: 'flex',
							flexDirection: isMobile ? 'column' : 'row',
							gap: '10px',
							justifyContent: 'center',
						}}
					>
						<Button
							type="primary"
							icon={<ReloadOutlined />}
							size={isMobile ? 'middle' : 'large'}
							onClick={() => window.location.reload()}
							block={isMobile}
							style={{
								height: isMobile ? '42px' : '46px',
								fontSize: isMobile ? '14px' : '15px',
								fontWeight: 600,
								borderRadius: '12px',
								minWidth: isMobile ? 'auto' : '180px',
								background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
								border: 'none',
								boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
								color: '#fff',
							}}
						>
							Refresh Page
						</Button>
						{FEATURE_ENABLED && (
							<Button
								icon={<ArrowRightOutlined />}
								size={isMobile ? 'middle' : 'large'}
								onClick={() => onNavigate?.('facilities/new')}
								block={isMobile}
								style={{
									height: isMobile ? '42px' : '46px',
									fontSize: isMobile ? '14px' : '15px',
									fontWeight: 600,
									borderRadius: '12px',
									minWidth: isMobile ? 'auto' : '190px',
									background: 'rgba(99, 102, 241, 0.08)',
									border: '1px solid rgba(99, 102, 241, 0.18)',
									color: '#4f46e5',
								}}
							>
								Onboard Your Facility
							</Button>
						)}
						<Button
							icon={<ArrowRightOutlined />}
							size={isMobile ? 'middle' : 'large'}
							onClick={() => onNavigate?.('profile')}
							block={isMobile}
							style={{
								height: isMobile ? '42px' : '46px',
								fontSize: isMobile ? '14px' : '15px',
								fontWeight: 600,
								borderRadius: '12px',
								minWidth: isMobile ? 'auto' : '160px',
								background: 'rgba(255, 255, 255, 0.6)',
								backdropFilter: 'blur(8px)',
								WebkitBackdropFilter: 'blur(8px)',
								border: '1px solid rgba(0, 0, 0, 0.08)',
								color: '#475569',
							}}
						>
							View Profile
						</Button>
						<Button
							type="text"
							icon={<LogoutOutlined />}
							size={isMobile ? 'middle' : 'large'}
							onClick={() => { void logout(); }}
							block={isMobile}
							style={{
								height: isMobile ? '42px' : '46px',
								fontSize: isMobile ? '13px' : '14px',
								fontWeight: 500,
								borderRadius: '12px',
								color: '#94a3b8',
							}}
						>
							Sign Out
						</Button>
					</div>
				</div>
			</div>

			{/* Keyframes */}
			<style>{`
				@keyframes slideUp {
					from { opacity: 0; transform: translateY(24px); }
					to { opacity: 1; transform: translateY(0); }
				}

				@media (hover: none) {
					button { -webkit-tap-highlight-color: transparent; }
				}
			`}</style>
		</div>
	);
};

export default CompanyPermissionRequired;
