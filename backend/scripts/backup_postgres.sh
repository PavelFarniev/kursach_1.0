#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_FILE="${OUTPUT_DIR}/killexam_${TIMESTAMP}.dump"

mkdir -p "${OUTPUT_DIR}"

pg_dump "${DATABASE_URL}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "${OUTPUT_FILE}"

echo "Backup created: ${OUTPUT_FILE}"
