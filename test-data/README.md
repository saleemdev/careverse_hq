# Test data for Bulk Affiliation Import

- **bulk_affiliation_import_5_records.csv** – Valid 5-row CSV for happy-path testing. Uses only allowed `employment_type` and `regulator` values.
- **bulk_affiliation_import_invalid.csv** – Invalid rows: missing required fields, invalid employment_type, invalid date format. Use to test validation and error messages.

To generate a 500-row boundary fixture, use the “Download CSV Template” on the Bulk Upload page and repeat the example row to 500 lines, or use a script that outputs 500 valid rows with the same headers.
