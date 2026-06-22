const fs = require('fs');
let c1 = fs.readFileSync('src/tests/financial-logic.test.ts', 'utf8');
c1 = c1.replace(/id: 'loan-1', balanceMinor: 4200, userId: 'user-1', name: 'L', lender: 'B', type: 't', originalAmountMinor: 5000, annualRate: 0, monthlyPaymentMinor: 0, nextDue: new Date\(\), createdAt: new Date\(\), daysOverdue: 0 \}\]/g, "id: 'loan-1', balanceMinor: 4200, userId: 'user-1', name: 'L', lender: 'B', type: 't', amortization: 'REDUCING_BALANCE', originalAmountMinor: 5000, annualRate: 0, monthlyPaymentMinor: 0, nextDue: new Date(), createdAt: new Date(), daysOverdue: 0 }]");
fs.writeFileSync('src/tests/financial-logic.test.ts', c1);
console.log('done');
