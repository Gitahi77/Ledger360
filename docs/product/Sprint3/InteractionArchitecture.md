# Interaction Architecture

## 1. Executive Summary
This document specifies the exact behavioral responses of the Ledger360 interface. We transition from a synchronous CRUD app to a fluid, optimistic application. Users will never be blocked waiting for a database round-trip unless mathematically necessary (e.g., final transfer commits).

## 2. Research
M-Pesa thrives on instant USSD feedback. Modern web applications (like Linear or Nubank) use Optimistic UI—assuming the server request will succeed to provide instant sub-50ms feedback to the user, reverting only on failure. 

## 3. Findings
- **Current Issues**: Forms and inputs rely on blocking `await` calls. Saving a category update freezes the button until the database responds.
- **Severity**: Medium-High. This makes the app feel sluggish, reducing the "M-Pesa speed" identity.

## 4. Recommendations
- **Rec. 1: Optimistic Mutations**: Wrap all non-destructive actions (updating categories, changing names, marking as paid) in `useOptimistic` hooks.
- **Rec. 2: Global Keyboard Shortcuts**: Implement power-user shortcuts (`/` to search, `T` to add transaction) to accelerate navigation without breaking the simple visual layout.
- **Rec. 3: Non-Blocking Loading States**: Use granular skeleton loaders (e.g., only the balance turns into a skeleton) rather than full-page spinners.

## 5. Product Design Council Review
- **Frontend Engineering Lead**: "Optimistic UI for everything is risky. What if a financial transfer fails but the UI showed it succeeding?"
- **Principal Product Designer**: "Agreed. We must separate non-destructive (categories, names) from destructive/financial (transfers, deletions). Financial moves must block and wait."
- **Final Decision**: Adopt Optimistic UI for metadata (categories, names, settings). Use strict blocking with localized skeletons for financial ledger entries. Adopt Keyboard Shortcuts.

## 6. Engineering Requirements
- **REQ-IA-01**: Implement React 19 `useOptimistic` for category updates in `TransactionsList`.
- **REQ-IA-02**: Integrate `react-hotkeys-hook` to bind `/` to the global search modal and `T` to the "New Transaction" bottom sheet.
- **REQ-IA-03**: Replace all full-page `<Spinner>` usages with localized `<Skeleton>` blocks matching the bounding box of the expected data.

## 7. Acceptance Criteria
- Pressing `T` opens the transaction modal in < 100ms.
- Changing a transaction category reflects in the UI instantly, syncing in the background.
