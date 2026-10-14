#!/usr/bin/env bash
# Adds the sample data (seed.sql, then demo.sql) to an existing database, without deleting
# anything. Safe to run more than once: rows that already exist are skipped.
#
# Usage: backend/db/seed.sh [database] [--seed-only]   (default database: project_tracker)
#   --seed-only  only seed.sql's small sample, not demo.sql
set -euo pipefail
source "$(dirname "$0")/connection.sh"

FILES=("$DB_DIR/seed.sql" "$DB_DIR/demo.sql")
for arg in "$@"; do
    case "$arg" in
        --seed-only) FILES=("$DB_DIR/seed.sql") ;;
        *) DB_NAME="$arg" ;;
    esac
done

for file in "${FILES[@]}"; do
    psql -d "$DB_NAME" -q -v ON_ERROR_STOP=1 -c 'SET client_min_messages = warning;' -f "$file"
done
echo "Added sample data to '$DB_NAME' ($(basename -a "${FILES[@]}" | paste -sd ' '))"
