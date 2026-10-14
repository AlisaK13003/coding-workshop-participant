# Sourced by reset.sh and seed.sh: connection settings for psql, taken from the same
# POSTGRES_* variables the backend uses, with local defaults. The database defaults to
# POSTGRES_NAME, or project_tracker locally.
export PGHOST="${POSTGRES_HOST:-localhost}"
export PGPORT="${POSTGRES_PORT:-5432}"
export PGUSER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASS:-postgres123}"
DB_NAME="${POSTGRES_NAME:-project_tracker}"
DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
