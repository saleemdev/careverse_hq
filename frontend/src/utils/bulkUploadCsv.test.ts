/**
 * Unit tests for bulk upload CSV validation (aligns with backend rules).
 * Run with: npx vitest run src/utils/bulkUploadCsv.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
    validateBulkUploadRecords,
    normalizeRecordsForSubmit,
    REQUIRED_CSV_COLUMNS,
    ALLOWED_EMPLOYMENT_TYPES,
} from './bulkUploadCsv';

describe('validateBulkUploadRecords', () => {
    const validRecord = {
        identification_type: 'National ID',
        identification_number: '12345678',
        employment_type: 'Full-time Employee',
        designation: 'Nurse',
        start_date: '2025-03-01',
    };

    it('returns empty array for valid records', () => {
        const errors = validateBulkUploadRecords([validRecord]);
        expect(errors).toEqual([]);
    });

    it('reports empty file', () => {
        const errors = validateBulkUploadRecords([]);
        expect(errors).toContain('CSV file is empty');
    });

    it('reports missing required columns', () => {
        const bad = [{ identification_type: 'National ID' }]; // missing others
        const errors = validateBulkUploadRecords(bad);
        expect(errors.some((e) => e.includes('Missing required columns'))).toBe(true);
        REQUIRED_CSV_COLUMNS.forEach((col) => {
            if (col !== 'identification_type') {
                expect(errors.some((e) => e.includes(col))).toBe(true);
            }
        });
    });

    it('reports invalid employment_type', () => {
        const bad = [{ ...validRecord, employment_type: 'Part-time' }];
        const errors = validateBulkUploadRecords(bad);
        expect(errors.some((e) => e.includes('employment_type') && e.includes('Invalid'))).toBe(true);
        expect(errors.some((e) => e.includes('Allowed') || e.includes('Full-time Employee'))).toBe(true);
    });

    it('reports invalid date format for start_date', () => {
        const bad = [{ ...validRecord, start_date: '03/01/2025' }];
        const errors = validateBulkUploadRecords(bad);
        expect(errors.some((e) => e.includes('YYYY-MM-DD'))).toBe(true);
    });

    it('accepts valid regulator abbreviation', () => {
        const withReg = { ...validRecord, regulator: 'NCK' };
        expect(validateBulkUploadRecords([withReg])).toEqual([]);
    });

    it('returns at most 10 errors', () => {
        const records = Array.from({ length: 20 }, (_, i) => ({
            identification_type: '',
            identification_number: '',
            employment_type: '',
            designation: '',
            start_date: '',
        }));
        const errors = validateBulkUploadRecords(records);
        expect(errors.length).toBeLessThanOrEqual(10);
    });
});

describe('normalizeRecordsForSubmit', () => {
    it('trims and fills required fields', () => {
        const raw = [
            {
                identification_type: '  National ID  ',
                identification_number: '123',
                employment_type: 'Full-time Employee',
                designation: 'Nurse',
                start_date: '2025-03-01',
            },
        ];
        const out = normalizeRecordsForSubmit(raw);
        expect(out).toHaveLength(1);
        expect(out[0].identification_type).toBe('National ID');
        expect(out[0].registration_number).toBe('');
        expect(out[0].regulator).toBe('');
    });
});
