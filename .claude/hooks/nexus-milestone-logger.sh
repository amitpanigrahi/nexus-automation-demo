#!/bin/bash
# PostToolUse:Write|Edit|Bash — auto-appends an observability event for any
# active Nexus Harness run. This replaces hand-written audit-log entries
# (easy to forget mid-pipeline) with a log the harness itself guarantees.
#
# No-op when no run is active, so this is safe to leave registered globally.

CURRENT_RUN=".nexus/runs/current"
[ -L "$CURRENT_RUN" ] || [ -d "$CURRENT_RUN" ] || exit 0

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
  TARGET=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // "n/a"' | cut -c1-160)
else
  TOOL="unknown"
  TARGET="n/a"
fi

TOOL_ESC=$(printf '%s' "$TOOL" | sed 's/"/\\"/g')
TARGET_ESC=$(printf '%s' "$TARGET" | sed 's/"/\\"/g')

"$(dirname "$0")/../../bin/nexus-milestone.sh" "$CURRENT_RUN" \
  "{\"event\":\"tool_use\",\"tool\":\"$TOOL_ESC\",\"target\":\"$TARGET_ESC\"}" 2>/dev/null

exit 0
