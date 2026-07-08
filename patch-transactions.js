const fs = require('fs');
const path = require('path');
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

const filePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'transactions', 'TransactionsClient.tsx');

// Reset to ensure clean slate from previous runs
run('git checkout release/v0.4-wave3');

run('git checkout -b feature/transactions-layout || git checkout feature/transactions-layout');
run('git checkout -- "src/app/(dashboard)/transactions/TransactionsClient.tsx"'); // reset just in case

let lines = fs.readFileSync(filePath, 'utf-8').split('\n');

// 1. Add imports
const importsToAdd = [
  "import { Grid } from '@/components/layout/grid';",
  "import { Stack } from '@/components/layout/stack';",
  "import { Surface } from '@/components/ui/surface';",
  "import { Card } from '@/components/ui/card';",
  "import { Button } from '@/components/ui/button';",
  "import { Input } from '@/components/ui/input';",
  "import { Label } from '@/components/ui/label';",
  "import { Badge } from '@/components/ui/badge';",
  "import { FinancialMetric } from '@/components/finance/metrics/FinancialMetric';",
  "import { CurrencyDisplay } from '@/components/finance/display/currency-display';"
].join('\n');

// find import { TransactionRow }
const importIdx = lines.findIndex(l => l.includes("import { TransactionRow } from '@/components/finance/TransactionRow';"));
if (importIdx !== -1) {
  lines.splice(importIdx, 0, importsToAdd);
}

// 2. Replace Hero
const heroStart = lines.findIndex(l => l.includes('{/* Summary Hero — Premium Style */}'));
let heroEnd = -1;
if (heroStart !== -1) {
  for (let i = heroStart + 1; i < lines.length; i++) {
    if (lines[i].includes('</div>')) {
      // Find the closing div of the grid grid-cols-1 md:grid-cols-3
      // By manually counting divs... wait, that's brittle.
    }
  }
}

fs.writeFileSync(filePath, lines.join('\n'));
