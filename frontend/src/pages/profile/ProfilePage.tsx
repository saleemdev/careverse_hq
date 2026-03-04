import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Avatar, Button, Card, Col, Descriptions, Empty, List, Row, Space, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, CameraOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import { profileApi } from '../../services/api';

const { Title, Text } = Typography;

interface ProfilePageProps {
    navigateToRoute?: (route: string, id?: string) => void;
    showStandaloneHeader?: boolean;
}

interface ProfilePermission {
    allow: string;
    for_value: string;
    is_default?: number;
    applicable_for?: string;
}

interface ProfileData {
    name: string;
    email: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    mobile_no?: string;
    user_image?: string | null;
    roles?: string[];
    user_permissions?: ProfilePermission[];
}

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });

const ProfilePage: React.FC<ProfilePageProps> = ({ navigateToRoute, showStandaloneHeader = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user, updateUser, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const response = await profileApi.getMyProfile();
            if (response.success && response.data) {
                setProfile(response.data as ProfileData);
            } else if (user) {
                setProfile({
                    name: user.name,
                    email: user.email,
                    full_name: user.full_name,
                    user_image: user.user_image,
                    roles: user.roles,
                    user_permissions: [],
                });
            }
            setLoading(false);
        };

        loadProfile();
    }, [user]);

    const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            message.error('Please select a valid image file.');
            return;
        }

        setUploading(true);
        try {
            const uploadResponse = await profileApi.uploadMyAvatar(file, profile?.name || user?.name);
            if (!uploadResponse.success || !uploadResponse.data?.file_url) {
                throw new Error(uploadResponse.error || 'Failed to upload avatar file');
            }

            let avatarUrl = uploadResponse.data.file_url;
            const saveResponse = await profileApi.setMyAvatar(avatarUrl);

            if (!saveResponse.success) {
                // Compatibility fallback for environments where multipart handling varies.
                const fallbackResponse = await profileApi.uploadMyAvatarBase64(file.name, await fileToBase64(file));
                if (!fallbackResponse.success || !fallbackResponse.data?.user_image) {
                    throw new Error(saveResponse.error || fallbackResponse.error || 'Failed to save avatar');
                }
                avatarUrl = fallbackResponse.data.user_image;
            }

            setProfile((prev) => (prev ? { ...prev, user_image: avatarUrl || prev.user_image } : prev));
            updateUser({ user_image: avatarUrl });
            message.success('Profile photo updated successfully.');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar.';
            message.error(errorMessage);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (loading) {
        return (
            <div className="profile-page loading-state">
                <Spin size="large" />
            </div>
        );
    }

    const permissions = profile?.user_permissions || [];

    return (
        <div className="profile-page">
            {showStandaloneHeader && (
                <Card className="profile-standalone-header">
                    <div className="profile-standalone-header-inner">
                        <Space direction="vertical" size={2}>
                            <Text className="profile-standalone-title">My Profile</Text>
                            <Text type="secondary">Account and permission details</Text>
                        </Space>
                        <Space wrap>
                            <Button onClick={() => navigateToRoute?.('dashboard')}>Back to Access Page</Button>
                            <Button onClick={() => { window.location.assign('/app'); }}>Switch to Desk</Button>
                            <Button danger onClick={() => { void logout(); }}>Logout</Button>
                        </Space>
                    </div>
                </Card>
            )}

            <Card className="profile-hero-card">
                <Row gutter={[24, 20]} align="middle">
                    <Col xs={24} lg={14}>
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <Text type="secondary" className="profile-label">MY PROFILE</Text>
                            <Space size={16} align="center">
                                <div className="profile-avatar-shell">
                                    <Avatar
                                        size={92}
                                        src={profile?.user_image || user?.user_image}
                                        className="profile-avatar"
                                        icon={<UserOutlined />}
                                    />
                                </div>
                                <div>
                                    <Title level={3} style={{ margin: 0 }}>
                                        {profile?.full_name || user?.full_name || 'My Profile'}
                                    </Title>
                                    <Text type="secondary">{profile?.email || user?.email || ''}</Text>
                                </div>
                            </Space>
                        </Space>
                    </Col>
                    <Col xs={24} lg={10}>
                        <div className="profile-action-panel">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleAvatarUpload}
                            />
                            <Space wrap>
                                <Button
                                    icon={<CameraOutlined />}
                                    loading={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="profile-primary-action"
                                >
                                    Upload Avatar
                                </Button>
                                <Button icon={<LockOutlined />} onClick={() => { window.location.href = '/update-password'; }}>
                                    Change Password
                                </Button>
                                <Button icon={<ArrowLeftOutlined />} onClick={() => navigateToRoute?.('dashboard')}>
                                    Back to Dashboard
                                </Button>
                            </Space>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card className="profile-section-card" title="Personal Information">
                        <Descriptions
                            size="middle"
                            column={1}
                            items={[
                                { key: 'username', label: 'Username', children: profile?.name || user?.name || '-' },
                                { key: 'first_name', label: 'First Name', children: profile?.first_name || '-' },
                                { key: 'last_name', label: 'Last Name', children: profile?.last_name || '-' },
                                { key: 'phone', label: 'Phone Number', children: profile?.phone || profile?.mobile_no || '-' },
                                { key: 'email', label: 'Email Address', children: profile?.email || user?.email || '-' },
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card className="profile-section-card" title="Roles">
                        <Space wrap>
                            {(profile?.roles || user?.roles || []).map((role) => (
                                <Tag key={role} className="profile-role-tag">{role}</Tag>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card
                className="profile-section-card"
                title={(
                    <Space>
                        <SafetyCertificateOutlined />
                        <span>Organization Permissions</span>
                    </Space>
                )}
            >
                {permissions.length === 0 ? (
                    <Empty description="No organization permissions found for your account." />
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={permissions}
                        renderItem={(permission) => (
                            <List.Item className="permission-row">
                                <List.Item.Meta
                                    title={
                                        <Space size={8} wrap>
                                            <Tag color="blue">{permission.allow}</Tag>
                                            <Text strong>{permission.for_value}</Text>
                                            {permission.is_default ? <Tag color="green">Default</Tag> : null}
                                        </Space>
                                    }
                                    description={permission.applicable_for ? `Applicable For: ${permission.applicable_for}` : 'Global permission'}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
};

export default ProfilePage;
