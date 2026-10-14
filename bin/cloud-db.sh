#!/usr/bin/env bash
# Script: Cloud database tools
# Purpose: Rebuild or seed the deployed (AWS Aurora) database
# Usage: ./bin/cloud-db.sh reset [--empty | --seed-only]   wipe and rebuild (asks to confirm)
#        ./bin/cloud-db.sh seed [--seed-only]              add sample data without deleting anything
# Run ./bin/deploy-backend.sh first. Aurora isn't reachable from outside AWS, so this asks the
# deployed auth Lambda to run the SQL (backend/_shared/maintenance.py) through a direct,
# AWS-authenticated invoke; web requests can't trigger these tasks.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" > /dev/null 2>&1 || exit 1; pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." > /dev/null 2>&1 || exit 1; pwd -P)"
COMMAND="${1:-}"
OPTION="${2:-}"

case "$COMMAND:$OPTION" in
    reset:)            TASK="reset" ;;
    reset:--empty)     TASK="reset_empty" ;;
    reset:--seed-only) TASK="reset_seed_only" ;;
    seed:)             TASK="seed" ;;
    seed:--seed-only)  TASK="seed_only" ;;
    *) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac

# Fresh temporary AWS credentials, the same way the deploy scripts get them.
"$SCRIPT_DIR/setup-participant.sh" > /dev/null
source "$PROJECT_ROOT/ENVIRONMENT.config"

# Lambdas are named <project>-<service>-<app code> (see infra/locals.tf).
FUNCTION="${TF_VAR_aws_project:-coding-workshop}-auth-${TF_VAR_aws_app_code:-}"

if [ "$COMMAND" = "reset" ]; then
    echo "This DELETES all data in the cloud database (via $FUNCTION)."
    read -r -p "Type 'reset' to confirm: " answer
    [ "$answer" = "reset" ] || { echo "Cancelled."; exit 1; }
fi

OUTPUT="$(mktemp)"
trap 'rm -f "$OUTPUT"' EXIT
echo "Running '$TASK' (the database may take ~30s to wake up)..."
aws lambda invoke --function-name "$FUNCTION" --cli-binary-format raw-in-base64-out \
    --cli-read-timeout 300 --payload "{\"db_task\": \"$TASK\"}" "$OUTPUT" > /dev/null

if jq -e '.ok == true' "$OUTPUT" > /dev/null; then
    jq -r '"Done: \(.task). The database now has \(.users) users and \(.projects) projects."' "$OUTPUT"
else
    echo "ERROR: $(jq -r '.error // .errorMessage // "unknown error"' "$OUTPUT")"
    exit 1
fi
