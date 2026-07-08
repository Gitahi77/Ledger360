const fs = require('fs');
const file = 'src/app/(dashboard)/transactions/TransactionsClient.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<label /g, '<Label ').replace(/<\/label>/g, '</Label>');
fs.writeFileSync(file, content);
