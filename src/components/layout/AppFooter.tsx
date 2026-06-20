/**
 * Copyright (c) 2024–present Eric Gitahi. All rights reserved.
 * Ledger360 — Personal Financial Operating System
 * Proprietary and Confidential. Unauthorized use prohibited.
 * https://github.com/Gitahi77/Ledger360
 */

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span className="app-footer-copy">
        © {new Date().getFullYear()} Eric Gitahi · Ledger360
      </span>
      <span className="app-footer-sep" aria-hidden="true">·</span>
      <span className="app-footer-rights">All rights reserved</span>
    </footer>
  );
}
