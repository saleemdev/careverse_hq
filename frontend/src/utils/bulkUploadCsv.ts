/**
 * Shared CSV parsing and validation for bulk affiliation upload.
 * Aligns with backend: careverse_hq.api.bulk_health_worker_onboarding (required columns, employment_type, regulator, date format).
 */

export type BulkUploadFieldKey =
    | 'identification_type'
    | 'identification_number'
    | 'registration_number'
    | 'regulator'
    | 'employment_type'
    | 'designation'
    | 'start_date'
    | 'end_date';

export interface CSVRecord {
    identification_type: string;
    identification_number: string;
    registration_number?: string;
    regulator?: string;
    employment_type: string;
    designation: string;
    start_date: string;
    end_date?: string;
}

export interface BulkUploadFieldDefinition {
    key: BulkUploadFieldKey;
    label: string;
    required: boolean;
    example: string;
    description: string;
}

export const REQUIRED_CSV_COLUMNS = [
    'identification_type',
    'identification_number',
    'employment_type',
    'designation',
    'start_date',
] as const;

export const OPTIONAL_CSV_COLUMNS = [
    'registration_number',
    'regulator',
    'end_date',
] as const;

export const ALLOWED_EMPLOYMENT_TYPES = [
    'Full-time Employee',
    'Part-time Employee',
    'Consultant',
    'Locum/Temporary',
    'Volunteer',
    'Intern/Resident',
    'Contracted',
] as const;

export const ALLOWED_REGULATORS: Record<string, string> = {
    KMPDC: 'Kenya Medical Practitioners and Dentists Council',
    NCK: 'Nursing Council of Kenya',
    PPB: 'Pharmacy and Poisons Board',
    COC: 'Clinical Officers Council',
};

export const BULK_UPLOAD_FIELD_GUIDE = [
    {
        key: 'identification_type',
        label: 'Identification Type',
        required: true,
        example: 'National ID',
        description: 'The identification document type used for the worker.',
    },
    {
        key: 'identification_number',
        label: 'Identification Number',
        required: true,
        example: '12345678',
        description: 'The worker identifier that will be used during verification.',
    },
    {
        key: 'registration_number',
        label: 'Registration Number',
        required: false,
        example: 'A12345',
        description: 'Professional council registration number when available.',
    },
    {
        key: 'regulator',
        label: 'Regulator',
        required: false,
        example: 'NCK',
        description: `Optional regulator abbreviation. Allowed: ${Object.keys(ALLOWED_REGULATORS).join(', ')}`,
    },
    {
        key: 'employment_type',
        label: 'Employment Type',
        required: true,
        example: ALLOWED_EMPLOYMENT_TYPES[0],
        description: 'Must match one of the supported employment types exactly.',
    },
    {
        key: 'designation',
        label: 'Designation',
        required: true,
        example: 'Nurse',
        description: 'The role or professional designation at the facility.',
    },
    {
        key: 'start_date',
        label: 'Start Date',
        required: true,
        example: '2025-03-01',
        description: 'Use ISO date format: YYYY-MM-DD.',
    },
    {
        key: 'end_date',
        label: 'End Date',
        required: false,
        example: '2026-03-01',
        description: 'Optional. Leave blank for open-ended affiliations.',
    },
] as const satisfies readonly BulkUploadFieldDefinition[];

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function trimRecord(record: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(record)) {
        if (v != null && typeof v === 'string') {
            out[k] = v.trim();
        } else if (v != null) {
            out[k] = String(v).trim();
        } else {
            out[k] = '';
        }
    }
    return out;
}

function isValidDateOnly(value: string): boolean {
    if (!value || !DATE_YYYY_MM_DD.test(value)) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && value === d.toISOString().slice(0, 10);
}

function isAllowedRegulator(value: string): boolean {
    const v = value.trim();
    if (!v) return true;
    const upper = v.toUpperCase();
    const lower = v.toLowerCase();
    if (Object.keys(ALLOWED_REGULATORS).some((abbr) => abbr.toUpperCase() === upper)) return true;
    if (Object.values(ALLOWED_REGULATORS).some((name) => name.toLowerCase() === lower)) return true;
    return false;
}

/**
 * Validate parsed CSV rows. Returns list of error messages (max 10).
 */
export function validateBulkUploadRecords(records: Record<string, unknown>[]): string[] {
    const errors: string[] = [];

    if (records.length === 0) {
        errors.push('CSV file is empty');
        return errors;
    }

    const first = records[0];
    const missingColumns = REQUIRED_CSV_COLUMNS.filter((col) => !(col in first));
    if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const allowedEmploymentSet = new Set(ALLOWED_EMPLOYMENT_TYPES);

    records.forEach((raw, index) => {
        const rowNum = index + 1;
        const record = trimRecord(raw as Record<string, unknown>);

        for (const col of REQUIRED_CSV_COLUMNS) {
            const val = record[col];
            if (val === undefined || val === null || String(val).trim() === '') {
                errors.push(`Row ${rowNum}: ${col} is required`);
            }
        }

        if (record.employment_type) {
            const et = record.employment_type.trim();
            if (!allowedEmploymentSet.has(et as (typeof ALLOWED_EMPLOYMENT_TYPES)[number])) {
                errors.push(
                    `Row ${rowNum}: Invalid employment_type '${et}'. Allowed: ${ALLOWED_EMPLOYMENT_TYPES.join(', ')}`
                );
            }
        }

        if (record.regulator && !isAllowedRegulator(record.regulator)) {
            errors.push(
                `Row ${rowNum}: Invalid regulator '${record.regulator}'. Allowed abbreviations: ${Object.keys(ALLOWED_REGULATORS).join(', ')}`
            );
        }

        if (record.start_date && !isValidDateOnly(record.start_date)) {
            errors.push(`Row ${rowNum}: start_date must be YYYY-MM-DD`);
        }
        if (record.end_date && record.end_date.trim() !== '' && !isValidDateOnly(record.end_date)) {
            errors.push(`Row ${rowNum}: end_date must be YYYY-MM-DD or empty`);
        }
    });

    return errors.slice(0, 10);
}

/**
 * Normalize parsed records for submission: trim strings and ensure required fields.
 */
export function normalizeRecordsForSubmit(records: Record<string, unknown>[]): CSVRecord[] {
    return records.map((raw) => {
        const r = trimRecord(raw as Record<string, unknown>);
        return {
            identification_type: r.identification_type ?? '',
            identification_number: r.identification_number ?? '',
            registration_number: r.registration_number ?? '',
            regulator: r.regulator ?? '',
            employment_type: r.employment_type ?? '',
            designation: r.designation ?? '',
            start_date: r.start_date ?? '',
            end_date: r.end_date ?? '',
        };
    });
}
