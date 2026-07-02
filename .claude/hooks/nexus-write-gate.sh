#!/bin/bash
# PreToolUse:Bash — enforces .github/rules/architect.json's external-write
# policy structurally, instead of relying on a skill remembering to ask.
#
# nexus-automation asks approval because its prompt says to. This hook makes
# the same policy true even if the model skips the step, forgets, or is
# jailbroken mid-run: the command is denied before it ever executes.

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
else
  COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"$//')
fi

[ -z "$COMMAND" ] && exit 0

# Only external-write shaped commands are in scope for this gate.
echo "$COMMAND" | grep -qE "git push|gh pr create|gh issue|gh api.*-X (POST|PATCH|DELETE)" || exit 0

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
RULES_FILE="$REPO_ROOT/.github/rules/architect.json"

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' \
    "$(printf '%s' "$1" | sed 's/"/\\"/g')"
  exit 0
}

ask() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' \
    "$(printf '%s' "$1" | sed 's/"/\\"/g')"
  exit 0
}

if [ ! -f "$RULES_FILE" ] || ! command -v jq >/dev/null 2>&1; then
  ask "No architect.json (or no jq) to consult — treating this external write as requires-approval by default."
fi

BLOCKED=$(jq -r '.blocked // [] | join("|")' "$RULES_FILE")
ALLOWED=$(jq -r '.allowedExternalWrites // [] | join("|")' "$RULES_FILE")

if [ -n "$BLOCKED" ] && echo "$COMMAND" | grep -qiE "$BLOCKED"; then
  deny "Target system is in architect.json's 'blocked' list. Refusing — this is a hard stop, not an approval gate."
fi

if [ -n "$ALLOWED" ] && echo "$COMMAND" | grep -qiE "github|gh "; then
  if echo "$ALLOWED" | grep -qi "github"; then
    ask "github is allowlisted in architect.json, but external writes still require one explicit approval per action."
  fi
fi

ask "External write detected (git push / gh pr / gh api mutation). Requires explicit user approval per architect.json."
