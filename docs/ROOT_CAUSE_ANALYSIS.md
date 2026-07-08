# Root Cause Analysis

## INF-001 & INF-002: Native Binding Errors (`@rolldown` & `@next/swc`)
**Issue:** `vitest run`, `next build`, and `storybook build` fail to start due to corrupted `.node` native bindings on Windows.
**Evidence:** 
- Error: `\\?\C:\...\next-swc.win32-x64-msvc.node is not a valid Win32 application`
- Error: `Cannot find native binding. npm has a bug related to optional dependencies...`
**Root Cause:** Known NPM caching/installation bug on Windows that corrupts downloaded native optional dependencies.
**Affected Files:** `node_modules/@next/swc-win32-x64-msvc/*`, `node_modules/@rolldown/binding-win32-x64-msvc/*`
**Smallest Possible Fix:** Delete `node_modules` and run `npm ci`. Only delete `package-lock.json` if `npm ci` fails due to lockfile inconsistencies.
**Local Verification:** Run `npm ci` and check if native bindings are valid.

## INF-003: `lucide-react` Missing
**Issue:** TypeScript and Next.js fail to resolve `lucide-react`.
**Evidence:** 
- `package.json` contains `"lucide-react": "^1.14.0"`.
- TypeScript outputs TS7016 "Could not find a declaration file...".
- Webpack outputs "Module not found: Can't resolve 'lucide-react'".
**Root Cause:** The package is declared in `package.json` but the installation inside `node_modules` is either missing or corrupt (Case B).
**Affected Files:** `node_modules/lucide-react`
**Smallest Possible Fix:** The same fix as INF-001/002 (`npm ci`) will restore the missing package. We will verify with `npm ls lucide-react` afterward.
**Local Verification:** `npx tsc --noEmit` and `npm ls` should pass.

## CODE-001: Assorted ESLint Violations
**Issue:** `npm run lint` fails with over 50 violations.
**Evidence:**
- Warnings: `@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-explicit-any`, `react/no-unescaped-entities`, `@typescript-eslint/no-unused-expressions`, `@typescript-eslint/no-require-imports`.
**Root Cause:** Rapid prototyping allowed relaxed typings and unused code to accumulate. Next.js strict build mode treats these warnings as build-failing errors.
**Affected Files:** Multiple components and API routes.
**Smallest Possible Fix:** Methodically review and fix each linting error. Classify them into errors vs. warnings, fixing errors first, then warnings.
**Local Verification:** `npm run lint` outputs zero warnings or errors.
