import os
import re

# Fix accounts mapper
fpath = "src/lib/mappers/accounts.ts"
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

# Add import if missing
if "AccountType" not in content:
    content = "import { AccountType } from '@prisma/client';\n" + content

content = content.replace("  type: string;", "  type: AccountType;")

with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)
