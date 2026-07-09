# CI Parity Checklist

**Requirement:** Every layer must be completed, locally verified, committed, and pushed atomically. No blind fixes. A rollback checkpoint must follow each layer.

### Phase 1: Infrastructure
- [ ] Freeze Feature Work
- [x] Infrastructure Audit
- [x] Dependency Audit (`lucide-react` verified in `package.json` but missing in `node_modules`)
- [ ] `node_modules` Refresh (Delete `node_modules`)
- [ ] `npm ci` (If this fails, delete `package-lock.json` & `npm install`)
- [ ] `npm ls`
- [ ] `npx prisma generate`
- [ ] Git Commit & Push (Infrastructure fix)
- [ ] GitHub CI Green

### Phase 2: TypeScript
- [x] `npx tsc --noEmit` (Fix `CODE-001` Type errors)
- [x] Git Commit & Push (TypeScript fix)
- [x] GitHub CI Green

### Phase 3: Lint
- [ ] `npm run lint` (Fix `CODE-001` Lint errors first, then warnings)
- [ ] Git Commit & Push (Lint fix)
- [ ] GitHub CI Green

### Phase 4: Tests
- [x] `npm run test` (Fix `CODE-003` Test failures if any)
- [x] Git Commit & Push (Test fix)
- [x] GitHub CI Green

### Phase 5: Production Build
- [x] `NODE_ENV=production npm run build` (Catch production-only bugs)
- [x] Git Commit & Push (Build fix)
- [x] GitHub CI Green

### Phase 6: Storybook
- [x] `npm run build-storybook` 
- [x] Git Commit & Push (Storybook fix)
- [x] GitHub CI Green

### Phase 7: Final Verification
- [ ] Local Smoke Test
- [ ] Vercel Preview
- [ ] Regression Audit
- [ ] Resume Wave 3
