import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { parseBulkUploadWorkbook } from './bulkUploadSpreadsheet';

const HEADERS = [
    'identification_type',
    'identification_number',
    'employment_type',
    'designation',
    'start_date',
    'registration_number',
    'regulator',
    'end_date',
];

async function workbookToFile(
    configure: (worksheet: ExcelJS.Worksheet) => void,
): Promise<File> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Upload Template');

    worksheet.getCell('A1').value = 'Bulk Facility Affiliation Upload Template';
    worksheet.getCell('A2').value = 'Required fields are highlighted. Dates must use YYYY-MM-DD.';

    HEADERS.forEach((header, index) => {
        worksheet.getCell(4, index + 1).value = header;
    });

    configure(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return new File(
        [buffer],
        'bulk-upload.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    );
}

describe('parseBulkUploadWorkbook', () => {
    it('keeps the first real row even if it matches the old sample values', async () => {
        const file = await workbookToFile((worksheet) => {
            worksheet.getCell('A5').value = 'National ID';
            worksheet.getCell('B5').value = '12345678';
            worksheet.getCell('C5').value = 'Full-time Employee';
            worksheet.getCell('D5').value = 'Nurse';
            worksheet.getCell('E5').value = '2025-03-01';
            worksheet.getCell('F5').value = 'A12345';
            worksheet.getCell('G5').value = 'NCK';
            worksheet.getCell('H5').value = '2026-03-01';
        });

        const records = await parseBulkUploadWorkbook(file);

        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
            identification_type: 'National ID',
            identification_number: '12345678',
            employment_type: 'Full-time Employee',
        });
    });

    it('normalizes numeric Excel date serials for date columns', async () => {
        const excelDateSerial =
            Math.floor(Date.UTC(2025, 2, 1) / 86400000) + 25569;

        const file = await workbookToFile((worksheet) => {
            worksheet.getCell('A5').value = 'Passport';
            worksheet.getCell('B5').value = '00123456';
            worksheet.getCell('C5').value = 'Consultant';
            worksheet.getCell('D5').value = 'Pharmacist';
            worksheet.getCell('E5').value = excelDateSerial;
            worksheet.getCell('E5').numFmt = 'yyyy-mm-dd';
        });

        const records = await parseBulkUploadWorkbook(file);

        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
            identification_number: '00123456',
            start_date: '2025-03-01',
        });
    });
});
