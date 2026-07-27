const fs = require('fs');

let content = fs.readFileSync('src/app/(dashboard)/settings/SettingsClient.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import { useRouter } from 'next/navigation';",
  "import { useRouter, useSearchParams } from 'next/navigation';\nimport { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';"
);

// 2. Update hooks and state
content = content.replace(
  "  const router       = useRouter();\n  const { update: updateSession } = useSession();\n  const [, startT]   = useTransition();\n\n  const [openSection, setOpenSection] = useState<Section | null>('profile');",
  `  const router       = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [, startT]   = useTransition();

  const currentTab = searchParams?.get('tab') || 'profile';

  function handleTabChange(value: string) {
    router.replace(\`?tab=\${value}\`, { scroll: false });
  }`
);

// 3. Replace the entire return statement
// We need to carefully replace the layout.
// The layout starts at: `return (\n    <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-6xl mx-auto">`
// We'll replace the top portion first.

const layoutStart = `return (
    <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-1 w-full md:w-64 shrink-0 md:sticky md:top-6">
        <button className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left \${['profile', 'appearance'].includes(openSection || '') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}\`} onClick={() => setOpenSection('profile')}>
          <User size={16} /> Profile
        </button>
        <button className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left \${['preferences', 'savings', 'notifications'].includes(openSection || '') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}\`} onClick={() => setOpenSection('preferences')}>
          <Globe size={16} /> Preferences
        </button>
        <button className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left \${['security'].includes(openSection || '') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}\`} onClick={() => setOpenSection('security')}>
          <ShieldCheck size={16} /> Account & Security
        </button>
        <button className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left \${['data', 'help'].includes(openSection || '') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}\`} onClick={() => setOpenSection('data')}>
          <Database size={16} /> Audit Logs & Data
        </button>
      </div>

      <div className="flex-1 w-full min-w-0 animate-in">
        {/* Profile & Appearance */}
        {(openSection === 'profile' || openSection === 'appearance') && (
          <>`;

const newLayoutStart = `return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 h-auto p-1.5 gap-1">
          <TabsTrigger value="profile" className="py-2 data-[state=active]:bg-background/80"><User size={16} className="mr-2"/> Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="py-2 data-[state=active]:bg-background/80"><Globe size={16} className="mr-2"/> Preferences</TabsTrigger>
          <TabsTrigger value="security" className="py-2 data-[state=active]:bg-background/80"><ShieldCheck size={16} className="mr-2"/> Security</TabsTrigger>
          <TabsTrigger value="data" className="py-2 data-[state=active]:bg-background/80"><Database size={16} className="mr-2"/> Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-500">`;

content = content.replace(layoutStart, newLayoutStart);

// Now fix the end of Profile/Appearance and start of Preferences
const profEndPrefStart = `          </>
        )}

        {/* Preferences, Savings, Notifications */}
        {(openSection === 'preferences' || openSection === 'savings' || openSection === 'notifications') && (
          <>`;
const newProfEndPrefStart = `        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 duration-500">`;
content = content.replace(profEndPrefStart, newProfEndPrefStart);

// End of Prefs and start of Security
const prefEndSecStart = `          </>
        )}

        {/* Security */}
        {openSection === 'security' && (`;
const newPrefEndSecStart = `        </TabsContent>

        <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-500">`;
content = content.replace(prefEndSecStart, newPrefEndSecStart);

// End of Security and start of Data/Help
const secEndDataStart = `          </Card>
        )}

        {/* Data & Help */}
        {(openSection === 'data' || openSection === 'help') && (
          <>`;
const newSecEndDataStart = `          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6 animate-in fade-in-50 duration-500">`;
content = content.replace(secEndDataStart, newSecEndDataStart);

// End of file cleanup
const endOfFile = `          </>
        )}
      </div>
    </div>
  );
}`;
const newEndOfFile = `        </TabsContent>
      </Tabs>
    </div>
  );
}`;
content = content.replace(endOfFile, newEndOfFile);

// Remove unused Section type
content = content.replace(`type Section = 'profile' | 'appearance' | 'preferences' | 'savings' | 'notifications' | 'security' | 'data' | 'help';`, "");

fs.writeFileSync('src/app/(dashboard)/settings/SettingsClient.tsx', content, 'utf8');
console.log("SettingsClient.tsx updated.");
