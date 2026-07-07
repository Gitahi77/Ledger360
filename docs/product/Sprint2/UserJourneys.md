# User Journey Mapping

## 1. Executive Summary
This document maps 5 critical user journeys within Ledger360. We identified that while the "Happy Paths" are technically functional, error states, offline states, and "Day 1" experiences induce anxiety. By mapping emotional states alongside technical paths, we identified exactly where to inject trust indicators.

## 2. Research
We benchmarked Ledger360 against Monarch's onboarding and M-Pesa's transactional feedback loop. Users require immediate positive reinforcement after completing a financial action.

## 3. Findings

### Journey 1: First Launch & Registration
- **Pain Point**: User registers and sees a blank page. High drop-off risk.
- **Emotion**: Confusion.
- **Improvement**: Intercept with a friendly "Welcome to your financial command center" and prompt a guided import via `SmartUpload`.

### Journey 2: Adding a Transaction (Manual & M-Pesa)
- **Pain Point**: `MpesaSmsInput` lacks visual parsing feedback. User pastes text and waits.
- **Emotion**: Anxiety (Did it work? Did it double charge?).
- **Improvement**: Implement optimistic UI updates and a skeleton loading state that parses the SMS visibly.

### Journey 3: Creating a Budget
- **Pain Point**: User guesses category limits.
- **Emotion**: Overwhelmed.
- **Improvement**: Pre-fill budget limits based on the last 30 days of historical spending averages.

## 4. Recommendations
- **Rec. 1: Smart M-Pesa Parsing UI**: Show a real-time extraction animation when pasting an M-Pesa SMS to build trust.
- **Rec. 2: Historical Budget Suggestions**: Auto-suggest budget limits during creation.
- **Rec. 3: Contextual Success Toasts**: Never redirect silently. Show a bottom-sheet or toast confirming "Ksh 5,000 saved to Rent."

## 5. Product Design Council Review
- **Behavioral Finance Specialist**: "Auto-suggesting budgets reduces cognitive load massively. Highly recommended."
- **Performance Engineer**: "Real-time SMS extraction animation must not block the main thread. We need to offload the regex to a Web Worker if it's heavy, though standard SMS parsing is usually fast enough."
- **Final Decision**: Adopt all recommendations. M-Pesa parsing will utilize local optimistic states.

## 6. Engineering Requirements
- **REQ-J-01**: Refactor `MpesaSmsInput.tsx` to include an `isParsing` state with a skeleton layout.
- **REQ-J-02**: Introduce `sonner` or a similar accessible toast library for contextual success messages.
- **REQ-J-03**: Budget API must expose a `/api/budgets/suggest` endpoint averaging `sum(amount)` over the last 90 days.

## 7. Acceptance Criteria
- M-Pesa input provides visual feedback within 50ms of paste.
- Every successful mutation (`POST`/`PUT`/`DELETE`) triggers a success toast.
