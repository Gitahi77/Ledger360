const fs = require('fs');
let c1 = fs.readFileSync('src/tests/financial-logic.test.ts', 'utf8');
let lines = c1.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('loanMock = { id: \'l1\'') && !lines[i].includes('amortization')) {
        lines[i] = lines[i].replace("type: 'student',", "type: 'student', amortization: 'REDUCING_BALANCE',");
    }
}
fs.writeFileSync('src/tests/financial-logic.test.ts', lines.join('\n'));
console.log('done');
