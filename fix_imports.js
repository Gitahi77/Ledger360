const fs = require('fs');
const path = require('path');
const dir = 'src/lib/queries';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const f of files) {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes("from './_auth'")) {
    content = content.replace(/from '\.\/_auth'/g, "from '../actions/_auth'");
    fs.writeFileSync(p, content);
    console.log('Fixed', f);
  }
}
