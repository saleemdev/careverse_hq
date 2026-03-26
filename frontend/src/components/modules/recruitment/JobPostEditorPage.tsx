import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Steps,
    Switch,
    Typography,
    message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { useResponsive } from '../../../hooks/useResponsive';
import useFacilityStore from '../../../stores/facilityStore';
import {
    recruitmentApi,
    type DesignationOption,
    type JobOpening,
    type JobOpeningFormOptions,
    type JobOpeningUpsertPayload,
} from '../../../services/api/recruitment';

const { Title, Text } = Typography;

interface Props {
    mode: 'create' | 'edit';
    jobId?: string;
    navigateToRoute: (route: string, id?: string) => void;
}

interface JobOpeningFormValues {
    job_title: string;
    designation: string;
    company: string;
    health_facility?: string;
    location?: string;
    employment_type?: string;
    status: string;
    description?: string;
    publish?: boolean;
    posted_on?: Dayjs;
    closes_on?: Dayjs;
    lower_range?: number;
    upper_range?: number;
    currency?: string;
    salary_per?: string;
}

const FIELD_TO_STEP: Partial<Record<keyof JobOpeningFormValues, number>> = {
    job_title: 0,
    designation: 0,
    health_facility: 0,
    location: 0,
    status: 1,
    employment_type: 1,
    publish: 1,
    posted_on: 1,
    closes_on: 1,
    lower_range: 2,
    upper_range: 2,
    currency: 2,
    salary_per: 2,
    description: 2,
};

const parseOptionalDate = (value?: string): Dayjs | undefined => {
    if (!value) return undefined;
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : undefined;
};

const parseOptionalNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const resolvePreferredCurrency = (currencyOptions: string[], companyDefaultCurrency?: string): string => {
    const options = Array.isArray(currencyOptions) ? currencyOptions : [];
    const normalizedCompanyCurrency = (companyDefaultCurrency || '').trim().toLowerCase();

    if (normalizedCompanyCurrency) {
        const matched = options.find((option) => option.trim().toLowerCase() === normalizedCompanyCurrency);
        if (matched) {
            return matched;
        }
    }

    return options[0] || '';
};

export default function JobPostEditorPage({ mode, jobId, navigateToRoute }: Props) {
    const { isMobile } = useResponsive();
    const [form] = Form.useForm<JobOpeningFormValues>();

    const company = useFacilityStore((state) => state.company);
    const loadCompanyAndFacilities = useFacilityStore((state) => state.loadCompanyAndFacilities);

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const suppressDirtyTrackingRef = useRef(false);

    const [designationOptions, setDesignationOptions] = useState<DesignationOption[]>([]);
    const [designationLoading, setDesignationLoading] = useState(false);
    const [formOptions, setFormOptions] = useState<JobOpeningFormOptions>({
        employment_types: [],
        locations: [],
        health_facilities: [],
        status_options: [],
        salary_per_options: [],
        currency_options: [],
    });

    const statusOptions = useMemo(
        () => (formOptions.status_options.length ? formOptions.status_options : ['Open', 'Closed'])
            .map((value) => ({ label: value, value })),
        [formOptions.status_options],
    );

    const employmentTypeOptions = useMemo(
        () => formOptions.employment_types.map((value) => ({ label: value, value })),
        [formOptions.employment_types],
    );

    const healthFacilityOptions = useMemo(
        () => formOptions.health_facilities.map((value) => ({ label: value, value })),
        [formOptions.health_facilities],
    );

    const locationOptions = useMemo(
        () => formOptions.locations.map((value) => ({ label: value, value })),
        [formOptions.locations],
    );

    const salaryPeriodOptions = useMemo(
        () => formOptions.salary_per_options.map((value) => ({ label: value, value })),
        [formOptions.salary_per_options],
    );

    const currencyOptions = useMemo(
        () => formOptions.currency_options.map((value) => ({ label: value, value })),
        [formOptions.currency_options],
    );

    const resolvedCompanyName = (company?.name || company?.company_name || '').trim();
    const companyDisplayName = company?.company_name || company?.name || 'Organization';
    const locationFieldLabel = (
        typeof formOptions.location_link_doctype === 'string'
            ? formOptions.location_link_doctype.trim()
            : ''
    ) || 'Location';

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            setLoading(true);
            setDesignationLoading(true);
            try {
                const [designationResp, optionResp] = await Promise.all([
                    recruitmentApi.getDesignationOptions(),
                    recruitmentApi.getJobOpeningFormOptions(),
                ]);

                if (cancelled) return;
                setDesignationOptions(designationResp);
                setFormOptions(optionResp);

                if (mode === 'create') {
                    if (!resolvedCompanyName) {
                        message.warning('Organization context not loaded. Please refresh the page.');
                    }
                    const defaultCurrency = resolvePreferredCurrency(
                        optionResp.currency_options || [],
                        company?.default_currency,
                    );
                    suppressDirtyTrackingRef.current = true;
                    form.setFieldsValue({
                        company: resolvedCompanyName || '',
                        status: optionResp.status_options?.[0] || 'Open',
                        publish: false,
                        salary_per: optionResp.salary_per_options?.[0] || '',
                        currency: defaultCurrency,
                    });
                    setHasUnsavedChanges(false);
                    suppressDirtyTrackingRef.current = false;
                }

                if (mode === 'edit') {
                    if (!jobId) {
                        message.error('Missing job ID for edit flow');
                        navigateToRoute('recruitment/job-posts');
                        return;
                    }

                    const detailResp = await recruitmentApi.getJobOpeningDetail(jobId);
                    const job = (detailResp?.data as JobOpening | null) || null;
                    if (!job) {
                        throw new Error('Unable to load job post');
                    }

                    suppressDirtyTrackingRef.current = true;
                    form.setFieldsValue({
                        job_title: job.job_title || '',
                        designation: job.designation || '',
                        company: job.company || resolvedCompanyName || '',
                        health_facility: job.health_facility_name || job.health_facility || undefined,
                        location: job.location || undefined,
                        employment_type: job.employment_type || undefined,
                        status: job.status || optionResp.status_options[0] || 'Open',
                        description: job.description || undefined,
                        publish: !!job.publish,
                        posted_on: parseOptionalDate(job.posted_on),
                        closes_on: parseOptionalDate(job.closes_on),
                        lower_range: parseOptionalNumber(job.lower_range),
                        upper_range: parseOptionalNumber(job.upper_range),
                        currency: job.currency || optionResp.currency_options[0],
                        salary_per: job.salary_per || optionResp.salary_per_options[0],
                    });
                    setHasUnsavedChanges(false);
                    suppressDirtyTrackingRef.current = false;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to load job post editor';
                message.error(errorMessage);
                navigateToRoute('recruitment/job-posts');
            } finally {
                if (!cancelled) {
                    setDesignationLoading(false);
                    setLoading(false);
                }
            }
        };

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, [mode, jobId, company?.default_currency, resolvedCompanyName, form, navigateToRoute]);

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges || saving) {
                return;
            }
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [hasUnsavedChanges, saving]);

    useEffect(() => {
        if (mode !== 'create') {
            return;
        }

        const updates: Partial<JobOpeningFormValues> = {};

        if (resolvedCompanyName) {
            const currentCompany = form.getFieldValue('company');
            if (!currentCompany) {
                updates.company = resolvedCompanyName;
            }
        }

        const preferredCurrency = resolvePreferredCurrency(
            formOptions.currency_options || [],
            company?.default_currency,
        );
        if (preferredCurrency) {
            const currentCurrency = (form.getFieldValue('currency') || '').trim();
            const firstCurrency = (formOptions.currency_options?.[0] || '').trim();
            const shouldSetCurrency = !currentCurrency || (currentCurrency === firstCurrency && currentCurrency !== preferredCurrency);

            if (shouldSetCurrency) {
                updates.currency = preferredCurrency;
            }
        }

        if (Object.keys(updates).length > 0) {
            suppressDirtyTrackingRef.current = true;
            form.setFieldsValue(updates);
            suppressDirtyTrackingRef.current = false;
        }
    }, [resolvedCompanyName, company?.default_currency, formOptions.currency_options, form, mode]);

    const toPayload = (values: JobOpeningFormValues): JobOpeningUpsertPayload => {
        const resolvedCompany = (values.company || resolvedCompanyName).trim();
        const payload: JobOpeningUpsertPayload = {
            job_title: (values.job_title || '').trim(),
            designation: (values.designation || '').trim(),
            health_facility: values.health_facility?.trim() || '',
            location: values.location?.trim() || '',
            employment_type: values.employment_type || '',
            status: values.status,
            description: values.description?.trim() || '',
            publish: values.publish ? 1 : 0,
            posted_on: values.posted_on ? values.posted_on.format('YYYY-MM-DD') : '',
            closes_on: values.closes_on ? values.closes_on.format('YYYY-MM-DD') : '',
            lower_range: values.lower_range ?? null,
            upper_range: values.upper_range ?? null,
            currency: values.currency || '',
            salary_per: values.salary_per || '',
        };

        if (resolvedCompany) {
            payload.company = resolvedCompany;
        }

        return payload;
    };

    const submit = async (values: JobOpeningFormValues) => {
        const feedbackKey = 'job-post-save-feedback';
        setSaving(true);
        try {
            let payload = toPayload(values);

            if (!payload.company) {
                await loadCompanyAndFacilities();
                const refreshedCompany = (
                    useFacilityStore.getState().company?.name
                    || useFacilityStore.getState().company?.company_name
                    || ''
                ).trim();
                if (refreshedCompany) {
                    payload = {
                        ...payload,
                        company: refreshedCompany,
                    };
                    suppressDirtyTrackingRef.current = true;
                    form.setFieldValue('company', refreshedCompany);
                    suppressDirtyTrackingRef.current = false;
                }
            }

            if (!payload.job_title || !payload.designation) {
                message.error({
                    key: feedbackKey,
                    content: 'Job title and designation are required',
                    duration: 4,
                });
                return;
            }
            if (!payload.company) {
                message.error({
                    key: feedbackKey,
                    content: 'Organization context is missing',
                    duration: 4,
                });
                return;
            }

            message.loading({
                key: feedbackKey,
                content: mode === 'create' ? 'Creating job post...' : 'Saving job post...',
                duration: 0,
            });

            let nextJobId = jobId;
            if (mode === 'create') {
                const created = await recruitmentApi.createJobOpening(payload);
                nextJobId = created.name;
            } else {
                if (!jobId) {
                    message.error({
                        key: feedbackKey,
                        content: 'Missing job ID for update',
                        duration: 4,
                    });
                    return;
                }
                const updated = await recruitmentApi.updateJobOpening(jobId, payload);
                nextJobId = updated.name || jobId;
            }

            const savedJobId = (nextJobId || '').trim();
            if (!savedJobId) {
                throw new Error('Job post was saved but no document ID was returned');
            }

            message.success({
                key: feedbackKey,
                content: mode === 'create' ? 'Job post created successfully' : 'Job post updated successfully',
                duration: 1.8,
            });
            setHasUnsavedChanges(false);
            navigateToRoute('recruitment/job-posts', savedJobId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save job post';
            message.error({
                key: feedbackKey,
                content: errorMessage,
                duration: 4,
            });
        } finally {
            setSaving(false);
        }
    };

    const validateStep = async () => {
        const stepFields: Array<Array<keyof JobOpeningFormValues>> = [
            ['job_title', 'designation', 'health_facility', 'location'],
            ['status', 'employment_type', 'posted_on', 'closes_on', 'publish'],
            ['lower_range', 'upper_range', 'currency', 'salary_per', 'description'],
        ];
        const fields = stepFields[step] || [];
        if (!fields.length) return;
        await form.validateFields(fields as string[]);
    };

    const onNext = async () => {
        try {
            await validateStep();
            setStep((current) => Math.min(current + 1, 2));
        } catch {
            message.warning('Fill the required fields before moving to the next step');
        }
    };

    const onPrevious = () => {
        setStep((current) => Math.max(current - 1, 0));
    };

    const navigateBackToList = () => {
        if (saving) {
            return;
        }

        if (!hasUnsavedChanges) {
            navigateToRoute('recruitment/job-posts');
            return;
        }

        Modal.confirm({
            title: 'Discard unsaved changes?',
            content: 'You have unsaved updates. Leaving now will discard them.',
            okText: 'Discard Changes',
            cancelText: 'Keep Editing',
            okType: 'danger',
            onOk: () => {
                navigateToRoute('recruitment/job-posts');
            },
        });
    };

    return (
        <div style={{ padding: isMobile ? 12 : 24 }}>
            <Card style={{ borderRadius: 12 }}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space direction="vertical" size={2}>
                            <Button
                                type="link"
                                icon={<ArrowLeftOutlined />}
                                style={{ padding: 0 }}
                                onClick={navigateBackToList}
                            >
                                Back to Job Posts
                            </Button>
                            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                                {mode === 'create' ? 'Add New Job Post' : 'Edit Job Post'}
                            </Title>
                            <Text type="secondary">Posting under organization: {companyDisplayName}</Text>
                            <Text type={hasUnsavedChanges ? 'warning' : 'secondary'}>
                                {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
                            </Text>
                        </Space>
                    </Space>

                    <Steps
                        current={step}
                        size={isMobile ? 'small' : 'default'}
                        items={[
                            { title: 'Basics' },
                            { title: 'Publication' },
                            { title: 'Compensation' },
                        ]}
                    />

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <Spin />
                        </div>
                    ) : (
                        <Form<JobOpeningFormValues>
                            form={form}
                            layout="vertical"
                            onFinish={(values) => {
                                void submit(values);
                            }}
                            onFinishFailed={(errorInfo) => {
                                const firstFieldPath = errorInfo?.errorFields?.[0]?.name;
                                const firstField = Array.isArray(firstFieldPath) ? firstFieldPath[0] : firstFieldPath;
                                if (typeof firstField === 'string') {
                                    const targetStep = FIELD_TO_STEP[firstField as keyof JobOpeningFormValues];
                                    if (typeof targetStep === 'number' && targetStep !== step) {
                                        setStep(targetStep);
                                    }
                                    requestAnimationFrame(() => {
                                        form.scrollToField(firstFieldPath);
                                    });
                                }
                                const firstError = errorInfo?.errorFields?.[0]?.errors?.[0];
                                if (firstError) {
                                    message.error(`Validation error: ${firstError}`);
                                }
                            }}
                            onValuesChange={() => {
                                if (saving || hasUnsavedChanges) {
                                    return;
                                }
                                setHasUnsavedChanges(true);
                            }}
                        >
                            <Form.Item name="company" hidden>
                                <Input />
                            </Form.Item>

                            <div style={{ display: step === 0 ? 'block' : 'none' }}>
                                <Row gutter={12}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Job Title"
                                            name="job_title"
                                            rules={[{ required: true, whitespace: true, message: 'Job title is required' }]}
                                        >
                                            <Input maxLength={140} placeholder="e.g. Registered Nurse" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Designation"
                                            name="designation"
                                            rules={[{ required: true, message: 'Designation is required' }]}
                                        >
                                            <Select
                                                showSearch
                                                optionFilterProp="label"
                                                options={designationOptions}
                                                notFoundContent={designationLoading ? <Spin size="small" /> : null}
                                                placeholder="Select designation"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={12}>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Health Facility" name="health_facility">
                                            <Select
                                                showSearch
                                                allowClear
                                                optionFilterProp="label"
                                                options={healthFacilityOptions}
                                                placeholder={healthFacilityOptions.length ? 'Select health facility' : 'No facilities available'}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label={locationFieldLabel} name="location">
                                            <Select
                                                showSearch
                                                allowClear
                                                optionFilterProp="label"
                                                options={locationOptions}
                                                placeholder={locationOptions.length ? `Select ${locationFieldLabel.toLowerCase()}` : `No ${locationFieldLabel.toLowerCase()} options available`}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div style={{ display: step === 1 ? 'block' : 'none' }}>
                                <Row gutter={12}>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Status"
                                            name="status"
                                            rules={[{ required: true, message: 'Status is required' }]}
                                        >
                                            <Select options={statusOptions} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Employment Type" name="employment_type">
                                            <Select
                                                showSearch
                                                allowClear
                                                optionFilterProp="label"
                                                options={employmentTypeOptions}
                                                placeholder={employmentTypeOptions.length ? 'Select employment type' : 'No employment types available'}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Published" name="publish" valuePropName="checked">
                                            <div style={{ minHeight: 32, display: 'flex', alignItems: 'center' }}>
                                                <Switch checkedChildren="Yes" unCheckedChildren="No" />
                                            </div>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={12}>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Posting Date" name="posted_on">
                                            <DatePicker style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Closing Date"
                                            name="closes_on"
                                            dependencies={['posted_on']}
                                            rules={[
                                                ({ getFieldValue }) => ({
                                                    validator(_, value: Dayjs | undefined) {
                                                        const postedOn = getFieldValue('posted_on') as Dayjs | undefined;
                                                        if (!postedOn || !value || value.isAfter(postedOn, 'day') || value.isSame(postedOn, 'day')) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error('Closing date must be on or after posting date'));
                                                    },
                                                }),
                                            ]}
                                        >
                                            <DatePicker style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div style={{ display: step === 2 ? 'block' : 'none' }}>
                                <Row gutter={12}>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Minimum Salary" name="lower_range">
                                            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Maximum Salary"
                                            name="upper_range"
                                            dependencies={['lower_range']}
                                            rules={[
                                                ({ getFieldValue }) => ({
                                                    validator(_, value: number | undefined) {
                                                        const minValue = getFieldValue('lower_range') as number | undefined;
                                                        if (!minValue || !value || value >= minValue) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error('Maximum salary must be greater than or equal to minimum salary'));
                                                    },
                                                }),
                                            ]}
                                        >
                                            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Currency" name="currency">
                                            <Select
                                                showSearch
                                                allowClear
                                                optionFilterProp="label"
                                                options={currencyOptions}
                                                placeholder={currencyOptions.length ? 'Select currency' : 'No currencies configured'}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={12}>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Salary Period" name="salary_per">
                                            <Select
                                                allowClear
                                                options={salaryPeriodOptions}
                                                placeholder={salaryPeriodOptions.length ? 'Select salary period' : 'No salary periods configured'}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Divider style={{ marginTop: 0 }} />

                                <Form.Item label="Description" name="description">
                                    <Input.TextArea rows={6} maxLength={4000} showCount />
                                </Form.Item>
                            </div>

                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Button
                                    onClick={step === 0 ? navigateBackToList : onPrevious}
                                    disabled={saving}
                                >
                                    {step === 0 ? 'Cancel' : 'Back'}
                                </Button>

                                {step < 2 ? (
                                    <Button type="primary" onClick={onNext} disabled={saving}>
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={saving}
                                    >
                                        {mode === 'create' ? 'Create & View Details' : 'Save & View Details'}
                                    </Button>
                                )}
                            </Space>
                        </Form>
                    )}
                </Space>
            </Card>
        </div>
    );
}
