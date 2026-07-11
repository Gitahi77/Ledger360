const fs = require('fs');
const content = fs.readFileSync('lint-baseline.txt', 'utf8');
const lines = content.split('\n');

const rules = {};

for (const line of lines) {
  // Matches "Warning: ... @rule/name" or "Error: ... @rule/name"
  const match = line.match(/  @?([\w-]+\/[\w-]+|[\w-]+)$/);
  if (match) {
    const rule = match[1];
    rules[rule] = (rules[rule] || 0) + 1;
  }
}

console.log('Lint Inventory:');
for (const [rule, count] of Object.entries(rules)) {
  console.log(`${rule}: ${count}`);
}
