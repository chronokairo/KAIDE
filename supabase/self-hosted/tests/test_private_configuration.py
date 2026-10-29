import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kaide_supabase_configure", ROOT / "configure.py")
configure = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(configure)


class PrivateConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.work = tempfile.TemporaryDirectory()
        self.addCleanup(self.work.cleanup)
        self.directory = Path(self.work.name)
        shutil.copyfile(ROOT / ".env.example", self.directory / ".env.example")

    def create(self):
        configure.initialize(self.directory)
        return configure.read_env(self.directory / ".env")

    def test_example_contains_no_usable_credentials(self):
        values = configure.read_env(ROOT / ".env.example")
        self.assertTrue(all(not values[key] for key in configure.SENSITIVE_KEYS))
        with self.assertRaises(ValueError):
            configure.validate(values)

    def test_generated_keys_have_distinct_roles_and_private_signatures(self):
        values = self.create()
        configure.validate(values)
        other = dict(values, JWT_SECRET="different-signing-secret-that-is-long-enough")
        with self.assertRaises(ValueError):
            configure.validate(other)
        swapped = dict(values, ANON_KEY=values["SERVICE_ROLE_KEY"])
        with self.assertRaises(ValueError):
            configure.validate(swapped)

    def test_command_line_initialization_never_displays_credentials(self):
        shutil.copyfile(ROOT / "configure.py", self.directory / "configure.py")
        result = subprocess.run([sys.executable, str(self.directory / "configure.py")], capture_output=True, text=True)
        self.assertEqual(0, result.returncode)
        values = configure.read_env(self.directory / ".env")
        for key in configure.SENSITIVE_KEYS:
            self.assertNotIn(values[key], result.stdout + result.stderr)

    def test_existing_credentials_are_never_silently_rotated(self):
        self.create()
        before = (self.directory / ".env").read_bytes()
        self.assertFalse(configure.initialize(self.directory))
        self.assertEqual(before, (self.directory / ".env").read_bytes())
        (self.directory / ".env").write_text("JWT_SECRET=invalid\n", encoding="utf-8")
        with self.assertRaises(ValueError):
            configure.initialize(self.directory)
        self.assertEqual("JWT_SECRET=invalid\n", (self.directory / ".env").read_text())

    def test_deployments_generate_different_secrets(self):
        first = self.create()
        with tempfile.TemporaryDirectory() as second_dir:
            second = Path(second_dir)
            shutil.copyfile(ROOT / ".env.example", second / ".env.example")
            configure.initialize(second)
            other = configure.read_env(second / ".env")
            self.assertTrue(all(first[key] != other[key] for key in configure.SENSITIVE_KEYS))

    def render(self, values):
        output = self.directory / "kong.yml"
        env = dict(os.environ, **{k: values[k] for k in ["ANON_KEY", "SERVICE_ROLE_KEY"]})
        env.update(KONG_TEMPLATE_PATH=str(ROOT / "volumes/api/kong.yml"), KONG_DECLARATIVE_CONFIG=str(output))
        result = subprocess.run(["sh", str(ROOT / "volumes/api/render-kong.sh")], env=env, capture_output=True, text=True)
        return result, output

    def test_rendered_gateway_enforces_keys_and_keeps_auth_redirects(self):
        result, output = self.render(self.create())
        self.assertEqual(0, result.returncode, "Gateway rendering failed")
        config = yaml.safe_load(output.read_text())
        services = {service["name"]: service for service in config["services"]}
        for name in ["auth-v1", "rest-v1", "realtime-v1"]:
            self.assertIn("key-auth", [plugin["name"] for plugin in services[name]["plugins"]])
        for name in ["auth-v1-verify", "auth-v1-callback", "auth-v1-authorize"]:
            self.assertFalse(services[name].get("plugins"))
        values = configure.read_env(self.directory / ".env")
        keys = [consumer["keyauth_credentials"][0]["key"] for consumer in config["consumers"]]
        self.assertEqual([values["ANON_KEY"], values["SERVICE_ROLE_KEY"]], keys)
        self.assertNotIn("${", output.read_text())
        if os.name != "nt":
            self.assertEqual(0o600, output.stat().st_mode & 0o777)

    def test_gateway_rejects_empty_equal_and_yaml_injection_credentials(self):
        for anon, service in [("", "valid"), ("same", "same"), ("invalid\nplugins: []", "valid"), ("bad&replacement", "valid")]:
            result, output = self.render({"ANON_KEY": anon, "SERVICE_ROLE_KEY": service})
            self.assertNotEqual(0, result.returncode)
            self.assertFalse(output.exists())

    def test_compose_publishes_services_only_on_loopback_and_requires_credentials(self):
        config = yaml.safe_load((ROOT / "docker-compose.yml").read_text())
        for service in config["services"].values():
            for port in service.get("ports", []):
                self.assertTrue(port.startswith("127.0.0.1:"), "Service has a public port binding")
            for name, value in service.get("environment", {}).items():
                if any(part in name for part in ["PASSWORD", "JWT_SECRET", "ANON_KEY", "SERVICE_KEY", "SERVICE_ROLE_KEY"]):
                    self.assertIn(":?", str(value), "Credential can default or be empty")

    def test_compose_accepts_generated_credentials_and_rejects_empty_example(self):
        if not shutil.which("docker"):
            self.fail("Docker Compose is required for startup preflight validation")
        self.create()
        clean_env = {key: value for key, value in os.environ.items() if key not in configure.SENSITIVE_KEYS}
        base = ["docker", "compose", "--env-file"]
        end = ["-f", str(ROOT / "docker-compose.yml"), "config", "--quiet"]
        good = subprocess.run(base + [str(self.directory / ".env")] + end, env=clean_env, capture_output=True, text=True)
        self.assertEqual(0, good.returncode, "Generated configuration must pass Docker Compose preflight")
        bad = subprocess.run(base + [str(ROOT / ".env.example")] + end, env=clean_env, capture_output=True, text=True)
        self.assertNotEqual(0, bad.returncode, "Empty configuration must fail before starting services")

    def test_initialize_removes_known_passwords_and_admin_membership(self):
        sql = (ROOT / "volumes/db/init.sql").read_text()
        self.assertNotIn("PASSWORD 'postgres'", sql)
        self.assertNotIn("GRANT supabase_admin TO authenticator", sql)
        self.assertIn("REVOKE supabase_admin FROM authenticator", sql)
        self.assertIn("\\getenv deployment_password POSTGRES_PASSWORD", sql)
        repair = (ROOT / "repair-privileges.sql").read_text()
        self.assertIn("REVOKE supabase_admin FROM authenticator", repair)
        self.assertIn("REVOKE ALL ON TABLES FROM anon, authenticated", repair)


if __name__ == "__main__":
    unittest.main()
