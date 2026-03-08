/**
 * Export facility claims to CSV or Excel (filtered data from list).
 */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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

export function downloadClaimsAsExcel(claims: FacilityClaim[], filenameBase: string): void {
    const rows = claims.map(claimToRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Claims');
    XLSX.writeFile(wb, `${filenameBase}.xlsx`);
}
