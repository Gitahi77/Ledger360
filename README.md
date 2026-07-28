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

- ✅ Design tokens
- ✅ Typography
- ✅ Motion
- ✅ Elevation
- ✅ ResponsiveDialog
- ✅ Chart standards
- ✅ Finance primitives
- ✅ **InsightCard primitive**
- ✅ **Premium Design Showcase (`/design`)**
- ✅ Freeze design APIs

### Phase 9B — Premium Product Experience

- ✅ **Phase 9B.0**: Competitive UX Audit
- ✅ **Phase 9B.1**: Information Architecture
- ✅ **Phase 9B.1.5**: Design Language & Interaction Specification
- 🟡 **Phase 9B.1.6**: Primitive Certification (HeroMetric, InsightCard, StoryCard, JourneyCard, RecommendationCard, Timeline, Calculation Pills)
- ⬜ **Phase 9B.2**: Dashboard Assembly (No new design decisions allowed)
- ⬜ **Phase 9B.3**: Pixel QA
- ⬜ **Phase 9B.4**: Interaction QA
- ⬜ **Phase 9B.5**: Production Integration
- ⬜ **Phase 9B.6**: Transactions Redesign
- ⬜ **Phase 9B.7**: Accounts Redesign
- ⬜ **Phase 9B.8**: Budgets Redesign
- ⬜ **Phase 9B.9**: Goals Redesign
- ⬜ **Phase 9B.10**: Global Screen Acceptance Review

### Phase 9C — Visual Perfection

* Pixel-perfect audit
* Accessibility audit
* Animation audit
* Responsive audit
* Visual regression
* Final consistency pass

### Phase 10 — Production Readiness

* Performance
* Security
* Monitoring
* Analytics
* Launch readiness

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
