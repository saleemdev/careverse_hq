/**
 * Company Permission Required Component
 * Shown when user lacks Company permission
 */

import { Result, Button, Typography } from 'antd';
import { BankOutlined, MailOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/authStore';

const { Paragraph, Text } = Typography;

const CompanyPermissionRequired: React.FC = () => {
	const { user, logout } = useAuthStore();

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '100vh',
				padding: '24px',
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			}}
		>
			<div
				style={{
					background: '#fff',
					borderRadius: '16px',
					padding: '48px',
					maxWidth: '600px',
					boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
				}}
			>
				<Result
					icon={<BankOutlined style={{ color: '#faad14' }} />}
					title="County Permission Required"
					subTitle="No county has been assigned to your account. Please contact your system administrator to grant you access."
					extra={[
						<div key="info" style={{ textAlign: 'left', marginBottom: '24px' }}>
							<Paragraph>
								<Text strong>Logged in as:</Text> {user?.full_name || user?.email}
							</Paragraph>
							<Paragraph type="secondary">
								<MailOutlined /> To gain access, please request a County (Company) user
								permission from your system administrator. Once granted, refresh this page.
							</Paragraph>
						</div>,
						<Button
							key="refresh"
							type="primary"
							size="large"
							onClick={() => window.location.reload()}
						>
							Refresh Page
						</Button>,
						<Button key="logout" size="large" onClick={logout}>
							Logout
						</Button>,
					]}
				/>
			</div>
		</div>
	);
};

export default CompanyPermissionRequired;
