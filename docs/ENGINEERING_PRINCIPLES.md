# Ledger360 Engineering Principles

This document serves as the constitution for the Ledger360 codebase. Every pull request and refactor must adhere to these rules to maintain institutional-grade engineering quality.

## 1. Architectural Boundaries

- **The Data Pipeline:** All database interactions must strictly follow this pipeline:
  `Prisma → Repository → Domain Service → Mapper → DTO → Server Component → Client Component`
- **Separation of Concerns:** 
  - **Repositories** read and write to the database. They must not contain financial business logic. Keep them as module-based exported functions (e.g., `export async function getAccounts()`).
  - **Domain Services** perform financial calculations, reconciliation, and aggregation (e.g., `BalanceService`, `NetWorthCalculator`).
- **No Raw Models:** Raw Prisma models must never cross the Server/Client boundary. Typed domain DTOs (e.g., `AccountDTO`, `TransactionDTO`) are mandatory.
- **Action Results:** All Server Actions must return a standardized `ActionResult<T>` contract containing specific error codes.
  ```typescript
  export type ActionErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'CONFLICT' | 'RATE_LIMIT' | 'UNKNOWN';
  export type ActionResult<T = void> = 
    | { success: true; data: T } 
    | { success: false; code: ActionErrorCode; message: string };
  ```

## 2. Financial Integrity

- **Minor Units:** Money is always stored and calculated in integer minor units (cents/pesewas). The `BigInt` type is used at the database layer.
- **Serialization:** `BigInt` must be serialized to standard `number` or `string` inside the Mapper/DTO layer before leaving the server.
- **Immutability:** Financial history is append-only. Use reversing entries or soft-deletes where appropriate; never permanently destroy financial trails without an AuditLog.
- **No Silenced Failures:** Never silently ignore calculation errors. Fail loudly at the server level and gracefully at the UI level.

## 3. Next.js & React Ecosystem

- **Server Components by Default:** Assume all components are Server Components. Add `"use client"` only at the leaf nodes (islands of interactivity).
- **Suspense Boundaries:** Use granular `<Suspense>` wrappers around independent data-fetching widgets to prevent blocking rendering waterfalls.
- **Error Boundaries:** Use `error.tsx` at the page and layout levels to catch unhandled DTO mapping or database connection failures.

## 4. UI & Design System

- **Primitive-First:** No utility-class soup. Reusable components (`<Button>`, `<Card>`, `<Input>`) must be defined in `src/components/ui/` and consumed everywhere.
- **No Inline Styles:** The `style={{ ... }}` prop is banned for layout and typography. Use the semantic Tailwind token system.
- **Accessibility (a11y) is Mandatory:**
  - Full keyboard navigation support.
  - Respect `prefers-reduced-motion`.
  - Ensure WCAG AA color contrast, especially for financial states (success/destructive).
  - Use `aria-invalid` and explicit label associations on all forms.
- **Aesthetic Philosophy:** 40% M-Pesa (clarity, trust, speed) / 60% Monarch (calm, premium, insightful). Avoid decorative gradients and heavy glassmorphism.

## 5. General Practices

- **Refactoring:** Never replace working architecture without measurable justification.
- **Performance:** A component must justify its render cost. Code-split heavy dependencies (like charting libraries) using `next/dynamic`.
