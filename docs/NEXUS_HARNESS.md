# Nexus Harness: from a well-written prompt to an enforced harness

`/nexus-automation` is a single skill file. It's a genuinely good prompt — it defines an action-classification scheme (LOCAL / GIT_LOCAL / EXTERNAL_WRITE / DESTRUCTIVE), an approval gate protocol, and an audit log. The problem isn't the design, it's where the design lives: entirely in text the model reads and is expected to keep obeying for the full length of a six-stage run. A long context, a compaction, or a plausible-sounding shortcut mid-pipeline and the "always ask before pushing" rule is just... a paragraph that didn't get re-read.

`/nexus-harness` keeps the same six stages and the same guardrail *intent*, and moves the parts that must never be skipped out of the prompt and into things Claude Code enforces mechanically:

## The four moves

**1. Hooks instead of instructions for anything irreversible.**
`nexus-branch-guard.sh` and `nexus-write-gate.sh` run as `PreToolUse` hooks on every `Bash` call. They don't ask the model to remember not to force-push or push straight to `main` — they read the command before it executes and deny it. This is the same shift `.github/rules/architect.json` already represents for design-system rules (a machine-checkable file instead of "please use the design system"), applied to the approval-gate logic itself.

**2. A goal contract instead of prose acceptance criteria.**
`bin/nexus-goal.sh` writes `goal.json` with a criteria array where every entry is a literal shell command (`npm test`, `npm run guardrails`) that must exit 0. "Done" stops being a judgment call made by the same agent that wrote the code — it's whatever the contract says, checked by actually running the command.

**3. An independent reviewer instead of self-grading.**
`nexus-reviewer` is spawned fresh for both the plan and the implementation, and sees only the artifact plus `goal.json` — never the producing agent's reasoning. A model correcting its own homework is a weak check; a second pass with no access to the first pass's justifications is a stronger one. This is the evaluator-optimizer pattern: generate → independent critique → revise → repeat until the findings list is empty, not until a retry counter runs out.

**4. An automatic audit trail instead of a written-by-hand one.**
v1's audit log is a real file the skill is instructed to append to on every action. v2's `nexus-milestone-logger.sh` does the appending itself, as a `PostToolUse` hook, for every tool call while a run is active. The log can't fall behind because there's no step where the model has to remember to write to it.

## What stayed the same, on purpose

The design-system constraint, the bundle-size and coverage guardrails in `architect.json`, the six conceptual stages, and the requirement that external writes need explicit approval — none of that changed. The point of this exercise isn't "throw away v1's guardrails," it's "notice which of v1's guardrails were load-bearing prose and give them a mechanism that doesn't depend on the model's attention."

## Try it

```
/nexus-harness "Add a summary stats row above the sales table showing
total revenue, average units sold, and the top performing product"
```

Then, as a live demo: ask Claude to `git push --force origin main` mid-run. In v1, whether that gets refused depends on the model re-deriving the guardrail from the prompt in the moment. In v2, `nexus-branch-guard.sh` denies it before the tool ever runs — no model judgment involved.
