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
    target="$service_dir/shared"
    mkdir -p "$target"
    # Overwrite in place (no delete-then-copy gap), then drop files removed from _shared.
    cp -f "$SHARED_DIR"/*.py "$target/"
    for copied in "$target"/*.py; do
        [ -e "$SHARED_DIR/$(basename "$copied")" ] || rm -f "$copied"
    done
    echo "  synced shared code into backend/$(basename "$service_dir")/shared"
done
