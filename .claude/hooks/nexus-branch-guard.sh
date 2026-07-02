#!/bin/bash
# PreToolUse:Bash — blocks destructive git operations regardless of what any
# skill prompt says. A skill can be mis-followed; a hook cannot.

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
else
  COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"$//')
fi

[ -z "$COMMAND" ] && exit 0

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' \
    "$(printf '%s' "$1" | sed 's/"/\\"/g')"
  exit 0
}

PROTECTED="main|master|prod|production"

if echo "$COMMAND" | grep -qE "git push[^|;&]*(origin|upstream)[[:space:]]+($PROTECTED)([[:space:]]|$)"; then
  deny "Direct push to a protected branch is blocked by nexus-branch-guard. Push a feature branch and open a PR instead."
fi

if echo "$COMMAND" | grep -qE "git push.*(-f\b|--force\b|--force-with-lease)"; then
  deny "Force push is blocked by nexus-branch-guard. Ask the user for explicit approval if this is really needed."
fi

if echo "$COMMAND" | grep -qE "git (reset --hard|clean -fd)"; then
  deny "Destructive git operation blocked by nexus-branch-guard. This discards local work — confirm with the user first."
fi

if echo "$COMMAND" | grep -qE "git branch -D"; then
  deny "Force branch deletion blocked by nexus-branch-guard. Use -d, or confirm with the user."
fi

exit 0
