@echo off
echo --- RUNNING: npx prisma generate ---
cmd.exe /c npx prisma generate
if %errorlevel% equ 0 (echo --- RESULT: PASS ---) else (echo --- RESULT: FAIL ---)

echo --- RUNNING: npx tsc --noEmit ---
cmd.exe /c npx tsc --noEmit
if %errorlevel% equ 0 (echo --- RESULT: PASS ---) else (echo --- RESULT: FAIL ---)

echo --- RUNNING: npm run lint ---
cmd.exe /c npm run lint
if %errorlevel% equ 0 (echo --- RESULT: PASS ---) else (echo --- RESULT: FAIL ---)

echo --- RUNNING: npm run test ---
cmd.exe /c npm run test
if %errorlevel% equ 0 (echo --- RESULT: PASS ---) else (echo --- RESULT: FAIL ---)

echo --- RUNNING: npm run build ---
cmd.exe /c npm run build
if %errorlevel% equ 0 (echo --- RESULT: PASS ---) else (echo --- RESULT: FAIL ---)

echo --- RUNNING: npm run build-storybook ---
cmd.exe /c npm run build-storybook
if %errorlevel% equ 0 (echo --- RESULT: PASS ---) else (echo --- RESULT: FAIL ---)
