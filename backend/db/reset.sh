#!/usr/bin/env bash
# Rebuilds a database from schema.sql, then adds sample data. Deletes all its data.
#
# Usage: backend/db/reset.sh [database] [--seed-only | --empty]   (default database: project_tracker)
#   --seed-only  only seed.sql's small sample (the automated tests use this), not demo.sql
#   --empty      tables only, no data at all (sign-up then creates the first admin)
#
# To add sample data later without wiping anything, use seed.sh.
# The Lambdas on LocalStack connect to the database named "postgres", so run
# `backend/db/reset.sh postgres` before testing the deployed services locally.
# For the AWS database, use bin/cloud-db.sh.
set -euo pipefail
source "$(dirname "$0")/connection.sh"

DATA="all"
for arg in "$@"; do
    case "$arg" in
        --seed-only) DATA="seed" ;;
        --empty) DATA="none" ;;
        *) DB_NAME="$arg" ;;
    esac
done

if ! psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
    psql -d postgres -qc "CREATE DATABASE \"$DB_NAME\";"
fi

# Dropping the schema removes every table, function and trigger, without dropping the database itself.
psql -d "$DB_NAME" -q -v ON_ERROR_STOP=1 \
    -c 'SET client_min_messages = warning;' \
    -c 'DROP SCHEMA public CASCADE;' \
    -c 'CREATE SCHEMA public;' \
    -f "$DB_DIR/schema.sql"

case "$DATA" in
    none) echo "Reset database '$DB_NAME' from schema.sql (no data)" ;;
    seed) "$DB_DIR/seed.sh" "$DB_NAME" --seed-only >/dev/null
          echo "Reset database '$DB_NAME' from schema.sql and seed.sql" ;;
    all)  "$DB_DIR/seed.sh" "$DB_NAME" >/dev/null
          echo "Reset database '$DB_NAME' from schema.sql, seed.sql and demo.sql" ;;
esac
