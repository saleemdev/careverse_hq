"""
Tests for bulk upload handoff behavior.
"""

from pathlib import Path
import unittest

from careverse_hq.api.bulk_health_worker_onboarding import _parse_records_input


def _read_bulk_upload_source() -> str:
    from careverse_hq.api import bulk_health_worker_onboarding

    return Path(bulk_health_worker_onboarding.__file__).read_text()


class TestParseRecordsInput(unittest.TestCase):
    """Unit tests for request payload parsing."""

    def test_returns_list_input_as_is(self):
        records = [{"identification_type": "National ID", "identification_number": "12345678"}]
        self.assertEqual(_parse_records_input(records), records)

    def test_parses_json_string_payload(self):
        payload = '[{"identification_type":"National ID","identification_number":"12345678"}]'
        parsed = _parse_records_input(payload)
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]["identification_number"], "12345678")

    def test_invalid_json_returns_empty_list(self):
        self.assertEqual(_parse_records_input("not-json"), [])


class TestHandoffContract(unittest.TestCase):
    """Source-level checks for the HQ handoff contract."""

    def test_upload_queues_job_and_returns_queued_message(self):
        source = _read_bulk_upload_source()
        section = source.split("def upload_bulk_health_workers")[1].split("def _is_legacy_uploaded_job_reader")[0]
        self.assertIn('parent_doc.status = "Queued"', section)
        self.assertIn('message="Bulk upload queued successfully"', section)
        self.assertIn('status_code=202', section)

    def test_upload_enqueues_healthpro_processor_only(self):
        source = _read_bulk_upload_source()
        self.assertIn("frappe.enqueue(", source)
        self.assertIn('method="healthpro_erp.api.bulk_health_worker_onboarding.process_bulk_upload"', source)
        self.assertNotIn("def process_bulk_upload", source)
        self.assertNotIn("def _process_single_record", source)

    def test_upload_does_not_run_server_side_business_validation(self):
        source = _read_bulk_upload_source()
        self.assertNotIn("max_records = 500", source)
        self.assertNotIn("validation_errors", source)
        self.assertNotIn("def _validate_record", source)

    def test_upload_does_not_trigger_hwr_or_affiliation_processing(self):
        source = _read_bulk_upload_source()
        self.assertNotIn("def _verify_with_hwr", source)
        self.assertNotIn("def _create_health_professional", source)
        self.assertNotIn("def _create_facility_affiliation", source)


class TestBulkUploadPermissionGuards(unittest.TestCase):
    """Source-level checks to guard against permission regressions."""

    def test_shared_helper_uses_document_permission_check(self):
        source = _read_bulk_upload_source()
        section = source.split("def _get_job_with_read_access")[1].split("def get_bulk_records_by_facility")[0]
        self.assertIn('job.check_permission("read")', section)

    def test_job_records_endpoint_reuses_shared_access_helper(self):
        source = _read_bulk_upload_source()
        section = source.split("def get_bulk_records_by_job")[1].split("def get_bulk_upload_jobs")[0]
        self.assertIn("_get_job_with_read_access(job_id)", section)

    def test_job_details_endpoint_reuses_shared_access_helper(self):
        source = _read_bulk_upload_source()
        section = source.split("def get_bulk_upload_job_details")[1].split("def _parse_records_input")[0]
        self.assertIn("_get_job_with_read_access(job_id)", section)
