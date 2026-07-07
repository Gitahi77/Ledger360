# Financial Privacy Principles

As a financial platform, privacy is an engineering requirement, not an afterthought.

## 1. No Unnecessary Data Collection
Do not request or store data that is not actively utilized by a feature.

## 2. Least Privilege
Services and Server Actions should only query the minimum data necessary. Avoid `SELECT *` patterns if only `id` and `amountMinor` are needed.

## 3. Data Minimization
Retain data only for its necessary lifecycle.

## 4. Encryption at Rest & Transit
All database fields must be secured by the hosting provider's encryption at rest. All API endpoints must enforce TLS 1.3.

## 5. Sensitive Fields Masked in Logs
No PII (names, emails, unmasked account numbers) or raw financial amounts should be logged in plaintext telemetry or application logs. Use `[REDACTED]` or hashing.

## 6. Secrets Never Reach Client Bundles
Ensure environment variables carrying API keys, DB URIs, and signing secrets never include the `NEXT_PUBLIC_` prefix unless strictly required by client libraries (e.g., Stripe public keys).

## 7. Financial Exports Require Confirmation
Bulk data extraction (CSV, PDF) should require an additional confirmation step (e.g., a re-authentication prompt or localized 2FA).

## 8. PII Segregation
Maintain structural separation between an individual's identity (Authentication / Users table) and their anonymous financial behavior (Ledger).
