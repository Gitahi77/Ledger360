const fs = require('fs');
const path = require('path');

const dashDir = path.join(__dirname, 'src', 'app', '(dashboard)');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('page.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const pages = walk(dashDir);

for (const page of pages) {
  let content = fs.readFileSync(page, 'utf8');
  
  // Remove import
  content = content.replace(/import\s+\{\s*AppLayout\s*\}\s+from\s+['"]@\/components\/layout\/AppLayout['"];?\n?/g, '');
  
  // Replace <AppLayout> with <>
  content = content.replace(/<AppLayout>/g, '<>');
  
  // Replace </AppLayout> with </>
  content = content.replace(/<\/AppLayout>/g, '</>');

  fs.writeFileSync(page, content, 'utf8');
  console.log(`Cleaned ${page}`);
}
