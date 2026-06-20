import re

with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove backdrop-filter
css = re.sub(r'backdrop-filter:\s*blur\([^)]+\);', '', css)
css = re.sub(r'-webkit-backdrop-filter:\s*blur\([^)]+\);', '', css)

# Fix mobile-nav background
css = css.replace('background-color: color-mix(in srgb, var(--bg-card) 90%, transparent);', 'background-color: var(--bg-card);')

# Fix buttons
css = re.sub(r'\.btn-primary\s*\{[^}]+\}', '.btn-primary {\n  background: var(--primary);\n  color: white; border: none;\n  box-shadow: none;\n}', css)
css = re.sub(r'\.btn-primary:hover\s*\{[^}]+\}', '.btn-primary:hover {\n  background: var(--primary-dark);\n  transform: translateY(-1px);\n  box-shadow: var(--shadow-sm);\n}', css)
css = re.sub(r'\.btn-primary:active\s*\{[^}]+\}', '.btn-primary:active {\n  transform: translateY(0);\n  box-shadow: none;\n}', css)
css = re.sub(r'\[data-theme="dark"\] \.btn-primary\s*\{[^}]+\}', '[data-theme="dark"] .btn-primary {\n  background: var(--primary);\n  box-shadow: none;\n}', css)

css = re.sub(r'\.btn-outline\s*\{[^}]+\}', '.btn-outline {\n  background: transparent;\n  color: var(--text-secondary);\n  border: 1px solid var(--border);\n  box-shadow: none;\n}', css)
css = re.sub(r'\.btn-outline:hover\s*\{[^}]+\}', '.btn-outline:hover {\n  background: var(--bg-hover);\n  color: var(--text-primary); border-color: var(--text-muted);\n  box-shadow: none;\n}', css)
css = re.sub(r'\[data-theme="dark"\] \.btn-outline\s*\{[^}]+\}', '[data-theme="dark"] .btn-outline {\n  background: transparent;\n  color: var(--text-secondary); border-color: var(--border);\n  box-shadow: none;\n}', css)
css = re.sub(r'\[data-theme="dark"\] \.btn-outline:hover\s*\{[^}]+\}', '[data-theme="dark"] .btn-outline:hover {\n  background: var(--bg-hover); color: var(--text-primary);\n}', css)

# Fix segmented control
css = re.sub(r'\.segmented-control\s*\{[^}]+\}', '.segmented-control {\n  display: inline-flex;\n  background: var(--bg-hover);\n  border: 1px solid var(--border);\n  padding: 3px; border-radius: var(--radius-sm);\n  gap: 1px;\n}', css)
css = re.sub(r'\[data-theme="dark"\] \.segmented-control\s*\{[^}]+\}', '[data-theme="dark"] .segmented-control {\n  background: var(--bg-hover);\n  border-color: var(--border);\n}', css)

css = re.sub(r'\.segmented-btn\.active\s*\{[^}]+\}', '.segmented-btn.active {\n  background: var(--bg-card);\n  color: var(--primary);\n  box-shadow: none;\n  font-weight: 700;\n  border-radius: 4px;\n}', css)
css = re.sub(r'\[data-theme="dark"\] \.segmented-btn\.active\s*\{[^}]+\}', '[data-theme="dark"] .segmented-btn.active {\n  background: var(--bg-card);\n  color: var(--primary);\n  box-shadow: none;\n}', css)

# Fix glows
css = re.sub(r'/\* ── Glow variants for progress fills ───────────────────── \*/.*?(?=/\* ── Hero card refined glow ──────────────────────────────── \*/)', '/* ── Glow variants for progress fills ───────────────────── */\n/* Removed */\n\n', css, flags=re.DOTALL)
css = re.sub(r'/\* ── Hero card refined glow ──────────────────────────────── \*/.*?(?=/\* ── KPI card colored glow on hover ─────────────────────── \*/)', '/* ── Hero card refined glow ──────────────────────────────── */\n/* Removed */\n\n', css, flags=re.DOTALL)
css = re.sub(r'/\* ── KPI card colored glow on hover ─────────────────────── \*/.*?(?=/\* ── Animations ──────────────────────────────────────────── \*/)', '/* ── KPI card colored glow on hover ─────────────────────── */\n/* Removed */\n\n', css, flags=re.DOTALL)

# Remove shadow on sidebar active
css = re.sub(r'/\* ── Sidebar active link.*?──────────────── \*/.*?\[data-theme="dark"\] \.sidebar-link\.active\s*\{[^}]+\}', '', css, flags=re.DOTALL)

# Fix hero-card background and pseudo-element
css = re.sub(r'\.hero-card\s*\{[^}]+\}', '.hero-card {\n  background: var(--primary);\n  border-radius: var(--radius); padding: 1.375rem; border: none;\n  box-shadow: none;\n  position: relative; overflow: hidden;\n}', css)
css = re.sub(r'\.hero-card::before\s*\{[^}]+\}', '.hero-card::before {\n  display: none;\n}', css)
css = re.sub(r'\[data-theme="dark"\] \.hero-card\s*\{[^}]+\}', '[data-theme="dark"] .hero-card {\n  box-shadow: none;\n}', css)

# Fix gradient on kpi card after elements
css = re.sub(r'\.kpi-card\.k-[a-z]+::after\s*\{[^}]+\}', '', css)
css = re.sub(r'\.kpi-card::after\s*\{[^}]+\}', '', css)

with open('src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("Done fixing globals.css")
