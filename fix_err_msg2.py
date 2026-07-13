import os
import re

files_to_update = [
    "src/app/(dashboard)/settings/SavingsAutomationSection.tsx"
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original_content = content
    
    def replacer(match):
        var_name = match.group(1)
        return f"getErrorMessage({var_name})"

    content = re.sub(r'\b(err|e|error)\.message\b', replacer, content)

    if content != original_content and "getErrorMessage(" in content and "getErrorMessage" not in original_content:
        import_stmt = "import { getErrorMessage } from '@/lib/format';\n"
        imports_end = content.rfind("import ")
        if imports_end != -1:
            end_of_line = content.find("\n", imports_end)
            content = content[:end_of_line+1] + import_stmt + content[end_of_line+1:]
        else:
            content = import_stmt + content
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
