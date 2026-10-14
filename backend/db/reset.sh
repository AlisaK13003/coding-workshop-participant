#!/usr/bin/env bash
# Rebuilds a local database from schema.sql and seed.sql. Deletes all its data.
#
# Usage: backend/db/reset.sh [database]   (default: project_tracker)
#
# The Lambdas on LocalStack connect to the database named "postgres", so run
# `backend/db/reset.sh postgres` before testing the deployed services locally.
set -euo pipefail

DB_NAME="${1:-project_tracker}"
DB_DIR="$(cd "$(dirname "$0")" && pwd)"
export PGHOST="${POSTGRES_HOST:-localhost}"
export PGPORT="${POSTGRES_PORT:-5432}"
export PGUSER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASS:-postgres123}"

if ! psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
    psql -d postgres -qc "CREATE DATABASE \"$DB_NAME\";"
fi

# Dropping the schema removes every table, function and trigger, without dropping the database itself.
psql -d "$DB_NAME" -q -v ON_ERROR_STOP=1 \
    -c 'SET client_min_messages = warning;' \
    -c 'DROP SCHEMA public CASCADE;' \
    -c 'CREATE SCHEMA public;' \
    -f "$DB_DIR/schema.sql" \
    -f "$DB_DIR/seed.sql"

echo "Reset database '$DB_NAME' from schema.sql and seed.sql"
