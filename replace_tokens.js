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

  if (filePath.endsWith('globals.css')) {
    // Add new canonical tokens to :root
    if (!content.includes('--color-brand: #1D9E75')) {
      content = content.replace(/:root\s*\{/, ":root {\n  --color-brand: #1D9E75;\n");
    }
    // --color-mpesa might already exist but just in case
    if (!content.includes('--color-mpesa: #1E8449')) {
      content = content.replace(/:root\s*\{/, ":root {\n  --color-mpesa: #1E8449;\n");
    }
    
    // Add the dashboard hero block
    if (!content.includes('.dashboard-hero')) {
      content += `

/* Hero sections: always render on a dark background.
   Override text tokens locally so components need no changes. */
.dashboard-hero {
  --color-text-primary:   #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.75);
  --color-text-tertiary:  rgba(255, 255, 255, 0.5);
  --color-border-tertiary: rgba(255, 255, 255, 0.12);
}
`;
    }
  }

  // Exact matches using negative lookahead
  content = content.replace(/--success(?![-\w])/g, '--color-income');
  content = content.replace(/--danger(?![-\w])/g, '--color-expense');
  content = content.replace(/--bg-card(?![-\w])/g, '--surface-card');
  content = content.replace(/--text-muted(?![-\w])/g, '--color-text-secondary');
  content = content.replace(/--text-primary(?![-\w])/g, '--color-text-primary');

  // Handle --primary contextually
  // 1. color: 'var(--primary)' for text like 'Suggested Transfer' in SmartUpload
  content = content.replace(/color:\s*r\.isTransfer\s*\?\s*'var\(--primary\)'/g, "color: r.isTransfer ? 'var(--color-text-primary)'");
  content = content.replace(/color:\s*'var\(--primary\)'(.*?)Suggested Transfer/g, "color: 'var(--color-text-primary)'$1Suggested Transfer");
  
  // Replace the remaining --primary with --color-brand
  content = content.replace(/--primary(?![-\w])/g, '--color-brand');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('./src', processFile);
