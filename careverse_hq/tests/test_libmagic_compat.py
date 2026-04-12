import sys
import unittest
from unittest.mock import patch

from careverse_hq.libmagic_compat import ensure_magic_compat


class TestLibmagicCompat(unittest.TestCase):
    def tearDown(self):
        sys.modules.pop("magic", None)

    def test_installs_fallback_when_libmagic_is_missing(self):
        sys.modules.pop("magic", None)

        with patch(
            "careverse_hq.libmagic_compat.importlib.import_module",
            side_effect=ImportError("failed to find libmagic. Check your installation"),
        ):
            magic_module = ensure_magic_compat()

        self.assertIs(sys.modules.get("magic"), magic_module)
        self.assertEqual(magic_module.from_file("example.pdf", mime=True), "application/pdf")
        self.assertEqual(magic_module.from_file("example.unknown", mime=True), "application/octet-stream")

    def test_re_raises_unrelated_import_errors(self):
        sys.modules.pop("magic", None)

        with patch(
            "careverse_hq.libmagic_compat.importlib.import_module",
            side_effect=ImportError("some other import problem"),
        ):
            with self.assertRaises(ImportError):
                ensure_magic_compat()
