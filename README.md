# Nexus Automation Demo

A demo app for showcasing the `/nexus-automation` autonomous SDLC pipeline — a full Discovery → PRD → HLD → Implementation → Verification → PR workflow driven by a single prompt.

## Using the Skill

### Prerequisites

[Claude Code](https://claude.ai/code) CLI installed and authenticated:

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

### Install the skill

Copy the skill file to your Claude skills directory:

```bash
mkdir -p ~/.claude/skills/nexus-automation
cp .claude/skills/nexus-automation.md ~/.claude/skills/nexus-automation/SKILL.md
```

Or install globally so it's available in any project:

```bash
mkdir -p ~/.claude/skills/nexus-automation
curl -o ~/.claude/skills/nexus-automation/SKILL.md \
  https://raw.githubusercontent.com/amitpanigrahi/nexus-automation-demo/main/.claude/skills/nexus-automation.md
```

### Use it

Open Claude Code in this repo and run:

```
/nexus-automation "your feature request here"
```

The pipeline will run through 6 stages automatically and pause for your approval before pushing anything to GitHub.

### What it does

| Stage | What happens |
|---|---|
| 🔍 Discovery | Analyzes the repo — files, design system, guardrails |
| 📋 PRD | Generates acceptance criteria from your request |
| 🏗️ HLD | Designs the architecture — which files to touch and how |
| 🛠️ Implementation | Writes the code, runs tests and guardrail checks |
| ✅ Verification | Reviews all ACs, security, and code quality |
| 🚀 Pull Request | Commits and opens a draft PR — **asks your approval first** |

Every external action (push, PR, Figma, Jira, Slack) requires explicit approval. All actions are logged to `.nexus-automation/audit.log`.

## Nexus Harness (Advanced)

`/nexus-harness` runs the same six stages but turns the guardrails that matter most — approval before external writes, never force-pushing, an audit trail — from prompt instructions into enforced Claude Code hooks, adds a `goal.json` contract with executable pass/fail criteria, and inserts an independent reviewer pass before anything ships. See [`docs/NEXUS_HARNESS.md`](docs/NEXUS_HARNESS.md) for the full comparison with v1.

```bash
mkdir -p ~/.claude/skills/nexus-harness ~/.claude/agents
cp .claude/skills/nexus-harness.md ~/.claude/skills/nexus-harness/SKILL.md
cp .claude/agents/nexus-reviewer.md ~/.claude/agents/nexus-reviewer.md
```

```
/nexus-harness "your feature request here"
```

## The Demo

This app starts in a clean state. The demo adds a **summary stats row** (total revenue, average units, top performer) above the sales table — using the full autonomous pipeline:

```
/nexus-automation "Add a summary stats row above the sales table showing 
total revenue, average units sold, and the top performing product"
```

## Setup

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # run tests
npm run guardrails   # check architectural constraints
```

## Architectural Rules

Defined in `.github/rules/architect.json`:
- Max bundle size: 15 KB
- Disallowed: chart.js, recharts, d3, highcharts
- Required test coverage: 80%
- UI must use components from `src/design-system/`

## Stack

- Next.js 14 (App Router)
- TypeScript
- Vitest + Testing Library
- Zero UI dependencies beyond the built-in design system
