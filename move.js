const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');
const destDir = path.join(srcDir, '(dashboard)');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir);
}

const toMove = [
  'page.tsx',
  'transactions',
  'budgets',
  'goals',
  'loans',
  'reports',
  'net-worth',
  'settings'
];

for (const item of toMove) {
  const srcPath = path.join(srcDir, item);
  const destPath = path.join(destDir, item);
  if (fs.existsSync(srcPath)) {
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${item} to (dashboard)`);
  }
}
