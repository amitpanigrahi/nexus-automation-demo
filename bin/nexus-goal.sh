#!/bin/bash
# Emits an immutable goal contract for a Nexus Harness run.
#
# Usage: nexus-goal.sh <run_dir> "<problem statement>" "<verify command 1>" ["<verify command 2>" ...]
#
# Writes <run_dir>/goal.json. Every criterion is an executable shell command
# that must exit 0 on pass — no prose acceptance criteria, no self-graded checklists.

set -euo pipefail

RUN_DIR="$1"
PROBLEM="$2"
shift 2

mkdir -p "$RUN_DIR"
GOAL_FILE="$RUN_DIR/goal.json"

if [ -f "$GOAL_FILE" ]; then
  echo "goal.json already exists at $GOAL_FILE — goals are immutable once emitted, not overwriting." >&2
  exit 1
fi

CRITERIA_JSON="[]"
for cmd in "$@"; do
  ESCAPED=$(printf '%s' "$cmd" | sed 's/\\/\\\\/g; s/"/\\"/g')
  CRITERIA_JSON=$(printf '%s' "$CRITERIA_JSON" | sed "s/\]$/,{\"command\":\"$ESCAPED\",\"status\":\"PENDING\"}]/; s/^\[,/[/")
done

PROBLEM_ESCAPED=$(printf '%s' "$PROBLEM" | sed 's/\\/\\\\/g; s/"/\\"/g')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$GOAL_FILE" <<EOF
{
  "problem": "$PROBLEM_ESCAPED",
  "createdAt": "$TIMESTAMP",
  "criteria": $CRITERIA_JSON
}
EOF

echo "Goal contract written: $GOAL_FILE"
