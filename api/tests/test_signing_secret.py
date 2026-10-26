"""Signing-key configuration must fail closed without usable deployment secrets."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

CONFIG = Path(__file__).resolve().parents[1] / "app/core/config.py"
KEY_NAME = "AUTH_SECRET_KEY"


class SigningKeyConfigurationTests(unittest.TestCase):
    def load_config(self, value):
        env = {k: v for k, v in os.environ.items() if k in ("PATH", "SYSTEMROOT")}
        if value is not None:
            env[KEY_NAME] = value
        code = (
            "import importlib.util, os, dotenv; "
            "dotenv.load_dotenv = lambda *a, **kw: False; "
            f"spec = importlib.util.spec_from_file_location('tested_config', {str(CONFIG)!r}); "
            "module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module); "
            f"assert getattr(module.settings, {KEY_NAME!r}) == os.environ[{KEY_NAME!r}].strip()"
        )
        with tempfile.TemporaryDirectory() as directory:
            return subprocess.run([sys.executable, "-c", code], cwd=directory, env=env,
                                  capture_output=True, text=True)

    def test_missing_key_is_rejected(self):
        result = self.load_config(None)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(KEY_NAME, result.stderr)

    def test_empty_and_short_keys_are_rejected(self):
        for value in ("", "   ", "short-test-value"):
            with self.subTest(length=len(value)):
                self.assertNotEqual(self.load_config(value).returncode, 0)

    def test_long_placeholder_is_rejected(self):
        value = "REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_BYTES"
        self.assertNotEqual(self.load_config(value).returncode, 0)

    def test_private_random_key_is_used(self):
        import secrets
        value = secrets.token_hex(32)
        self.assertEqual(self.load_config(value).returncode, 0)


if __name__ == "__main__":
    unittest.main()
