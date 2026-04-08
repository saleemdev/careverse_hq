import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal, Form, Input, Select, DatePicker, Button, Space, Card, Tag,
    Typography, message, Alert, Divider, Spin,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ToolOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import { erpnextAssetsApi } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// CreateMaintenanceTeamModal
// ---------------------------------------------------------------------------

interface CreateTeamProps {
    open: boolean;
    onClose: () => void;
    company: string;
    onCreated: (team: { name: string; maintenance_team_name: string; company: string; members: any[] }) => void;
}

interface TeamMemberRow {
    key: number;
}

let _memberCounter = 0;
const nextMemberKey = () => ++_memberCounter;


const CreateMaintenanceTeamModal: React.FC<CreateTeamProps> = ({ open, onClose, company, onCreated }) => {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [members, setMembers] = useState<TeamMemberRow[]>([{ key: nextMemberKey() }]);

    // Employee search for maintenance manager and member fields
    const [managerOptions, setManagerOptions] = useState<{ name: string; employee_name: string; designation?: string; user_id?: string }[]>([]);
    const [managerSearching, setManagerSearching] = useState(false);
    const [memberOptions, setMemberOptions] = useState<Record<number, { name: string; employee_name: string; designation?: string; user_id?: string }[]>>({});
    const [memberSearching, setMemberSearching] = useState<Record<number, boolean>>({});
    const managerSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const memberSearchRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const managerSeqRef = useRef(0);
    const memberSeqRefs = useRef<Record<number, number>>({});

    useEffect(() => {
        if (!open) {
            form.resetFields();
            setError('');
            setMembers([{ key: nextMemberKey() }]);
            setManagerOptions([]);
            setMemberOptions({});
        }
    }, [open, form]);

    const searchEmployees = useCallback(async (value: string, seq: number, seqRef: React.MutableRefObject<number>) => {
        if (!value || value.length < 2) return [];
        const res = await erpnextAssetsApi.searchEmployees(value, company);
        if (seq !== seqRef.current) return null; // stale
        return res.success ? (res.data?.items || []) : [];
    }, [company]);

    const handleManagerSearch = (value: string) => {
        if (managerSearchRef.current) clearTimeout(managerSearchRef.current);
        if (!value || value.length < 2) { setManagerOptions([]); return; }
        const seq = ++managerSeqRef.current;
        setManagerSearching(true);
        managerSearchRef.current = setTimeout(async () => {
            const results = await searchEmployees(value, seq, managerSeqRef);
            if (results !== null) { setManagerOptions(results || []); }
            if (seq === managerSeqRef.current) setManagerSearching(false);
        }, 300);
    };

    const handleMemberSearch = (memberKey: number, value: string) => {
        if (memberSearchRefs.current[memberKey]) clearTimeout(memberSearchRefs.current[memberKey]);
        if (!value || value.length < 2) { setMemberOptions((prev) => ({ ...prev, [memberKey]: [] })); return; }
        memberSeqRefs.current[memberKey] = (memberSeqRefs.current[memberKey] || 0) + 1;
        const seq = memberSeqRefs.current[memberKey];
        setMemberSearching((prev) => ({ ...prev, [memberKey]: true }));
        memberSearchRefs.current[memberKey] = setTimeout(async () => {
            const res = await erpnextAssetsApi.searchEmployees(value, company);
            if (seq === memberSeqRefs.current[memberKey]) {
                setMemberOptions((prev) => ({ ...prev, [memberKey]: res.success ? (res.data?.items || []) : [] }));
                setMemberSearching((prev) => ({ ...prev, [memberKey]: false }));
            }
        }, 300);
    };

    const addMember = () => setMembers((prev) => [...prev, { key: nextMemberKey() }]);
    const removeMember = (key: number) => {
        if (members.length <= 1) return;
        setMembers((prev) => prev.filter((m) => m.key !== key));
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            setError('');

            const memberPayload = members
                .map((m) => ({
                    team_member: values[`member_${m.key}`],
                }))
                .filter((m) => m.team_member);

            const res = await erpnextAssetsApi.createMaintenanceTeam({
                maintenance_team_name: values.maintenance_team_name,
                company,
                maintenance_manager: values.maintenance_manager || undefined,
                members: memberPayload,
            });

            if (res.success) {
                message.success(`Team "${values.maintenance_team_name}" created`);
                onCreated(res.data);
                onClose();
            } else {
                setError(res.message || res.error || 'Failed to create team');
            }
        } catch {
            // antd validation handles field feedback
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={<Space><TeamOutlined /><span>Create Maintenance Team</span></Space>}
            open={open}
            onCancel={onClose}
            width={isMobile ? '100%' : 680}
            style={{ top: isMobile ? 0 : 24 }}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="create" type="primary" icon={<PlusOutlined />} loading={submitting} onClick={handleCreate}>
                    Create Team
                </Button>,
            ]}
        >
            {error && (
                <Alert type="error" message={error} showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />
            )}
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Team Name"
                    name="maintenance_team_name"
                    rules={[{ required: true, message: 'Team name is required' }]}
                >
                    <Input placeholder="e.g. Biomedical Engineering Team" />
                </Form.Item>

                <Form.Item label="Maintenance Manager" name="maintenance_manager">
                    <Select
                        showSearch
                        allowClear
                        placeholder="Search employee (min 2 characters)"
                        filterOption={false}
                        onSearch={handleManagerSearch}
                        loading={managerSearching}
                        notFoundContent={managerSearching ? <Spin size="small" /> : <Text type="secondary">Type to search</Text>}
                    >
                        {managerOptions.map((e) => (
                            <Select.Option key={e.name} value={e.user_id || ''} disabled={!e.user_id}>
                                <Space>
                                    <UserOutlined />
                                    <Text strong>{e.employee_name}</Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {e.name}{e.designation ? ` · ${e.designation}` : ''}
                                        {!e.user_id && ' · No user account'}
                                    </Text>
                                </Space>
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Divider orientation="left" style={{ fontSize: 13 }}>Team Members</Divider>

                {members.map((member, idx) => (
                    <Card
                        key={member.key}
                        size="small"
                        style={{ borderRadius: 8, marginBottom: 10 }}
                        title={<Text style={{ fontSize: 13 }}>Member {idx + 1}</Text>}
                        extra={members.length > 1 && (
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeMember(member.key)} />
                        )}
                    >
                        <Space style={{ width: '100%' }} direction="vertical" size={8}>
                            <Form.Item
                                name={`member_${member.key}`}
                                label="Employee"
                                rules={[{ required: true, message: 'Select an employee' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Search employee (min 2 characters)"
                                    filterOption={false}
                                    onSearch={(v) => handleMemberSearch(member.key, v)}
                                    loading={memberSearching[member.key]}
                                    notFoundContent={memberSearching[member.key] ? <Spin size="small" /> : <Text type="secondary">Type to search</Text>}
                                >
                                    {(memberOptions[member.key] || []).map((e) => (
                                        <Select.Option key={e.name} value={e.user_id || ''} disabled={!e.user_id}>
                                            <Space>
                                                <UserOutlined />
                                                <Text strong>{e.employee_name}</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {e.name}
                                                    {!e.user_id && ' · No user account'}
                                                </Text>
                                            </Space>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Space>
                    </Card>
                ))}

                <Button type="dashed" icon={<PlusOutlined />} onClick={addMember} block>
                    Add Member
                </Button>
            </Form>
        </Modal>
    );
};

let _taskCounter = 0;
const nextTaskKey = () => ++_taskCounter;

const PERIODICITY_OPTIONS = [
    'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-yearly', 'Yearly', '2 Yearly', '3 Yearly',
];

const MAINTENANCE_TYPES = ['Preventive Maintenance', 'Calibration'];

interface Props {
    open: boolean;
    onClose: () => void;
    assetName: string;
    company: string;
}

interface MaintenanceTaskRow {
    key: number;
}

interface MaintenanceTeamMember {
    team_member: string;
    full_name?: string;
}

interface MaintenanceTeam {
    name: string;
    maintenance_team_name?: string;
    company?: string;
    members?: MaintenanceTeamMember[];
}

const AssetMaintenanceModal: React.FC<Props> = ({ open, onClose, assetName, company }) => {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [teamsError, setTeamsError] = useState('');
    const [createTeamOpen, setCreateTeamOpen] = useState(false);
    const [tasks, setTasks] = useState<MaintenanceTaskRow[]>([{ key: nextTaskKey() }]);
    const { createMaintenanceRequest } = useERPNextAssetStore();
    const teamsRequestSeqRef = useRef(0);

    // Track selected team reactively so member dropdown updates
    const selectedTeamName = Form.useWatch('maintenance_team', form);
    const selectedTeam = teams.find((t) => t.name === selectedTeamName);

    const loadTeams = (companyFilter: string) => {
        const requestSeq = ++teamsRequestSeqRef.current;
        setTeamsLoading(true);
        setTeamsError('');
        erpnextAssetsApi.getMaintenanceTeams(companyFilter).then((res) => {
            if (requestSeq !== teamsRequestSeqRef.current) return;
            if (res.success) {
                setTeams(res.data?.items || []);
                setTeamsError('');
            } else {
                setTeams([]);
                setTeamsError(res.error || res.message || 'Failed to load maintenance teams.');
            }
        }).catch(() => {
            if (requestSeq === teamsRequestSeqRef.current) {
                setTeams([]);
                setTeamsError('Failed to load maintenance teams.');
            }
        }).finally(() => {
            if (requestSeq === teamsRequestSeqRef.current) {
                setTeamsLoading(false);
            }
        });
    };

    useEffect(() => {
        if (!open) {
            teamsRequestSeqRef.current += 1;
            setTeams([]);
            setTeamsLoading(false);
            setTeamsError('');
            return;
        }
        loadTeams(company);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, company]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const taskData = tasks.map((task) => ({
                maintenance_task: values[`task_name_${task.key}`],
                maintenance_type: values[`task_type_${task.key}`],
                start_date: values[`task_start_${task.key}`]?.format('YYYY-MM-DD'),
                end_date: values[`task_end_${task.key}`]?.format('YYYY-MM-DD'),
                periodicity: values[`task_periodicity_${task.key}`],
                assign_to: values[`task_assign_${task.key}`],
                description: values[`task_desc_${task.key}`] || '',
            }));

            const result = await createMaintenanceRequest({
                asset_name: assetName,
                maintenance_team: values.maintenance_team,
                tasks: JSON.stringify(taskData),
            });

            if (result.success) {
                if (result.warning) {
                    message.warning(result.warning);
                } else {
                    message.success('Maintenance scheduled');
                }
                form.resetFields();
                setTasks([{ key: nextTaskKey() }]);
                onClose();
            } else {
                message.error(result.error || 'Failed to create maintenance schedule');
            }
        } catch {
            // validation error
        } finally {
            setSubmitting(false);
        }
    };

    const addTask = () => setTasks([...tasks, { key: nextTaskKey() }]);
    const removeTask = (taskKey: number) => {
        if (tasks.length <= 1) return;
        setTasks(tasks.filter((task) => task.key !== taskKey));
    };

    return (
        <Modal
            title={<Space><ToolOutlined /><span>Schedule Maintenance</span></Space>}
            open={open}
            onCancel={onClose}
            width={isMobile ? '100%' : 1040}
            style={{ top: isMobile ? 0 : 24 }}
            bodyStyle={{ padding: isMobile ? 12 : 20 }}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
                    Create Schedule
                </Button>,
            ]}
        >
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
                <Space>
                    <Text strong>{assetName}</Text>
                    <Tag color="blue">Maintenance Request</Tag>
                </Space>
            </Card>

            <Form form={form} layout="vertical">
                {teamsError && (
                    <Alert
                        type="error"
                        message={teamsError}
                        showIcon
                        style={{ marginBottom: 12 }}
                        action={
                            <Button size="small" icon={<ReloadOutlined />} onClick={() => loadTeams(company)}>
                                Retry
                            </Button>
                        }
                    />
                )}
                <Form.Item
                    label="Maintenance Team"
                    name="maintenance_team"
                    rules={[{ required: true, message: 'Select a maintenance team' }]}
                >
                    <Select
                        placeholder={teamsLoading ? 'Loading teams...' : 'Select team'}
                        loading={teamsLoading}
                        disabled={teamsLoading}
                        notFoundContent={teamsError ? 'Load failed — use Retry above' : 'No maintenance teams available'}
                        onChange={() => {
                            const clearedAssignments = tasks.reduce<Record<string, undefined>>((acc, task) => {
                                acc[`task_assign_${task.key}`] = undefined;
                                return acc;
                            }, {});
                            form.setFieldsValue(clearedAssignments);
                        }}
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                                <Divider style={{ margin: '4px 0' }} />
                                <div style={{ padding: '4px 8px 8px' }}>
                                    <Button
                                        type="text"
                                        icon={<PlusOutlined />}
                                        block
                                        onClick={() => setCreateTeamOpen(true)}
                                    >
                                        Create new maintenance team
                                    </Button>
                                </div>
                            </>
                        )}
                    >
                        {teams.map((t) => (
                            <Select.Option key={t.name} value={t.name}>
                                {t.maintenance_team_name} ({t.company})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                {tasks.map((task, idx) => (
                    <Card
                        key={task.key}
                        size="small"
                        style={{ borderRadius: 10, marginBottom: 12 }}
                        title={`Task ${idx + 1}`}
                        extra={tasks.length > 1 && (
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeTask(task.key)} />
                        )}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            <Form.Item name={`task_name_${task.key}`} label="Task Name" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                <Input placeholder="e.g. Monthly Inspection" />
                            </Form.Item>
                            <Space wrap style={{ width: '100%' }}>
                                <Form.Item name={`task_type_${task.key}`} label="Type" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                    <Select style={{ width: 200 }} options={MAINTENANCE_TYPES.map((t) => ({ value: t, label: t }))} />
                                </Form.Item>
                                <Form.Item name={`task_periodicity_${task.key}`} label="Periodicity" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                    <Select style={{ width: 150 }} options={PERIODICITY_OPTIONS.map((p) => ({ value: p, label: p }))} />
                                </Form.Item>
                            </Space>
                            <Space wrap style={{ width: '100%' }}>
                                <Form.Item name={`task_start_${task.key}`} label="Start Date" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                    <DatePicker />
                                </Form.Item>
                                <Form.Item name={`task_end_${task.key}`} label="End Date" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                    <DatePicker />
                                </Form.Item>
                                <Form.Item name={`task_assign_${task.key}`} label="Assign To" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                                    <Select style={{ width: 200 }} placeholder="Team member">
                                        {(selectedTeam?.members || []).map((m: MaintenanceTeamMember) => (
                                            <Select.Option key={m.team_member} value={m.team_member}>
                                                {m.full_name || m.team_member}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Space>
                            <Form.Item name={`task_desc_${task.key}`} label="Description" style={{ marginBottom: 0 }}>
                                <Input.TextArea rows={2} placeholder="Optional description" />
                            </Form.Item>
                        </Space>
                    </Card>
                ))}

                <Button type="dashed" icon={<PlusOutlined />} onClick={addTask} block>
                    Add Task
                </Button>
            </Form>

            <CreateMaintenanceTeamModal
                open={createTeamOpen}
                onClose={() => setCreateTeamOpen(false)}
                company={company}
                onCreated={(newTeam) => {
                    setTeams((prev) => [...prev, newTeam]);
                    form.setFieldValue('maintenance_team', newTeam.name);
                    setCreateTeamOpen(false);
                }}
            />
        </Modal>
    );
};

export default AssetMaintenanceModal;
