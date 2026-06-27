const fs = require('fs');
const path = require('path');

function processDir(dirPath, isQueries) {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts') && f !== '_auth.ts');
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove all existing 'use server' directives
    content = content.replace(/^['"]use server['"];?\s*/gm, '');

    // The regex to match exported async functions
    const funcRegex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]*?^\})/gm;

    content = content.replace(funcRegex, (match, funcName, args, body) => {
      const isQuery = funcName.startsWith('get');
      
      if (isQueries) {
        // In queries, we only keep 'get' functions
        return isQuery ? match : '';
      } else {
        // In actions, we only keep non-'get' functions
        return !isQuery ? match : '';
      }
    });

    if (!isQueries) {
      // For actions, add 'use server' at the very top
      content = "'use server';\n\n" + content;
    }

    fs.writeFileSync(fullPath, content);
  }
}

processDir(path.join(__dirname, 'src', 'lib', 'queries'), true);
processDir(path.join(__dirname, 'src', 'lib', 'actions'), false);

console.log('Refactoring complete.');
