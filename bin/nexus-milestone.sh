#!/bin/bash
# Appends one structured event to a Nexus Harness run's milestone log.
#
# Usage: nexus-milestone.sh <run_dir> '<json object, no trailing newline>'
#
# The log is append-only JSONL — one event per line. progress.md is a
# derived, human-readable render of this file, never hand-edited.

set -euo pipefail

RUN_DIR="$1"
EVENT_JSON="$2"

mkdir -p "$RUN_DIR"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if command -v jq >/dev/null 2>&1; then
  echo "$EVENT_JSON" | jq -c --arg ts "$TIMESTAMP" '. + {ts: $ts}' >> "$RUN_DIR/milestones.jsonl"
else
  # jq not available — stitch the timestamp in without reparsing.
  TRIMMED=$(printf '%s' "$EVENT_JSON" | sed 's/[[:space:]]*}[[:space:]]*$//')
  printf '%s,"ts":"%s"}\n' "$TRIMMED" "$TIMESTAMP" >> "$RUN_DIR/milestones.jsonl"
fi
