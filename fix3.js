const fs = require('fs');
let c1 = fs.readFileSync('src/tests/financial-logic.test.ts', 'utf8');
c1 = c1.replace(/daysOverdue: 0 \}/g, "daysOverdue: 0, amortization: 'REDUCING_BALANCE' }");
fs.writeFileSync('src/tests/financial-logic.test.ts', c1);
console.log('done');
