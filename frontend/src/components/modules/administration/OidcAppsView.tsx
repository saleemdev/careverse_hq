import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Form,
    Input,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tabs,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import {
    BookOutlined,
    EditOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    KeyOutlined,
    LockOutlined,
    PlusOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import useOidcAppsStore from '../../../stores/modules/oidcAppsStore';
import type { OidcApp } from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

type WorkspaceTabKey = 'overview' | 'create' | 'edit' | 'quickstart' | 'rotate' | 'status';

type SecretReveal = {
    kind: 'create' | 'rotate';
    appName: string;
    clientId?: string;
    clientSecret: string;
    note: string;
};

const createDefaults = {
    app_name: '',
    owner_system: '',
    contacts: '',
    status: 'Draft',
    client_type: 'Web Confidential',
    trusted_client: false,
    default_redirect_uri: '',
    redirect_uris_text: '',
    scopes: ['openid', 'profile', 'email'],
    description: '',
};

const statusColor = (status: string) => {
    if (status === 'Active') return 'success';
    if (status === 'Disabled') return 'default';
    if (status === 'Archived') return 'purple';
    return 'orange';
};

const parseMultiline = (value: string): string[] => (
    value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
);

const AUDIT_ACTION_LABELS: Record<string, string> = {
    create_oidc_app: 'App created',
    update_oidc_app: 'App updated',
    rotate_oidc_client_secret: 'Secret rotated',
    set_oidc_app_status: 'Status changed',
};

const formatAuditAction = (action?: string): string => {
    if (!action) return 'Activity';
    if (AUDIT_ACTION_LABELS[action]) return AUDIT_ACTION_LABELS[action];
    return action
        .split('_')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
};

const formatAuditDetails = (reason?: string, details?: string): string => {
    if (reason?.trim()) return reason.trim();
    if (!details?.trim()) return 'No notes added.';
    try {
        const parsed = JSON.parse(details);
        if (!parsed || typeof parsed !== 'object') return 'No notes added.';
        const entries = Object.entries(parsed as Record<string, unknown>)
            .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
            .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${String(value)}`);
        return entries.length ? entries.join(' | ') : 'No notes added.';
    } catch {
        return details.trim() || 'No notes added.';
    }
};

const buildQuickstartText = (origin: string, quickstart?: ReturnType<typeof useOidcAppsStore.getState>['quickstart']) => {
    if (!quickstart?.oauth) return '';
    const oauth = quickstart.oauth;

    return [
        `issuer: ${origin}`,
        `authorization_endpoint: ${oauth.authorization_endpoint}`,
        `token_endpoint: ${oauth.token_endpoint}`,
        `userinfo_endpoint: ${oauth.userinfo_endpoint}`,
        `client_id: ${oauth.client_id}`,
        `token_endpoint_auth_method: ${oauth.token_endpoint_auth_method}`,
        `scopes: ${oauth.scopes.join(' ')}`,
        `redirect_uris:`,
        ...oauth.redirect_uris.map((uri) => `  - ${uri}`),
    ].join('\n');
};

const validateRedirectUri = (_: unknown, value: string): Promise<void> => {
    const uris = value
        ? value.split('\n').map((u) => u.trim()).filter(Boolean)
        : [];
    for (const uri of uris) {
        const isHttps = uri.startsWith('https://');
        const isLocalhost = uri.startsWith('http://localhost') || uri.startsWith('http://127.0.0.1');
        if (!isHttps && !isLocalhost) {
            return Promise.reject('Use HTTPS redirect URLs. http://localhost is allowed only for local testing.');
        }
    }
    return Promise.resolve();
};

const validateDefaultRedirectUri = (_: unknown, value: string): Promise<void> => {
    const uri = (value || '').trim();
    if (!uri) return Promise.resolve();
    const isHttps = uri.startsWith('https://');
    const isLocalhost = uri.startsWith('http://localhost') || uri.startsWith('http://127.0.0.1');
    if (!isHttps && !isLocalhost) {
        return Promise.reject('Use HTTPS. http://localhost is allowed only for local testing.');
    }
    return Promise.resolve();
};

const OidcAppsView: React.FC = () => {
    const [editorForm] = Form.useForm();
    const [rotateForm] = Form.useForm();
    const [statusForm] = Form.useForm();

    const watchedClientType = Form.useWatch('client_type', editorForm) as string | undefined;
    const watchedScopes = Form.useWatch('scopes', editorForm) as string[] | undefined;
    const isNativePublic = watchedClientType === 'Native Public';
    const missingOpenid = Array.isArray(watchedScopes) && watchedScopes.length > 0 && !watchedScopes.includes('openid');

    const {
        apps,
        quickstart,
        selectedApp,
        referenceData,
        filters,
        pagination,
        loadingList,
        loadingDetail,
        loadingQuickstart,
        mutating,
        error,
        fetchReferenceData,
        fetchApps,
        fetchAppDetail,
        fetchQuickstart,
        createApp,
        updateApp,
        setAppStatus,
        rotateClientSecret,
        setFilters,
        setPage,
        clearSelectedApp,
    } = useOidcAppsStore();

    const [activeTab, setActiveTab] = useState<WorkspaceTabKey>('overview');
    const [editingAppId, setEditingAppId] = useState<string | null>(null);
    const [secretReveal, setSecretReveal] = useState<SecretReveal | null>(null);

    useEffect(() => {
        void fetchReferenceData();
    }, [fetchReferenceData]);

    useEffect(() => {
        void fetchApps();
    }, [fetchApps, filters.search, filters.status, filters.client_type, pagination.page, pagination.pageSize]);

    const quickstartText = useMemo(
        () => buildQuickstartText(window.location.origin, quickstart),
        [quickstart]
    );

    const selectedWorkspaceApp = selectedApp?.app || null;

    const loadAppDetail = async (appId: string) => {
        const ok = await fetchAppDetail(appId);
        if (!ok) {
            message.error("We couldn't load app details. Try again.");
            return null;
        }

        return useOidcAppsStore.getState().selectedApp;
    };

    const openCreate = () => {
        clearSelectedApp();
        setEditingAppId(null);
        setSecretReveal(null);
        editorForm.resetFields();
        editorForm.setFieldsValue(createDefaults);
        setActiveTab('create');
    };

    const openOverview = async (appId: string) => {
        const detail = await loadAppDetail(appId);
        if (!detail?.app) return;

        setEditingAppId(null);
        setActiveTab('overview');
        setSecretReveal(null);
    };

    const openEdit = async (appId: string) => {
        const detail = await loadAppDetail(appId);
        if (!detail?.app) {
            return;
        }

        setEditingAppId(appId);
        editorForm.resetFields();
        editorForm.setFieldsValue({
            app_name: detail.app.app_name,
            owner_system: detail.app.owner_system || '',
            contacts: detail.app.contacts || '',
            status: detail.app.status || 'Draft',
            client_type: detail.app.client_type || 'Web Confidential',
            trusted_client: Boolean(detail.app.trusted_client),
            default_redirect_uri: detail.app.default_redirect_uri || '',
            redirect_uris_text: (detail.app.redirect_uris || []).join('\n'),
            scopes: detail.app.scopes || ['openid'],
            description: detail.app.description || '',
        });
        setSecretReveal(null);
        setActiveTab('edit');
    };

    const openQuickstart = async (appId: string) => {
        const detail = await loadAppDetail(appId);
        if (!detail?.app) {
            return;
        }

        const ok = await fetchQuickstart(appId);
        if (!ok) {
            message.error("We couldn't load setup details. Try again.");
            return;
        }

        setSecretReveal(null);
        setEditingAppId(null);
        setActiveTab('quickstart');
    };

    const openRotate = async (appId: string) => {
        const detail = await loadAppDetail(appId);
        if (!detail?.app) {
            return;
        }

        rotateForm.resetFields();
        rotateForm.setFieldsValue({
            reason: 'Manual rotation from Admin Central',
        });
        setSecretReveal(null);
        setActiveTab('rotate');
        setEditingAppId(null);
    };

    const openStatus = async (appId: string) => {
        const detail = await loadAppDetail(appId);
        if (!detail?.app) {
            return;
        }

        const nextStatus = detail.app.status === 'Active' ? 'Disabled' : 'Active';
        statusForm.resetFields();
        statusForm.setFieldsValue({
            status: nextStatus,
            reason: '',
        });
        setSecretReveal(null);
        setActiveTab('status');
        setEditingAppId(null);
    };

    const canEditSelectedApp = Boolean(editingAppId && selectedWorkspaceApp?.id === editingAppId);

    const submitEditor = async () => {
        const values = await editorForm.validateFields();
        const redirectUris = parseMultiline(values.redirect_uris_text || '');

        if (!redirectUris.length) {
            message.error('Add at least one redirect URL.');
            return;
        }

        const payload = {
            app_name: values.app_name?.trim(),
            owner_system: values.owner_system?.trim() || '',
            contacts: values.contacts?.trim() || '',
            status: values.status,
            client_type: values.client_type,
            trusted_client: values.trusted_client ? 1 : 0,
            default_redirect_uri: (values.default_redirect_uri || redirectUris[0]).trim(),
            redirect_uris: redirectUris,
            scopes: values.scopes || ['openid'],
            description: values.description?.trim() || '',
        };

        if (canEditSelectedApp && editingAppId) {
            const ok = await updateApp(editingAppId, payload);
            if (!ok) {
                message.error(useOidcAppsStore.getState().error || "We couldn't save changes.");
                return;
            }

            await loadAppDetail(editingAppId);
            setActiveTab('overview');
            message.success('App updated.');
            return;
        }

        const result = await createApp(payload);
        if (!result.success || !result.app) {
            message.error(result.error || "We couldn't create the app.");
            return;
        }

        if (result.credentials?.client_id && result.credentials?.client_secret) {
            setSecretReveal({
                kind: 'create',
                appName: result.app.app_name,
                clientId: result.credentials.client_id,
                clientSecret: result.credentials.client_secret,
                note: "Copy and store this now. You won't see it again.",
            });
        }

        await loadAppDetail(result.app.id);
        setEditingAppId(result.app.id);
        setActiveTab('overview');
        message.success('App created.');
    };

    const submitRotate = async () => {
        const values = await rotateForm.validateFields();
        if (!selectedWorkspaceApp?.id || !selectedWorkspaceApp?.app_name) {
            message.error('Choose an app first.');
            return;
        }

        const result = await rotateClientSecret(selectedWorkspaceApp.id, values.reason?.trim() || 'Manual rotation from Admin Central');
        if (!result.success || !result.client_secret) {
            message.error(result.error || "We couldn't rotate the secret.");
            return;
        }

        setSecretReveal({
            kind: 'rotate',
            appName: selectedWorkspaceApp.app_name,
            clientSecret: result.client_secret,
            note: "Copy and store this now. You won't see it again.",
        });
        setActiveTab('overview');
        message.success('Secret rotated.');
    };

    const submitStatus = async () => {
        const values = await statusForm.validateFields();
        if (!selectedWorkspaceApp?.id) {
            message.error('Choose an app first.');
            return;
        }

        const ok = await setAppStatus(selectedWorkspaceApp.id, values.status, values.reason?.trim() || undefined);
        if (!ok) {
            message.error(useOidcAppsStore.getState().error || "We couldn't update app status.");
            return;
        }

        setActiveTab('overview');
        message.success(`App ${values.status.toLowerCase()}.`);
    };

    const renderSecretReveal = () => {
        if (!secretReveal) return null;

        return (
            <Alert
                type="warning"
                showIcon
                closable
                onClose={() => setSecretReveal(null)}
                style={{ marginBottom: 16 }}
                message={secretReveal.kind === 'create' ? 'Copy your client credentials' : 'Copy your new client secret'}
                description={(
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Text>{secretReveal.appName}</Text>
                        <Text type="secondary">{secretReveal.note}</Text>
                        <Descriptions bordered size="small" column={1}>
                            {secretReveal.clientId && (
                                <Descriptions.Item label="Client ID">
                                    <Text code copyable>{secretReveal.clientId}</Text>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Client Secret">
                                <Text code copyable>{secretReveal.clientSecret}</Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </Space>
                )}
            />
        );
    };

    const renderSelectedAppOverview = () => {
        if (!selectedWorkspaceApp) {
            return (
                <Empty
                    description="Choose an app to view and manage it."
                >
                    <Button type="primary" onClick={openCreate}>Create app</Button>
                </Empty>
            );
        }

        return (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card size="small" title="App summary">
                    <Descriptions bordered size="small" column={1}>
                        <Descriptions.Item label="App Name">{selectedWorkspaceApp.app_name}</Descriptions.Item>
                        <Descriptions.Item label="Owner System">{selectedWorkspaceApp.owner_system || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Contacts">{selectedWorkspaceApp.contacts || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={statusColor(selectedWorkspaceApp.status)}>{selectedWorkspaceApp.status}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Client Type">{selectedWorkspaceApp.client_type}</Descriptions.Item>
                        <Descriptions.Item label="OAuth Client">{selectedWorkspaceApp.oauth_client ? <Text code>{selectedWorkspaceApp.oauth_client}</Text> : '-'}</Descriptions.Item>
                        <Descriptions.Item label="Trusted Client">{selectedWorkspaceApp.trusted_client ? 'Yes' : 'No'}</Descriptions.Item>
                        <Descriptions.Item label="Default Redirect URI">{selectedWorkspaceApp.default_redirect_uri}</Descriptions.Item>
                        <Descriptions.Item label="Redirect URIs">
                            <Space direction="vertical" size={4}>
                                {(selectedWorkspaceApp.redirect_uris || []).map((uri) => (
                                    <Text key={uri} code>{uri}</Text>
                                ))}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Scopes">{(selectedWorkspaceApp.scopes || []).join(', ') || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Description">{selectedWorkspaceApp.description || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Last Secret Rotated">{selectedWorkspaceApp.last_secret_rotated_on || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Modified">{selectedWorkspaceApp.modified || '-'}</Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card
                    size="small"
                    title="Manage this app"
                    extra={
                        <Space wrap>
                            <Button icon={<EditOutlined />} onClick={() => openEdit(selectedWorkspaceApp.id)}>Edit app</Button>
                            <Button icon={<BookOutlined />} onClick={() => openQuickstart(selectedWorkspaceApp.id)}>Load setup details</Button>
                            <Button icon={<KeyOutlined />} onClick={() => openRotate(selectedWorkspaceApp.id)}>Rotate secret</Button>
                            <Button icon={<SettingOutlined />} onClick={() => openStatus(selectedWorkspaceApp.id)}>Change status</Button>
                        </Space>
                    }
                >
                    <Text type="secondary">
                        Choose an action to update settings, get setup values, rotate the secret, or change status.
                    </Text>
                </Card>

                {selectedApp?.oauth_client && (
                    <Card size="small" title="Client settings">
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="Client ID">
                                <Text code copyable>{selectedApp.oauth_client.client_id || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Grant Type">{selectedApp.oauth_client.grant_type || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Response Type">{selectedApp.oauth_client.response_type || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Token Endpoint Auth Method">{selectedApp.oauth_client.token_endpoint_auth_method || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Skip Consent">{selectedApp.oauth_client.skip_authorization ? 'Yes' : 'No'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}

                <Card size="small" title="Audit trail">
                    {selectedApp?.audit_events?.length ? (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            {selectedApp.audit_events.map((event, index) => (
                                <Alert
                                    key={`${event.event_time || 'event'}-${index}`}
                                    type="info"
                                    showIcon
                                    message={formatAuditAction(event.action)}
                                    description={(
                                        <Space direction="vertical" size={2}>
                                            <Text type="secondary">{event.event_time || '-'}</Text>
                                            <Text>{formatAuditDetails(event.reason, event.details)}</Text>
                                            <Text type="secondary">{event.actor || 'Unknown user'}</Text>
                                        </Space>
                                    )}
                                />
                            ))}
                        </Space>
                    ) : (
                        <Empty description="No activity yet." />
                    )}
                </Card>
            </Space>
        );
    };

    const renderEditorPanel = (mode: 'create' | 'edit') => {
        const title = mode === 'create' ? 'Create app' : 'Edit app';
        const actionText = mode === 'create' ? 'Create app' : 'Save changes';

        if (mode === 'edit' && (!selectedWorkspaceApp || !canEditSelectedApp)) {
            return (
                <Empty
                    description="Choose an app, then select Edit."
                >
                    <Button type="primary" onClick={() => setActiveTab('overview')}>Back to overview</Button>
                </Empty>
            );
        }

        return (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                    type="info"
                    showIcon
                    message={title}
                    description={mode === 'create'
                        ? 'Fill in app details and save.'
                        : 'Update app details and save.'}
                />
                <Form form={editorForm} layout="vertical">
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="App Name" name="app_name" rules={[{ required: true, message: 'App name is required' }]}>
                                <Input placeholder="County HR Portal" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Owner System" name="owner_system">
                                <Input placeholder="County HRMS" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                label={
                                    <Space size={6}>
                                        <span>Client Type</span>
                                        {isNativePublic && (
                                            <Tooltip title="Native Public clients must use PKCE (code_challenge_method=S256). No client secret is used.">
                                                <Tag icon={<LockOutlined />} color="blue" style={{ fontWeight: 500, cursor: 'help' }}>
                                                    PKCE required
                                                </Tag>
                                            </Tooltip>
                                        )}
                                    </Space>
                                }
                                name="client_type"
                                rules={[{ required: true, message: 'Select client type' }]}
                            >
                                <Select options={(referenceData.client_types || []).map((item) => ({ label: item, value: item }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Select status' }]}>
                                <Select options={(referenceData.statuses || []).map((item) => ({ label: item, value: item }))} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Contacts" name="contacts">
                        <Input placeholder="ops@county.go.ke, secops@county.go.ke" />
                    </Form.Item>
                    <Form.Item
                        label="Default Redirect URI"
                        name="default_redirect_uri"
                        rules={[
                            { required: true, message: 'Default redirect URI is required' },
                            { validator: validateDefaultRedirectUri },
                        ]}
                        extra={<span style={{ fontSize: 12, color: 'var(--text-tertiary, #8c8c8c)' }}>Exact match only — no wildcards</span>}
                    >
                        <Input placeholder="https://client.example.com/auth/callback" />
                    </Form.Item>
                    <Form.Item
                        label="Redirect URIs (one per line)"
                        name="redirect_uris_text"
                        rules={[
                            { required: true, message: 'At least one redirect URI is required' },
                            { validator: validateRedirectUri },
                        ]}
                        extra={<span style={{ fontSize: 12, color: 'var(--text-tertiary, #8c8c8c)' }}>HTTPS required · http://localhost allowed for local testing only</span>}
                    >
                        <TextArea
                            rows={4}
                            placeholder={'https://client.example.com/auth/callback\nhttps://client.example.com/oidc/callback'}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <Space size={6}>
                                <span>Scopes</span>
                                <Tooltip title="openid scope is mandatory and will be added automatically if missing.">
                                    <InfoCircleOutlined style={{ color: 'var(--text-tertiary, #8c8c8c)', fontSize: 13 }} />
                                </Tooltip>
                            </Space>
                        }
                        name="scopes"
                        rules={[{ required: true, message: 'Select at least one scope' }]}
                    >
                        <Select
                            mode="multiple"
                            options={(referenceData.supported_scopes || []).map((scope) => ({ label: scope, value: scope }))}
                        />
                    </Form.Item>
                    {missingOpenid && (
                        <Alert
                            type="warning"
                            showIcon
                            message="openid scope is required and will be added automatically on save."
                            style={{ marginBottom: 16, marginTop: -8 }}
                        />
                    )}
                    <Form.Item label="Description" name="description">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item label="Skip consent screen (trusted apps only)" name="trusted_client" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Space wrap>
                        <Button type="primary" loading={mutating || loadingDetail} onClick={submitEditor}>
                            {actionText}
                        </Button>
                        <Button onClick={() => setActiveTab('overview')}>Back to overview</Button>
                    </Space>
                </Form>
            </Space>
        );
    };

    const renderQuickstartPanel = () => {
        if (!selectedWorkspaceApp) {
            return <Empty description="Choose an app first, then load setup values." />;
        }

        const quickstartMatchesSelectedApp = quickstart?.app?.id === selectedWorkspaceApp.id;

        return (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                    type="info"
                    showIcon
                    message="Setup details"
                    description="Use these values when connecting your app."
                />
                <Space wrap>
                    <Button icon={<ReloadOutlined />} loading={loadingQuickstart} onClick={() => openQuickstart(selectedWorkspaceApp.id)}>
                        Refresh setup details
                    </Button>
                    <Button onClick={() => setActiveTab('overview')}>Back to overview</Button>
                </Space>
                <Card size="small" title={quickstart?.app?.app_name || selectedWorkspaceApp.app_name}>
                    {loadingQuickstart ? (
                        <Text>Loading setup details...</Text>
                    ) : !quickstartMatchesSelectedApp ? (
                        <Empty description="Click Refresh setup details to load this app." />
                    ) : (
                        <>
                            <Descriptions bordered size="small" column={1} style={{ marginBottom: 12 }}>
                                <Descriptions.Item label="Client ID">
                                    <Text code copyable>{quickstart?.oauth?.client_id || '-'}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Auth Method">{quickstart?.oauth?.token_endpoint_auth_method || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Sign-in Endpoint">{quickstart?.oauth?.authorization_endpoint || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Token Endpoint">{quickstart?.oauth?.token_endpoint || '-'}</Descriptions.Item>
                                <Descriptions.Item label="UserInfo Endpoint">{quickstart?.oauth?.userinfo_endpoint || '-'}</Descriptions.Item>
                            </Descriptions>
                            <pre
                                style={{
                                    background: '#0b1220',
                                    color: '#e2e8f0',
                                    borderRadius: 10,
                                    padding: 16,
                                    overflowX: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontSize: 12,
                                    margin: 0,
                                }}
                            >
                                {quickstartText || 'No setup details available.'}
                            </pre>
                        </>
                    )}
                </Card>
            </Space>
        );
    };

    const renderRotatePanel = () => {
        if (!selectedWorkspaceApp) {
            return <Empty description="Choose an app first, then rotate the secret." />;
        }

        return (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                    type="warning"
                    showIcon
                    message="Rotate client secret"
                    description="A new secret will be shown once after you confirm."
                />
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="App">{selectedWorkspaceApp.app_name}</Descriptions.Item>
                    <Descriptions.Item label="Current Status">
                        <Tag color={statusColor(selectedWorkspaceApp.status)}>{selectedWorkspaceApp.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Rotated">{selectedWorkspaceApp.last_secret_rotated_on || '-'}</Descriptions.Item>
                </Descriptions>
                <Form form={rotateForm} layout="vertical">
                    <Form.Item
                        label="Reason"
                        name="reason"
                        rules={[{ required: true, message: 'Rotation reason is required' }]}
                    >
                        <TextArea rows={4} placeholder="Why are you rotating this secret?" />
                    </Form.Item>
                    <Space wrap>
                        <Button type="primary" danger loading={mutating} icon={<KeyOutlined />} onClick={submitRotate}>
                            Rotate secret
                        </Button>
                        <Button onClick={() => setActiveTab('overview')}>Back to overview</Button>
                    </Space>
                </Form>
            </Space>
        );
    };

    const renderStatusPanel = () => {
        if (!selectedWorkspaceApp) {
            return <Empty description="Choose an app first, then change status." />;
        }

        return (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                    type="warning"
                    showIcon
                    message="Change app status"
                    description="Choose a status and add a reason."
                />
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="App">{selectedWorkspaceApp.app_name}</Descriptions.Item>
                    <Descriptions.Item label="Current Status">
                        <Tag color={statusColor(selectedWorkspaceApp.status)}>{selectedWorkspaceApp.status}</Tag>
                    </Descriptions.Item>
                </Descriptions>
                <Form form={statusForm} layout="vertical">
                    <Form.Item
                        label="Target Status"
                        name="status"
                        rules={[{ required: true, message: 'Select a target status' }]}
                    >
                        <Select
                            options={(referenceData.statuses || ['Active', 'Disabled']).map((item) => ({ label: item, value: item }))}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Reason"
                        name="reason"
                        rules={[{ required: true, message: 'Reason is required' }]}
                    >
                        <TextArea rows={4} placeholder="Explain why the status is changing." />
                    </Form.Item>
                    <Space wrap>
                        <Button type="primary" loading={mutating} onClick={submitStatus}>
                            Save status
                        </Button>
                        <Button onClick={() => setActiveTab('overview')}>Back to overview</Button>
                    </Space>
                </Form>
            </Space>
        );
    };

    const columns: ColumnsType<OidcApp> = [
        {
            title: 'App',
            key: 'app_name',
            render: (_, row) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{row.app_name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{row.owner_system || 'No owner set'}</Text>
                </Space>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'client_type',
            key: 'client_type',
            width: 150,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
        },
        {
            title: 'OAuth Client',
            dataIndex: 'oauth_client',
            key: 'oauth_client',
            width: 180,
            render: (name?: string) => name ? <Text code>{name}</Text> : <Text type="secondary">-</Text>,
        },
        {
            title: 'Default Redirect URI',
            dataIndex: 'default_redirect_uri',
            key: 'default_redirect_uri',
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 280,
            render: (_, row) => (
                <Space wrap>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => openOverview(row.id)}>Open</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row.id)}>Edit</Button>
                    <Button size="small" icon={<BookOutlined />} onClick={() => openQuickstart(row.id)}>Setup</Button>
                </Space>
            ),
        },
    ];

    const workspaceItems = [
        {
            key: 'overview',
            label: 'Overview',
            children: renderSelectedAppOverview(),
        },
        {
            key: 'create',
            label: 'Create',
            children: renderEditorPanel('create'),
        },
        {
            key: 'edit',
            label: 'Edit',
            children: renderEditorPanel('edit'),
        },
        {
            key: 'quickstart',
            label: 'Setup',
            children: renderQuickstartPanel(),
        },
        {
            key: 'rotate',
            label: 'Rotate Secret',
            children: renderRotatePanel(),
        },
        {
            key: 'status',
            label: 'Status',
            children: renderStatusPanel(),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 16 }}>
                    <Col>
                        <Space align="start">
                            <SafetyCertificateOutlined style={{ fontSize: 22, color: '#1677ff', marginTop: 6 }} />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>OIDC Apps</Title>
                                <Text type="secondary">
                                    Add apps that sign in with Admin Central.
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={() => fetchApps()}>Refresh</Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add App</Button>
                        </Space>
                    </Col>
                </Row>

                <Alert
                    type="info"
                    showIcon
                    message="Start here"
                    description="Add an app, then open it to manage setup values, secret rotation, and status."
                    style={{ marginBottom: 16 }}
                />

                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={error}
                        style={{ marginBottom: 16 }}
                    />
                )}

                {renderSecretReveal()}

                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search
                        allowClear
                        placeholder="Search by app name, owner, or client"
                        style={{ width: 320 }}
                        onSearch={(value) => setFilters({ search: value })}
                        onChange={(event) => {
                            if (!event.target.value) {
                                setFilters({ search: '' });
                            }
                        }}
                    />
                    <Select
                        allowClear
                        placeholder="Status"
                        style={{ width: 160 }}
                        value={filters.status || undefined}
                        options={(referenceData.statuses || []).map((status) => ({ label: status, value: status }))}
                        onChange={(value) => setFilters({ status: value || '' })}
                    />
                    <Select
                        allowClear
                        placeholder="Client Type"
                        style={{ width: 190 }}
                        value={filters.client_type || undefined}
                        options={(referenceData.client_types || []).map((item) => ({ label: item, value: item }))}
                        onChange={(value) => setFilters({ client_type: value || '' })}
                    />
                </Space>

                <Row gutter={16} align="top">
                    <Col xs={24} xl={14}>
                        <Card
                            title="OIDC Apps"
                            extra={<Text type="secondary">{pagination.total} total</Text>}
                            style={{ marginBottom: 16 }}
                        >
                            <Table
                                rowKey="id"
                                loading={loadingList}
                                columns={columns}
                                dataSource={apps}
                                pagination={{
                                    current: pagination.page,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total,
                                    showSizeChanger: false,
                                    onChange: (page) => setPage(page),
                                }}
                                scroll={{ x: 1280 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} xl={10}>
                        <Card
                            title="Workspace"
                            extra={selectedWorkspaceApp ? <Text type="secondary">{selectedWorkspaceApp.app_name}</Text> : <Text type="secondary">Select an app</Text>}
                            style={{ marginBottom: 16 }}
                        >
                            <Tabs
                                activeKey={activeTab}
                                onChange={(key) => setActiveTab(key as WorkspaceTabKey)}
                                items={workspaceItems}
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default OidcAppsView;
