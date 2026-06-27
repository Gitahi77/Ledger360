const fs = require('fs');
const p = 'prisma/schema.prisma';
let c = fs.readFileSync(p, 'utf8');

c = c.replace('  autoSaveTransfer Transfer? @relation("AutoSaveRelation")', '');

const lines = c.split('\n');
let inTransaction = false;
let modified = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('model Transaction {')) {
    inTransaction = true;
  }
  if (inTransaction && lines[i].includes('createdAt       DateTime @default(now())')) {
    lines.splice(i + 1, 0, '  autoSaveTransfer Transfer? @relation("AutoSaveRelation")');
    modified = true;
    break;
  }
}

fs.writeFileSync(p, lines.join('\n'));
console.log('Fixed schema correctly');
