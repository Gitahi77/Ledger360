const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd) {
    console.log(`> ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
}

function writeMsg(name, content) {
    fs.writeFileSync(name, content);
}

const filePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'transactions', 'TransactionsClient.tsx');

// --- Branch 1: Layout was already patched locally, but we need to commit it.
run('git add "src/app/(dashboard)/transactions/TransactionsClient.tsx"');
writeMsg('msg-layout.txt', `refactor(transactions): migrate layout and hero to UI primitives\n\n- use Grid and Stack instead of manual divs\n- use Surface for summary cards\n- integrate FinancialMetric and CurrencyDisplay`);
run('git commit -F msg-layout.txt');
run('git checkout release/v0.4-wave3');
run('git merge feature/transactions-layout');

// --- Branch 2: Filters
run('git checkout -b feature/transactions-filters');
let content = fs.readFileSync(filePath, 'utf-8');

const oldToolbar = `{/* Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex p-1 bg-secondary/60 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'income', label: 'Income' },
              { id: 'expense', label: 'Expense' },
              { id: 'transfer', label: 'Transfers' }
            ].map(t => {
              const active = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleFilter(t.id)}
                  className={\`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 \${
                    active 
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }\`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-shadow shadow-sm placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTxToEdit(null)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          
          <button
            onClick={() => alert('Exporting to CSV...')}
            className="flex items-center justify-center gap-2 bg-background hover:bg-secondary text-foreground border border-border px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <FileDown className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>`;

const newToolbar = `{/* Toolbar */}
      <Stack gap="md" className="xl:flex-row xl:items-center justify-between">
        <Stack gap="sm" className="flex-row items-center flex-wrap flex-1">
          <Surface variant="glass" className="flex p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'income', label: 'Income' },
              { id: 'expense', label: 'Expense' },
              { id: 'transfer', label: 'Transfers' }
            ].map(t => {
              const active = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleFilter(t.id)}
                  className={\`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 \${
                    active 
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }\`}
                >
                  {t.label}
                </button>
              );
            })}
          </Surface>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </Stack>
        
        <Stack gap="sm" className="flex-row items-center">
          <Button onClick={() => setTxToEdit(null)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
          
          <Button variant="outline" onClick={() => alert('Exporting to CSV...')} size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </Stack>
      </Stack>`;

content = content.replace(oldToolbar, newToolbar);
fs.writeFileSync(filePath, content);

run('git add "src/app/(dashboard)/transactions/TransactionsClient.tsx"');
writeMsg('msg-filters.txt', `refactor(transactions): use primitives for filters and toolbar\n\n- use Surface for filter tabs container\n- use Button for add/export actions\n- use Input for search`);
run('git commit -F msg-filters.txt');
run('git checkout release/v0.4-wave3');
run('git merge feature/transactions-filters');

// --- Branch 3: Modals
run('git checkout -b feature/transactions-modals');
content = fs.readFileSync(filePath, 'utf-8');

// Replace standard labels with Label primitives (Regex to catch them all)
content = content.replace(/<label className="block text-sm font-medium text-muted-foreground mb-1">/g, '<Label>');
content = content.replace(/<\/label>/g, '</Label>');

// Replace input text/number with Input primitives (Basic regex for the ones in the form)
content = content.replace(/<input\s+type="number"\s+step="0.01"\s+required\s+value=\{amount\}\s+onChange=\{e => setAmount\(e.target.value\)\}\s+className="[^"]+"\s+\/>/g, 
  `<Input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full" />`);
content = content.replace(/<input\s+type="text"\s+required\s+value=\{name\}\s+onChange=\{e => setName\(e.target.value\)\}\s+placeholder="[^"]+"\s+className="[^"]+"\s+\/>/g, 
  `<Input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Grocery Shopping" className="w-full" />`);
content = content.replace(/<input\s+type="date"\s+required\s+value=\{date\}\s+onChange=\{e => setDate\(e.target.value\)\}\s+className="[^"]+"\s+\/>/g, 
  `<Input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full" />`);
content = content.replace(/<input\s+type="text"\s+value=\{note\}\s+onChange=\{e => setNote\(e.target.value\)\}\s+placeholder="[^"]+"\s+className="[^"]+"\s+\/>/g, 
  `<Input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..." className="w-full" />`);

// Replace Modal Footer
const oldFooter = `{/* Footer Actions */}
        <div className="p-5 border-t border-border/50 bg-secondary/30 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={() => onClose()}
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-background border border-border rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="tx-form"
            disabled={pending}
            className="flex items-center justify-center min-w-[120px] px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm disabled:opacity-70"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : tx ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>`;

const newFooter = `{/* Footer Actions */}
        <div className="p-5 border-t border-border/50 bg-secondary/30 flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button type="submit" form="tx-form" disabled={pending} className="min-w-[120px]">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : tx ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>`;

content = content.replace(oldFooter, newFooter);

// Replace Error
const oldError = `<div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>`;
const newError = `<Surface variant="destructive" className="mb-6 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </Surface>`;
content = content.replace(oldError, newError);

fs.writeFileSync(filePath, content);

run('git add "src/app/(dashboard)/transactions/TransactionsClient.tsx"');
writeMsg('msg-modals.txt', `refactor(transactions): use primitives for modal inputs and actions\n\n- use Label and Input for form fields\n- use Button for submission actions\n- use Surface for validation errors`);
run('git commit -F msg-modals.txt');
run('git checkout release/v0.4-wave3');
run('git merge feature/transactions-modals');

// --- Verification 
console.log('Running verify...');
run('npm.cmd run lint');
run('npm.cmd run build');
run('npx.cmd tsc --noEmit');

// --- Push and Squash
run('git push -u origin release/v0.4-wave3');

run('git checkout main');
run('git merge --squash release/v0.4-wave3');
writeMsg('msg-squash-wave3.txt', `Release: Phase 4 Wave 3 — Transactions Redesign\n\nThis release refactors the Transactions page to consume the Wave 1 primitives.\n\nHighlights\n\n• migrate layout and hero to Grid and Stack\n• implement FinancialMetric and CurrencyDisplay\n• update toolbars with Button and Input\n• modernize modal form elements`);
run('git commit -F msg-squash-wave3.txt');

run('git tag v0.4.0-wave3');
run('git push origin main');
run('git push origin v0.4.0-wave3');

console.log('Successfully completed Wave 3.');
