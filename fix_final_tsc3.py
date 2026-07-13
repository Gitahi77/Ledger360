import os

# 1. SavingsAutomationSection
fpath = "src/app/(dashboard)/settings/SavingsAutomationSection.tsx"
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()
if "getErrorMessage" not in content:
    content = "import { getErrorMessage } from '@/lib/format';\n" + content
with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)

# 2. SettingsClient
fpath = "src/app/(dashboard)/settings/SettingsClient.tsx"
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()
if "getErrorMessage" not in content:
    content = "import { getErrorMessage } from '@/lib/format';\n" + content
with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)

# 3. BalanceService
fpath = "src/lib/domain/services/BalanceService.ts"
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()
if "AccountType" not in content:
    content = "import { AccountType } from '@prisma/client';\n" + content
content = content.replace("  type: string;", "  type: AccountType;")
with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)

