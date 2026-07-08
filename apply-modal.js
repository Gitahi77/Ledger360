const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'transactions', 'TransactionsClient.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

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
console.log('Successfully applied modal refactor');
