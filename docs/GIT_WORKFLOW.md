# Ledger360 Git Workflow & Release Strategy

## Philosophy
We do not push raw code. We publish **verified engineering milestones**.
Every Git commit must satisfy:
- Builds successfully
- Type-safe
- Lints successfully
- Passes all tests
- Doesn't break existing functionality
- Has a rollback strategy
- Represents one logical engineering unit

## Branch Strategy (Release Train)
- **`main`**: The stable, production-ready branch.
- **`release/vX.Y-waveZ`**: The integration branch for an entire Wave or Milestone.
- **`feature/*`**: Short-lived branches focused on a single logical change (e.g., `feature/design-tokens`, `feature/storybook`).

```text
main
│
├── release/v0.4-wave1
│   ├── feature/design-tokens
│   ├── feature/ui-primitives
│   └── ...
│
├── release/v0.4-wave2
│   ├── feature/transactions-layout
│   ├── feature/transactions-filters
│   └── ...
```

## Release Workflow Sequence
1. **Develop on a dedicated feature branch** off the target `release/*` branch.
2. **Keep changes focused** on a single concern.
3. **Make small, conventional commits** (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`).
4. **Merge feature branches** into the release branch.
5. **Run the full verification suite** (CI Release Gate) on the release branch.
6. **Open one release PR** with a comprehensive summary against `main`.
7. **Squash and Merge** into `main` (never use Merge Commit or Rebase Merge, to keep `main` history clean).
8. **Create a version tag** (e.g., `v0.4.0-wave1`) and push.
9. **Document the release** in `docs/releases/`.
10. **Begin the next wave** from a fresh branch off `main`.

## CI Release Gate Checklist (NO MERGE if any fail)
- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build-storybook`
- [ ] TypeScript check
- [ ] No console errors
- [ ] Accessibility
- [ ] Responsive
- [ ] Dark Mode
