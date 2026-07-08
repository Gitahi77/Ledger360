$ErrorActionPreference = "Stop"

Write-Host "========================================="
Write-Host "Ledger360 Local CI Verification Sequence"
Write-Host "========================================="

Write-Host "`n[1/7] Running: npm ci"
cmd.exe /c npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

Write-Host "`n[2/7] Running: npx prisma generate"
cmd.exe /c npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "prisma generate failed" }

Write-Host "`n[3/7] Running: npx tsc --noEmit"
cmd.exe /c npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw "tsc failed" }

Write-Host "`n[4/7] Running: npm run lint"
cmd.exe /c npm run lint
if ($LASTEXITCODE -ne 0) { throw "lint failed" }

Write-Host "`n[5/7] Running: npm run test"
cmd.exe /c npm run test
if ($LASTEXITCODE -ne 0) { throw "tests failed" }

Write-Host "`n[6/7] Running: npm run build"
cmd.exe /c npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

Write-Host "`n[7/7] Running: npm run build-storybook"
cmd.exe /c npm run build-storybook
if ($LASTEXITCODE -ne 0) { throw "build-storybook failed" }

Write-Host "`n========================================="
Write-Host "SUCCESS: All CI checks passed locally!"
Write-Host "========================================="
