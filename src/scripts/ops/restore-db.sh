#!/usr/bin/env bash
set -euo pipefail

# Ledger360 Emergency Database Restore Script
# Usage: ./restore-db.sh <database_url> <input_file.dump>

if ! command -v pg_restore &> /dev/null; then
    echo "ERROR: pg_restore could not be found. Please install postgresql-client."
    exit 1
fi

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <database_url> <input_file.dump>"
    exit 1
fi

DB_URL=$1
INPUT_FILE=$2

# Extract database name/host for display (crude parsing for safety prompt)
DB_HOST=$(echo "${DB_URL}" | grep -o '@.*' | cut -d@ -f2 | cut -d/ -f1 || echo "UNKNOWN")
DB_NAME=$(echo "${DB_URL}" | awk -F/ '{print $NF}' || echo "UNKNOWN")

echo "=========================================="
echo "DANGER: You are about to restore a database"
echo "Target Host: ${DB_HOST}"
echo "Target Name: ${DB_NAME}"
echo "Input File:  ${INPUT_FILE}"
echo "=========================================="
echo ""
echo "Type 'YES RESTORE' exactly to proceed, or anything else to cancel:"

read -r confirmation

if [ "${confirmation}" != "YES RESTORE" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Starting restoration process..."
# Clean (-c) and single transaction (-1) for safety
pg_restore --dbname="${DB_URL}" -c --if-exists -1 "${INPUT_FILE}"

echo "Restoration complete."
