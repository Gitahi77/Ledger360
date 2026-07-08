const fs = require('fs');
const { execSync } = require('child_process');

function run(cmd) {
    console.log(`> ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
}

function writeMsg(name, content) {
    fs.writeFileSync(name, content);
}

run('git checkout release/v0.4-wave3');
run('git add "src/app/(dashboard)/transactions/TransactionsClient.tsx"');
writeMsg('msg-all.txt', `refactor(transactions): migrate layout, hero, filters, and modal to UI primitives`);
run('git commit -F msg-all.txt || echo "Already committed"');

run('git checkout main');
run('git merge --squash release/v0.4-wave3');

writeMsg('msg-squash.txt', `Release: Phase 4 Wave 3 — Transactions Redesign

Highlights
• migrate layout and hero to Grid and Stack
• implement FinancialMetric and CurrencyDisplay
• update toolbars with Button and Input
• modernize modal form elements`);

run('git commit -F msg-squash.txt');
run('git tag v0.4.0-wave3 || echo "Tag already exists"');
run('git push origin main');
run('git push origin v0.4.0-wave3');
console.log('Wave 3 successfully published to main.');
