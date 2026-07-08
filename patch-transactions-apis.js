const fs = require('fs');
const file = 'src/app/(dashboard)/transactions/TransactionsClient.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/variant="glass"/g, 'variant="flat"');
content = content.replace(/variant="outline"/g, 'variant="secondary"');
content = content.replace(/variant="card"/g, 'variant="raised"');
content = content.replace(/cols=\{\{ base: 1, md: 3 \}\}/g, 'columns={3} responsive');
content = content.replace(/size="xl"/g, 'size="hero"');

content = content.replace(/amountMinor=\{Math\.abs\(net\)\} currency=\{currency\} size="hero" showSign=\{false\} prefix=\{netPositive \? '\+' : '−'\} trend=\{netPositive \? 'positive' : 'negative'\}/g, 'amount={net / 100} currencyCode={currency} size="hero" signDisplay="always" colorize');
content = content.replace(/amountMinor=\{totalIncome\} currency=\{currency\} size="lg" trend="positive"/g, 'amount={totalIncome / 100} currencyCode={currency} size="lg" colorize');
content = content.replace(/amountMinor=\{moneyOut\} currency=\{currency\} size="lg" trend="negative"/g, 'amount={moneyOut / 100} currencyCode={currency} size="lg" colorize');

fs.writeFileSync(file, content);
console.log('Patched API issues.');
