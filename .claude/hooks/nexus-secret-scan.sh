#!/bin/bash
# PostToolUse:Write|Edit — scans the file that was just written for
# hardcoded-secret shapes. Runs after every write so a leaked key can't
# survive to the next stage of the pipeline, let alone a commit.

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
else
  FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*"' | head -1 | sed 's/"file_path":"//;s/"$//')
fi

[ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ] && exit 0

PATTERNS='AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|xox[baprs]-[0-9a-zA-Z-]{10,}'

MATCH=$(grep -nEo "$PATTERNS" "$FILE_PATH" 2>/dev/null | head -3)

if [ -n "$MATCH" ]; then
  printf '{"systemMessage":"nexus-secret-scan: possible hardcoded secret in %s — review before committing:\\n%s"}\n' \
    "$(printf '%s' "$FILE_PATH" | sed 's/"/\\"/g')" \
    "$(printf '%s' "$MATCH" | sed 's/"/\\"/g' | tr '\n' ';')"
fi

exit 0
