"""
Tests for bulk health worker onboarding API: validation and record limit.
"""
from pathlib import Path
import unittest

from careverse_hq.api.bulk_health_worker_onboarding import _validate_record


def _read_bulk_upload_source() -> str:
    from careverse_hq.api import bulk_health_worker_onboarding

    return Path(bulk_health_worker_onboarding.__file__).read_text()


class TestValidateRecord(unittest.TestCase):
    """Unit tests for _validate_record."""

    def test_valid_record_no_errors(self):
        record = {
            "identification_type": "National ID",
            "identification_number": "12345678",
            "employment_type": "Full-time Employee",
            "designation": "Nurse",
            "start_date": "2025-03-01",
        }
        errors = _validate_record(record, 1)
        self.assertEqual(errors, [])

    def test_missing_required_field(self):
        record = {
            "identification_type": "National ID",
            "identification_number": "12345678",
            "employment_type": "Full-time Employee",
            "designation": "Nurse",
            # start_date missing
        }
        errors = _validate_record(record, 1)
        self.assertIn("start_date", errors[0])
        self.assertIn("Missing required field", errors[0])

    def test_invalid_employment_type(self):
        record = {
            "identification_type": "National ID",
            "identification_number": "12345678",
            "employment_type": "Part-time",
            "designation": "Nurse",
            "start_date": "2025-03-01",
        }
        errors = _validate_record(record, 1)
        self.assertTrue(any("employment_type" in e and "Invalid" in e for e in errors))
        self.assertTrue(any("Part-time Employee" in e or "Allowed" in e for e in errors))

    def test_invalid_regulator(self):
        record = {
            "identification_type": "National ID",
            "identification_number": "12345678",
            "employment_type": "Full-time Employee",
            "designation": "Nurse",
            "start_date": "2025-03-01",
            "regulator": "INVALID_REG",
        }
        errors = _validate_record(record, 1)
        self.assertTrue(any("regulator" in e and "Invalid" in e for e in errors))

    def test_valid_regulator_abbreviation(self):
        record = {
            "identification_type": "National ID",
            "identification_number": "12345678",
            "employment_type": "Full-time Employee",
            "designation": "Nurse",
            "start_date": "2025-03-01",
            "regulator": "NCK",
        }
        errors = _validate_record(record, 1)
        self.assertEqual(errors, [])

    def test_valid_regulator_full_name(self):
        record = {
            "identification_type": "National ID",
            "identification_number": "12345678",
            "employment_type": "Consultant",
            "designation": "Doctor",
            "start_date": "2025-03-01",
            "regulator": "Nursing Council of Kenya",
        }
        errors = _validate_record(record, 1)
        self.assertEqual(errors, [])


class TestUploadRecordLimitEnforcement(unittest.TestCase):
    """Test that the module enforces a maximum of 500 records per upload."""

    def test_max_records_constant_defined(self):
        source = _read_bulk_upload_source()
        self.assertIn("max_records = 500", source, "Server should enforce max 500 records")
        self.assertIn("len(records) > max_records", source, "Length check should be present")


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
        section = source.split("def get_bulk_upload_job_details")[1].split("def process_bulk_upload")[0]
        self.assertIn("_get_job_with_read_access(job_id)", section)
