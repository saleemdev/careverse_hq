/**
 * Export facility claims to CSV or Excel (filtered data from list).
 */
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import type { FacilityClaim } from '../../../types/modules';

function claimToRow(record: FacilityClaim): Record<string, string | number> {
    const period =
        record.date_start && record.date_end
            ? record.date_start === record.date_end
                ? record.date_start
                : `${record.date_start} – ${record.date_end}`
            : '';
    return {
        'Client name': record.client_name ?? '',
        'Client ID': record.client ?? '',
        Use: record.use ?? 'claim',
        Period: period,
        Insurer: record.insurer ?? '',
        Status: record.claim_status ?? '',
        'Claim Upstream Error Group': record.claim_upstream_error_group ?? '',
        'Claim Upstream Response': record.claim_upstream_response ?? '',
        'Amount (KES)': record.claim_amount ?? 0,
        Facility: record.facility_name ?? '',
        County: record.county ?? '',
        'Sub county': record.sub_county ?? '',
        'Claim ID': record.claim_id ?? '',
        'Scheme ID': record.scheme_id ?? '',
        'Claim subtype': record.claim_subtype ?? '',
        Diagnoses: record.diagnoses ?? '',
        Interventions: record.interventions ?? '',
        Modified: record.modified ?? '',
    };
}

export function downloadClaimsAsCsv(claims: FacilityClaim[], filenameBase: string): void {
    const rows = claims.map(claimToRow);
    const csv = Papa.unparse(rows);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export async function downloadClaimsAsExcel(claims: FacilityClaim[], filenameBase: string): Promise<void> {
    const rows = claims.map(claimToRow);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Claims');

    if (rows.length > 0) {
        // Use the keys of the first row as column headers
        const columns = Object.keys(rows[0]);
        ws.columns = columns.map((key) => ({ header: key, key }));
        rows.forEach((row) => ws.addRow(row));
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
}
