#!/usr/bin/env bash
# Script: Cloud database tools
# Purpose: Run the database scripts against the deployed (AWS Aurora) database
# Usage: ./bin/cloud-db.sh reset [--empty | --seed-only]   wipe and rebuild (asks to confirm)
#        ./bin/cloud-db.sh seed [--seed-only]              add sample data without deleting anything
#        ./bin/cloud-db.sh psql                            open a SQL shell on it
# Run ./bin/deploy-backend.sh first: it creates the database and sets up Terraform.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" > /dev/null 2>&1 || exit 1; pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." > /dev/null 2>&1 || exit 1; pwd -P)"
COMMAND="${1:-}"
shift || true

case "$COMMAND" in
    reset|seed|psql) ;;
    *) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac

# Fresh temporary AWS credentials, the same way the deploy scripts get them.
"$SCRIPT_DIR/setup-participant.sh" > /dev/null
source "$PROJECT_ROOT/ENVIRONMENT.config"

if ! CONNECTION=$(cd "$PROJECT_ROOT/infra" && terraform output -json postgres_connection 2>/dev/null); then
    echo "ERROR: No database connection found. Deploy the backend first: ./bin/deploy-backend.sh"
    exit 1
fi
read_field() { echo "$CONNECTION" | jq -r ".$1"; }
export POSTGRES_HOST="$(read_field host)" POSTGRES_PORT="$(read_field port)"
export POSTGRES_NAME="$(read_field name)" POSTGRES_USER="$(read_field user)" POSTGRES_PASS="$(read_field password)"
export PGSSLMODE=require  # Aurora only accepts encrypted connections

if [ -z "$POSTGRES_HOST" ]; then
    echo "ERROR: The deployment has no database (is aws_postgres_enabled off?)"
    exit 1
fi
echo "Cloud database: $POSTGRES_NAME on $POSTGRES_HOST"

case "$COMMAND" in
    reset)
        echo "This DELETES all data in the cloud database '$POSTGRES_NAME'."
        read -r -p "Type the database name to confirm: " answer
        [ "$answer" = "$POSTGRES_NAME" ] || { echo "Cancelled."; exit 1; }
        "$PROJECT_ROOT/backend/db/reset.sh" "$POSTGRES_NAME" "$@"
        ;;
    seed)
        "$PROJECT_ROOT/backend/db/seed.sh" "$POSTGRES_NAME" "$@"
        ;;
    psql)
        PGPASSWORD="$POSTGRES_PASS" exec psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_NAME"
        ;;
esac
