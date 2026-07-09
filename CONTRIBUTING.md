# Contributing to Ledger360

## Engineering Philosophy
The Ledger360 project is governed by a **strict evidence-based, zero-surprise workflow**. 

- **The local repository is the source of truth.** GitHub Actions simply verifies work that has already been proven locally.
- **No Blind Fixes.** Every fix requires root cause analysis and evidence. Never throw code at a wall to see what sticks.
- **One Logical Layer Per Commit.** Do not bundle unrelated fixes or features together.

## The Zero-Surprise Policy (Before Every Commit)

You must ensure that the entire pipeline is locally verified before committing and pushing code. **Nobody pushes code with a broken pipeline.**

Before committing, you **MUST** run the local CI parity sequence:

```bash
npm ci
npx prisma generate
npx tsc --noEmit
npm run lint
npm run test
npm run build
npm run build-storybook
```

**(Tip: You can use the `scripts/ci-local.ps1` or `verify.bat` helper scripts to run these automatically).**

### Failure Protocol
**If any step fails, STOP.**
1. Do not commit.
2. Do not push.
3. Diagnose the root cause using the lowest level tool. (e.g. If build fails due to a typing issue, use `tsc` to fix it, do not debug via Next.js).
4. Restart the sequence.

## Architecture & Code Constraints
1. **Financial Precision**: Money is stored ONLY as integer minor units (cents). Convert major/minor units ONLY in `src/lib/money.ts`.
2. **Idempotency**: All mutating operations must be safe to retry.
3. **Data Residency/Privacy**: Comply fully with data residency laws. No user PII or sensitive transaction data leaves the app without explicit, logged consent.
4. **Scope**: Do not refactor code outside the scope of your specific work order. Do not rename models or exported primitives unless explicitly part of an architectural change.
