import ast

with open('src/app/settings/SettingsClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_toggle = """function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        width: 64, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0.75rem',
      }}
    >
      <div style={{
        width: 42, height: 24, borderRadius: 999,
        background: checked ? 'var(--color-brand)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
      </div>
    </button>
  );
}"""

new_toggle = """function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        minWidth: 64, minHeight: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        background: 'transparent', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0.5rem',
        margin: '-0.5rem'
      }}
    >
      <div style={{
        width: 42, height: 24, borderRadius: 999,
        background: checked ? 'var(--color-brand)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
      </div>
    </button>
  );
}"""

content = content.replace(old_toggle, new_toggle)

start_str = "  return (\\n    <div style={{ maxWidth:680, margin:'0 auto' }}>"
start_idx = content.find("  return (\\n    <div style={{ maxWidth:680, margin:'0 auto' }}>")
if start_idx == -1:
    # try just the return
    start_str2 = "  return (\\n    <div style={{ maxWidth:680,"
    start_idx = content.find("  return (\\n    <div style={{ maxWidth:680")

# If we still can't find it, let's just use string split!
if start_idx == -1:
    parts = content.split("  return (\\n    <div style={{ maxWidth:680, margin:'0 auto' }}>")
    if len(parts) == 2:
        start_idx = len(parts[0])

with open('rewrite_settings_perfect.py', 'r', encoding='utf-8') as f2:
    py_content = f2.read()
    tree = ast.parse(py_content)
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets)==1 and getattr(node.targets[0], 'id', '') == 'new_body':
            new_body = node.value.value
            break

# the actual split
split_str = "  return (\\n    <div style={{ maxWidth:680, margin:'0 auto' }}>"
parts = content.split(split_str)
if len(parts) == 2:
    final_content = parts[0] + new_body + "\\n"
    with open('src/app/settings/SettingsClient.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
else:
    print("COULD NOT FIND SPLIT STR!")

