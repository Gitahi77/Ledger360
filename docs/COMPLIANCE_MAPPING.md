# Ledger360 Compliance Mapping

This document identifies the lawful basis and data flow mapping for all processing activities within Ledger360, under the Kenya Data Protection Act (DPA), 2019.

## 1. Lawful Basis for Processing

| Processing Activity | Data Types Involved | Lawful Basis | Justification |
| :--- | :--- | :--- | :--- |
| **Account Creation & Auth** | Email, Hashed Password, Auth Tokens | **Contract** | Necessary to provide the authenticated service and secure user accounts. |
| **Transaction & Budget Tracking** | Amounts, Dates, Categories, Account Balances | **Contract** | Core functionality of the Ledger360 personal finance OS. |
| **M-Pesa SMS / Statement Upload** | Raw Text, SMS bodies, PDF contents | **Consent** | Processing unstructured financial records requires explicit consent. |
| **AI Insights Generation** | Redacted SMS text, Statement text | **Consent** | Users opt-in explicitly before any data is sent to the Gemini AI API. |
| **Security Monitoring & Rate Limiting** | IPs, Request Rates, User IDs | **Legitimate Interest** | Necessary to protect the platform from abuse and ensure service stability. |

## 2. Cross-Border Data Transfers

Ledger360 relies on global infrastructure providers. This entails cross-border transfers outside Kenya.

### Google Gemini (AI Processing)
- **Data Transferred:** Redacted SMS strings, PDF statement text.
- **Safeguards in Place:**
  - **Data Governance Tier:** The API is configured to use a paid/data-governed tier. Google explicitly guarantees that data submitted via this API is **not** used to train their foundational models.
  - **Pre-transfer Redaction:** The `redactForAI` module strips names, phone numbers, and full account identifiers locally before data leaves the application server.
- **Lawful Basis for Transfer:** Explicit User Consent + Appropriate Safeguards (DPA Section 48).

### Vercel / Neon (Hosting & Database)
- **Data Transferred:** Encrypted application data, user records.
- **Safeguards in Place:**
  - Standard Contractual Clauses (SCCs) via provider Data Processing Agreements (DPAs).
  - Data is encrypted at rest and in transit.

## 3. Data Subject Rights Implementation

- **Right of Access:** Users can view all transactions and budgets in-app. (Export feature planned).
- **Right to Erasure:** Handled via the Account Deletion action (`WO-13.2` implemented strict DB cascading to ensure irreversible deletion).
- **Right to Rectification:** Users can manually edit transactions and categories to correct AI categorization errors.
- **Right to Withdraw Consent:** Users can simply stop uploading SMS/Statements; the app functions entirely via manual entry if preferred.

## 4. Retention Policy

| Data Category | Retention Period | Deletion Trigger |
| :--- | :--- | :--- |
| **User Account & Core Ledger** | Life of the account | Account Deletion |
| **Session & Reset Tokens** | 7 days / 30 mins | Expiry or Single-Use Consumption |
| **Raw AI Prompt Logs** | None (Disabled) | Not retained per `WO-5` Safe Logging |

