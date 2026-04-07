import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Calendar,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    TimePicker,
    Modal,
    Row,
    Segmented,
    Select,
    Space,
    Statistic,
    Switch,
    Table,
    Tabs,
    Tag,
    Typography,
    message,
    theme,
} from 'antd';
import type { CalendarProps, TableColumnsType } from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    RetweetOutlined,
    TeamOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import useFacilityStore from '../../../stores/facilityStore';
import { useResponsive } from '../../../hooks/useResponsive';
import { COMPONENT_WIDTHS } from '../../../styles/tokens';
import { TableSkeleton } from '../../shared/Skeleton/Skeleton';
import EmptyState from '../../shared/EmptyState/EmptyState';
import {
    shiftManagementApi,
    type AttendanceVisibilityItem,
    type ShiftAssignmentItem,
    type ShiftDashboardPayload,
    type ShiftFilterOptionsPayload,
    type ShiftFilterLocationOption,
    type ShiftFilterTypeOption,
    type ShiftStatusAggregates,
    type ShiftTypeCreateResult,
} from '../../../services/api';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

type ShiftTabKey = 'assignments' | 'attendance';

interface ShiftManagementViewProps {
    initialTab?: ShiftTabKey;
    forceLateOnly?: boolean;
}

interface AssignmentFilters {
    employee?: string;
    shift_type?: string;
    status?: string;
    date_range: [Dayjs, Dayjs];
}

interface AttendanceFilters {
    employee?: string;
    status?: string;
    date_range: [Dayjs, Dayjs];
    late_only: boolean;
    missing_checkout_only: boolean;
}

interface PaginationState {
    page: number;
    page_size: number;
    total_count: number;
}

interface CreateShiftFormValues {
    employee: string;
    shift_type: string;
    start_date: Dayjs;
    end_date?: Dayjs;
    status: string;
    shift_location?: string;
    overtime_type?: string;
}

interface ReassignShiftFormValues {
    source_shift: string;
    target_employee: string;
    target_date: Dayjs;
    source_date?: Dayjs;
    target_shift?: string;
}

interface ShiftTypeFormValues {
    name: string;
    start_time: Dayjs;
    end_time: Dayjs;
    color?: string;
    enable_auto_attendance?: boolean;
    process_attendance_after?: Dayjs;
}

type ViewMode = 'table' | 'calendar';

const SHIFT_TYPE_COLORS = ['Blue', 'Cyan', 'Fuchsia', 'Green', 'Lime', 'Orange', 'Pink', 'Red', 'Violet', 'Yellow'];

const EMPTY_DASHBOARD: ShiftStatusAggregates = {
    total_assignments: 0,
    active_assignments: 0,
    inactive_assignments: 0,
    employees_with_shifts: 0,
    attendance_records: 0,
    late_entries: 0,
    missing_checkouts: 0,
};

const DEFAULT_FILTER_OPTIONS: ShiftFilterOptionsPayload = {
    facilities: [],
    employees: [],
    shift_types: [],
    locations: [],
    shift_status_options: ['Active', 'Inactive'],
    attendance_status_options: ['Present', 'Absent', 'On Leave', 'Half Day'],
};

interface CreateShiftTypeModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (shiftType: ShiftFilterTypeOption) => void;
}

interface CreateShiftLocationModalProps {
    open: boolean;
    locationOptions: ShiftFilterLocationOption[];
    onClose: () => void;
    onCreated: (location: ShiftFilterLocationOption) => void;
}

const CreateShiftTypeModal: React.FC<CreateShiftTypeModalProps> = ({ open, onClose, onCreated }) => {
    const [form] = Form.useForm<ShiftTypeFormValues>();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        form.setFieldsValue({
            color: 'Blue',
            enable_auto_attendance: false,
        });
    }, [open, form]);

    const handleCreate = useCallback(async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            setError('');

            const response = await shiftManagementApi.createShiftType({
                name: values.name?.trim(),
                start_time: values.start_time.format('HH:mm'),
                end_time: values.end_time.format('HH:mm'),
                color: values.color || 'Blue',
                enable_auto_attendance: Boolean(values.enable_auto_attendance),
                process_attendance_after: values.enable_auto_attendance && values.process_attendance_after
                    ? values.process_attendance_after.format('YYYY-MM-DD')
                    : undefined,
            });
            setSubmitting(false);

            if (!response.success) {
                setError(response.error || response.message || 'Unable to create Shift Type.');
                return;
            }

            const created = response.data as ShiftTypeCreateResult | undefined;
            const option: ShiftFilterTypeOption = {
                name: created?.name || values.name.trim(),
                start_time: created?.start_time || values.start_time.format('HH:mm'),
                end_time: created?.end_time || values.end_time.format('HH:mm'),
                enable_auto_attendance: Boolean(created?.enable_auto_attendance ?? values.enable_auto_attendance),
                color: created?.color || values.color || 'Blue',
            };
            message.success(`Shift Type "${option.name}" created.`);
            onCreated(option);
            onClose();
            form.resetFields();
        } catch {
            setSubmitting(false);
        }
    }, [form, onClose, onCreated]);

    const autoAttendanceEnabled = Form.useWatch('enable_auto_attendance', form);

    return (
        <Modal
            title="Create Shift Type"
            open={open}
            onCancel={onClose}
            onOk={handleCreate}
            okText="Create Shift Type"
            confirmLoading={submitting}
            destroyOnClose
        >
            {error && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={error}
                    closable
                    onClose={() => setError('')}
                />
            )}
            <Form form={form} layout="vertical" preserve={false}>
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="Missing Shift Type?"
                    description="Create it here and continue without leaving Shift Management, similar to Asset Item creation."
                />
                <Form.Item name="name" label="Shift Type Name" rules={[{ required: true, message: 'Shift Type name is required' }]}>
                    <Input placeholder="e.g. Night Shift - ICU" />
                </Form.Item>
                <Space style={{ width: '100%' }} align="start">
                    <Form.Item
                        name="start_time"
                        label="Start Time"
                        rules={[{ required: true, message: 'Start time is required' }]}
                        style={{ flex: 1 }}
                    >
                        <TimePicker style={{ width: '100%' }} format="HH:mm" />
                    </Form.Item>
                    <Form.Item
                        name="end_time"
                        label="End Time"
                        rules={[{ required: true, message: 'End time is required' }]}
                        style={{ flex: 1 }}
                    >
                        <TimePicker style={{ width: '100%' }} format="HH:mm" />
                    </Form.Item>
                </Space>
                <Form.Item name="color" label="Roster Color" initialValue="Blue">
                    <Select>
                        {SHIFT_TYPE_COLORS.map((color) => (
                            <Select.Option key={color} value={color}>
                                {color}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="enable_auto_attendance" label="Enable Auto Attendance" valuePropName="checked">
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
                {autoAttendanceEnabled && (
                    <Form.Item
                        name="process_attendance_after"
                        label="Process Attendance After"
                        rules={[{ required: true, message: 'Process date is required when auto attendance is enabled' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

const CreateShiftLocationModal: React.FC<CreateShiftLocationModalProps> = ({
    open,
    locationOptions,
    onClose,
    onCreated,
}) => {
    const [form] = Form.useForm<{ name: string; parent_location?: string; is_group?: boolean }>();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        form.resetFields();
    }, [open, form]);

    const handleCreate = useCallback(async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            setError('');

            const response = await shiftManagementApi.createShiftLocation({
                name: values.name?.trim(),
                parent_location: values.parent_location || undefined,
                is_group: Boolean(values.is_group),
            });
            setSubmitting(false);

            if (!response.success) {
                setError(response.error || response.message || 'Unable to create Location.');
                return;
            }

            const createdName = response.data?.name || values.name.trim();
            const created: ShiftFilterLocationOption = { name: createdName, label: createdName };
            message.success(`Location "${createdName}" created.`);
            onCreated(created);
            onClose();
            form.resetFields();
        } catch {
            setSubmitting(false);
        }
    }, [form, onClose, onCreated]);

    return (
        <Modal
            title="Create Location"
            open={open}
            onCancel={onClose}
            onOk={handleCreate}
            okText="Create Location"
            confirmLoading={submitting}
            destroyOnClose
        >
            {error && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={error}
                    closable
                    onClose={() => setError('')}
                />
            )}
            <Form form={form} layout="vertical" preserve={false}>
                <Form.Item
                    name="name"
                    label="Location Name"
                    rules={[{ required: true, message: 'Location name is required' }]}
                >
                    <Input placeholder="e.g. West Wing" />
                </Form.Item>
                <Form.Item name="parent_location" label="Parent Location (Optional)">
                    <Select
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        placeholder="Select parent location"
                    >
                        {locationOptions.map((location) => (
                            <Select.Option key={location.name} value={location.name}>
                                {location.label || location.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="is_group" label="Is Group" valuePropName="checked">
                    <Switch checkedChildren="Group" unCheckedChildren="Single" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const ShiftManagementView: React.FC<ShiftManagementViewProps> = ({
    initialTab = 'assignments',
    forceLateOnly = false,
}) => {
    const { token } = theme.useToken();
    const { isMobile, getResponsiveValue } = useResponsive();
    const { availableFacilities, loading: facilitiesLoading } = useFacilityStore();

    const [activeTab, setActiveTab] = useState<ShiftTabKey>(initialTab);
    const [assignmentViewMode, setAssignmentViewMode] = useState<ViewMode>('table');
    const [attendanceViewMode, setAttendanceViewMode] = useState<ViewMode>('table');
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    const [dashboard, setDashboard] = useState<ShiftStatusAggregates>(EMPTY_DASHBOARD);
    const [filterOptions, setFilterOptions] = useState<ShiftFilterOptionsPayload>(DEFAULT_FILTER_OPTIONS);

    const [assignments, setAssignments] = useState<ShiftAssignmentItem[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceVisibilityItem[]>([]);
    const [calendarAssignments, setCalendarAssignments] = useState<ShiftAssignmentItem[]>([]);
    const [calendarAttendance, setCalendarAttendance] = useState<AttendanceVisibilityItem[]>([]);
    const [assignmentCalendarMonth, setAssignmentCalendarMonth] = useState<Dayjs>(dayjs());
    const [attendanceCalendarMonth, setAttendanceCalendarMonth] = useState<Dayjs>(dayjs());

    const [assignmentPagination, setAssignmentPagination] = useState<PaginationState>({
        page: 1,
        page_size: 20,
        total_count: 0,
    });
    const [attendancePagination, setAttendancePagination] = useState<PaginationState>({
        page: 1,
        page_size: 20,
        total_count: 0,
    });

    const [assignmentFilters, setAssignmentFilters] = useState<AssignmentFilters>({
        status: 'Active',
        date_range: [dayjs(), dayjs().add(30, 'day')],
    });
    const [attendanceFilters, setAttendanceFilters] = useState<AttendanceFilters>({
        date_range: [dayjs(), dayjs()],
        late_only: forceLateOnly,
        missing_checkout_only: false,
    });

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [loadingCalendarAssignments, setLoadingCalendarAssignments] = useState(false);
    const [loadingCalendarAttendance, setLoadingCalendarAttendance] = useState(false);
    const [submittingCreate, setSubmittingCreate] = useState(false);
    const [submittingReassign, setSubmittingReassign] = useState(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createShiftTypeModalOpen, setCreateShiftTypeModalOpen] = useState(false);
    const [createShiftLocationModalOpen, setCreateShiftLocationModalOpen] = useState(false);
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [selectedSourceShift, setSelectedSourceShift] = useState<ShiftAssignmentItem | null>(null);

    const [createForm] = Form.useForm<CreateShiftFormValues>();
    const [reassignForm] = Form.useForm<ReassignShiftFormValues>();

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const effectiveFacilities = useMemo(() => {
        if (facilitiesLoading) return null;
        if (selectedFacilities.length > 0) return selectedFacilities;
        if (availableFacilities.length > 0) return availableFacilities.map((facility) => facility.hie_id);
        return [] as string[];
    }, [selectedFacilities, availableFacilities, facilitiesLoading]);

    const facilitiesKey = useMemo(() => {
        if (!effectiveFacilities) return 'loading';
        return effectiveFacilities.join(',');
    }, [effectiveFacilities]);

    const facilityOptions = useMemo(() => {
        if (filterOptions.facilities.length > 0) {
            return filterOptions.facilities;
        }
        return availableFacilities.map((facility) => ({
            hie_id: facility.hie_id,
            facility_name: facility.facility_name,
            facility_mfl: facility.facility_mfl,
        }));
    }, [filterOptions.facilities, availableFacilities]);

    const locationOptions = useMemo(() => (
        filterOptions.locations || []
    ), [filterOptions.locations]);

    const loadDashboard = useCallback(async () => {
        if (effectiveFacilities === null) return;

        setLoadingDashboard(true);
        const response = await shiftManagementApi.getDashboard({
            facilities: effectiveFacilities,
            date_from: assignmentFilters.date_range[0].format('YYYY-MM-DD'),
            date_to: assignmentFilters.date_range[1].format('YYYY-MM-DD'),
        });
        setLoadingDashboard(false);

        if (!response.success) {
            setErrorMessage(response.error || response.message || 'Unable to load shift dashboard metrics.');
            return;
        }

        const payload = response.data as ShiftDashboardPayload | undefined;
        setDashboard(payload?.status_aggregates || EMPTY_DASHBOARD);
    }, [effectiveFacilities, assignmentFilters.date_range]);

    const loadFilterOptions = useCallback(async () => {
        if (effectiveFacilities === null) return;

        setLoadingFilters(true);
        const response = await shiftManagementApi.getFilterOptions({
            facilities: effectiveFacilities,
            employee_limit: 500,
        });
        setLoadingFilters(false);

        if (!response.success) {
            setErrorMessage(response.error || response.message || 'Unable to load shift filter options.');
            return;
        }

        setFilterOptions(response.data || DEFAULT_FILTER_OPTIONS);
    }, [effectiveFacilities]);

    const loadAssignments = useCallback(async () => {
        if (effectiveFacilities === null) return;

        setLoadingAssignments(true);
        const response = await shiftManagementApi.getShiftAssignments({
            facilities: effectiveFacilities,
            page: assignmentPagination.page,
            page_size: assignmentPagination.page_size,
            employee: assignmentFilters.employee,
            shift_type: assignmentFilters.shift_type,
            status: assignmentFilters.status,
            date_from: assignmentFilters.date_range[0].format('YYYY-MM-DD'),
            date_to: assignmentFilters.date_range[1].format('YYYY-MM-DD'),
        });
        setLoadingAssignments(false);

        if (!response.success) {
            setErrorMessage(response.error || response.message || 'Unable to load shift assignments.');
            return;
        }

        const payload = response.data;
        setAssignments(payload?.items || []);
        setAssignmentPagination((prev) => ({
            ...prev,
            total_count: payload?.total_count || 0,
        }));
    }, [effectiveFacilities, assignmentFilters, assignmentPagination.page, assignmentPagination.page_size]);

    const loadAttendance = useCallback(async () => {
        if (effectiveFacilities === null) return;

        setLoadingAttendance(true);
        const response = await shiftManagementApi.getAttendanceVisibility({
            facilities: effectiveFacilities,
            page: attendancePagination.page,
            page_size: attendancePagination.page_size,
            employee: attendanceFilters.employee,
            status: attendanceFilters.status,
            date_from: attendanceFilters.date_range[0].format('YYYY-MM-DD'),
            date_to: attendanceFilters.date_range[1].format('YYYY-MM-DD'),
            late_only: attendanceFilters.late_only,
            missing_checkout_only: attendanceFilters.missing_checkout_only,
        });
        setLoadingAttendance(false);

        if (!response.success) {
            setErrorMessage(response.error || response.message || 'Unable to load attendance visibility.');
            return;
        }

        const payload = response.data;
        setAttendanceRecords(payload?.items || []);
        setAttendancePagination((prev) => ({
            ...prev,
            total_count: payload?.total_count || 0,
        }));
    }, [effectiveFacilities, attendanceFilters, attendancePagination.page, attendancePagination.page_size]);

    const loadAssignmentsCalendar = useCallback(async (month: Dayjs) => {
        if (effectiveFacilities === null) return;

        setLoadingCalendarAssignments(true);
        const monthStart = month.startOf('month').format('YYYY-MM-DD');
        const monthEnd = month.endOf('month').format('YYYY-MM-DD');
        const response = await shiftManagementApi.getShiftAssignments({
            facilities: effectiveFacilities,
            page: 1,
            page_size: 1000,
            employee: assignmentFilters.employee,
            shift_type: assignmentFilters.shift_type,
            status: assignmentFilters.status,
            date_from: monthStart,
            date_to: monthEnd,
        });
        setLoadingCalendarAssignments(false);

        if (!response.success) {
            setErrorMessage(response.error || response.message || 'Unable to load shift calendar.');
            return;
        }

        setCalendarAssignments(response.data?.items || []);
    }, [effectiveFacilities, assignmentFilters]);

    const loadAttendanceCalendar = useCallback(async (month: Dayjs) => {
        if (effectiveFacilities === null) return;

        setLoadingCalendarAttendance(true);
        const monthStart = month.startOf('month').format('YYYY-MM-DD');
        const monthEnd = month.endOf('month').format('YYYY-MM-DD');
        const response = await shiftManagementApi.getAttendanceVisibility({
            facilities: effectiveFacilities,
            page: 1,
            page_size: 1000,
            employee: attendanceFilters.employee,
            status: attendanceFilters.status,
            date_from: monthStart,
            date_to: monthEnd,
            late_only: attendanceFilters.late_only,
            missing_checkout_only: attendanceFilters.missing_checkout_only,
        });
        setLoadingCalendarAttendance(false);

        if (!response.success) {
            setErrorMessage(response.error || response.message || 'Unable to load attendance calendar.');
            return;
        }

        setCalendarAttendance(response.data?.items || []);
    }, [effectiveFacilities, attendanceFilters]);

    useEffect(() => {
        if (effectiveFacilities === null) return;
        setErrorMessage(null);
        loadFilterOptions();
    }, [effectiveFacilities, loadFilterOptions, facilitiesKey]);

    useEffect(() => {
        if (effectiveFacilities === null) return;
        loadDashboard();
    }, [effectiveFacilities, loadDashboard, facilitiesKey]);

    useEffect(() => {
        if (effectiveFacilities === null) return;
        loadAssignments();
    }, [effectiveFacilities, loadAssignments, facilitiesKey]);

    useEffect(() => {
        if (effectiveFacilities === null) return;
        loadAttendance();
    }, [effectiveFacilities, loadAttendance, facilitiesKey]);

    useEffect(() => {
        if (effectiveFacilities === null) return;
        if (activeTab !== 'assignments' || assignmentViewMode !== 'calendar') return;
        loadAssignmentsCalendar(assignmentCalendarMonth);
    }, [
        effectiveFacilities,
        activeTab,
        assignmentViewMode,
        assignmentCalendarMonth,
        assignmentFilters,
        facilitiesKey,
        loadAssignmentsCalendar,
    ]);

    useEffect(() => {
        if (effectiveFacilities === null) return;
        if (activeTab !== 'attendance' || attendanceViewMode !== 'calendar') return;
        loadAttendanceCalendar(attendanceCalendarMonth);
    }, [
        effectiveFacilities,
        activeTab,
        attendanceViewMode,
        attendanceCalendarMonth,
        attendanceFilters,
        facilitiesKey,
        loadAttendanceCalendar,
    ]);

    const assignmentCalendarMap = useMemo(() => {
        const byDate: Record<string, ShiftAssignmentItem[]> = {};
        const monthStart = assignmentCalendarMonth.startOf('month');
        const monthEnd = assignmentCalendarMonth.endOf('month');

        for (const assignment of calendarAssignments) {
            const start = dayjs(assignment.start_date);
            const assignmentEnd = assignment.end_date ? dayjs(assignment.end_date) : monthEnd;

            if (assignmentEnd.isBefore(monthStart) || start.isAfter(monthEnd)) {
                continue;
            }

            let cursor = start.isBefore(monthStart) ? monthStart : start;
            const rangeEnd = assignmentEnd.isAfter(monthEnd) ? monthEnd : assignmentEnd;
            while (cursor.isBefore(rangeEnd) || cursor.isSame(rangeEnd, 'day')) {
                const key = cursor.format('YYYY-MM-DD');
                if (!byDate[key]) byDate[key] = [];
                byDate[key].push(assignment);
                cursor = cursor.add(1, 'day');
            }
        }

        return byDate;
    }, [calendarAssignments, assignmentCalendarMonth]);

    const attendanceCalendarMap = useMemo(() => {
        const byDate: Record<string, AttendanceVisibilityItem[]> = {};
        for (const attendance of calendarAttendance) {
            const key = attendance.attendance_date;
            if (!byDate[key]) byDate[key] = [];
            byDate[key].push(attendance);
        }
        return byDate;
    }, [calendarAttendance]);

    const openCreateShiftForDate = useCallback((date: Dayjs) => {
        createForm.setFieldsValue({
            start_date: date,
            end_date: date,
            status: 'Active',
        });
        setCreateModalOpen(true);
    }, [createForm]);

    const handleShiftTypeCreated = useCallback((shiftType: ShiftFilterTypeOption) => {
        setFilterOptions((prev) => {
            const withoutDuplicate = prev.shift_types.filter((item) => item.name !== shiftType.name);
            return {
                ...prev,
                shift_types: [...withoutDuplicate, shiftType].sort((a, b) => a.name.localeCompare(b.name)),
            };
        });
        createForm.setFieldValue('shift_type', shiftType.name);
    }, [createForm]);

    const handleShiftLocationCreated = useCallback((location: ShiftFilterLocationOption) => {
        setFilterOptions((prev) => {
            const withoutDuplicate = (prev.locations || []).filter((item) => item.name !== location.name);
            const merged = [...withoutDuplicate, location];
            merged.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));
            return {
                ...prev,
                locations: merged,
            };
        });
        createForm.setFieldValue('shift_location', location.name);
    }, [createForm]);

    const assignmentCellRender: CalendarProps<Dayjs>['cellRender'] = useCallback((current, info) => {
        if (info.type !== 'date') return info.originNode;

        const dateKey = current.format('YYYY-MM-DD');
        const entries = assignmentCalendarMap[dateKey] || [];
        const isCurrentMonth = current.month() === assignmentCalendarMonth.month();

        return (
            <div style={{ minHeight: 74, padding: 2 }}>
                {info.originNode}
                {isCurrentMonth && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
                        <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                openCreateShiftForDate(current);
                            }}
                            style={{ height: 20, paddingInline: 4 }}
                            title="Add shift on this date"
                        />
                    </div>
                )}
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    {entries.slice(0, 2).map((entry) => (
                        <Tag
                            key={`${entry.name}-${dateKey}`}
                            color={entry.status === 'Active' ? 'green' : 'default'}
                            style={{
                                marginInlineEnd: 0,
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {entry.shift_type} · {entry.employee_name || entry.employee}
                        </Tag>
                    ))}
                    {entries.length > 2 && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            +{entries.length - 2} more
                        </Text>
                    )}
                </Space>
            </div>
        );
    }, [assignmentCalendarMap, assignmentCalendarMonth, openCreateShiftForDate]);

    const attendanceCellRender: CalendarProps<Dayjs>['cellRender'] = useCallback((current, info) => {
        if (info.type !== 'date') return info.originNode;

        const entries = attendanceCalendarMap[current.format('YYYY-MM-DD')] || [];
        if (!entries.length) return <div style={{ minHeight: 68 }}>{info.originNode}</div>;

        const presentCount = entries.filter((entry) => entry.status === 'Present').length;
        const absentCount = entries.filter((entry) => entry.status === 'Absent').length;
        const lateCount = entries.filter((entry) => entry.late_entry).length;
        const missingCheckoutCount = entries.filter((entry) => entry.is_missing_checkout).length;

        return (
            <Space direction="vertical" size={2} style={{ minHeight: 68, width: '100%' }}>
                {info.originNode}
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>Total {entries.length}</Tag>
                {presentCount > 0 && <Tag color="green" style={{ marginInlineEnd: 0 }}>Present {presentCount}</Tag>}
                {absentCount > 0 && <Tag color="red" style={{ marginInlineEnd: 0 }}>Absent {absentCount}</Tag>}
                {lateCount > 0 && <Tag color="orange" style={{ marginInlineEnd: 0 }}>Late {lateCount}</Tag>}
                {missingCheckoutCount > 0 && <Tag color="volcano" style={{ marginInlineEnd: 0 }}>Missing Out {missingCheckoutCount}</Tag>}
            </Space>
        );
    }, [attendanceCalendarMap]);

    const assignmentColumns: TableColumnsType<ShiftAssignmentItem> = useMemo(
        () => [
            {
                title: 'Employee',
                key: 'employee',
                fixed: 'left',
                width: 240,
                render: (_, record) => (
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 13 }}>{record.employee_name || record.employee}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.employee}</Text>
                    </Space>
                ),
            },
            {
                title: 'Shift',
                key: 'shift_type',
                width: 200,
                render: (_, record) => (
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 13 }}>{record.shift_type}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.shift_start_time || '--:--'} - {record.shift_end_time || '--:--'}
                        </Text>
                    </Space>
                ),
            },
            {
                title: 'Period',
                key: 'period',
                width: 200,
                render: (_, record) => (
                    <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: 13 }}>{record.start_date}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.end_date || 'Open-ended'}
                        </Text>
                    </Space>
                ),
            },
            {
                title: 'Status',
                dataIndex: 'status',
                width: 130,
                render: (status: string) => (
                    <Tag color={status === 'Active' ? 'green' : 'default'}>{status || 'Unknown'}</Tag>
                ),
            },
            {
                title: 'Facility',
                key: 'facility_name',
                width: 220,
                render: (_, record) => (
                    <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: 13 }}>{record.facility_name || 'Unmapped'}</Text>
                        {record.facility_id && (
                            <Text type="secondary" style={{ fontSize: 11 }}>ID: {record.facility_id}</Text>
                        )}
                    </Space>
                ),
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 140,
                render: (_, record) => (
                    <Button
                        type="link"
                        icon={<RetweetOutlined />}
                        onClick={() => {
                            setSelectedSourceShift(record);
                            reassignForm.setFieldsValue({
                                source_shift: record.name,
                                source_date: dayjs(record.start_date),
                                target_date: dayjs(record.start_date),
                                target_shift: record.shift_type,
                            });
                            setReassignModalOpen(true);
                        }}
                    >
                        Reassign
                    </Button>
                ),
            },
        ],
        [reassignForm],
    );

    const attendanceColumns: TableColumnsType<AttendanceVisibilityItem> = useMemo(
        () => [
            {
                title: 'Date',
                dataIndex: 'attendance_date',
                width: 130,
            },
            {
                title: 'Employee',
                key: 'employee',
                width: 240,
                render: (_, record) => (
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 13 }}>{record.employee_name || record.employee}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.employee}</Text>
                    </Space>
                ),
            },
            {
                title: 'Shift',
                dataIndex: 'shift',
                width: 180,
                render: (shift: string | undefined) => shift || 'Not Set',
            },
            {
                title: 'Check In/Out',
                key: 'check',
                width: 180,
                render: (_, record) => (
                    <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: 13 }}>{record.check_in || '--:--'}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.check_out || '--:--'}</Text>
                    </Space>
                ),
            },
            {
                title: 'Status',
                dataIndex: 'status',
                width: 140,
                render: (status: string) => {
                    const color = status === 'Present' ? 'green' : status === 'Absent' ? 'red' : 'gold';
                    return <Tag color={color}>{status || 'Unknown'}</Tag>;
                },
            },
            {
                title: 'Flags',
                key: 'flags',
                width: 200,
                render: (_, record) => (
                    <Space wrap>
                        {record.late_entry && <Tag color="orange">Late</Tag>}
                        {record.is_missing_checkout && <Tag color="red">Missing Checkout</Tag>}
                        {!record.late_entry && !record.is_missing_checkout && <Tag>Normal</Tag>}
                    </Space>
                ),
            },
            {
                title: 'Facility',
                dataIndex: 'facility_name',
                width: 220,
                render: (facilityName: string | undefined) => facilityName || 'Unmapped',
            },
        ],
        [],
    );

    const handleRefresh = useCallback(() => {
        setErrorMessage(null);
        loadDashboard();
        if (activeTab === 'assignments') {
            if (assignmentViewMode === 'calendar') {
                loadAssignmentsCalendar(assignmentCalendarMonth);
                return;
            }
            loadAssignments();
            return;
        }
        if (attendanceViewMode === 'calendar') {
            loadAttendanceCalendar(attendanceCalendarMonth);
            return;
        }
        loadAttendance();
    }, [
        activeTab,
        assignmentViewMode,
        attendanceViewMode,
        assignmentCalendarMonth,
        attendanceCalendarMonth,
        loadAssignments,
        loadAssignmentsCalendar,
        loadAttendance,
        loadAttendanceCalendar,
        loadDashboard,
    ]);

    const handleCreateShift = useCallback(async () => {
        try {
            const values = await createForm.validateFields();
            setSubmittingCreate(true);
            const response = await shiftManagementApi.createShiftAssignment({
                employee: values.employee,
                shift_type: values.shift_type,
                start_date: values.start_date.format('YYYY-MM-DD'),
                end_date: values.end_date?.format('YYYY-MM-DD'),
                status: values.status || 'Active',
                shift_location: values.shift_location?.trim() || undefined,
                overtime_type: values.overtime_type?.trim() || undefined,
            });
            setSubmittingCreate(false);

            if (!response.success) {
                setErrorMessage(response.error || response.message || 'Unable to create shift assignment.');
                return;
            }

            message.success('Shift assignment created.');
            setCreateModalOpen(false);
            createForm.resetFields();
            loadDashboard();
            if (assignmentViewMode === 'calendar') {
                loadAssignmentsCalendar(assignmentCalendarMonth);
            } else {
                loadAssignments();
            }
        } catch {
            setSubmittingCreate(false);
        }
    }, [
        createForm,
        assignmentViewMode,
        assignmentCalendarMonth,
        loadAssignments,
        loadAssignmentsCalendar,
        loadDashboard,
    ]);

    const handleReassignShift = useCallback(async () => {
        try {
            const values = await reassignForm.validateFields();
            setSubmittingReassign(true);
            const response = await shiftManagementApi.reassignShiftAssignment({
                source_shift: values.source_shift,
                target_employee: values.target_employee,
                target_date: values.target_date.format('YYYY-MM-DD'),
                source_date: values.source_date?.format('YYYY-MM-DD'),
                target_shift: values.target_shift || undefined,
            });
            setSubmittingReassign(false);

            if (!response.success) {
                setErrorMessage(response.error || response.message || 'Unable to reassign this shift.');
                return;
            }

            message.success('Shift reassigned successfully.');
            setReassignModalOpen(false);
            setSelectedSourceShift(null);
            reassignForm.resetFields();
            loadDashboard();
            if (assignmentViewMode === 'calendar') {
                loadAssignmentsCalendar(assignmentCalendarMonth);
            } else {
                loadAssignments();
            }
            if (attendanceViewMode === 'calendar') {
                loadAttendanceCalendar(attendanceCalendarMonth);
            } else {
                loadAttendance();
            }
        } catch {
            setSubmittingReassign(false);
        }
    }, [
        reassignForm,
        assignmentViewMode,
        attendanceViewMode,
        assignmentCalendarMonth,
        attendanceCalendarMonth,
        loadAssignments,
        loadAssignmentsCalendar,
        loadAttendance,
        loadAttendanceCalendar,
        loadDashboard,
    ]);

    const employeeOptions = filterOptions.employees;
    const shiftTypeOptions = filterOptions.shift_types;
    const shiftStatusOptions = filterOptions.shift_status_options;
    const attendanceStatusOptions = filterOptions.attendance_status_options;

    return (
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
            {errorMessage && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Shift Management Error"
                    description={errorMessage}
                    closable
                    onClose={() => setErrorMessage(null)}
                />
            )}

            <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="stat-card stat-card--primary" loading={loadingDashboard}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>TOTAL SHIFTS</Text>}
                            value={dashboard.total_assignments}
                            prefix={<CalendarOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 18, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="stat-card stat-card--success" loading={loadingDashboard}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>ACTIVE SHIFTS</Text>}
                            value={dashboard.active_assignments}
                            prefix={<CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 18, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="stat-card stat-card--warning" loading={loadingDashboard}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>LATE ENTRIES</Text>}
                            value={dashboard.late_entries}
                            prefix={<WarningOutlined style={{ color: token.colorWarning, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 18, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="stat-card stat-card--error" loading={loadingDashboard}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>MISSING CHECKOUTS</Text>}
                            value={dashboard.missing_checkouts}
                            prefix={<ExclamationCircleOutlined style={{ color: token.colorError, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 18, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="stat-card stat-card--cyan" loading={loadingDashboard}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>EMPLOYEES WITH SHIFTS</Text>}
                            value={dashboard.employees_with_shifts}
                            prefix={<TeamOutlined style={{ color: token.colorInfo, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 18, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="stat-card stat-card--neutral" loading={loadingDashboard}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 12 }}>ATTENDANCE RECORDS</Text>}
                            value={dashboard.attendance_records}
                            prefix={<ClockCircleOutlined style={{ color: token.colorTextSecondary, marginRight: 8 }} />}
                            valueStyle={{ fontSize: 18, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                bodyStyle={{ padding: 0 }}
                title={(
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 12,
                        }}
                    >
                        <Title level={4} style={{ margin: 0 }}>Shift Management</Title>
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    createForm.setFieldsValue({
                                        status: 'Active',
                                        start_date: dayjs(),
                                    });
                                    setCreateModalOpen(true);
                                }}
                            >
                                Create Shift
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Space>
                    </div>
                )}
            >
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as ShiftTabKey)}
                        items={[
                            { key: 'assignments', label: 'Shift Assignments' },
                            { key: 'attendance', label: 'Attendance Visibility' },
                        ]}
                        style={{ marginBottom: 8 }}
                    />

                    <Space wrap size={[8, 8]}>
                        <Segmented<ViewMode>
                            options={[
                                { label: 'Table', value: 'table' },
                                { label: 'Calendar', value: 'calendar' },
                            ]}
                            value={activeTab === 'assignments' ? assignmentViewMode : attendanceViewMode}
                            onChange={(value) => {
                                if (activeTab === 'assignments') {
                                    const mode = value as ViewMode;
                                    setAssignmentViewMode(mode);
                                    if (mode === 'calendar') {
                                        loadAssignmentsCalendar(assignmentCalendarMonth);
                                    }
                                    return;
                                }

                                const mode = value as ViewMode;
                                setAttendanceViewMode(mode);
                                if (mode === 'calendar') {
                                    loadAttendanceCalendar(attendanceCalendarMonth);
                                }
                            }}
                        />

                        <Select
                            mode="multiple"
                            placeholder="All Facilities"
                            value={selectedFacilities}
                            loading={facilitiesLoading || loadingFilters}
                            onChange={(values) => {
                                setSelectedFacilities(values);
                                setAssignmentPagination((prev) => ({ ...prev, page: 1 }));
                                setAttendancePagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            style={{
                                width: getResponsiveValue(COMPONENT_WIDTHS.facilitySelector),
                                minWidth: isMobile ? '160px' : '220px',
                            }}
                            maxTagCount="responsive"
                            popupMatchSelectWidth={false}
                            allowClear
                        >
                            {facilityOptions.map((facility) => (
                                <Select.Option key={facility.hie_id} value={facility.hie_id}>
                                    {facility.facility_name}
                                    {facility.facility_mfl ? ` (${facility.facility_mfl})` : ''}
                                </Select.Option>
                            ))}
                        </Select>

                        <Select
                            showSearch
                            allowClear
                            placeholder="Employee"
                            optionFilterProp="children"
                            value={activeTab === 'assignments' ? assignmentFilters.employee : attendanceFilters.employee}
                            onChange={(value) => {
                                if (activeTab === 'assignments') {
                                    setAssignmentFilters((prev) => ({ ...prev, employee: value || undefined }));
                                    setAssignmentPagination((prev) => ({ ...prev, page: 1 }));
                                    return;
                                }
                                setAttendanceFilters((prev) => ({ ...prev, employee: value || undefined }));
                                setAttendancePagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            style={{ width: isMobile ? 180 : 230 }}
                            loading={loadingFilters}
                        >
                            {employeeOptions.map((employee) => (
                                <Select.Option key={employee.name} value={employee.name}>
                                    {employee.employee_name || employee.name}
                                </Select.Option>
                            ))}
                        </Select>

                        {activeTab === 'assignments' && (
                            <Space.Compact>
                                <Select
                                    allowClear
                                    placeholder="Shift Type"
                                    value={assignmentFilters.shift_type}
                                    onChange={(value) => {
                                        setAssignmentFilters((prev) => ({ ...prev, shift_type: value || undefined }));
                                        setAssignmentPagination((prev) => ({ ...prev, page: 1 }));
                                    }}
                                    style={{ width: isMobile ? 150 : 190 }}
                                >
                                    {shiftTypeOptions.map((shiftType) => (
                                        <Select.Option key={shiftType.name} value={shiftType.name}>
                                            {shiftType.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Button
                                    icon={<PlusOutlined />}
                                    onClick={() => setCreateShiftTypeModalOpen(true)}
                                    title="Create missing Shift Type"
                                />
                            </Space.Compact>
                        )}

                        <Select
                            allowClear
                            placeholder="Status"
                            value={activeTab === 'assignments' ? assignmentFilters.status : attendanceFilters.status}
                            onChange={(value) => {
                                if (activeTab === 'assignments') {
                                    setAssignmentFilters((prev) => ({ ...prev, status: value || undefined }));
                                    setAssignmentPagination((prev) => ({ ...prev, page: 1 }));
                                    return;
                                }
                                setAttendanceFilters((prev) => ({ ...prev, status: value || undefined }));
                                setAttendancePagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            style={{ width: isMobile ? 130 : 170 }}
                        >
                            {(activeTab === 'assignments' ? shiftStatusOptions : attendanceStatusOptions).map((status) => (
                                <Select.Option key={status} value={status}>
                                    {status}
                                </Select.Option>
                            ))}
                        </Select>

                        <RangePicker
                            value={activeTab === 'assignments' ? assignmentFilters.date_range : attendanceFilters.date_range}
                            onChange={(range) => {
                                if (!range || !range[0] || !range[1]) return;
                                if (activeTab === 'assignments') {
                                    setAssignmentFilters((prev) => ({ ...prev, date_range: [range[0], range[1]] }));
                                    setAssignmentPagination((prev) => ({ ...prev, page: 1 }));
                                    return;
                                }
                                setAttendanceFilters((prev) => ({ ...prev, date_range: [range[0], range[1]] }));
                                setAttendancePagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            allowClear={false}
                        />

                        {activeTab === 'attendance' && (
                            <Space wrap>
                                <Space size={4}>
                                    <Switch
                                        size="small"
                                        checked={attendanceFilters.late_only}
                                        onChange={(checked) => {
                                            setAttendanceFilters((prev) => ({ ...prev, late_only: checked }));
                                            setAttendancePagination((prev) => ({ ...prev, page: 1 }));
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Late Only</Text>
                                </Space>
                                <Space size={4}>
                                    <Switch
                                        size="small"
                                        checked={attendanceFilters.missing_checkout_only}
                                        onChange={(checked) => {
                                            setAttendanceFilters((prev) => ({ ...prev, missing_checkout_only: checked }));
                                            setAttendancePagination((prev) => ({ ...prev, page: 1 }));
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Missing Checkout</Text>
                                </Space>
                            </Space>
                        )}
                    </Space>
                </div>

                {activeTab === 'assignments' ? (
                    assignmentViewMode === 'calendar' ? (
                        loadingCalendarAssignments ? (
                            <TableSkeleton rows={10} />
                        ) : (
                            <div style={{ padding: isMobile ? '12px 8px' : '16px' }}>
                                <Alert
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 12 }}
                                    message="Calendar Shift View"
                                    description="Use + in any date cell to create a shift directly from calendar context."
                                />
                                <Calendar
                                    value={assignmentCalendarMonth}
                                    onPanelChange={(value) => {
                                        setAssignmentCalendarMonth(value);
                                        loadAssignmentsCalendar(value);
                                    }}
                                    cellRender={assignmentCellRender}
                                />
                            </div>
                        )
                    ) : loadingAssignments ? (
                        <TableSkeleton rows={assignmentPagination.page_size} />
                    ) : assignments.length > 0 ? (
                        <Table
                            rowKey="name"
                            columns={assignmentColumns}
                            dataSource={assignments}
                            pagination={{
                                current: assignmentPagination.page,
                                pageSize: assignmentPagination.page_size,
                                total: assignmentPagination.total_count,
                                showSizeChanger: true,
                                onChange: (page, pageSize) => {
                                    setAssignmentPagination((prev) => ({ ...prev, page, page_size: pageSize }));
                                },
                            }}
                            scroll={{ x: 'max-content' }}
                            size="middle"
                        />
                    ) : (
                        <EmptyState
                            type="no-data"
                            title="No Shift Assignments"
                            description="Create a shift assignment or adjust your current filters."
                            onAction={() => setCreateModalOpen(true)}
                            actionText="Create Shift"
                        />
                    )
                ) : attendanceViewMode === 'calendar' ? (
                    loadingCalendarAttendance ? (
                        <TableSkeleton rows={10} />
                    ) : (
                        <div style={{ padding: isMobile ? '12px 8px' : '16px' }}>
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginBottom: 12 }}
                                message="Calendar Attendance View"
                                description="Daily totals and exceptions are summarized directly in the calendar cells."
                            />
                            <Calendar
                                value={attendanceCalendarMonth}
                                onPanelChange={(value) => {
                                    setAttendanceCalendarMonth(value);
                                    loadAttendanceCalendar(value);
                                }}
                                cellRender={attendanceCellRender}
                            />
                        </div>
                    )
                ) : loadingAttendance ? (
                    <TableSkeleton rows={attendancePagination.page_size} />
                ) : attendanceRecords.length > 0 ? (
                    <Table
                        rowKey="name"
                        columns={attendanceColumns}
                        dataSource={attendanceRecords}
                        pagination={{
                            current: attendancePagination.page,
                            pageSize: attendancePagination.page_size,
                            total: attendancePagination.total_count,
                            showSizeChanger: true,
                            onChange: (page, pageSize) => {
                                setAttendancePagination((prev) => ({ ...prev, page, page_size: pageSize }));
                            },
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                ) : (
                    <EmptyState
                        type="no-data"
                        title="No Attendance Records"
                        description="No attendance data matched your current date range and filters."
                        onAction={handleRefresh}
                        actionText="Reload Attendance"
                    />
                )}
            </Card>

            <Modal
                title="Create Shift Assignment"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={handleCreateShift}
                okText="Create Shift"
                confirmLoading={submittingCreate}
                destroyOnClose
            >
                <Form form={createForm} layout="vertical" preserve={false}>
                    {shiftTypeOptions.length === 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 12 }}
                            message="Shift Type is required before assignment"
                            description={(
                                <Space direction="vertical" size={8}>
                                    <Text type="secondary">
                                        No Shift Types are currently available in scope.
                                    </Text>
                                    <Button icon={<PlusOutlined />} onClick={() => setCreateShiftTypeModalOpen(true)}>
                                        Create Shift Type
                                    </Button>
                                </Space>
                            )}
                        />
                    )}
                    <Form.Item name="employee" label="Employee" rules={[{ required: true, message: 'Employee is required' }]}>
                        <Select
                            showSearch
                            optionFilterProp="children"
                            placeholder="Select employee"
                        >
                            {employeeOptions.map((employee) => (
                                <Select.Option key={employee.name} value={employee.name}>
                                    {employee.employee_name || employee.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="shift_type" label="Shift Type" rules={[{ required: true, message: 'Shift type is required' }]}>
                        <Select
                            placeholder="Select shift type"
                            popupRender={(originNode) => (
                                <>
                                    {originNode}
                                    <div
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                        }}
                                        style={{ padding: 8, borderTop: `1px solid ${token.colorBorderSecondary}` }}
                                    >
                                        <Button type="text" icon={<PlusOutlined />} block onClick={() => setCreateShiftTypeModalOpen(true)}>
                                            Create missing Shift Type
                                        </Button>
                                    </div>
                                </>
                            )}
                        >
                            {shiftTypeOptions.map((shiftType) => (
                                <Select.Option key={shiftType.name} value={shiftType.name}>
                                    {shiftType.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Space style={{ width: '100%' }} align="start">
                        <Form.Item
                            name="start_date"
                            label="Start Date"
                            rules={[{ required: true, message: 'Start date is required' }]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="end_date" label="End Date" style={{ flex: 1 }}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Space>

                    <Form.Item name="status" label="Status" initialValue="Active">
                        <Select>
                            {shiftStatusOptions.map((status) => (
                                <Select.Option key={status} value={status}>
                                    {status}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="shift_location" label="Shift Location">
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            placeholder={locationOptions.length ? 'Select shift location' : 'No locations available'}
                            popupRender={(originNode) => (
                                <>
                                    {originNode}
                                    <div
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                        }}
                                        style={{ padding: 8, borderTop: `1px solid ${token.colorBorderSecondary}` }}
                                    >
                                        <Button type="text" icon={<PlusOutlined />} block onClick={() => setCreateShiftLocationModalOpen(true)}>
                                            Create missing Location
                                        </Button>
                                    </div>
                                </>
                            )}
                        >
                            {locationOptions.map((location) => (
                                <Select.Option key={location.name} value={location.name}>
                                    {location.label || location.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="overtime_type" label="Overtime Type">
                        <Input placeholder="Optional overtime type" />
                    </Form.Item>
                </Form>
            </Modal>

            <CreateShiftTypeModal
                open={createShiftTypeModalOpen}
                onClose={() => setCreateShiftTypeModalOpen(false)}
                onCreated={handleShiftTypeCreated}
            />

            <CreateShiftLocationModal
                open={createShiftLocationModalOpen}
                locationOptions={locationOptions}
                onClose={() => setCreateShiftLocationModalOpen(false)}
                onCreated={handleShiftLocationCreated}
            />

            <Modal
                title="Reassign Shift"
                open={reassignModalOpen}
                onCancel={() => {
                    setReassignModalOpen(false);
                    setSelectedSourceShift(null);
                }}
                onOk={handleReassignShift}
                okText="Reassign Shift"
                confirmLoading={submittingReassign}
                destroyOnClose
            >
                <Form form={reassignForm} layout="vertical" preserve={false}>
                    {selectedSourceShift && (
                        <Alert
                            type="info"
                            showIcon
                            style={{ marginBottom: 12 }}
                            message={`Source: ${selectedSourceShift.employee_name || selectedSourceShift.employee}`}
                            description={`${selectedSourceShift.shift_type} (${selectedSourceShift.start_date})`}
                        />
                    )}

                    <Form.Item name="source_shift" label="Source Shift" rules={[{ required: true, message: 'Source shift is required' }]}>
                        <Input placeholder="Shift Assignment ID" />
                    </Form.Item>

                    <Form.Item
                        name="target_employee"
                        label="Target Employee"
                        rules={[{ required: true, message: 'Target employee is required' }]}
                    >
                        <Select showSearch optionFilterProp="children" placeholder="Select target employee">
                            {employeeOptions.map((employee) => (
                                <Select.Option key={employee.name} value={employee.name}>
                                    {employee.employee_name || employee.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Space style={{ width: '100%' }} align="start">
                        <Form.Item
                            name="source_date"
                            label="Source Date"
                            style={{ flex: 1 }}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            name="target_date"
                            label="Target Date"
                            rules={[{ required: true, message: 'Target date is required' }]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Space>

                    <Form.Item name="target_shift" label="Target Shift (Optional)">
                        <Select allowClear placeholder="Use employee default if empty">
                            {shiftTypeOptions.map((shiftType) => (
                                <Select.Option key={shiftType.name} value={shiftType.name}>
                                    {shiftType.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ShiftManagementView;
