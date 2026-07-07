# Design System Constitution

## 1. Executive Summary
This document establishes the unbending visual laws of Ledger360. To achieve a "calm, trustworthy" aesthetic, we are banning inline styles, arbitrary hex codes, and standard web colors (like stark red). Everything will be driven by semantic Tailwind tokens. We emphasize generous spacing, muted negative colors, and unignorable typography for primary balances.

## 2. Research
According to *Refactoring UI* and modern fintech best practices, interfaces feel "premium" when they rely heavily on typography and negative space rather than borders and explicit bounding boxes. Trust is heavily influenced by layout stability; moving elements or layout shifts during data loading destroy perceived reliability.

## 3. Findings
- **Current Issues**: Ledger360 uses generic Tailwind colors (`text-red-500` for expenses), which induces panic. Typography lacks a distinct hierarchy.
- **Severity**: High. Aesthetically, the app feels like a boilerplate dashboard rather than a polished consumer product.

## 4. Recommendations
- **Rec. 1: Semantic Color Tokens**: Ditch default Tailwind colors. Introduce `--color-surface-base`, `--color-text-primary`, `--color-finance-positive` (deep forest green), and `--color-finance-negative` (slate/charcoal, not red). Red is reserved strictly for overdrafts.
- **Rec. 2: The "Hero" Typography Scale**: Introduce a `text-balance-hero` class specifically for the Dashboard Net Worth, utilizing a clean geometric sans-serif (e.g., Inter or Plus Jakarta Sans).
- **Rec. 3: Borderless Architecture**: Rely on elevation (subtle shadows) and spacing (`gap-4`, `p-6`) to separate cards rather than harsh borders.

## 5. Product Design Council Review
- **Visual Design Director**: "I strongly support borderless architecture. It makes data feel accessible and fluid rather than trapped."
- **Accessibility Specialist**: "If we use subtle shadows instead of borders, we must ensure high contrast ratio for text and interactive elements. Also, deep forest green and charcoal are color-blind safe if contrasted properly."
- **Final Decision**: Adopt all recommendations. All colors must be mapped to semantic variables in `globals.css` and injected into `tailwind.config.ts`.

## 6. Engineering Requirements
- **REQ-DS-01**: Replace all hardcoded colors in `src/components` with semantic CSS variables mapped in `tailwind.config.ts`.
- **REQ-DS-02**: Establish typography tokens: `.text-heading-1`, `.text-body-base`, `.text-finance-hero`.
- **REQ-DS-03**: Create standard `<Card>` component that strictly uses elevation tokens rather than `border-gray-200`.

## 7. Acceptance Criteria
- `npm run lint` enforces a ban on arbitrary value classes (e.g., `text-[#FF0000]`).
- Lighthouse Accessibility score remains 100 on all newly tokenized pages.
