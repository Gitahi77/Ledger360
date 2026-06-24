import os, re

files = [
    'src/app/budgets/BudgetsClient.tsx',
    'src/app/categories/CategoriesClient.tsx',
    'src/app/goals/GoalsClient.tsx',
    'src/app/loans/LoansClient.tsx',
    'src/app/net-worth/NetWorthClient.tsx',
    'src/app/transactions/TransactionsClient.tsx',
    'src/app/reports/ReportsClient.tsx',
    'src/components/DashboardCharts.tsx',
    'src/components/Sidebar.tsx'
]

pattern = re.compile(r'<div\s+style=\{\{\s*position:\s*[\'\"\`]fixed[\'\"\`],\s*inset:\s*0,(?:\s*zIndex:\s*1000,)?\s*background:\s*[\'\"\`]rgba\(0,0,0,0\.\d+\)[\'\"\`],\s*backdropFilter:\s*[\'\"\`]blur\(\dp?x?\)[\'\"\`].*?\}\}')

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace modal overlay inline style
        new_content = pattern.sub('<div className="modal-overlay"', content)
        
        # Replace --text-secondary with --color-text-secondary
        new_content = new_content.replace('var(--text-secondary)', 'var(--color-text-secondary)')
        
        if content != new_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Updated {f}')
