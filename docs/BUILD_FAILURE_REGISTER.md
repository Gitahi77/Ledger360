# Build Failure Register

## Infrastructure Failures

| ID | Error | Layer | Severity | Root Cause | Fixed |
|---|---|---|---|---|---|
| INF-001 | Next.js build failed: `@next/swc` native binding (`.node`) is not a valid Win32 app | Production Build | Critical | Corrupted or missing SWC native bindings for Windows | No |
| INF-002 | Vitest & Storybook error: `rolldown` native binding (`.node`) is not a valid Win32 app | Tests / Storybook | Critical | NPM optional dependency installation bug corrupting Windows binary bindings | No |
| INF-003 | `lucide-react` module not found during build / TS checks | Dependencies | Critical | Package is in `package.json` but missing/corrupt in `node_modules` (Installation mismatch) | No |

## Code Failures

| ID | Error | Layer | Severity | Root Cause | Fixed |
|---|---|---|---|---|---|
| CODE-001 | Assorted ESLint violations (unused vars, `any`, unescaped quotes) | Lint | Medium | Rapid prototyping left unaddressed warnings/errors blocking strict-mode CI | No |
