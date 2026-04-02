import React, { useState, useEffect } from 'react';
import {
    Modal, Form, Input, Select, DatePicker, Button, Space, Card, Tag,
    Typography, message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ToolOutlined } from '@ant-design/icons';
import useERPNextAssetStore from '../../../stores/modules/erpnextAssetStore';
import { erpnextAssetsApi } from '../../../services/api';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text } = Typography;

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
    const [tasks, setTasks] = useState<MaintenanceTaskRow[]>([{ key: Date.now() }]);
    const { createMaintenanceRequest } = useERPNextAssetStore();

    // Track selected team reactively so member dropdown updates
    const selectedTeamName = Form.useWatch('maintenance_team', form);
    const selectedTeam = teams.find((t) => t.name === selectedTeamName);

    useEffect(() => {
        if (open) {
            erpnextAssetsApi.getMaintenanceTeams(company).then((res) => {
                if (res.success) setTeams(res.data?.items || []);
            });
        }
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

            const success = await createMaintenanceRequest({
                asset_name: assetName,
                maintenance_team: values.maintenance_team,
                tasks: JSON.stringify(taskData),
            });

            if (success) {
                message.success('Maintenance scheduled');
                form.resetFields();
                setTasks([{ key: Date.now() }]);
                onClose();
            } else {
                message.error('Failed to create maintenance schedule');
            }
        } catch {
            // validation error
        } finally {
            setSubmitting(false);
        }
    };

    const addTask = () => setTasks([...tasks, { key: Date.now() }]);
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
                <Form.Item
                    label="Maintenance Team"
                    name="maintenance_team"
                    rules={[{ required: true, message: 'Select a maintenance team' }]}
                >
                    <Select
                        placeholder="Select team"
                        onChange={() => {
                            const clearedAssignments = tasks.reduce<Record<string, undefined>>((acc, task) => {
                                acc[`task_assign_${task.key}`] = undefined;
                                return acc;
                            }, {});
                            form.setFieldsValue(clearedAssignments);
                        }}
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
        </Modal>
    );
};

export default AssetMaintenanceModal;
