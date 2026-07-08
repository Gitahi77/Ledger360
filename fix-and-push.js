const fs = require('fs');
const { execSync } = require('child_process');

try {
  execSync('git restore "src/app/(dashboard)/transactions/TransactionsClient.tsx"');
  console.log('Restored TransactionsClient.tsx');
} catch (e) {
  console.log('Failed to restore, might be already clean');
}

const file = 'src/app/(dashboard)/transactions/TransactionsClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix label tags
content = content.replace(/<label /g, '<Label ').replace(/<\/label>/g, '</Label>');

// Fix the UI primitive API hallucinations:
content = content.replace(/variant="glass"/g, 'variant="flat"');
content = content.replace(/variant="outline"/g, 'variant="secondary"');
content = content.replace(/variant="card"/g, 'variant="raised"');
content = content.replace(/cols=\{\{ base: 1, md: 3 \}\}/g, 'columns={3} responsive');
content = content.replace(/size="xl"/g, 'size="hero"');

content = content.replace(/amountMinor=\{Math\.abs\(net\)\} currency=\{currency\} size="hero" showSign=\{false\} prefix=\{netPositive \? '\+' : '−'\} trend=\{netPositive \? 'positive' : 'negative'\}/g, 'value={{ amountMinor: Math.abs(net), currencyCode: currency }} size="hero" signDisplay="always" colorize');
content = content.replace(/amountMinor=\{totalIncome\} currency=\{currency\} size="lg" trend="positive"/g, 'value={{ amountMinor: totalIncome, currencyCode: currency }} size="lg" colorize');
content = content.replace(/amountMinor=\{moneyOut\} currency=\{currency\} size="lg" trend="negative"/g, 'value={{ amountMinor: moneyOut, currencyCode: currency }} size="lg" colorize');

fs.writeFileSync(file, content);
console.log('Fixed file.');

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  execSync('npm run test', { stdio: 'inherit' });
  
  execSync('git add "src/app/(dashboard)/transactions/TransactionsClient.tsx"', { stdio: 'inherit' });
  execSync('git commit -m "fix(transactions): correct UI primitive API usage and label tags"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Successfully pushed fixes!');
} catch (err) {
  console.error('Failed to compile or push:', err);
  process.exit(1);
}
