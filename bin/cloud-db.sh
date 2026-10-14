#!/usr/bin/env bash
# Script: Cloud database tools
# Purpose: Run the database scripts against the deployed (AWS Aurora) database
# Usage: ./bin/cloud-db.sh reset [--empty | --seed-only]   wipe and rebuild (asks to confirm)
#        ./bin/cloud-db.sh seed [--seed-only]              add sample data without deleting anything
#        ./bin/cloud-db.sh psql                            open a SQL shell on it
# Run ./bin/deploy-backend.sh first. The connection is read from the deployed auth Lambda's
# environment (the same settings the backend uses), so no Terraform outputs are needed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" > /dev/null 2>&1 || exit 1; pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." > /dev/null 2>&1 || exit 1; pwd -P)"
COMMAND="${1:-}"
shift || true

case "$COMMAND" in
    reset|seed|psql) ;;
    *) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac

# Fresh temporary AWS credentials, the same way the deploy scripts get them.
"$SCRIPT_DIR/setup-participant.sh" > /dev/null
source "$PROJECT_ROOT/ENVIRONMENT.config"

# Lambdas are named <project>-<service>-<app code> (see infra/locals.tf); workshop
# credentials can read one function's settings but not list them all.
FUNCTION="${TF_VAR_aws_project:-coding-workshop}-auth-${TF_VAR_aws_app_code:-}"
if ! SETTINGS=$(aws lambda get-function-configuration --function-name "$FUNCTION" \
        --query 'Environment.Variables' --output json 2>/dev/null); then
    echo "ERROR: Couldn't read the $FUNCTION Lambda. Deploy the backend first: ./bin/deploy-backend.sh"
    exit 1
fi
read_setting() { echo "$SETTINGS" | jq -r ".$1 // empty"; }
export POSTGRES_HOST="$(read_setting POSTGRES_HOST)" POSTGRES_PORT="$(read_setting POSTGRES_PORT)"
export POSTGRES_NAME="$(read_setting POSTGRES_NAME)" POSTGRES_USER="$(read_setting POSTGRES_USER)"
export POSTGRES_PASS="$(read_setting POSTGRES_PASS)"
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
