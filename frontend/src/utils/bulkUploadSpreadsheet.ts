import ExcelJS from 'exceljs';

import {
    ALLOWED_EMPLOYMENT_TYPES,
    BULK_UPLOAD_FIELD_GUIDE,
    OPTIONAL_CSV_COLUMNS,
    REQUIRED_CSV_COLUMNS,
    type BulkUploadFieldKey,
} from './bulkUploadCsv';

const TEMPLATE_FILENAME_PREFIX = 'affiliation_template';
const TEMPLATE_TITLE = 'Bulk Facility Affiliation Upload Template';
const TEMPLATE_SUBTITLE = 'Required fields are highlighted. Dates must use YYYY-MM-DD.';
const HEADER_ROW_NUMBER = 4;
const HEADER_MATCH_THRESHOLD = 3;
const EXCEL_MIN_DATE_SERIAL = 1;
const EXCEL_MAX_DATE_SERIAL = 2958465;

const ALL_TEMPLATE_COLUMNS = [
    ...REQUIRED_CSV_COLUMNS,
    ...OPTIONAL_CSV_COLUMNS,
] as const;

const KNOWN_COLUMNS = new Set<string>(ALL_TEMPLATE_COLUMNS.map((column) => column.toLowerCase()));

const SAMPLE_ROW: Record<BulkUploadFieldKey, string> = {
    identification_type: 'National ID',
    identification_number: '12345678',
    registration_number: 'A12345',
    regulator: 'NCK',
    employment_type: ALLOWED_EMPLOYMENT_TYPES[0],
    designation: 'Nurse',
    start_date: '2025-03-01',
    end_date: '2026-03-01',
};

function getDatedFilename(extension: 'csv' | 'xlsx'): string {
    return `${TEMPLATE_FILENAME_PREFIX}_${new Date().toISOString().split('T')[0]}.${extension}`;
}

function triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function stringifyCellValue(value: ExcelJS.CellValue | undefined | null): string {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value).trim();
    }
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'object') {
        if ('text' in value && typeof value.text === 'string') {
            return value.text.trim();
        }
        if ('result' in value && value.result != null) {
            return String(value.result).trim();
        }
        if ('richText' in value && Array.isArray(value.richText)) {
            return value.richText.map((part) => part.text ?? '').join('').trim();
        }
    }
    return String(value).trim();
}

function isDateColumn(header: string): boolean {
    return header === 'start_date' || header === 'end_date';
}

function excelSerialToIsoDate(serial: number): string {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000).toISOString().slice(0, 10);
}

function getCellString(cell: ExcelJS.Cell, header?: string): string {
    const value = cell.value;

    if (value == null) return '';

    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    if (typeof value === 'number') {
        if (
            header &&
            isDateColumn(header) &&
            value >= EXCEL_MIN_DATE_SERIAL &&
            value <= EXCEL_MAX_DATE_SERIAL
        ) {
            return excelSerialToIsoDate(value);
        }

        return cell.text?.trim() || String(value).trim();
    }

    return stringifyCellValue(value);
}

function getRowStrings(row: ExcelJS.Row): string[] {
    const values: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        values[columnNumber - 1] = stringifyCellValue(cell.value);
    });
    return values;
}

function getLastNonEmptyIndex(values: string[]): number {
    for (let index = values.length - 1; index >= 0; index -= 1) {
        if ((values[index] ?? '').trim()) return index;
    }
    return -1;
}

function findHeaderRowNumber(worksheet: ExcelJS.Worksheet): number | null {
    let bestRow: { rowNumber: number; matches: number } | null = null;
    const searchLimit = Math.min(worksheet.rowCount, 12);

    for (let rowNumber = 1; rowNumber <= searchLimit; rowNumber += 1) {
        const cells = getRowStrings(worksheet.getRow(rowNumber))
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);

        if (!cells.length) continue;

        const matches = cells.reduce((count, value) => {
            return count + (KNOWN_COLUMNS.has(value) ? 1 : 0);
        }, 0);

        if (!bestRow || matches > bestRow.matches) {
            bestRow = { rowNumber, matches };
        }

        if (matches === ALL_TEMPLATE_COLUMNS.length) {
            return rowNumber;
        }
    }

    return bestRow && bestRow.matches >= HEADER_MATCH_THRESHOLD ? bestRow.rowNumber : null;
}

export function downloadBulkUploadCsvTemplate(): void {
    const commentLines = [
        `# ${TEMPLATE_TITLE}`,
        `# Required columns: ${REQUIRED_CSV_COLUMNS.join(', ')}`,
        `# Optional columns: ${OPTIONAL_CSV_COLUMNS.join(', ')}`,
        '# Dates must use YYYY-MM-DD. Use the Excel template if you want the visual field guide.',
    ];

    const headerLine = ALL_TEMPLATE_COLUMNS.join(',');
    const csv = `\uFEFF${commentLines.join('\r\n')}\r\n${headerLine}`;

    triggerDownload(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        getDatedFilename('csv'),
    );
}

export async function downloadBulkUploadExcelTemplate(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Careverse HQ';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Upload Template', {
        views: [{ state: 'frozen', ySplit: HEADER_ROW_NUMBER }],
    });

    const guideSheet = workbook.addWorksheet('Field Guide');

    worksheet.mergeCells(1, 1, 1, ALL_TEMPLATE_COLUMNS.length);
    worksheet.getCell('A1').value = TEMPLATE_TITLE;
    worksheet.getCell('A1').font = {
        name: 'Aptos Display',
        size: 16,
        bold: true,
        color: { argb: 'FF0F172A' },
    };
    worksheet.getCell('A1').alignment = { vertical: 'middle' };

    worksheet.mergeCells(2, 1, 2, ALL_TEMPLATE_COLUMNS.length);
    worksheet.getCell('A2').value = TEMPLATE_SUBTITLE;
    worksheet.getCell('A2').font = {
        name: 'Aptos',
        size: 11,
        color: { argb: 'FF475569' },
    };

    ALL_TEMPLATE_COLUMNS.forEach((columnKey, index) => {
        const field = BULK_UPLOAD_FIELD_GUIDE.find((item) => item.key === columnKey);
        const headerCell = worksheet.getCell(HEADER_ROW_NUMBER, index + 1);

        headerCell.value = columnKey;
        headerCell.font = {
            name: 'Aptos',
            size: 11,
            bold: true,
            color: { argb: field?.required ? 'FFFFFFFF' : 'FF0F172A' },
        };
        headerCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: field?.required ? 'FF1D4ED8' : 'FFE2E8F0' },
        };
        headerCell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
        headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

        const width = Math.max(columnKey.length + 4, SAMPLE_ROW[columnKey].length + 3, 18);
        const column = worksheet.getColumn(index + 1);
        column.width = width;
        column.numFmt = '@';
    });

    worksheet.getRow(HEADER_ROW_NUMBER).height = 24;
    worksheet.autoFilter = {
        from: { row: HEADER_ROW_NUMBER, column: 1 },
        to: { row: HEADER_ROW_NUMBER, column: ALL_TEMPLATE_COLUMNS.length },
    };

    guideSheet.columns = [
        { header: 'Field', key: 'field', width: 26 },
        { header: 'Required', key: 'required', width: 14 },
        { header: 'Example', key: 'example', width: 24 },
        { header: 'Description', key: 'description', width: 58 },
    ];

    guideSheet.getRow(1).font = {
        name: 'Aptos',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
    };
    guideSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
    };

    BULK_UPLOAD_FIELD_GUIDE.forEach((field) => {
        guideSheet.addRow({
            field: field.key,
            required: field.required ? 'Required' : 'Optional',
            example: field.example,
            description: field.description,
        });
    });

    guideSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const requiredCell = row.getCell(2);
        requiredCell.font = {
            name: 'Aptos',
            size: 11,
            bold: true,
            color: { argb: requiredCell.value === 'Required' ? 'FF1D4ED8' : 'FF475569' },
        };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    triggerDownload(
        new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        getDatedFilename('xlsx'),
    );
}

export async function parseBulkUploadWorkbook(file: File): Promise<Record<string, unknown>[]> {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new Error('The uploaded workbook does not contain any worksheets.');
    }

    const headerRowNumber = findHeaderRowNumber(worksheet);
    if (!headerRowNumber) {
        throw new Error('Could not find a header row with the expected upload field names.');
    }

    const rawHeaders = getRowStrings(worksheet.getRow(headerRowNumber)).map((value) => value.trim().toLowerCase());
    const lastHeaderIndex = getLastNonEmptyIndex(rawHeaders);
    const headers = rawHeaders.slice(0, lastHeaderIndex + 1);

    const records: Record<string, unknown>[] = [];

    for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        const record: Record<string, string> = {};
        let hasData = false;

        headers.forEach((header, index) => {
            if (!header) return;
            const value = getCellString(row.getCell(index + 1), header).trim();
            if (value) hasData = true;
            record[header] = value;
        });

        if (!hasData) continue;

        records.push(record);
    }

    return records;
}
