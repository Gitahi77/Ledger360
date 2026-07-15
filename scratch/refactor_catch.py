import os
import glob
import re

actions_dir = r"c:\Users\GITAHI\.gemini\antigravity\scratch\ledger360\src\lib\actions"

for filepath in glob.glob(os.path.join(actions_dir, "*.ts")):
    if os.path.basename(filepath) == "_auth.ts":
        continue
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if AuthorizationError is imported, if not, insert it after imports
    if "AuthorizationError" not in content:
        import_stmt = "import { AuthorizationError } from '@/lib/authz';\n"
        if "import { z } from 'zod';" in content:
            content = content.replace("import { z } from 'zod';", "import { z } from 'zod';\n" + import_stmt)
        else:
            # Just put it near the top
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith("import"):
                    lines.insert(i, import_stmt)
                    break
            content = '\n'.join(lines)
            
    # Find all catch (error) blocks and insert the AuthorizationError check
    # Many variations: catch (error) {, catch (e) {, catch (err) {
    catch_pattern = re.compile(r'catch\s*\(\s*([a-zA-Z0-9_]+)(?:\s*:\s*[^)]+)?\s*\)\s*\{')
    
    def replacer(match):
        var_name = match.group(1)
        # Avoid double inserting
        return f"catch ({var_name}) {{\n    if ({var_name} instanceof AuthorizationError) return {{ success: false, code: 'FORBIDDEN', message: {var_name}.message }};"
        
    new_content = catch_pattern.sub(replacer, content)
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
