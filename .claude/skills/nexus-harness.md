# /nexus-harness — Nexus Automation, hardened into a harness

`/nexus-automation` runs a good pipeline as long as the model faithfully follows every instruction in its prompt: ask before every external write, log every action, never skip a stage. `/nexus-harness` keeps the same six stages but stops depending on the model remembering to police itself. Policy that matters is moved out of prose and into things that run whether or not the prompt is followed exactly: hooks that physically deny risky commands, a goal contract with executable pass/fail checks, and an independent review pass before anything ships.

**Feature request:** $ARGUMENTS

---

## What's different from /nexus-automation

| | nexus-automation (v1) | nexus-harness (v2) |
|---|---|---|
| External-write approval | Described in the prompt; relies on the model remembering | Enforced by `nexus-write-gate.sh` — the command is denied/asked at the tool layer, prompt or no prompt |
| Protected branches / force-push | Not addressed | `nexus-branch-guard.sh` blocks it outright, always |
| Success criteria | Prose acceptance criteria, self-graded | `goal.json` — each criterion is a shell command that must exit 0 |
| Review before shipping | The implementer checks its own work | `nexus-reviewer` agent reviews independently — APPROVE/REVISE, no shared context with the implementer |
| Audit trail | Hand-written by the skill, one line per action | Auto-appended by `nexus-milestone-logger.sh` on every tool call — can't be forgotten |
| Workflow shape | Always all 6 stages, same depth | Classifies the request first and right-sizes Plan/Verify depth |
| Ambiguous requirements | Handled ad hoc, inline | Explicit gap protocol: BLOCKING stops and asks, INFORMATIONAL is logged as an assumption and the run proceeds |

Same guardrail *intent* as v1 (`.github/rules/architect.json`, approval before external writes, an audit trail) — different enforcement mechanism. Nothing here talks to a different design system or a different repo; it's the same demo app, run through a sturdier harness.

---

## Stage 0 — Classify + open the run

Score the request against three natures: `quick-fix` (small, localized, low ambiguity), `feature` (new additive UI/behavior), `structural` (touches architecture, the design system itself, or multiple components). If it's not obviously one of these, ask.

```bash
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR=".nexus/runs/$RUN_ID"
mkdir -p "$RUN_DIR"
ln -sfn "$RUN_ID" .nexus/runs/current
```

`quick-fix` skips Stage 2's reviewer loop (plan is short enough to eyeball). `feature` and `structural` always go through it — `structural` additionally requires the reviewer to explicitly check for design-system violations before Stage 3 starts.

## Stage 1 — Gap protocol

Before writing the goal, check for gaps:
- **BLOCKING** (ambiguous which component owns this, conflicting with an existing guardrail, no clear success signal): stop, `AskUserQuestion`, do not proceed until resolved.
- **IMPORTANT** (reasonable default exists but worth flagging): note it in `$RUN_DIR/assumptions.md`, proceed.
- **INFORMATIONAL**: proceed silently.

Never let a BLOCKING gap become an assumption because asking felt slow.

## Stage 2 — Goal + Plan (with review gate)

Emit the contract first, before any plan is written — the plan is judged against it, not the other way around:

```bash
sh bin/nexus-goal.sh "$RUN_DIR" "<one-line feature request>" \
  "npm test" \
  "npm run guardrails"
```

Draft a short plan inline: which files change, what the design-system-compliant approach is, what the test plan is. Then spawn `nexus-reviewer` with the plan and `goal.json` — nothing else. On `REVISE`, address every finding and resubmit. On `APPROVE`, proceed. Log the outcome:

```bash
sh bin/nexus-milestone.sh "$RUN_DIR" '{"event":"plan_review","verdict":"<APPROVE|REVISE>"}'
```

## Stage 3 — Implementation

Spawn an agent to implement against the approved plan: design-system components only, no disallowed imports, tests alongside the code. Run `npm test` and `npm run guardrails` yourself before calling this stage done — don't hand that off to Stage 4 to discover.

## Stage 4 — Verification

Re-run every command in `goal.json.criteria` and record the result:

```bash
sh bin/nexus-milestone.sh "$RUN_DIR" '{"event":"verify","criterion":"npm test","result":"PASS"}'
```

Spawn `nexus-reviewer` a second time — this time over the diff, not the plan — for an independent implementation review. Any REVISE sends it back to Stage 3. A run cannot reach Stage 5 with any criterion still PENDING or FAILED, or an unresolved REVISE.

## Stage 5 — Ship

`nexus-branch-guard.sh` and `nexus-write-gate.sh` are already registered in `.claude/settings.json` — they fire on every `git push` / `gh pr create` regardless of what this stage does or doesn't remember to say. Still, narrate the plan to the user before running it:

1. `git checkout -b feature/<kebab-case-name>`
2. `git add <specific files>` / `git commit`
3. `git push origin feature/<kebab-case-name>` — the write-gate hook will surface an approval prompt here
4. `gh pr create --draft` — same

Render `$RUN_DIR/progress.md` from `milestones.jsonl` as the last step, and include it in the PR description.

## Final summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEXUS HARNESS — RUN COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Classification: [quick-fix|feature|structural]
  Goal:           .nexus/runs/<id>/goal.json
  Criteria:       [N]/[N] PASS
  Plan review:    [APPROVE after N rounds]
  Impl review:    [APPROVE after N rounds]
  PR:             [URL or "not pushed — user declined"]
  Run log:        .nexus/runs/<id>/milestones.jsonl
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Rules
- Never skip Stage 1's gap check, even for `quick-fix`.
- Never let the implementer be its own reviewer — `nexus-reviewer` runs in a fresh context every time.
- Never mark a criterion PASS without having actually run its command in this session.
- The hooks in `.claude/settings.json` are the real enforcement; treat every rule above as backup, not the primary control.
