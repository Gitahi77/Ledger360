<div align="center">

<img src="public/favicon.ico" width="48" alt="Ledger360 Logo" />

# Ledger360

**Personal Financial Operating System**

*Institutional-grade financial intelligence, built for real people.*

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](./LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?logo=nextdotjs)](https://nextjs.org)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)

</div>

---

## What Is Ledger360?

Ledger360 is a **personal financial command center** — not a spending tracker, not a generic dashboard. It bridges the gap between the operational discipline of institutional finance tools and the emotional clarity that personal finance users need.

Think Mercury × YNAB × Notion — built for individuals who take their financial life seriously.

### Core Capabilities

| Module | Description |
|--------|-------------|
| **Dashboard** | Net worth snapshot, cashflow hero, AI-powered insights |
| **Transactions** | Full ledger with smart categorization and CSV/Excel import |
| **Budgets** | Real-time budget tracking with visual health indicators |
| **Goals** | Milestone-based savings goal tracking |
| **Loans & Debt** | Multi-loan management with amortization forecasting |
| **Net Worth** | Asset + liability tracker with trend analysis |
| **Reports** | Period-based financial reporting with export |
| **AI Intelligence** | Anomaly detection, recurring bill prediction, cashflow forecasting |

---

## Architecture

- **Framework:** Next.js 16 (App Router, Server Actions, React 19)
- **Database:** PostgreSQL via Neon + Prisma ORM
- **Auth:** NextAuth.js (credential-based)
- **Styling:** Institutional Vanilla CSS Design System (custom HSL token architecture)
- **AI:** Rule-based intelligence engine backed by Google Gemini. PII (phone numbers, account numbers) is securely redacted before external processing.
- **Deployment:** Vercel (Edge Runtime)

---

## Design Philosophy

Ledger360 is built on a strict **7-law interaction doctrine**:

1. Financial values never visually jump *(mandatory tabular alignment)*
2. Critical balances render before analytics *(data-priority architecture)*
3. All financial actions provide tactile feedback within 100ms *(haptic governance)*
4. No loading state may cause layout shift *(absolute skeleton stability)*
5. Transaction states must be visually distinct AND emotionally readable
6. Motion must communicate continuity and calm *(no bouncing animations)*
7. Every density mode preserves ledger readability and whitespace rhythm

## Roadmap

### Phase 9A — Design Foundation
*Goal: Establish the fundamental design tokens and systems to ensure visual consistency across all future screens.*
- **Responsive design tokens**: Fluid typography scales, breakpoint-aware spacing systems, standardized container widths, and responsive grid layouts.
- **Core Primitives**: Radius, Shadows, Motion tokens, Color system, and Chart design language.
- **UI Element standards**: Touch targets (min 44x44px), card behavior (stacking/expanding), responsive tables, and breakpoint-specific navigation rules.

### Phase 9B — Premium Product Experience
*Goal: Transform the UI from a "developer dashboard" into an information-rich, story-driven, Monarch-tier experience.*
- **Responsive Experience Review**: Every screen must be explicitly redesigned for Mobile (thumb-friendly, bottom sheets, cards) rather than merely scaling down the Desktop layout.
- **Explicit Acceptance Criteria**: Every feature must explicitly define its Desktop, Tablet, and Mobile layouts before implementation.
- **Dashboard redesign**: Information hierarchy prioritizing storytelling ("Cash Available", "Budget Health").
- **Information hierarchy**: Clearer primary actions (e.g. "Quick Add", "Insights") before tabular data.
- **Better financial insights**: Contextual text insights instead of raw numbers.
- **Better visualizations**: Radial budget rings, cash-flow Sankeys, spending heatmaps, investment allocation donuts.
- **Better empty & loading states**: Skeletons, optimistic UI, animated placeholders, and actionable empty states.
- **Better micro-interactions**: Hover effects, selection states, success/delete animations, and tactile button press feedback.
- **Better forms**: Progressive disclosure, smart defaults, keyboard shortcuts, and contextual validation.
- **UX writing**: Warmer, clearer copywriting (e.g., "Cash Available" instead of "Net Balance").

### Phase 9C — Visual Perfection & UX Audit
*Goal: Walk through every screen to ensure absolute pixel-perfect consistency.*
- Audit padding, spacing, typography, icon alignment, card alignment, shadows, semantic colors, and border radii.
- Ensure all loading, empty, and animation states belong to the same cohesive product.

### Phase 10 — Production Readiness & Launch
*Goal: Ensure the application is fast, secure, accessible, and ready for end users.*
- Performance optimization (Lighthouse ≥ 95, JS Bundle ≤ 250 KB/route, CLS < 0.1).
- Security review, error monitoring, analytics integration.
- Cross-browser/device testing, accessibility validation, documentation, beta feedback, and final release checklist.

---

## Copyright & License

Copyright (c) 2024–present **Eric Gitahi**. All rights reserved.

This is **proprietary software**. Viewing the source code is permitted for
evaluation and educational purposes. Copying, redistribution, modification,
or commercial use is strictly prohibited. See [LICENSE](./LICENSE) for full terms.

---

<div align="center">
  <sub>Built with precision by <a href="https://github.com/Gitahi77">Eric Gitahi</a></sub>
</div>
