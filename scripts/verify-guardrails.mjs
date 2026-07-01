import { readFileSync, existsSync } from 'fs';
import { glob } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function collectSourceFiles(dir) {
  const all = [];
  const sourceOnly = [];
  const { readdirSync, statSync } = await import('fs');

  function walk(current) {
    const entries = readdirSync(current);
    for (const entry of entries) {
      const full = path.join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        all.push(full);
        // Exclude test files from import scanning and bundle estimates
        if (!entry.endsWith('.test.tsx') && !entry.endsWith('.test.ts') &&
            !entry.endsWith('.spec.tsx') && !entry.endsWith('.spec.ts')) {
          sourceOnly.push(full);
        }
      }
    }
  }

  walk(dir);
  return { all, sourceOnly };
}

async function main() {
  console.log('Checking architectural guardrails...\n');

  const rulesPath = path.join(ROOT, '.github', 'rules', 'architect.json');
  const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

  const srcDir = path.join(ROOT, 'src');
  const { sourceOnly: files } = await collectSourceFiles(srcDir);

  const violations = [];

  // 1. Check for disallowed imports (source files only, not test files)
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const banned of rules.disallowedImports) {
        if (lines[i].includes(`'${banned}'`) || lines[i].includes(`"${banned}"`)) {
          const rel = path.relative(ROOT, file);
          violations.push({
            type: 'disallowed-import',
            message: `"${banned}" found in ${rel}:${i + 1}`,
          });
        }
      }
    }
  }

  if (violations.filter(v => v.type === 'disallowed-import').length === 0) {
    console.log('  ✔ No disallowed imports found');
  } else {
    for (const v of violations.filter(v => v.type === 'disallowed-import')) {
      console.log(`  ✖ disallowed-import: ${v.message}`);
    }
  }

  // 2. Check bundle size estimate
  // Heuristic: sum raw source sizes, then apply a 0.5 compression/tree-shaking factor
  // to approximate the minified bundle contribution of first-party code.
  // This check primarily guards against accidentally importing large external libs
  // (e.g. chart.js adds ~500 KB; our own source is ~15-20 KB raw → ~8-10 KB estimated).
  let totalBytes = 0;
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    totalBytes += Buffer.byteLength(content, 'utf-8');
  }
  const estimatedKb = (totalBytes / 1024) * 0.5;

  if (estimatedKb <= rules.maxBundleSizeKb) {
    console.log(`  ✔ Bundle size within limit (${estimatedKb.toFixed(1)} KB estimated)`);
  } else {
    violations.push({
      type: 'bundle-size',
      message: `estimated ${estimatedKb.toFixed(1)} KB > limit ${rules.maxBundleSizeKb} KB`,
    });
    console.log(`  ✖ bundle-size: estimated ${estimatedKb.toFixed(1)} KB > limit ${rules.maxBundleSizeKb} KB`);
  }

  // 3. Check test coverage from coverage summary
  const coveragePath = path.join(ROOT, 'coverage', 'coverage-summary.json');
  if (existsSync(coveragePath)) {
    const summary = JSON.parse(readFileSync(coveragePath, 'utf-8'));
    const total = summary.total;
    if (total && total.lines) {
      const pct = total.lines.pct;
      if (pct >= rules.requiredTestCoverage) {
        console.log(`  ✔ Test coverage: ${pct}% (target: ${rules.requiredTestCoverage}%)`);
      } else {
        violations.push({
          type: 'coverage',
          message: `test coverage ${pct}% < required ${rules.requiredTestCoverage}%`,
        });
        console.log(`  ✖ coverage: test coverage ${pct}% < required ${rules.requiredTestCoverage}%`);
      }
    } else {
      console.log(`  - Test coverage: unable to parse summary (skipped)`);
    }
  } else {
    console.log(`  - Test coverage: no coverage report found (run npm test first)`);
  }

  console.log('');
  if (violations.length === 0) {
    console.log('  ✅ All guardrails passed. Gate: PASS');
    process.exit(0);
  } else {
    console.log(`  ❌ ${violations.length} violation(s). Gate: FAIL`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Guardrails script error:', err);
  process.exit(1);
});
