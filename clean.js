const fs = require('fs');
const path = require('path');

const dir = 'src/lib/actions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== '_auth.ts');

let processed = 0;
let modifiedFunctions = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove file-level 'use server'
  content = content.replace(/^['"]use server['"];?\s*/gm, '');

  // Find all exported async functions
  const regex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g;
  
  content = content.replace(regex, (match, funcName) => {
    // If it starts with 'get', it's a data fetcher, don't make it a server action.
    if (funcName.startsWith('get')) {
      return match;
    }
    
    modifiedFunctions.push(funcName);
    // Otherwise it's a mutation, so inject 'use server'; inside
    return match + '\n  \'use server\';';
  });

  fs.writeFileSync(filePath, content);
  processed++;
}

console.log('Processed ' + processed + ' files.');
console.log('Added use server to:', modifiedFunctions.join(', '));
