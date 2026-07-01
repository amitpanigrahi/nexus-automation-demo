# Nexus Automation Demo

A demo app for showcasing the `/nexus-automation` autonomous SDLC pipeline.

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
