#!/usr/bin/env bash
set -euo pipefail

# Ledger360 Emergency Database Backup Script
# Usage: ./backup-db.sh <database_url> <output_file.dump>

if ! command -v pg_dump &> /dev/null; then
    echo "ERROR: pg_dump could not be found. Please install postgresql-client."
    exit 1
fi

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <database_url> <output_file.dump>"
    exit 1
fi

DB_URL=$1
OUTPUT_FILE=$2

echo "Starting logical backup to ${OUTPUT_FILE}..."

# Use custom format (-Fc) for easier restoration with pg_restore
pg_dump --dbname="${DB_URL}" -Fc -f "${OUTPUT_FILE}"

echo "Backup complete: ${OUTPUT_FILE}"
