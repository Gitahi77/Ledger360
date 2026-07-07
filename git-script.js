const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
    console.log(`> ${cmd}`);
    try {
        const out = execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
}

function writeMsg(name, content) {
    fs.writeFileSync(name, content);
}

// Ensure we are in a clean working state by resetting our monolith commit
run('git checkout feature/phase4-design-system');
run('git reset main');

run('git checkout -b release/v0.4-wave1');

// Commit 1: Design Tokens
run('git checkout -b feature/design-tokens');
run('git add src/app/globals.css');
writeMsg('msg1.txt', `feat(ui): establish semantic design token system\n\n- introduce finance semantic colors\n- migrate global typography tokens\n- add spacing variables\n- prepare theme architecture`);
run('git commit -F msg1.txt');
run('git checkout release/v0.4-wave1');
run('git merge feature/design-tokens');

// Commit 2: UI Primitives
run('git checkout -b feature/ui-primitives');
run('git add src/components/layout src/components/ui src/lib/ui');
run('git reset src/components/**/*.stories.tsx'); // exclude stories
writeMsg('msg2.txt', `feat(ui): introduce foundational component primitives\n\n- add layout primitives\n- add button variants\n- introduce CVA architecture\n- enforce accessibility defaults`);
run('git commit -F msg2.txt');
run('git checkout release/v0.4-wave1');
run('git merge feature/ui-primitives');

// Commit 3: Financial Primitives
run('git checkout -b feature/financial-primitives');
run('git add src/components/finance');
run('git reset src/components/finance/**/*.stories.tsx || true'); // in case there are none
writeMsg('msg3.txt', `feat(finance): add reusable financial presentation primitives\n\n- MoneyDTO formatting\n- semantic financial colors\n- locale-aware currency rendering\n- delta visualization`);
run('git commit -F msg3.txt');
run('git checkout release/v0.4-wave1');
run('git merge feature/financial-primitives');

// Commit 4: Storybook
run('git checkout -b feature/storybook');
run('git add .storybook src/components/**/*.stories.tsx');
writeMsg('msg4.txt', `docs(ui): initialize Storybook component catalog\n\n- configure Next.js Storybook\n- add accessibility addon\n- document primitive components`);
run('git commit -F msg4.txt');
run('git checkout release/v0.4-wave1');
run('git merge feature/storybook');

// Commit 5: Dashboard Refactor
run('git checkout -b feature/dashboard-refactor');
run('git add .');
writeMsg('msg5.txt', `refactor(dashboard): migrate dashboard to new design system\n\n- replace legacy layout\n- consume new primitives\n- remove ForecastCard\n- improve dashboard clarity`);
run('git commit -F msg5.txt');
run('git checkout release/v0.4-wave1');
run('git merge feature/dashboard-refactor');

// Push Release Branch
run('git push -u origin release/v0.4-wave1');

// Squash and merge to main
run('git checkout main');
run('git merge --squash release/v0.4-wave1');
writeMsg('msg-squash.txt', `Release: Phase 4 Wave 1 — Design System Foundation\n\nThis release establishes the foundational UI platform for Ledger360.\n\nHighlights\n\n• semantic design tokens\n• primitive UI library\n• financial display primitives\n• Storybook integration\n• dashboard migration\n• accessibility improvements\n\nBusiness logic remains unchanged.\n\nNo database migrations.\n\nNo API changes.`);
run('git commit -F msg-squash.txt');

// Tag
run('git tag v0.4.0-wave1');
run('git push origin main');
run('git push origin v0.4.0-wave1');

console.log('Successfully completed Git workflow.');
