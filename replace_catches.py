import os
import re

files_to_update = [
    "src/lib/actions/transactions.ts",
    "src/lib/actions/accounts.ts",
    "src/app/reset-password/ResetPasswordClient.tsx",
    "src/app/forgot-password/ForgotPasswordClient.tsx",
    "src/app/api/auth/signup/route.ts",
    "src/app/(dashboard)/transactions/TransactionsClient.tsx",
    "src/app/(dashboard)/settings/SettingsClient.tsx",
    "src/app/(dashboard)/settings/SavingsAutomationSection.tsx",
    "src/app/(dashboard)/loans/LoansClient.tsx",
    "src/app/(dashboard)/categories/CategoriesClient.tsx",
    "src/app/(dashboard)/goals/GoalsClient.tsx",
    "src/app/(dashboard)/accounts/AccountsClient.tsx",
    "src/app/(dashboard)/budgets/BudgetsClient.tsx",
    "src/app/(dashboard)/net-worth/NetWorthClient.tsx"
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original_content = content
    
    # 1. Catch block type replace
    content = re.sub(r'catch\s*\(\s*(err|e|error)\s*:\s*any\s*\)(?:\s*//\s*eslint-disable-line.*)?\s*\{', r'catch (\1: unknown) {', content)
    
    # 2. Error message extract replace
    content = re.sub(r'(setErrMsg|setError)\(\s*(err|e|error)\.message(?:\s*\?\?\s*[^)]+)?\s*\)', r'\1(getErrorMessage(\2))', content)
    content = re.sub(r'(setErrMsg|setError)\(\s*(err|e|error)\s*\)', r'\1(getErrorMessage(\2))', content)
    
    # 3. API route replace
    content = re.sub(r'NextResponse\.json\(\{\s*error\s*:\s*(err|e|error)\.message\s*\}', r'NextResponse.json({ error: getErrorMessage(\1) }', content)
    
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
