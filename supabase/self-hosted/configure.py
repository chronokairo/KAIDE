#!/usr/bin/env python3
"""Initialize private local Supabase credentials; never rotate existing deployments."""
import argparse
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import secrets
import time


SENSITIVE_KEYS = ("POSTGRES_PASSWORD", "JWT_SECRET", "ANON_KEY", "SERVICE_ROLE_KEY")


def read_env(path):
    values = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, separator, value = line.partition("=")
        if not separator or not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            raise ValueError("Invalid environment file format")
        values[key] = value
    return values


def encode_part(value):
    return base64.urlsafe_b64encode(json.dumps(value, separators=(",", ":")).encode()).decode().rstrip("=")


def sign_key(secret, role):
    now = int(time.time())
    message = encode_part({"alg": "HS256", "typ": "JWT"}) + "." + encode_part({
        "iss": "kaide-self-hosted", "role": role, "iat": now, "exp": now + 365 * 86400,
    })
    signature = base64.urlsafe_b64encode(hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()).decode().rstrip("=")
    return message + "." + signature


def validate(values):
    if any(not values.get(key, "").strip() for key in SENSITIVE_KEYS):
        raise ValueError("Deployment credentials are required")
    if not re.fullmatch(r"[A-Za-z0-9_-]{32,}", values["POSTGRES_PASSWORD"]):
        raise ValueError("Database password must contain at least 32 URL-safe characters")
    secret = values["JWT_SECRET"]
    if len(secret) < 32 or secret.startswith(("your-", "replace-", "super-secret-")):
        raise ValueError("JWT signing secret must be private and randomly generated")
    for key, role in (("ANON_KEY", "anon"), ("SERVICE_ROLE_KEY", "service_role")):
        try:
            header, payload, signature = values[key].split(".")
            metadata = json.loads(base64.urlsafe_b64decode(header + "==="))
            claims = json.loads(base64.urlsafe_b64decode(payload + "==="))
            expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), (header + "." + payload).encode(), hashlib.sha256).digest()).decode().rstrip("=")
            valid = metadata.get("alg") == "HS256" and claims.get("role") == role and claims.get("exp", 0) > time.time() and hmac.compare_digest(signature, expected)
        except Exception:
            valid = False
        if not valid:
            raise ValueError(key + " must be an unexpired JWT signed for its expected role")


def initialize(directory):
    destination = directory / ".env"
    if destination.exists():
        validate(read_env(destination))
        return False
    template = (directory / ".env.example").read_text(encoding="utf-8")
    values = {"POSTGRES_PASSWORD": secrets.token_hex(32), "JWT_SECRET": secrets.token_urlsafe(48)}
    values["ANON_KEY"] = sign_key(values["JWT_SECRET"], "anon")
    values["SERVICE_ROLE_KEY"] = sign_key(values["JWT_SECRET"], "service_role")
    for key, value in values.items():
        template, count = re.subn(r"^" + key + r"=.*$", key + "=" + value, template, flags=re.M)
        if count != 1:
            raise ValueError("Environment template must define each credential exactly once")
    validate(values)
    descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as output:
        output.write(template)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate existing configuration without changing it")
    options = parser.parse_args()
    directory = Path(__file__).resolve().parent
    try:
        if options.check:
            validate(read_env(directory / ".env"))
            print("Configuration validated; no credentials displayed or changed.")
        else:
            created = initialize(directory)
            print("Private .env created." if created else "Existing .env validated and preserved.")
    except (ValueError, OSError) as error:
        # Only controlled messages: never print file contents or credentials.
        print("Configuration failed: " + (str(error) if isinstance(error, ValueError) else "environment file unavailable"))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
