const fs = require('fs');
const p = 'prisma/schema.prisma';
let c = fs.readFileSync(p, 'utf8');

const searchTransfer = `  sourceTransactionId String? @unique          // WO-15: idempotency — links auto-save to the income that triggered it`;
const replaceTransfer = `  sourceTransactionId String? @unique          // WO-15: idempotency — links auto-save to the income that triggered it
  sourceTransaction   Transaction? @relation("AutoSaveRelation", fields: [sourceTransactionId], references: [id], onDelete: Cascade)`;

const searchTransaction = `  createdAt       DateTime @default(now())`;
const replaceTransaction = `  createdAt       DateTime @default(now())
  autoSaveTransfer Transfer? @relation("AutoSaveRelation")`;

c = c.replace(searchTransfer, replaceTransfer);
if (c.includes('model Transaction {')) {
  // Replace the first match of createdAt (which is in Transaction if we match the model boundary, but to be safe let's use regex)
  c = c.replace(/model Transaction \{[\s\S]*?createdAt       DateTime @default\(now\(\)\)/, match => match + '\n  autoSaveTransfer Transfer? @relation("AutoSaveRelation")');
}

fs.writeFileSync(p, c);
console.log('Fixed schema.prisma');
