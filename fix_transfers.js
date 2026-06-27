const fs = require('fs');
const p = 'src/lib/actions/transfers.ts';
let c = fs.readFileSync(p, 'utf8');
const search = `    const effectiveFromAccountId = data.fromAccountId ?? oldTransfer.fromAccountId;
    const effectiveToAccountId = data.toAccountId !== undefined ? data.toAccountId : oldTransfer.toAccountId;`;
const replace = `    const effectiveFromAccountId = data.fromAccountId ?? oldTransfer.fromAccountId;
    const effectiveToAccountId = data.toAccountId !== undefined ? data.toAccountId : oldTransfer.toAccountId;
    const effectiveLoanId = data.loanId !== undefined ? data.loanId : oldTransfer.loanId;
    if (effectiveFromAccountId && effectiveFromAccountId === effectiveToAccountId) {
      return { error: 'Source and destination must be different accounts.' };
    }
    if (effectiveToAccountId && effectiveLoanId) {
      return { error: 'A transfer cannot target both an account and a loan.' };
    }`;
c = c.replace(search, replace);
fs.writeFileSync(p, c);
console.log('Fixed transfers schema');
