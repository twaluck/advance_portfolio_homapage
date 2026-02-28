import base64
import hashlib
import hmac
import os
import secrets

PBKDF2_ITERATIONS = 120_000
SALT_BYTES = 16


def hash_password(password):
    """Hash a password using PBKDF2-HMAC-SHA256."""
    if password is None:
        raise ValueError("Password is required")

    salt = os.urandom(SALT_BYTES)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    key_b64 = base64.b64encode(derived_key).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${key_b64}"


def verify_password(password, stored_hash):
    """Verify a password against a stored PBKDF2 hash."""
    if not password or not stored_hash:
        return False

    try:
        algorithm, iterations, salt_b64, key_b64 = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
    except ValueError:
        return False

    salt = base64.b64decode(salt_b64)
    expected_key = base64.b64decode(key_b64)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        int(iterations),
    )
    return hmac.compare_digest(derived_key, expected_key)


def generate_token():
    return secrets.token_urlsafe(32)


# TODO: Move to a dedicated auth module and add rotation/expiry.
# TODO: Replace with a vetted library (e.g., passlib) for production.
