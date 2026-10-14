#!/usr/bin/env bash
# Script: Sync shared backend code
# Purpose: Copy backend/_shared into every Python service as backend/<service>/shared,
#          because each Lambda is packaged from its own folder only.
# Usage: ./bin/sync-backend-shared.sh
# Called automatically by start-dev.sh and deploy-backend.sh. The copies are
# gitignored; edit backend/_shared, never a service's shared/ folder.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" > /dev/null 2>&1 || exit 1; pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." > /dev/null 2>&1 || exit 1; pwd -P)"
SHARED_DIR="$PROJECT_ROOT/backend/_shared"

shopt -s nullglob
for function_file in "$PROJECT_ROOT"/backend/*/function.py; do
    service_dir="$(dirname "$function_file")"
    case "$(basename "$service_dir")" in _*) continue ;; esac
    rm -rf "$service_dir/shared"
    mkdir -p "$service_dir/shared"
    cp "$SHARED_DIR"/*.py "$service_dir/shared/"
    echo "  synced shared code into backend/$(basename "$service_dir")/shared"
done
