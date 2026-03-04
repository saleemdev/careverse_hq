/**
 * Organization Access Required Component
 * Shown when user lacks Company permission
 * Light, friendly design with header - user is logged in!
 */

import { Button, Typography, Space, Avatar, Dropdown, theme } from 'antd';
import { BankOutlined, ReloadOutlined, LogoutOutlined, MailOutlined, UserOutlined, BellOutlined, LinkOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/authStore';
import { useResponsive } from '../hooks/useResponsive';
import useFacilityStore from '../stores/facilityStore';

const { Title, Paragraph, Text } = Typography;

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
			handleLogout();
			return;
		}
		if (key === 'switch-desk') {
			window.location.assign('/app');
			return;
		}
		onNavigate?.(key);
	};


	const handleLogout = () => {
		logout();
	};

	// Compact, responsive sizing
	const cardMaxWidth = isMobile ? '100%' : isTablet ? '520px' : '580px';
	const cardPadding = isMobile ? '24px 20px' : isTablet ? '32px 28px' : '36px 32px';

	// Get user initials for avatar
	const getInitials = () => {
		if (user?.full_name) {
			return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		return user?.email?.charAt(0).toUpperCase() || 'U';
	};

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '100vh',
				maxHeight: '100vh',
				background: 'linear-gradient(135deg, #f0f4ff 0%, #e6e9f2 50%, #f8fafc 100%)',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* Subtle Background Decorations */}
			<div
				style={{
					position: 'absolute',
					top: '-10%',
					right: '-5%',
					width: isMobile ? '250px' : '450px',
					height: isMobile ? '250px' : '450px',
					background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
					borderRadius: '50%',
					filter: 'blur(60px)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					bottom: '-10%',
					left: '-5%',
					width: isMobile ? '280px' : '500px',
					height: isMobile ? '280px' : '500px',
					background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
					borderRadius: '50%',
					filter: 'blur(60px)',
				}}
			/>

			{/* Header with User Info */}
			<div
				style={{
					position: 'relative',
					zIndex: 10,
					background: '#fff',
					borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
					padding: isMobile ? '12px 16px' : '16px 24px',
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
					{/* Logo/Brand */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<div
							style={{
								width: '36px',
								height: '36px',
								borderRadius: '8px',
								background: 'rgba(24, 144, 255, 0.18)',
								backdropFilter: 'blur(12px)',
								WebkitBackdropFilter: 'blur(12px)',
								border: '1px solid rgba(24, 144, 255, 0.30)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: token.colorPrimary,
								fontWeight: 'bold',
								fontSize: '16px',
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
								className="header-action-btn"
								style={{ width: '38px', height: '38px', fontSize: '15px' }}
							/>
						)}

						<Dropdown
							menu={{
								items: [
									{
										key: 'profile',
										icon: <UserOutlined />,
										label: 'My Profile',
									},
									{
										key: 'switch-desk',
										icon: <LinkOutlined />,
										label: 'Switch to Desk',
									},
									{
										type: 'divider',
									},
									{
										key: 'logout',
										icon: <LogoutOutlined />,
										label: 'Logout',
										danger: true,
									},
								],
								onClick: handleUserMenuClick,
							}}
							placement="bottomRight"
						>
							<div
								className="header-user-trigger"
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									cursor: 'pointer',
									padding: '6px 12px',
									borderRadius: '10px',
									background: 'rgba(255, 255, 255, 0.8)',
									border: '1px solid rgba(0, 0, 0, 0.06)',
									transition: 'all 0.2s',
								}}
							>
								<Avatar
									size={isMobile ? 28 : 32}
									style={{
										background: 'rgba(24, 144, 255, 0.12)',
								backdropFilter: 'blur(12px)',
								WebkitBackdropFilter: 'blur(12px)',
								border: '1px solid rgba(24, 144, 255, 0.15)',
										color: '#1890ff',
										fontWeight: 600,
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

			{/* Main Content - Centered Card */}
			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: isMobile ? '16px' : '24px',
					position: 'relative',
					zIndex: 1,
					overflow: 'auto',
				}}
			>
				<div
					style={{
						maxWidth: cardMaxWidth,
						width: '100%',
						borderRadius: '12px',
						background: '#fff',
						boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
						border: 'none',
						padding: cardPadding,
						position: 'relative',
						animation: 'slideUp 0.5s ease-out',
					}}
				>
					{/* Icon - Friendly blue color */}
					<div style={{ textAlign: 'center', marginBottom: isMobile ? '16px' : '20px' }}>
						<div
							style={{
								width: '48px',
								height: '48px',
								borderRadius: '12px',
								background: '#1890ff15',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '18px',
								color: '#1890ff',
							}}
						>
							<BankOutlined />
						</div>
					</div>

					{/* Title */}
					<Title
						level={isMobile ? 4 : 3}
						style={{
							textAlign: 'center',
							marginBottom: isMobile ? '8px' : '12px',
							marginTop: 0,
							fontSize: isMobile ? '20px' : isTablet ? '24px' : '26px',
							fontWeight: 700,
							color: '#1e293b',
							letterSpacing: '-0.01em',
							lineHeight: 1.2,
						}}
					>
						Organization Access Required
					</Title>

					{/* Status Badge - Friendlier color */}
					<div style={{ textAlign: 'center', marginBottom: isMobile ? '16px' : '20px' }}>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px',
								background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
								padding: isMobile ? '4px 12px' : '6px 14px',
								borderRadius: '100px',
								border: '1px solid #a5b4fc',
							}}
						>
							<Text strong style={{ fontSize: isMobile ? '11px' : '12px', color: '#4f46e5' }}>
								✓ Logged In · Permission Required
							</Text>
						</div>
					</div>

					{/* Description */}
					<Paragraph
						style={{
							textAlign: 'center',
							fontSize: isMobile ? '13px' : '14px',
							lineHeight: 1.6,
							color: '#64748b',
							maxWidth: '480px',
							margin: `0 auto ${isMobile ? '20px' : '24px'}`,
						}}
					>
						Your account needs <strong style={{ color: '#1e293b' }}>organization access permission</strong> to use this dashboard. Contact your administrator to get assigned.
					</Paragraph>

					{/* Instructions - More compact */}
					<div
						style={{
							display: 'flex',
							gap: isMobile ? '10px' : '12px',
							padding: isMobile ? '14px' : '18px',
							background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
							borderRadius: '12px',
							marginBottom: isMobile ? '20px' : '24px',
							border: '1px solid #bae6fd',
						}}
					>
						<div
							style={{
								width: isMobile ? '32px' : '36px',
								height: isMobile ? '32px' : '36px',
								borderRadius: '10px',
								background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<MailOutlined style={{ color: '#fff', fontSize: isMobile ? '16px' : '18px' }} />
						</div>
						<div style={{ flex: 1 }}>
							<Text strong style={{ fontSize: isMobile ? '13px' : '14px', color: '#075985', display: 'block', marginBottom: '4px' }}>
								Next Steps
							</Text>
							<Paragraph
								style={{
									margin: 0,
									fontSize: isMobile ? '12px' : '13px',
									lineHeight: 1.6,
									color: '#0c4a6e',
								}}
							>
								Ask your administrator to assign you to a county. Once done, click "Refresh Page" to access the dashboard.
							</Paragraph>
						</div>
					</div>

					{/* Action Buttons */}
					<Space
						direction={isMobile ? 'vertical' : 'horizontal'}
						size={isMobile ? 10 : 12}
						style={{ width: '100%', justifyContent: 'center' }}
					>
						<Button
							type="primary"
							icon={<ReloadOutlined />}
							size={isMobile ? 'middle' : 'large'}
							onClick={() => window.location.reload()}
							block={isMobile}
							style={{
								height: isMobile ? '40px' : '44px',
								fontSize: isMobile ? '14px' : '15px',
								fontWeight: 600,
								borderRadius: '10px',
								minWidth: isMobile ? 'auto' : '150px',
								background: 'linear-gradient(135deg, #1890ff 0%, #1890ff 100%)',
								border: 'none',
								boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
								color: '#fff',
							}}
						>
							Refresh Page
						</Button>
							<Button
								icon={<LogoutOutlined />}
								size={isMobile ? 'middle' : 'large'}
								onClick={handleLogout}
								block={isMobile}
								style={{
								height: isMobile ? '40px' : '44px',
								fontSize: isMobile ? '14px' : '15px',
								fontWeight: 600,
								borderRadius: '10px',
								minWidth: isMobile ? 'auto' : '130px',
								background: '#fff',
								border: '2px solid #e2e8f0',
								color: '#64748b',
							}}
						>
							Logout
						</Button>
					</Space>
				</div>
			</div>

			{/* Inline keyframe animations */}
			<style>{`
				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				/* Smooth scrollbar */
				div::-webkit-scrollbar {
					width: 6px;
				}

				div::-webkit-scrollbar-track {
					background: rgba(0, 0, 0, 0.03);
					border-radius: 3px;
				}

				div::-webkit-scrollbar-thumb {
					background: rgba(0, 0, 0, 0.15);
					border-radius: 3px;
				}

				div::-webkit-scrollbar-thumb:hover {
					background: rgba(0, 0, 0, 0.25);
				}

				/* Touch optimization for mobile */
				@media (hover: none) {
					button {
						-webkit-tap-highlight-color: transparent;
					}
				}
			`}</style>
		</div>
	);
};

export default CompanyPermissionRequired;
