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
- [ ] `npx tsc --noEmit` (Fix `CODE-001` Type errors)
- [ ] Git Commit & Push (TypeScript fix)
- [ ] GitHub CI Green

### Phase 3: Lint
- [ ] `npm run lint` (Fix `CODE-001` Lint errors first, then warnings)
- [ ] Git Commit & Push (Lint fix)
- [ ] GitHub CI Green

### Phase 4: Tests
- [ ] `npm run test` (Fix `CODE-003` Test failures if any)
- [ ] Git Commit & Push (Test fix)
- [ ] GitHub CI Green

### Phase 5: Production Build
- [ ] `NODE_ENV=production npm run build` (Catch production-only bugs)
- [ ] Git Commit & Push (Build fix)
- [ ] GitHub CI Green

### Phase 6: Storybook
- [ ] `npm run build-storybook` 
- [ ] Git Commit & Push (Storybook fix)
- [ ] GitHub CI Green

### Phase 7: Final Verification
- [ ] Local Smoke Test
- [ ] Vercel Preview
- [ ] Regression Audit
- [ ] Resume Wave 3
