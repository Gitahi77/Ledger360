import os
import re

files_to_update = [
    "src/lib/actions/transactions.ts",
    "src/lib/actions/accounts.ts",
    "src/app/reset-password/ResetPasswordClient.tsx",
    "src/app/forgot-password/ForgotPasswordClient.tsx",
    "src/app/(dashboard)/transactions/TransactionsClient.tsx",
    "src/app/(dashboard)/settings/SettingsClient.tsx",
    "src/app/(dashboard)/categories/CategoriesClient.tsx",
    "src/app/(dashboard)/accounts/AccountsClient.tsx"
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original_content = content
    
    # Replace error.message || '...' -> getErrorMessage(error) || '...'
    # Use function replacer to handle variable names
    def replacer(match):
        var_name = match.group(1)
        return f"getErrorMessage({var_name})"

    # Handle `err.message`, `e.message`, `error.message`
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
