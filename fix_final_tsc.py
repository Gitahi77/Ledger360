import os
import re

# 1. Fix PieTip
fpath = "src/app/(dashboard)/reports/ReportsClient.tsx"
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("function PieTip(props: unknown) {", "function PieTip(props: { active?: boolean; payload?: unknown; label?: string; currency?: string; total?: number }) {")

with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Fix catch blocks error.message -> getErrorMessage(error)
files_to_fix = [
    "src/app/(dashboard)/settings/SettingsClient.tsx",
    "src/app/(dashboard)/settings/SavingsAutomationSection.tsx"
]

for file_path in files_to_fix:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace err?.message ?? '...' with getErrorMessage(err)
    content = re.sub(r'err\?\.message\s*\?\?\s*[\'"`][^\'"`]*[\'"`]', r'getErrorMessage(err)', content)
    content = re.sub(r'e\?\.message\s*\?\?\s*[\'"`][^\'"`]*[\'"`]', r'getErrorMessage(e)', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

# 3. Fix accounts/page.tsx AccountType
# Let's inspect accounts/page.tsx first to see why it fails.
