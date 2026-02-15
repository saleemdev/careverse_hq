/**
 * Company Permission Required Component
 * Shown when user lacks Company permission
 * Light, friendly design with header - user is logged in!
 */

import { Button, Typography, Space, Avatar, Dropdown, Modal, message } from 'antd';
import { BankOutlined, ReloadOutlined, LogoutOutlined, MailOutlined, UserOutlined, SettingOutlined, BellOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/authStore';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Paragraph, Text } = Typography;

const CompanyPermissionRequired: React.FC = () => {
	const { user, logout } = useAuthStore();
	const { isMobile, isTablet } = useResponsive();

	const confirmLogout = () => {
		Modal.confirm({
			title: 'Log out of your session?',
			icon: <ExclamationCircleOutlined />,
			content: 'You will be signed out immediately and redirected to the login page.',
			okText: 'Log Out',
			cancelText: 'Stay Signed In',
			centered: true,
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await logout();
				} catch (error: any) {
					message.error(error.message || 'Logout failed. Please try again.');
					throw error;
				}
			},
		});
	};

	// Compact, responsive sizing
	const cardMaxWidth = isMobile ? '100%' : isTablet ? '520px' : '580px';
	const cardPadding = isMobile ? '24px 20px' : isTablet ? '32px 28px' : '36px 32px';
	const iconSize = isMobile ? 60 : isTablet ? 68 : 76;
	const iconFontSize = isMobile ? 30 : isTablet ? 34 : 38;

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
					background: 'rgba(255, 255, 255, 0.7)',
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
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
								width: '32px',
								height: '32px',
								borderRadius: '8px',
								background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#fff',
								fontWeight: 'bold',
								fontSize: '16px',
							}}
						>
							F
						</div>
						{!isMobile && (
							<Text strong style={{ fontSize: '16px', color: '#1e293b' }}>
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
									color: '#64748b',
									borderRadius: '8px',
								}}
							/>
						)}

						<Dropdown
							menu={{
								items: [
									{
										key: 'profile',
										icon: <UserOutlined />,
										label: 'Profile',
									},
									{
										key: 'settings',
										icon: <SettingOutlined />,
										label: 'Settings',
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
									onClick: ({ key }) => {
										if (key === 'logout') {
											confirmLogout();
										}
									},
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
									background: 'rgba(255, 255, 255, 0.8)',
									border: '1px solid rgba(0, 0, 0, 0.06)',
									transition: 'all 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
									e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
									e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
								}}
							>
								<Avatar
									size={isMobile ? 28 : 32}
									style={{
										background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
										color: '#fff',
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
											fontSize: '14px',
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
						borderRadius: isMobile ? '16px' : '20px',
						background: 'rgba(255, 255, 255, 0.95)',
						backdropFilter: 'blur(20px) saturate(180%)',
						WebkitBackdropFilter: 'blur(20px) saturate(180%)',
						boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
						border: '1px solid rgba(255, 255, 255, 0.8)',
						padding: cardPadding,
						position: 'relative',
						animation: 'slideUp 0.5s ease-out',
					}}
				>
					{/* Top accent bar - Softer colors */}
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: '3px',
							background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
							borderRadius: isMobile ? '16px 16px 0 0' : '20px 20px 0 0',
						}}
					/>

					{/* Icon - Friendlier color */}
					<div style={{ textAlign: 'center', marginBottom: isMobile ? '16px' : '20px', marginTop: isMobile ? '8px' : '12px' }}>
						<div
							style={{
								width: `${iconSize}px`,
								height: `${iconSize}px`,
								borderRadius: '50%',
								background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25), 0 0 0 6px rgba(99, 102, 241, 0.08)',
							}}
						>
							<BankOutlined style={{ fontSize: `${iconFontSize}px`, color: '#fff' }} />
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
						County Permission Required
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
						Your account needs <strong style={{ color: '#1e293b' }}>County (Company) access permission</strong> to use this dashboard. Contact your administrator to get assigned.
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
								background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
								border: 'none',
								boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
							}}
						>
							Refresh Page
						</Button>
							<Button
								icon={<LogoutOutlined />}
								size={isMobile ? 'middle' : 'large'}
								onClick={confirmLogout}
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
