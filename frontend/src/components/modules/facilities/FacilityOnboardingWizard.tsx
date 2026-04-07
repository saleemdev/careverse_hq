import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Collapse,
    Descriptions,
    Divider,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Result,
    Row,
    Segmented,
    Select,
    Space,
    Spin,
    Steps,
    Switch,
    Tag,
    Typography,
    message,
    theme,
} from 'antd';
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useResponsive } from '../../../hooks/useResponsive';
import useFacilityStore from '../../../stores/facilityStore';
import {
    facilityOnboardingApi,
} from '../../../services/api';
import type {
    ApiErrorPayload,
    ApiResponse,
    FacilityOnboardingAdditionalDefaults,
    FacilityOnboardingBank,
    FacilityOnboardingContact,
    FacilityOnboardingLookupResult,
    FacilityOnboardingOtpSession,
    FacilityOwnerOtpVerificationResult,
} from '../../../services/api';

const { Paragraph, Text, Title } = Typography;

interface FacilityOnboardingWizardProps {
    navigateToRoute?: (route: string, id?: string) => void;
    standalone?: boolean;
}

interface WizardFormValues {
    lookup_mode?: 'facility_id' | 'registration_number';
    lookup_value?: string;
    facility_id?: string;
    registration_number?: string;
    delivery_mode?: 'sms' | 'email';
    otp_code?: string;
    region?: string;
    physical_address?: string;
    email_address?: string;
    number_of_beds?: number | null;
    latitude?: string;
    longitude?: string;
    maximum_bed_allocation?: number | null;
    open_whole_day?: boolean;
    open_public_holiday?: boolean;
    open_weekends?: boolean;
    open_late_night?: boolean;
    contacts?: FacilityOnboardingContact[];
    banks?: FacilityOnboardingBank[];
}

interface StepErrorState {
    step: number;
    title: string;
    message: string;
    statusCode?: number;
    sourceLabel?: string;
    technicalMessage?: string;
    debugTraceback?: string;
}

const FEATURE_ENABLED = import.meta.env.VITE_ENABLE_FACILITY_ONBOARDING !== 'false';

const toSwitchValue = (value: boolean | number | string | null | undefined): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
    return false;
};

const compactValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') {
        return 'Not provided';
    }
    return String(value);
};

const formatCountdown = (seconds: number): string => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const FacilityOnboardingWizard: React.FC<FacilityOnboardingWizardProps> = ({
    navigateToRoute,
    standalone = false,
}) => {
    const { token } = theme.useToken();
    const { isMobile } = useResponsive();
    const [form] = Form.useForm<WizardFormValues>();
    const lookupMode = Form.useWatch('lookup_mode', form) || 'facility_id';
    const [modal, contextHolder] = Modal.useModal();
    const { accessMode, loadCompanyAndFacilities } = useFacilityStore();

    const [currentStep, setCurrentStep] = useState(0);
    const [referenceData, setReferenceData] = useState<{
        regions: any[];
        public_owner_types: string[];
        organization_context?: {
            organization_id?: string | null;
            organization_name?: string | null;
            company_names?: string[];
            organization_region?: string | null;
            organization_region_name?: string | null;
            default_region?: string | null;
        };
    }>({
        regions: [],
        public_owner_types: [],
        organization_context: undefined,
    });
    const [referenceLoading, setReferenceLoading] = useState(true);
    const [lookupResult, setLookupResult] = useState<(FacilityOnboardingLookupResult & { otp_session?: FacilityOnboardingOtpSession | null }) | null>(null);
    const [verificationResult, setVerificationResult] = useState<FacilityOwnerOtpVerificationResult | null>(null);
    const [createdFacility, setCreatedFacility] = useState<any | null>(null);
    const [searchingFacility, setSearchingFacility] = useState(false);
    const [requestingOtp, setRequestingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpExpiresIn, setOtpExpiresIn] = useState(0);
    const [verificationExpiresIn, setVerificationExpiresIn] = useState(0);
    const [stepError, setStepError] = useState<StepErrorState | null>(null);

    const steps = [
        { title: 'Find Facility' },
        { title: 'Verify Ownership' },
        { title: 'Local Setup' },
        { title: 'Contacts & Banking' },
        { title: 'Review' },
    ];

    useEffect(() => {
        if (!FEATURE_ENABLED) {
            setReferenceLoading(false);
            return;
        }

        let active = true;
        setReferenceLoading(true);
        facilityOnboardingApi.getReferenceData().then((response) => {
            if (!active) return;
            if (response.success && response.data) {
                setReferenceData({
                    regions: response.data.regions || [],
                    public_owner_types: response.data.public_owner_types || [],
                    organization_context: response.data.organization_context,
                });
                if (response.data.organization_context?.default_region) {
                    form.setFieldValue('region', response.data.organization_context.default_region);
                }
                setStepError(null);
            } else {
                setStepError(buildStepError(
                    0,
                    'Unable to load onboarding setup',
                    response,
                    'Unable to load facility onboarding reference data.',
                ));
            }
            setReferenceLoading(false);
        }).catch(() => {
            if (!active) return;
            setStepError({
                step: 0,
                title: 'Unable to load onboarding setup',
                message: 'Unable to load facility onboarding reference data.',
            });
            setReferenceLoading(false);
        });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setResendCooldown((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [resendCooldown]);

    useEffect(() => {
        if (otpExpiresIn <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setOtpExpiresIn((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [otpExpiresIn]);

    useEffect(() => {
        if (verificationExpiresIn <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setVerificationExpiresIn((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [verificationExpiresIn]);

    const currentOwnerType = verificationResult?.additional_defaults?.organization_owner_type || '';
    const isPublicFacility = referenceData.public_owner_types.includes(currentOwnerType.trim().toUpperCase());
    const hasDraft = currentStep > 0 || !!lookupResult || !!verificationResult || form.isFieldsTouched(true);
    const backRoute = standalone ? 'company-permissions' : 'facilities';
    const currentOrganizationName = referenceData.organization_context?.organization_name || null;
    const currentOrganizationRegionName = referenceData.organization_context?.organization_region_name || null;
    const canContinueToVerification = Boolean(
        lookupResult?.facility_preview?.facility_id
        && lookupResult?.can_start_verification
        && !lookupResult?.already_onboarded
    );
    const verificationExpired = Boolean(verificationResult && verificationExpiresIn <= 0);

    const extractApiErrorPayload = (response: ApiResponse<any>): ApiErrorPayload | undefined => {
        const candidate = response.data;
        if (candidate && typeof candidate === 'object') {
            return candidate as ApiErrorPayload;
        }
        return undefined;
    };

    const buildStepError = (
        step: number,
        title: string,
        response: ApiResponse<any>,
        fallbackMessage: string,
    ): StepErrorState => {
        const payload = extractApiErrorPayload(response);
        const details = payload?.details;
        return {
            step,
            title,
            message: response.error || response.message || payload?.message || fallbackMessage,
            statusCode: payload?.status_code || details?.status_code,
            sourceLabel: details?.source_label,
            technicalMessage: details?.technical_message,
            debugTraceback: details?.debug_traceback,
        };
    };

    const renderStepError = () => {
        if (!stepError || stepError.step !== currentStep) {
            return null;
        }

        const hasExpandedDetails = Boolean(
            stepError.sourceLabel || stepError.statusCode || stepError.technicalMessage || stepError.debugTraceback,
        );

        return (
            <Alert
                type="error"
                showIcon
                message={stepError.title}
                description={(
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Text>{stepError.message}</Text>
                        {hasExpandedDetails && (
                            <Collapse
                                ghost
                                size="small"
                                items={[
                                    {
                                        key: 'details',
                                        label: 'Show more',
                                        children: (
                                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                {stepError.sourceLabel && (
                                                    <Text>
                                                        <Text strong>Source:</Text> {stepError.sourceLabel}
                                                    </Text>
                                                )}
                                                {stepError.statusCode && (
                                                    <Text>
                                                        <Text strong>HTTP status:</Text> {stepError.statusCode}
                                                    </Text>
                                                )}
                                                {stepError.technicalMessage && (
                                                    <div>
                                                        <Text strong>Technical details</Text>
                                                        <div
                                                            style={{
                                                                marginTop: 6,
                                                                padding: 10,
                                                                borderRadius: 8,
                                                                background: token.colorFillTertiary,
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                            }}
                                                        >
                                                            <Text>{stepError.technicalMessage}</Text>
                                                        </div>
                                                    </div>
                                                )}
                                                {stepError.debugTraceback && (
                                                    <div>
                                                        <Text strong>Stack trace</Text>
                                                        <div
                                                            style={{
                                                                marginTop: 6,
                                                                padding: 10,
                                                                borderRadius: 8,
                                                                background: token.colorFillTertiary,
                                                                maxHeight: 220,
                                                                overflow: 'auto',
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {stepError.debugTraceback}
                                                        </div>
                                                    </div>
                                                )}
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </Space>
                )}
            />
        );
    };

    const resetWizard = () => {
        setCurrentStep(0);
        setStepError(null);
        setLookupResult(null);
        setVerificationResult(null);
        setCreatedFacility(null);
        setRequestingOtp(false);
        setVerifyingOtp(false);
        setSubmitting(false);
        setResendCooldown(0);
        setOtpExpiresIn(0);
        setVerificationExpiresIn(0);
        form.resetFields();
        form.setFieldsValue({
            lookup_mode: 'facility_id',
            contacts: [],
            banks: [],
        });
    };

    useEffect(() => {
        form.setFieldsValue({
            lookup_mode: 'facility_id',
            contacts: [],
            banks: [],
        });
    }, [form]);

    const handleBack = async () => {
        if (!hasDraft || createdFacility) {
            navigateToRoute?.(backRoute);
            return;
        }

        const confirmed = await modal.confirm({
            title: 'Discard onboarding draft?',
            content: 'Your current facility onboarding progress will be lost.',
            okText: 'Discard Draft',
            okType: 'danger',
            cancelText: 'Stay Here',
        });

        if (confirmed) {
            navigateToRoute?.(backRoute);
        }
    };

    const handleLookupModeChange = (value: string | number) => {
        const nextMode = value === 'registration_number' ? 'registration_number' : 'facility_id';
        form.setFieldsValue({
            lookup_mode: nextMode,
            lookup_value: '',
            facility_id: undefined,
            registration_number: undefined,
            otp_code: '',
        });
        setLookupResult(null);
        setVerificationResult(null);
        setStepError(null);
        setCurrentStep(0);
        setResendCooldown(0);
        setOtpExpiresIn(0);
        setVerificationExpiresIn(0);
    };

    const handleLookupValueChange = () => {
        if (!lookupResult && !verificationResult) {
            return;
        }

        setLookupResult(null);
        setVerificationResult(null);
        setStepError(null);
        setCurrentStep(0);
        setResendCooldown(0);
        setOtpExpiresIn(0);
        setVerificationExpiresIn(0);
        form.setFieldsValue({
            facility_id: undefined,
            registration_number: undefined,
            otp_code: '',
        });
    };

    const buildLookupPayload = (): Record<string, string> => {
        const values = form.getFieldsValue(['lookup_mode', 'lookup_value']);
        const lookupMode = values.lookup_mode || 'facility_id';
        const lookupValue = String(values.lookup_value || '').trim();

        if (!lookupValue) {
            return {};
        }

        if (lookupMode === 'registration_number') {
            return { registration_number: lookupValue };
        }

        return { facility_id: lookupValue };
    };

    const handleLookupFacility = async () => {
        const payload = buildLookupPayload();
        if (!payload.facility_id && !payload.registration_number) {
            message.warning('Enter a facility FID or registration number to search.');
            return;
        }

        setStepError(null);
        setLookupResult(null);
        setVerificationResult(null);
        setCurrentStep(0);
        setResendCooldown(0);
        setOtpExpiresIn(0);
        setVerificationExpiresIn(0);
        setSearchingFacility(true);
        const response = await facilityOnboardingApi.lookupFacility(payload);
        setSearchingFacility(false);

        if (!response.success || !response.data) {
            form.setFieldsValue({
                facility_id: undefined,
                registration_number: undefined,
                otp_code: '',
            });
            setStepError(buildStepError(
                0,
                'We could not fetch the facility from HFR',
                response,
                'Unable to fetch the facility from the Health Facility Registry.',
            ));
            return;
        }

        setLookupResult({ ...response.data, otp_session: null });
        setVerificationResult(null);
        setCurrentStep(0);
        setResendCooldown(0);
        form.setFieldsValue({
            facility_id: response.data.facility_preview?.facility_id || undefined,
            registration_number: response.data.facility_preview?.registration_number || undefined,
            otp_code: '',
        });
        if (response.data.already_onboarded) {
            message.warning(response.data.message || 'This facility is already onboarded in the system.');
            return;
        }

        if (response.data.can_start_verification) {
            message.success('Facility preview loaded from HFR. Continue to ownership verification.');
            return;
        }

        message.warning(response.data.message || 'Facility found, but onboarding cannot continue yet.');
    };

    const handleStartVerification = async () => {
        const facilityId = lookupResult?.facility_preview?.facility_id;
        if (!facilityId) {
            message.warning('Search for a facility first.');
            return;
        }

        if (!lookupResult?.can_start_verification) {
            message.warning(lookupResult?.message || 'This facility cannot proceed to verification.');
            return;
        }

        setStepError(null);
        setRequestingOtp(true);
        const response = await facilityOnboardingApi.startOwnerVerification({
            facility_id: facilityId,
        });
        setRequestingOtp(false);

        if (!response.success || !response.data) {
            setStepError(buildStepError(
                1,
                'We could not send the verification code',
                response,
                'Unable to send the ownership verification code.',
            ));
            return;
        }

        setLookupResult((current) => current ? {
            ...current,
            owner_match: response.data.owner_match,
            otp_session: response.data.otp_session,
        } : null);
        setResendCooldown(response.data.otp_session?.resend_cooldown_seconds || 0);
        setOtpExpiresIn(response.data.otp_session?.expires_in_seconds || 0);
        form.setFieldValue('otp_code', '');
        message.success('OTP sent to the registered facility owner contact.');
    };

    const handleVerifyOtp = async () => {
        const otpCode = String(form.getFieldValue('otp_code') || '').trim();
        const facilityId = lookupResult?.facility_preview?.facility_id;
        const otpId = lookupResult?.otp_session?.otp_id;

        if (!facilityId || !otpId) {
            message.error('OTP session is missing. Start verification again.');
            return;
        }

        if (!otpCode) {
            message.warning('Enter the OTP to continue.');
            return;
        }

        if (otpExpiresIn <= 0) {
            message.warning('The current OTP has expired. Request a new code to continue.');
            return;
        }

        setStepError(null);
        setVerifyingOtp(true);
        const response = await facilityOnboardingApi.verifyOwnerOtp({
            facility_id: facilityId,
            otp_id: otpId,
            otp_code: otpCode,
        });
        setVerifyingOtp(false);

        if (!response.success || !response.data) {
            setStepError(buildStepError(
                1,
                'We could not verify the code',
                response,
                'Unable to verify the ownership code.',
            ));
            return;
        }

        setVerificationResult(response.data);
        setCurrentStep(2);
        setOtpExpiresIn(0);
        setVerificationExpiresIn(response.data.verification?.expires_in_seconds || 0);
        form.setFieldsValue({
            region: response.data.additional_defaults?.region || referenceData.organization_context?.default_region || undefined,
            physical_address: response.data.additional_defaults?.physical_address || undefined,
            email_address: response.data.additional_defaults?.email_address || undefined,
            number_of_beds: response.data.additional_defaults?.number_of_beds as number | null | undefined,
            latitude: response.data.additional_defaults?.latitude || undefined,
            longitude: response.data.additional_defaults?.longitude || undefined,
            maximum_bed_allocation: response.data.additional_defaults?.maximum_bed_allocation as number | null | undefined,
            open_whole_day: toSwitchValue(response.data.additional_defaults?.open_whole_day),
            open_public_holiday: toSwitchValue(response.data.additional_defaults?.open_public_holiday),
            open_weekends: toSwitchValue(response.data.additional_defaults?.open_weekends),
            open_late_night: toSwitchValue(response.data.additional_defaults?.open_late_night),
        });
        message.success('Ownership verified. Complete the facility setup details.');
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) {
            return;
        }
        await handleStartVerification();
    };

    const ensureVerificationActive = () => {
        if (!verificationResult) {
            return false;
        }

        if (verificationExpiresIn > 0) {
            return true;
        }

        message.warning('Ownership verification expired. Return to the OTP step and verify again.');
        setCurrentStep(1);
        return false;
    };

    const handleNextFromSetup = async () => {
        if (!ensureVerificationActive()) {
            return;
        }

        const fieldNames = [
            'physical_address',
            'email_address',
            'number_of_beds',
            'latitude',
            'longitude',
            'maximum_bed_allocation',
        ];

        if (!isPublicFacility) {
            fieldNames.push('region');
        }

        try {
            await form.validateFields(fieldNames);
            setCurrentStep(3);
        } catch {
            message.warning('Complete the required setup fields before continuing.');
        }
    };

    const handleNextFromContacts = async () => {
        if (!ensureVerificationActive()) {
            return;
        }

        try {
            await form.validateFields();
            setCurrentStep(4);
        } catch {
            message.warning('Review the contact and bank details before continuing.');
        }
    };

    const handleSubmit = async () => {
        const facilityId = verificationResult?.facility_details?.facility_fid || lookupResult?.facility_preview?.facility_id;
        if (!facilityId) {
            message.error('Facility verification data is missing.');
            return;
        }

        if (!ensureVerificationActive()) {
            return;
        }

        const values = form.getFieldsValue(true);
        const additionalDetails: FacilityOnboardingAdditionalDefaults = {
            physical_address: values.physical_address,
            email_address: values.email_address,
            number_of_beds: values.number_of_beds,
            latitude: values.latitude,
            longitude: values.longitude,
            maximum_bed_allocation: values.maximum_bed_allocation,
            open_whole_day: values.open_whole_day,
            open_public_holiday: values.open_public_holiday,
            open_weekends: values.open_weekends,
            open_late_night: values.open_late_night,
            region: values.region,
        };

        const contacts = (values.contacts || []).filter((contact) => contact?.contact_name && contact?.phone_number);
        const banks = (values.banks || []).filter((bank) => bank?.bank_name && bank?.account_number);

        setStepError(null);
        setSubmitting(true);
        const response = await facilityOnboardingApi.completeOnboarding({
            facility_id: facilityId,
            additional_details: additionalDetails,
            contacts,
            banks,
        });
        setSubmitting(false);

        if (!response.success || !response.data) {
            setStepError(buildStepError(
                4,
                'We could not complete facility onboarding',
                response,
                'Unable to complete facility onboarding.',
            ));
            return;
        }

        setCreatedFacility(response.data);
        message.success('Facility onboarded successfully.');
    };

    const handlePostSuccessNavigation = async (route: string, id?: string) => {
        if (accessMode === 'none') {
            await loadCompanyAndFacilities();
        }
        navigateToRoute?.(route, id);
    };

    const renderRegistrySummary = () => {
        if (!lookupResult?.facility_preview) {
            return null;
        }

        return (
            <Card
                size="small"
                style={{ borderRadius: 12, background: token.colorFillQuaternary }}
                bodyStyle={{ padding: 16 }}
            >
                <Descriptions
                    title="Registry Match"
                    column={isMobile ? 1 : 2}
                    size="small"
                    items={[
                        { key: 'name', label: 'Facility', children: compactValue(lookupResult.facility_preview.facility_name) },
                        { key: 'id', label: 'Facility ID', children: compactValue(lookupResult.facility_preview.facility_id) },
                        { key: 'code', label: 'MFL Code', children: compactValue(lookupResult.facility_preview.facility_code) },
                        { key: 'reg', label: 'Registration No.', children: compactValue(lookupResult.facility_preview.registration_number) },
                        { key: 'type', label: 'Type', children: compactValue(lookupResult.facility_preview.facility_type) },
                        { key: 'level', label: 'Level', children: compactValue(lookupResult.facility_preview.facility_level) },
                    ]}
                />
            </Card>
        );
    };

    const renderVerificationExpiryNotice = () => {
        if (!verificationResult) {
            return null;
        }

        if (verificationExpiresIn <= 0) {
            return (
                <Alert
                    type="error"
                    showIcon
                    message="Ownership verification expired"
                    description="Return to the OTP step, send a new code, and verify again before saving the facility."
                />
            );
        }

        return (
            <Alert
                type={verificationExpiresIn <= 120 ? 'warning' : 'info'}
                showIcon
                message="Ownership verification is active"
                description={`Complete the remaining steps within ${formatCountdown(verificationExpiresIn)}.`}
            />
        );
    };

    const renderReview = () => {
        const values = form.getFieldsValue(true);
        const contacts = values.contacts || [];
        const banks = values.banks || [];

        return (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card size="small" style={{ borderRadius: 12 }}>
                    <Descriptions
                        title="Facility"
                        column={isMobile ? 1 : 2}
                        size="small"
                        items={[
                            { key: 'facility_name', label: 'Facility Name', children: compactValue(verificationResult?.facility_details?.facility_name) },
                            { key: 'facility_id', label: 'Facility ID', children: compactValue(verificationResult?.facility_details?.facility_fid) },
                            { key: 'facility_type', label: 'Facility Type', children: compactValue(verificationResult?.facility_details?.facility_type) },
                            { key: 'owner_type', label: 'Owner Type', children: compactValue(verificationResult?.additional_defaults?.organization_owner_type) },
                            { key: 'owner', label: 'Owner', children: compactValue(verificationResult?.additional_defaults?.organization_owner) },
                            { key: 'license', label: 'License Number', children: compactValue(verificationResult?.license_details?.current_license_number) },
                        ]}
                    />
                </Card>

                <Card size="small" style={{ borderRadius: 12 }}>
                    <Descriptions
                        title="Local Setup"
                        column={isMobile ? 1 : 2}
                        size="small"
                        items={[
                            { key: 'organization', label: 'Organization', children: compactValue(currentOrganizationName) },
                            { key: 'region', label: 'Region', children: compactValue(referenceData.regions.find((region) => region.name === values.region)?.region_name || values.region) },
                            { key: 'address', label: 'Address', children: compactValue(values.physical_address) },
                            { key: 'email', label: 'Email', children: compactValue(values.email_address) },
                            { key: 'beds', label: 'Beds', children: compactValue(values.number_of_beds) },
                            { key: 'lat', label: 'Latitude', children: compactValue(values.latitude) },
                            { key: 'long', label: 'Longitude', children: compactValue(values.longitude) },
                            { key: 'whole_day', label: 'Open Whole Day', children: values.open_whole_day ? 'Yes' : 'No' },
                            { key: 'weekends', label: 'Open Weekends', children: values.open_weekends ? 'Yes' : 'No' },
                        ]}
                    />
                </Card>

                <Card size="small" style={{ borderRadius: 12 }}>
                    <Descriptions
                        title="Contacts & Banking"
                        column={1}
                        size="small"
                        items={[
                            {
                                key: 'contacts',
                                label: 'Contacts',
                                children: contacts.length
                                    ? contacts.map((contact: FacilityOnboardingContact) => `${contact.contact_name} (${contact.phone_number})`).join(', ')
                                    : 'No extra contacts added',
                            },
                            {
                                key: 'banks',
                                label: 'Bank Accounts',
                                children: banks.length
                                    ? banks.map((bank: FacilityOnboardingBank) => `${bank.bank_name} (${bank.account_number})`).join(', ')
                                    : 'No bank accounts added',
                            },
                        ]}
                    />
                </Card>
            </Space>
        );
    };

    if (!FEATURE_ENABLED) {
        return (
            <div style={{ padding: isMobile ? '16px' : '24px' }}>
                <Card style={{ borderRadius: 16 }}>
                    <Empty description="Facility onboarding is currently disabled." />
                </Card>
            </div>
        );
    }

    if (createdFacility) {
        return (
            <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: 760, margin: '0 auto' }}>
                {contextHolder}
                <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <Result
                        status="success"
                        title="Facility Onboarded"
                        subTitle={
                            <Space direction="vertical" size={6} style={{ textAlign: 'center' }}>
                                <Text>
                                    <Tag color="blue">{createdFacility.facility_name}</Tag> has been added to your organization.
                                </Text>
                                <Text type="secondary">
                                    Refresh your facility context and continue to the facilities module.
                                </Text>
                            </Space>
                        }
                        extra={[
                            <Button
                                key="view"
                                type="primary"
                                onClick={() => handlePostSuccessNavigation('facilities', createdFacility.facility_docname)}
                            >
                                View Facility
                            </Button>,
                            <Button key="another" onClick={resetWizard}>
                                Onboard Another
                            </Button>,
                            <Button key="return" onClick={() => handlePostSuccessNavigation('facilities')}>
                                Return to Facilities
                            </Button>,
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: 1040, margin: '0 auto' }}>
            {contextHolder}
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBack}
                            style={{ paddingInline: 0, marginBottom: 8 }}
                        >
                            {standalone ? 'Back to Access Page' : 'Back to Facilities'}
                        </Button>
                        <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                            <SafetyCertificateOutlined style={{ marginRight: 10, opacity: 0.55 }} />
                            Health Facility Onboarding
                        </Title>
                        <Text type="secondary">
                            Verify the registered facility owner, complete the local setup, and add the facility to your organization.
                        </Text>
                    </div>
                    <Alert
                        type="info"
                        showIcon
                        style={{ maxWidth: 360 }}
                        message={currentOrganizationName ? `Adding to ${currentOrganizationName}` : 'Registry-driven onboarding'}
                        description={
                            currentOrganizationName
                                ? `The facility must already exist in the health facility registry and will be added within your authorized organization context${currentOrganizationRegionName ? ` (${currentOrganizationRegionName})` : ''}.`
                                : 'The facility must already exist in the health facility registry and list you as the owner.'
                        }
                    />
                </div>

                <Card style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <Space direction="vertical" size={24} style={{ width: '100%' }}>
                        <Steps
                            current={currentStep}
                            size={isMobile ? 'small' : 'default'}
                            direction={isMobile ? 'vertical' : 'horizontal'}
                            items={steps}
                        />

                        {referenceLoading ? (
                            <div style={{ padding: '48px 0', textAlign: 'center' }}>
                                <Spin size="large" />
                            </div>
                        ) : (
                            <Form form={form} layout="vertical" initialValues={{ lookup_mode: 'facility_id', contacts: [], banks: [] }}>
                                {renderStepError()}

                                {currentStep === 0 && (
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        <Alert
                                            type="warning"
                                            showIcon
                                            icon={<InfoCircleOutlined />}
                                            message="Find the facility in the registry"
                                            description="Search by either FID or the regulator-issued registration number. This step loads an HFR preview only. The full onboarding defaults appear after owner OTP verification and the facility will be attached to your current organization context."
                                        />

                                        {currentOrganizationName && (
                                            <Card size="small" style={{ borderRadius: 12, background: token.colorFillTertiary }}>
                                                <Descriptions
                                                    title="Current Organization Context"
                                                    column={isMobile ? 1 : 2}
                                                    size="small"
                                                    items={[
                                                        {
                                                            key: 'organization',
                                                            label: 'Organization',
                                                            children: currentOrganizationName,
                                                        },
                                                        {
                                                            key: 'region',
                                                            label: 'Default Region',
                                                            children: currentOrganizationRegionName || 'Select a region during setup if required',
                                                        },
                                                    ]}
                                                />
                                            </Card>
                                        )}

                                        <Card size="small" style={{ borderRadius: 12, background: token.colorFillQuaternary }}>
                                            <Descriptions
                                                title="Choose the lookup identifier"
                                                column={isMobile ? 1 : 2}
                                                size="small"
                                                items={[
                                                    {
                                                        key: 'fid',
                                                        label: 'FID',
                                                        children: 'The HIE-generated facility identifier used across integrated systems.',
                                                    },
                                                    {
                                                        key: 'registration_number',
                                                        label: 'Registration Number',
                                                        children: 'The regulator-issued facility registration number used on the facility licence/registration record.',
                                                    },
                                                ]}
                                            />
                                        </Card>

                                        <Form.Item label="Search By" name="lookup_mode">
                                            <Segmented
                                                block
                                                options={[
                                                    { label: 'FID', value: 'facility_id' },
                                                    { label: 'Facility Registration Number', value: 'registration_number' },
                                                ]}
                                                value={lookupMode}
                                                onChange={handleLookupModeChange}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label={lookupMode === 'registration_number' ? 'Facility Registration Number' : 'HIE Facility ID (FID)'}
                                            name="lookup_value"
                                            rules={[{ required: true, message: 'Enter the selected registry identifier' }]}
                                        >
                                            <Input.Search
                                                allowClear
                                                enterButton="Search Facility"
                                                loading={searchingFacility}
                                                onChange={handleLookupValueChange}
                                                onSearch={handleLookupFacility}
                                                prefix={<SearchOutlined />}
                                                placeholder={
                                                    lookupMode === 'registration_number'
                                                        ? 'Enter the official facility registration number'
                                                        : 'e.g. FID-19-118376-4'
                                                }
                                            />
                                        </Form.Item>

                                        {renderRegistrySummary()}

                                        {lookupResult?.message && (
                                            <Alert
                                                type={canContinueToVerification ? 'success' : 'warning'}
                                                showIcon
                                                message={lookupResult.message}
                                            />
                                        )}

                                        {lookupResult?.already_onboarded && (
                                            <Result
                                                status="warning"
                                                title="This facility is already onboarded"
                                                subTitle="Confirm the FID or registration number and search again if needed. If the identifier is correct, this facility is already onboarded in the system."
                                                extra={[
                                                    <Button key="search-again" onClick={resetWizard}>
                                                        Search Another Facility
                                                    </Button>,
                                                ]}
                                            />
                                        )}

                                        {!lookupResult?.already_onboarded && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    type="primary"
                                                    disabled={!canContinueToVerification}
                                                    onClick={() => setCurrentStep(1)}
                                                >
                                                    Continue to Owner Verification
                                                </Button>
                                            </div>
                                        )}
                                    </Space>
                                )}

                                {currentStep === 1 && lookupResult && (
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        {renderRegistrySummary()}

                                        <Card size="small" style={{ borderRadius: 12, background: token.colorFillQuaternary }}>
                                            <Descriptions
                                                title="Ownership Check"
                                                column={isMobile ? 1 : 2}
                                                size="small"
                                                items={[
                                                    {
                                                        key: 'match',
                                                        label: 'Registry owner ID',
                                                        children: lookupResult.owner_match?.matched
                                                            ? 'Matched your signed-in account'
                                                            : 'Did not match your signed-in account',
                                                    },
                                                    {
                                                        key: 'id_number',
                                                        label: 'Your identifier',
                                                        children: compactValue(lookupResult.owner_match?.identification_number),
                                                    },
                                                    {
                                                        key: 'id_type',
                                                        label: 'Identifier type',
                                                        children: compactValue(lookupResult.owner_match?.identification_type),
                                                    },
                                                ]}
                                            />
                                        </Card>

                                        {lookupResult.otp_session ? (
                                            <Alert
                                                type="info"
                                                showIcon
                                                message="OTP Sent"
                                                description={(
                                                    <Space wrap>
                                                        <Tag color="processing">{lookupResult.otp_session.channel?.toUpperCase()}</Tag>
                                                        <Text>{lookupResult.otp_session.masked_destination}</Text>
                                                        <Text type="secondary">Expires in {formatCountdown(otpExpiresIn)}</Text>
                                                    </Space>
                                                )}
                                            />
                                        ) : (
                                            <Alert
                                                type="info"
                                                showIcon
                                                message="Send an OTP to confirm ownership"
                                                description={`Admin Central asks Client Registry for the primary owner contact. SMS is preferred and email is used only when SMS is unavailable${currentOrganizationName ? `. Once verified, this facility will be added under ${currentOrganizationName}.` : '.'}`}
                                            />
                                        )}

                                        {lookupResult.otp_session && otpExpiresIn <= 0 && (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                message="OTP expired"
                                                description="Request a new OTP to continue with ownership verification."
                                            />
                                        )}

                                        <Form.Item
                                            label="One-Time Password"
                                            name="otp_code"
                                            rules={[{ required: true, message: 'Enter the OTP sent to the verified owner contact' }]}
                                        >
                                            <Input.OTP length={5} formatter={(value) => value.replace(/\D/g, '')} />
                                        </Form.Item>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <Button onClick={() => setCurrentStep(0)}>
                                                Edit Lookup
                                            </Button>
                                            <Space>
                                                <Button
                                                    type="default"
                                                    loading={requestingOtp}
                                                    disabled={Boolean(lookupResult.otp_session && resendCooldown > 0)}
                                                    onClick={lookupResult.otp_session ? handleResendOtp : handleStartVerification}
                                                >
                                                    {lookupResult.otp_session
                                                        ? (resendCooldown > 0 ? `New OTP in ${resendCooldown}s` : 'Send New OTP')
                                                        : 'Send OTP'}
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    loading={verifyingOtp}
                                                    onClick={handleVerifyOtp}
                                                    disabled={!lookupResult.otp_session || otpExpiresIn <= 0}
                                                >
                                                    Verify OTP
                                                </Button>
                                            </Space>
                                        </div>
                                    </Space>
                                )}

                                {currentStep === 2 && verificationResult && (
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        {renderVerificationExpiryNotice()}
                                        {currentOrganizationName && (
                                            <Card size="small" style={{ borderRadius: 12, background: token.colorFillTertiary }}>
                                                <Descriptions
                                                    title="Target Organization"
                                                    column={isMobile ? 1 : 2}
                                                    size="small"
                                                    items={[
                                                        {
                                                            key: 'organization',
                                                            label: 'Organization',
                                                            children: currentOrganizationName,
                                                        },
                                                        {
                                                            key: 'region',
                                                            label: 'Region Scope',
                                                            children: currentOrganizationRegionName || 'Organization-wide',
                                                        },
                                                    ]}
                                                />
                                            </Card>
                                        )}
                                        <Card size="small" style={{ borderRadius: 12, background: token.colorFillQuaternary }}>
                                            <Descriptions
                                                title="Registry Details"
                                                column={isMobile ? 1 : 2}
                                                size="small"
                                                items={[
                                                    { key: 'facility', label: 'Facility', children: compactValue(verificationResult.facility_details?.facility_name) },
                                                    { key: 'owner_type', label: 'Owner Type', children: compactValue(verificationResult.additional_defaults?.organization_owner_type) },
                                                    { key: 'owner', label: 'Owner', children: compactValue(verificationResult.additional_defaults?.organization_owner) },
                                                    { key: 'county', label: 'County', children: compactValue(verificationResult.additional_defaults?.county) },
                                                    { key: 'sub_county', label: 'Sub-county', children: compactValue(verificationResult.additional_defaults?.sub_county) },
                                                    { key: 'license', label: 'License', children: compactValue(verificationResult.license_details?.current_license_number) },
                                                ]}
                                            />
                                        </Card>

                                        <Row gutter={16}>
                                            {!isPublicFacility && (
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        label="Organization Region"
                                                        name="region"
                                                        rules={[{ required: true, message: 'Select the region that should own this private facility' }]}
                                                    >
                                                        <Select
                                                            placeholder="Select region"
                                                            options={referenceData.regions.map((region) => ({
                                                                label: region.region_name,
                                                                value: region.name,
                                                            }))}
                                                            showSearch
                                                            optionFilterProp="label"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            )}
                                            <Col xs={24} md={isPublicFacility ? 24 : 12}>
                                                <Form.Item label="Physical Address" name="physical_address" rules={[{ required: true, message: 'Enter the facility address' }]}>
                                                    <Input placeholder="Building, road, or landmark" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <Form.Item label="Official Email" name="email_address" rules={[{ required: true, message: 'Enter the facility email' }]}>
                                                    <Input placeholder="facility@example.com" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item label="Number of Beds" name="number_of_beds">
                                                    <InputNumber min={0} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col xs={24} md={8}>
                                                <Form.Item label="Latitude" name="latitude">
                                                    <Input placeholder="Latitude" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Form.Item label="Longitude" name="longitude">
                                                    <Input placeholder="Longitude" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Form.Item label="Maximum Bed Allocation" name="maximum_bed_allocation">
                                                    <InputNumber min={0} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Card size="small" style={{ borderRadius: 12 }}>
                                            <Row gutter={16}>
                                                <Col xs={24} md={6}>
                                                    <Form.Item label="Open Whole Day" name="open_whole_day" valuePropName="checked">
                                                        <Switch />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item label="Open Public Holiday" name="open_public_holiday" valuePropName="checked">
                                                        <Switch />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item label="Open Weekends" name="open_weekends" valuePropName="checked">
                                                        <Switch />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item label="Open Late Night" name="open_late_night" valuePropName="checked">
                                                        <Switch />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Card>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <Button onClick={() => setCurrentStep(1)}>
                                                Back
                                            </Button>
                                            <Button type="primary" onClick={handleNextFromSetup}>
                                                Continue
                                            </Button>
                                        </div>
                                    </Space>
                                )}

                                {currentStep === 3 && (
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        {renderVerificationExpiryNotice()}
                                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                            Add any extra contact numbers and bank accounts to be saved on the facility record.
                                        </Paragraph>

                                        <Card title="Facility Contacts" style={{ borderRadius: 12 }}>
                                            <Form.List name="contacts">
                                                {(fields, { add, remove }) => (
                                                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                                        {fields.length === 0 && (
                                                            <Empty
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                description="No additional contacts added"
                                                            />
                                                        )}
                                                        {fields.map((field) => (
                                                            <Row gutter={12} key={field.key}>
                                                                <Col xs={24} md={10}>
                                                                    <Form.Item
                                                                        {...field}
                                                                        label="Contact Name"
                                                                        name={[field.name, 'contact_name']}
                                                                        rules={[{ required: true, message: 'Enter the contact name' }]}
                                                                    >
                                                                        <Input placeholder="Reception" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col xs={24} md={10}>
                                                                    <Form.Item
                                                                        {...field}
                                                                        label="Phone Number"
                                                                        name={[field.name, 'phone_number']}
                                                                        rules={[{ required: true, message: 'Enter the phone number' }]}
                                                                    >
                                                                        <Input placeholder="+2547..." />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                                                                        Remove
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        ))}
                                                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                                                            Add Contact
                                                        </Button>
                                                    </Space>
                                                )}
                                            </Form.List>
                                        </Card>

                                        <Card title="Facility Bank Accounts" style={{ borderRadius: 12 }}>
                                            <Form.List name="banks">
                                                {(fields, { add, remove }) => (
                                                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                                        {fields.length === 0 && (
                                                            <Empty
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                description="No bank accounts added"
                                                            />
                                                        )}
                                                        {fields.map((field) => (
                                                            <Card key={field.key} size="small" style={{ borderRadius: 10 }}>
                                                                <Row gutter={12}>
                                                                    <Col xs={24} md={12}>
                                                                        <Form.Item
                                                                            {...field}
                                                                            label="Bank Name"
                                                                            name={[field.name, 'bank_name']}
                                                                            rules={[{ required: true, message: 'Enter the bank name' }]}
                                                                        >
                                                                            <Input placeholder="Bank name" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={12}>
                                                                        <Form.Item
                                                                            {...field}
                                                                            label="Account Number"
                                                                            name={[field.name, 'account_number']}
                                                                            rules={[{ required: true, message: 'Enter the account number' }]}
                                                                        >
                                                                            <Input placeholder="Account number" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                </Row>
                                                                <Row gutter={12}>
                                                                    <Col xs={24} md={8}>
                                                                        <Form.Item {...field} label="Branch" name={[field.name, 'branch_name']}>
                                                                            <Input placeholder="Branch" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={8}>
                                                                        <Form.Item {...field} label="Account Name" name={[field.name, 'account_name']}>
                                                                            <Input placeholder="Account name" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={6}>
                                                                        <Form.Item {...field} label="Purpose" name={[field.name, 'purpose']}>
                                                                            <Input placeholder="Purpose" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                        <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                                                    </Col>
                                                                </Row>
                                                            </Card>
                                                        ))}
                                                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                                                            Add Bank Account
                                                        </Button>
                                                    </Space>
                                                )}
                                            </Form.List>
                                        </Card>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <Button onClick={() => setCurrentStep(2)}>
                                                Back
                                            </Button>
                                            <Button type="primary" onClick={handleNextFromContacts}>
                                                Continue
                                            </Button>
                                        </div>
                                    </Space>
                                )}

                                {currentStep === 4 && (
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        {renderVerificationExpiryNotice()}
                                        {renderReview()}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                            <Button onClick={() => setCurrentStep(3)}>
                                                Back
                                            </Button>
                                            <Button
                                                type="primary"
                                                loading={submitting}
                                                onClick={handleSubmit}
                                                disabled={verificationExpired}
                                            >
                                                {verificationExpired ? 'Verification Expired' : 'Submit Facility Onboarding'}
                                            </Button>
                                        </div>
                                    </Space>
                                )}
                            </Form>
                        )}
                    </Space>
                </Card>
            </Space>
        </div>
    );
};

export default FacilityOnboardingWizard;
