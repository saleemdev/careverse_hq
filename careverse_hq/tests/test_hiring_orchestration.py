"""
Tests for Hiring Orchestration API

Covers BRD Section 17.6 Test Plan (pure unit tests, no frappe site needed):
1. Shared API path enforcement (no direct insert bypass)
2. hp_name-only terminal step (no hwr_cache_key)
3. No direct Employee creation in hiring orchestration
4. Idempotency key format validation
5. Public field whitelist (no restricted data leak)
6. LinkedIn Settings DocType schema validation
7. Request hash determinism
8. Employment details parsing

Integration tests that need DB should be run via: bench run-tests --app careverse_hq
"""

import ast
import json
import os
import re
import unittest
from types import SimpleNamespace


# ---------------------------------------------------------------------------
# Path helpers (no frappe import needed)
# ---------------------------------------------------------------------------

_APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_API_DIR = os.path.join(_APP_ROOT, "api")
_DOCTYPE_DIR = os.path.join(_APP_ROOT, "careverse_hq", "doctype")


def _read_source(filename):
    """Read a Python source file from the api directory."""
    with open(os.path.join(_API_DIR, filename)) as f:
        return f.read()


def _read_doctype_json(doctype_slug, filename):
    """Read a DocType JSON file."""
    with open(os.path.join(_DOCTYPE_DIR, doctype_slug, filename)) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Inline copies of pure helper functions (avoid frappe import chain)
# ---------------------------------------------------------------------------

def _parse_employment_details(employment_details):
    if not employment_details:
        return None
    if isinstance(employment_details, str):
        try:
            employment_details = json.loads(employment_details)
        except (json.JSONDecodeError, TypeError):
            return None
    return dict(employment_details) if employment_details else None


def _compute_request_hash(job_offer_id, hp_name, employment_details):
    import hashlib
    payload = json.dumps(
        {"job_offer": job_offer_id, "hp_name": hp_name, "employment_details": employment_details},
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def _make_job_slug(job):
    title = job.job_title or job.designation or job.name
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{slug}-{job.name}"


# ===========================================================================
# Test Cases
# ===========================================================================

class TestParseEmploymentDetails(unittest.TestCase):
    """Tests for employment_details parsing."""

    def test_none_returns_none(self):
        self.assertIsNone(_parse_employment_details(None))

    def test_empty_string_returns_none(self):
        self.assertIsNone(_parse_employment_details(""))

    def test_valid_dict(self):
        details = {"fid": "HF-001", "employment_type": "Full-time", "designation": "Nurse", "start_date": "2026-04-01"}
        result = _parse_employment_details(details)
        self.assertEqual(result["fid"], "HF-001")

    def test_valid_json_string(self):
        details_str = json.dumps({"fid": "HF-002", "employment_type": "Locum", "designation": "Doctor", "start_date": "2026-05-01"})
        result = _parse_employment_details(details_str)
        self.assertEqual(result["fid"], "HF-002")

    def test_invalid_json_returns_none(self):
        self.assertIsNone(_parse_employment_details("{invalid json"))


class TestComputeRequestHash(unittest.TestCase):
    """Tests for request hash computation."""

    def test_deterministic_hash(self):
        h1 = _compute_request_hash("JO-001", "HP-001", {"fid": "HF-001"})
        h2 = _compute_request_hash("JO-001", "HP-001", {"fid": "HF-001"})
        self.assertEqual(h1, h2)

    def test_different_inputs_different_hash(self):
        h1 = _compute_request_hash("JO-001", "HP-001", {"fid": "HF-001"})
        h2 = _compute_request_hash("JO-002", "HP-001", {"fid": "HF-001"})
        self.assertNotEqual(h1, h2)

    def test_hash_length(self):
        h = _compute_request_hash("JO-001", "HP-001", {"fid": "HF-001"})
        self.assertEqual(len(h), 16)


class TestMakeJobSlug(unittest.TestCase):
    """Tests for job slug generation."""

    def test_basic_slug(self):
        job = SimpleNamespace(job_title="Primary Nurse", designation="Nurse", name="HR-JOB-00001")
        slug = _make_job_slug(job)
        self.assertEqual(slug, "primary-nurse-HR-JOB-00001")

    def test_special_chars_removed(self):
        job = SimpleNamespace(job_title="Nurse (L2) - Night Shift", designation="Nurse", name="JO-001")
        slug = _make_job_slug(job)
        self.assertIn("JO-001", slug)
        self.assertNotIn("(", slug)
        self.assertNotIn(")", slug)

    def test_fallback_to_designation(self):
        job = SimpleNamespace(job_title=None, designation="Locum Doctor", name="JO-002")
        slug = _make_job_slug(job)
        self.assertIn("locum-doctor", slug)


class TestIdempotencyKeyFormat(unittest.TestCase):
    """Tests that the idempotency key format matches BRD spec."""

    def test_key_format(self):
        key = "hire_aff_req:JO-001:HP-001:HF-001"
        self.assertTrue(key.startswith("hire_aff_req:"))
        parts = key.split(":")
        self.assertEqual(len(parts), 4)

    def test_key_format_in_source(self):
        """Verify the source code uses the correct key format."""
        source = _read_source("hiring_orchestration.py")
        self.assertIn('hire_aff_req:{job_offer_id}:{hp_name}:{fid}', source)


class TestHiringOrchestrationRules(unittest.TestCase):
    """
    Source-level verification that BRD non-negotiable rules are enforced.
    Uses AST parsing to inspect the code without importing it.
    """

    def setUp(self):
        self.source = _read_source("hiring_orchestration.py")
        self.tree = ast.parse(self.source)

    def test_terminal_step_uses_hp_name_only(self):
        """BRD Rule 5: Terminal step uses hp_name only, no hwr_cache_key parameter."""
        # Find the complete_hire function and check its parameters
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef) and node.name == "complete_hire":
                param_names = [arg.arg for arg in node.args.args]
                self.assertIn("job_offer_id", param_names)
                self.assertIn("employment_details", param_names)
                self.assertNotIn("hwr_cache_key", param_names,
                                 "Terminal hiring step must not accept hwr_cache_key")
                return
        self.fail("complete_hire function not found")

    def test_no_direct_employee_creation(self):
        """BRD Rule 3: No direct employee creation in hiring orchestration."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr == "new_doc" and node.args:
                    if isinstance(node.args[0], ast.Constant) and node.args[0].value == "Employee":
                        self.fail("Hiring orchestration must not create Employee directly")

    def test_no_direct_facility_affiliation_insert(self):
        """BRD Rule 2: No direct insert bypass into Facility Affiliation."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr == "new_doc" and node.args:
                    if isinstance(node.args[0], ast.Constant) and node.args[0].value == "Facility Affiliation":
                        self.fail("Hiring orchestration must not insert Facility Affiliation directly")

    def test_calls_create_single_affiliation(self):
        """BRD Rule 1: Must call create_single_affiliation."""
        self.assertIn("create_single_affiliation", self.source)
        self.assertIn("from .single_affiliation import create_single_affiliation", self.source)

    def test_imports_only_hp_name_path(self):
        """BRD Rule 5: Only hp_name path, never hwr_cache_key at terminal step."""
        # Verify that complete_hire passes hp_name to create_single_affiliation
        self.assertIn("hp_name=hp_name", self.source)
        # And does NOT pass hwr_cache_key
        self.assertNotIn("hwr_cache_key=", self.source.split("def complete_hire")[1].split("def ")[0])

    def test_check_hire_status_enforces_job_offer_permission(self):
        """Status endpoint must enforce read permission on Job Offer."""
        section = self.source.split("def check_hire_status")[1].split("def ")[0]
        self.assertIn('frappe.get_doc("Job Offer", job_offer_id)', section)
        self.assertIn('offer.check_permission("read")', section)


class TestPublicFieldWhitelist(unittest.TestCase):
    """BRD FR-24: Public pages must not expose restricted data."""

    def setUp(self):
        self.source = _read_source("public_jobs.py")

    def _extract_field_list(self, var_name):
        """Extract a list constant from source using AST."""
        tree = ast.parse(self.source)
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == var_name:
                        if isinstance(node.value, ast.List):
                            return [
                                elt.value for elt in node.value.elts
                                if isinstance(elt, ast.Constant)
                            ]
        return []

    def test_no_restricted_fields_in_public_list(self):
        fields = self._extract_field_list("_PUBLIC_JOB_LIST_FIELDS")
        self.assertTrue(len(fields) > 0, "Could not extract _PUBLIC_JOB_LIST_FIELDS")
        restricted = [
            "internal_notes", "compliance_status", "kyc_data",
            "recruiter_notes", "health_professional", "interview_summary",
        ]
        for field in restricted:
            self.assertNotIn(field, fields,
                             f"Restricted field '{field}' must not be in public list fields")

    def test_no_restricted_fields_in_public_detail(self):
        fields = self._extract_field_list("_PUBLIC_JOB_FIELDS")
        self.assertTrue(len(fields) > 0, "Could not extract _PUBLIC_JOB_FIELDS")
        restricted = [
            "internal_notes", "compliance_status", "kyc_data",
            "recruiter_notes", "health_professional",
        ]
        for field in restricted:
            self.assertNotIn(field, fields,
                             f"Restricted field '{field}' must not be in public detail fields")

    def test_submit_application_requires_consent(self):
        """BRD FR-3: Mandatory consent capture."""
        self.assertIn("consent_given", self.source)
        self.assertIn("Explicit consent is required", self.source)

    def test_guest_accessible_endpoints(self):
        """Public endpoints must be allow_guest=True."""
        self.assertIn("allow_guest=True", self.source)


class TestLinkedInSettingsSchema(unittest.TestCase):
    """Tests for LinkedIn Settings DocType schema."""

    def setUp(self):
        self.schema = _read_doctype_json("linkedin_settings", "linkedin_settings.json")

    def test_all_required_fields_present(self):
        field_names = [f["fieldname"] for f in self.schema["fields"]]
        required = [
            "is_enabled", "partner_access_mode", "partner_approved",
            "client_id", "client_secret", "redirect_uri", "scopes",
            "organization_urn", "apply_connect_enabled", "sync_job_postings_enabled",
            "compliance_api_enabled", "webhook_signing_secret", "webhook_verification_token",
            "sync_interval_minutes", "rate_limit_per_minute", "last_sync_at",
            "last_sync_status", "last_sync_error",
        ]
        for field in required:
            self.assertIn(field, field_names, f"Missing required field: {field}")

    def test_is_single_doctype(self):
        self.assertEqual(self.schema["issingle"], 1)

    def test_system_manager_permission_only(self):
        roles = [p["role"] for p in self.schema["permissions"]]
        self.assertEqual(roles, ["System Manager"])

    def test_secret_fields_are_password_type(self):
        secret_fields = {"client_secret", "webhook_signing_secret"}
        for field in self.schema["fields"]:
            if field["fieldname"] in secret_fields:
                self.assertEqual(field["fieldtype"], "Password",
                                 f"Secret field '{field['fieldname']}' must be Password type")

    def test_read_only_status_fields(self):
        """Sync status fields should be read-only to prevent manual tampering."""
        readonly_fields = {"last_sync_at", "last_sync_status", "last_sync_error"}
        for field in self.schema["fields"]:
            if field["fieldname"] in readonly_fields:
                self.assertTrue(
                    field.get("read_only"),
                    f"Field '{field['fieldname']}' should be read_only",
                )


class TestHiringIdempotencyLogSchema(unittest.TestCase):
    """Tests for Hiring Idempotency Log DocType schema."""

    def setUp(self):
        self.schema = _read_doctype_json("hiring_idempotency_log", "hiring_idempotency_log.json")

    def test_autoname_by_idempotency_key(self):
        self.assertEqual(self.schema["autoname"], "field:idempotency_key")

    def test_required_fields(self):
        required = {"idempotency_key", "job_offer", "hp_name", "facility"}
        field_map = {f["fieldname"]: f for f in self.schema["fields"]}
        for name in required:
            self.assertIn(name, field_map, f"Missing field: {name}")
            self.assertTrue(field_map[name].get("reqd"), f"Field '{name}' should be required")

    def test_idempotency_key_is_unique(self):
        for field in self.schema["fields"]:
            if field["fieldname"] == "idempotency_key":
                self.assertTrue(field.get("unique"), "idempotency_key must be unique")

    def test_status_options(self):
        for field in self.schema["fields"]:
            if field["fieldname"] == "status":
                self.assertIn("Created", field["options"])
                self.assertIn("Failed", field["options"])
                self.assertIn("Expired", field["options"])
                self.assertIn("Hired", field["options"])
                self.assertIn("Rejected", field["options"])
                self.assertIn("Closed", field["options"])


class TestHooksConfiguration(unittest.TestCase):
    """Tests for hooks.py configuration related to hiring workflow."""

    def setUp(self):
        hooks_path = os.path.join(_APP_ROOT, "hooks.py")
        with open(hooks_path) as f:
            self.source = f.read()

    def test_job_detail_route_rule(self):
        """Public /jobs/<slug> must route to job-detail."""
        self.assertIn("/jobs/<path:job_slug>", self.source)
        self.assertIn("job-detail", self.source)

    def test_public_jobs_csrf_exempt(self):
        """Public job APIs must be CSRF-exempt for guest access."""
        self.assertIn("careverse_hq.api.public_jobs.get_public_jobs", self.source)
        self.assertIn("careverse_hq.api.public_jobs.get_public_job_detail", self.source)
        self.assertIn("careverse_hq.api.public_jobs.submit_application", self.source)

    def test_scheduler_has_expiry_check(self):
        """Scheduler must include hiring affiliation expiry check."""
        self.assertIn("check_expired_hiring_affiliations", self.source)

    def test_scheduler_has_reminder(self):
        """Scheduler must include hiring confirmation reminders."""
        self.assertIn("send_hiring_confirmation_reminders", self.source)


class TestPermissionSafeQueryPatterns(unittest.TestCase):
    """Guard against permission-bypassing query patterns in private hiring APIs."""

    def test_recruitment_desk_avoids_db_count_and_get_all(self):
        source = _read_source("recruitment_desk.py")
        self.assertNotIn("frappe.db.count(", source)
        self.assertNotIn("frappe.get_all(", source)
        self.assertNotIn("frappe.db.get_all(", source)

    def test_private_hiring_modules_avoid_ignore_permissions(self):
        for filename in ("recruitment_desk.py", "hiring_orchestration.py", "hiring_reconciliation.py"):
            source = _read_source(filename)
            self.assertNotIn("ignore_permissions=True", source, f"{filename} should not use ignore_permissions=True")
            self.assertNotIn("flags.ignore_permissions", source, f"{filename} should not set flags.ignore_permissions")


class TestRecruitmentDeskHPResolution(unittest.TestCase):
    """Tests for HP resolution endpoints in recruitment_desk.py (BRD §9.2)."""

    def setUp(self):
        self.source = _read_source("recruitment_desk.py")
        self.tree = ast.parse(self.source)

    def test_search_hp_endpoint_exists(self):
        """search_hp_for_applicant must exist as a whitelisted method."""
        func_names = [
            node.name for node in ast.walk(self.tree)
            if isinstance(node, ast.FunctionDef)
        ]
        self.assertIn("search_hp_for_applicant", func_names)

    def test_link_applicant_endpoint_exists(self):
        """link_applicant_to_health_professional must exist as a whitelisted method."""
        func_names = [
            node.name for node in ast.walk(self.tree)
            if isinstance(node, ast.FunctionDef)
        ]
        self.assertIn("link_applicant_to_health_professional", func_names)

    def test_search_reuses_shared_logic(self):
        """Must reuse search_health_professional from single_affiliation."""
        self.assertIn("from .single_affiliation import search_health_professional", self.source)

    def test_link_validates_hp_exists(self):
        """Link endpoint must validate HP exists before linking."""
        self.assertIn("Health Professional", self.source)
        self.assertIn("not found", self.source)

    def test_link_creates_audit_log(self):
        """Link endpoint must create an audit log entry."""
        self.assertIn("Comment", self.source)
        self.assertIn("Health Professional linked", self.source)

    def test_toggle_job_publish_endpoint_exists(self):
        """toggle_job_publish must exist."""
        func_names = [
            node.name for node in ast.walk(self.tree)
            if isinstance(node, ast.FunctionDef)
        ]
        self.assertIn("toggle_job_publish", func_names)

    def test_job_opening_form_options_endpoint_exists(self):
        """Job Opening form option endpoint must exist for link-safe UI selections."""
        func_names = [
            node.name for node in ast.walk(self.tree)
            if isinstance(node, ast.FunctionDef)
        ]
        self.assertIn("get_job_opening_form_options", func_names)

    def test_link_option_normalization_is_dynamic(self):
        """Backend should normalize link options from DocType data, not hardcoded aliases."""
        self.assertIn("_JOB_OPENING_LINK_FIELD_DOCTYPES", self.source)
        self.assertIn("_normalize_link_option", self.source)
        self.assertIn("_get_link_option_map", self.source)
        self.assertNotIn("_EMPLOYMENT_TYPE_ALIASES", self.source)

    def test_create_update_surface_real_validation_errors(self):
        """Create/update should expose actionable validation messages."""
        self.assertIn("_extract_exception_message", self.source)


class TestReconciliationHook(unittest.TestCase):
    """Tests for hiring reconciliation via doc_events."""

    def setUp(self):
        self.source = _read_source("hiring_reconciliation.py")
        self.tree = ast.parse(self.source)

    def test_reconcile_function_exists(self):
        func_names = [
            node.name for node in ast.walk(self.tree)
            if isinstance(node, ast.FunctionDef)
        ]
        self.assertIn("reconcile_hiring_on_affiliation_update", func_names)

    def test_no_direct_affiliation_status_change(self):
        """Reconciliation must not change affiliation status — only reads it."""
        # Should not contain set_value on Facility Affiliation
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr == "set_value" and node.args:
                    if isinstance(node.args[0], ast.Constant) and node.args[0].value == "Facility Affiliation":
                        self.fail("Reconciliation must not change Facility Affiliation status")

    def test_no_employee_creation(self):
        """Reconciliation must not create Employee directly."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr == "new_doc" and node.args:
                    if isinstance(node.args[0], ast.Constant) and node.args[0].value == "Employee":
                        self.fail("Reconciliation must not create Employee")

    def test_status_mapping_covers_terminal_states(self):
        """Must handle Active, Rejected, Expired affiliation states."""
        self.assertIn('"Active"', self.source)
        self.assertIn('"Rejected"', self.source)
        self.assertIn('"Expired"', self.source)

    def test_doc_events_in_hooks(self):
        """Facility Affiliation doc_events must be registered in hooks.py."""
        hooks_path = os.path.join(_APP_ROOT, "hooks.py")
        with open(hooks_path) as f:
            hooks_source = f.read()
        self.assertIn("Facility Affiliation", hooks_source)
        self.assertIn("reconcile_hiring_on_affiliation_update", hooks_source)


class TestCustomFieldsPatch(unittest.TestCase):
    """Tests for the custom fields patch."""

    def setUp(self):
        patch_path = os.path.join(_APP_ROOT, "patches", "add_hiring_custom_fields.py")
        with open(patch_path) as f:
            self.source = f.read()
        self.tree = ast.parse(self.source)

    def test_patch_has_execute_function(self):
        func_names = [
            node.name for node in ast.walk(self.tree)
            if isinstance(node, ast.FunctionDef)
        ]
        self.assertIn("execute", func_names)

    def test_job_applicant_hp_field(self):
        """Patch must add health_professional to Job Applicant."""
        self.assertIn('"Job Applicant"', self.source)
        self.assertIn('"health_professional"', self.source)

    def test_job_offer_fields(self):
        """Patch must add facility_affiliation, health_professional, hiring_idempotency_key to Job Offer."""
        self.assertIn('"Job Offer"', self.source)
        self.assertIn('"facility_affiliation"', self.source)
        self.assertIn('"hiring_idempotency_key"', self.source)

    def test_patch_registered(self):
        """Patch must be registered in patches.txt."""
        patches_path = os.path.join(_APP_ROOT, "patches.txt")
        with open(patches_path) as f:
            patches = f.read()
        self.assertIn("add_hiring_custom_fields", patches)


class TestReminderNotifications(unittest.TestCase):
    """Tests that reminder notifications use frappe.sendmail."""

    def setUp(self):
        self.source = _read_source("hiring_orchestration.py")

    def test_uses_sendmail(self):
        """Reminders must use frappe.sendmail, not just log_error."""
        # Find the send_hiring_confirmation_reminders function body
        func_body = self.source.split("def send_hiring_confirmation_reminders")[1].split("\ndef ")[0]
        self.assertIn("frappe.sendmail", func_body)

    def test_includes_candidate_info(self):
        """Email must include candidate name and job offer ID."""
        func_body = self.source.split("def send_hiring_confirmation_reminders")[1].split("\ndef ")[0]
        self.assertIn("candidate_name", func_body)
        self.assertIn("job_offer", func_body)

    def test_includes_time_remaining(self):
        """Email must include time remaining."""
        func_body = self.source.split("def send_hiring_confirmation_reminders")[1].split("\ndef ")[0]
        self.assertIn("hours_remaining", func_body)


if __name__ == "__main__":
    unittest.main()
