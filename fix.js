const fs = require('fs');

let f1 = fs.readFileSync('src/tests/financial-logic.test.ts', 'utf8');
f1 = f1.replace(/'bank'/g, "'CHECKING'");
f1 = f1.replace(/'credit_card'/g, "'CREDIT_CARD'");
f1 = f1.replace(/type: 'personal',/g, "type: 'personal', amortization: 'REDUCING_BALANCE',");
fs.writeFileSync('src/tests/financial-logic.test.ts', f1);

let f2 = fs.readFileSync('src/tests/savings-plan.test.ts', 'utf8');
f2 = f2.replace(/'mobile_money'/g, "'MPESA'");
fs.writeFileSync('src/tests/savings-plan.test.ts', f2);

console.log('done');
