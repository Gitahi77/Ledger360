css_to_add = """
/* Settings UX Redesign */
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}
@media (min-width: 768px) {
  .settings-container {
    flex-direction: row;
    align-items: flex-start;
  }
}
.settings-sidebar {
  width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  gap: 0.5rem;
}
@media (min-width: 768px) {
  .settings-sidebar {
    width: 240px;
    flex-direction: column;
  }
}
.settings-sidebar-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  white-space: nowrap;
}
.settings-sidebar-btn:hover {
  background: var(--bg-hover);
  color: var(--color-text-primary);
}
.settings-sidebar-btn.active {
  background: var(--color-brand-light);
  color: var(--color-brand);
}
.settings-content {
  flex: 1;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.settings-card {
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}
.settings-card-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}
.settings-card-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}
"""

with open('src/app/globals.css', 'a', encoding='utf-8') as f:
    f.write(css_to_add)
