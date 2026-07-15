import os
import glob
import re

action_dir = r'c:\Users\GITAHI\.gemini\antigravity\scratch\ledger360\src\lib\actions'
files = glob.glob(os.path.join(action_dir, '*.ts'))

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'safeParse' not in content:
        return False
        
    # Add import if needed
    if 'safeValidate' not in content:
        content = content.replace("import { z } from 'zod';", "import { z } from 'zod';\nimport { safeValidate } from '@/lib/respond';")

    # Replace safeParse pattern
    # Match: const parsed = Schema.safeParse(raw);
    # Followed by: if (!parsed.success) return { error: ... };
    
    # Example:
    # const parsed = AddTransactionSchema.safeParse(raw);
    # if (!parsed.success) return { error: 'Invalid input' };
    
    # We have to be careful as variable names might differ (e.g. parsedId, parsedData).
    # Regex:
    pattern = re.compile(
        r"const\s+(\w+)\s*=\s*([a-zA-Z0-9_]+(?:\.partial\(\))?(?:\(\))?)\.safeParse\(([^)]+)\);\s*"
        r"if\s*\(!\1\.success\)\s*return\s*\{[^}]+\};",
        re.MULTILINE
    )
    
    def repl(m):
        var_name = m.group(1)
        schema_name = m.group(2)
        raw_name = m.group(3)
        return f"const {var_name} = safeValidate({schema_name}, {raw_name}, '{schema_name}');\n    if (!{var_name}.success) return {var_name}.error;"
        
    new_content = pattern.sub(repl, content)
    
    # Replace cases like:
    # if (!parsedId.success || !parsedData.success) return { error: 'Invalid input' };
    # This happens when two things are parsed sequentially.
    pattern2 = re.compile(
        r"const\s+(\w+)\s*=\s*([a-zA-Z0-9_]+(?:\.partial\(\))?(?:\(\))?)\.safeParse\(([^)]+)\);\s*"
        r"const\s+(\w+)\s*=\s*([a-zA-Z0-9_]+(?:\.partial\(\))?(?:\(\))?)\.safeParse\(([^)]+)\);\s*"
        r"if\s*\(!\1\.success\s*\|\|\s*!\4\.success\)\s*return\s*\{[^}]+\};",
        re.MULTILINE
    )
    
    def repl2(m):
        var1 = m.group(1)
        schema1 = m.group(2)
        raw1 = m.group(3)
        var2 = m.group(4)
        schema2 = m.group(5)
        raw2 = m.group(6)
        
        return (f"const {var1} = safeValidate({schema1}, {raw1}, '{schema1}');\n"
                f"    const {var2} = safeValidate({schema2}, {raw2}, '{schema2}');\n"
                f"    if (!{var1}.success) return {var1}.error;\n"
                f"    if (!{var2}.success) return {var2}.error;")
                
    new_content = pattern2.sub(repl2, new_content)
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

for f in files:
    if process_file(f):
        print('Updated', f)
