const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}
const files = walk('src');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('actions/loans') && content.includes('getLoansForUser')) {
    content = content.replace(/actions\/loans/g, 'queries/loans');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
