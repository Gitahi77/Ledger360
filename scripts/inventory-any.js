const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));

const anyByFile = {};

let total = 0;

for (const file of data) {
  let anyCount = 0;
  for (const msg of file.messages) {
    if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
      anyCount++;
    }
  }
  if (anyCount > 0) {
    const relPath = file.filePath.split('ledger360\\')[1] || file.filePath.split('ledger360/')[1] || file.filePath;
    anyByFile[relPath.replace(/\\/g, '/')] = anyCount;
    total += anyCount;
  }
}

const categories = {
  'Phase 2.2A (Tests)': { regex: /^src\/tests\//, count: 0, files: [] },
  'Phase 2.2B (API Layer)': { regex: /^src\/lib\/(api\/|api\.ts|respond\.ts)/, count: 0, files: [] },
  'Phase 2.2C (Authentication)': { regex: /^src\/lib\/auth\.ts/, count: 0, files: [] },
  'Phase 2.2D (Server Actions)': { regex: /^src\/lib\/actions\//, count: 0, files: [] },
  'Phase 2.2E (Domain Layer)': { regex: /^src\/lib\/(queries|repositories|intelligence|behavioral|domain)\//, count: 0, files: [] },
  'UI Layer (Pages/Components)': { regex: /^src\/(app|components)\//, count: 0, files: [] },
  'Other Helpers': { regex: /.*/, count: 0, files: [] }
};

for (const [filePath, count] of Object.entries(anyByFile)) {
  for (const [catName, cat] of Object.entries(categories)) {
    if (cat.regex.test(filePath)) {
      cat.count += count;
      cat.files.push(`${filePath} (${count})`);
      break;
    }
  }
}

console.log('Total any count:', total);
for (const [catName, cat] of Object.entries(categories)) {
  if (cat.count > 0) {
    console.log(`\n### ${catName}`);
    console.log(`Count: ${cat.count}`);
    for (const f of cat.files) {
      console.log(`  - ${f}`);
    }
  }
}
