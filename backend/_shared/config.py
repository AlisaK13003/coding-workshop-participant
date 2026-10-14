"""Settings read from environment variables (set by Terraform on Lambda)."""

import os

IS_LOCAL = os.getenv("IS_LOCAL", "false") == "true"

POSTGRES = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASS", "postgres123"),
    "dbname": os.getenv("POSTGRES_NAME", "project_tracker"),
}

# Signing key for JWTs. Terraform generates one per deployment. A fixed key is only
# acceptable for local development; elsewhere it stays None and auth refuses to work.
_DEV_JWT_SECRET = "local-development-only-not-a-secret"
JWT_SECRET = os.getenv("JWT_SECRET") or (_DEV_JWT_SECRET if IS_LOCAL else None)

ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "7"))
