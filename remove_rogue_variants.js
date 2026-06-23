const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.css')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  const map = {
    '--primary-light': '--color-brand-light',
    '--primary-dark': '--color-brand-dark',
    '--primary-grad': '--color-brand-grad',
    '--success-light': '--color-income-light',
    '--success-text': '--color-income-text',
    '--success-grad': '--color-income-grad',
    '--danger-light': '--color-expense-light',
    '--danger-text': '--color-expense-text',
    '--danger-grad': '--color-expense-grad',
    '--bg-card-hover': '--surface-card-hover'
  };

  for (const [key, value] of Object.entries(map)) {
    content = content.split(key).join(value);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('./src', processFile);
