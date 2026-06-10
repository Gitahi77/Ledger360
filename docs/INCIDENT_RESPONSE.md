# Ledger360 Incident Response Runbook (Breach-Ready)

## 1. Objective
To provide a clear, actionable guide for responding to data breaches, specifically meeting the 72-hour notification requirement under the Kenya Data Protection Act (DPA), 2019.

## 2. Roles & Responsibilities
- **Incident Commander / DPO:** (Founder) Leads the response, coordinates communication, and acts as the ODPC liaison.
- **Lead Engineer:** Investigates the technical scope of the breach, patches the vulnerability, and secures the systems.

## 3. Incident Severity Levels
- **SEV-1 (Critical):** Confirmed exposure of sensitive PII or financial data. Requires ODPC notification within 72 hours.
- **SEV-2 (High):** Potential exposure or service disruption affecting data integrity.
- **SEV-3 (Low):** Isolated incident, no sensitive PII exposed.

## 4. Response Procedures (The First 72 Hours)

### Hour 0-4: Discovery & Containment
- **Discover:** Alert triggered (Sentry, user report, or internal audit).
- **Contain:** Isolate affected systems immediately. Revoke compromised keys/tokens. Rotate database credentials if a DB leak is suspected.
- **Log:** Start a timeline in an incident document. Record every action taken.

### Hour 4-24: Investigation
- **Determine Scope:** Identify which user records, types of data (e.g., M-Pesa SMS, Account balances), and systems were affected.
- **Identify Cause:** Find the root cause (e.g., misconfigured bucket, application vulnerability).
- **Patch:** Deploy hotfixes to permanently close the vulnerability.

### Hour 24-48: Assessment & Drafting Communications
- **DPIA Check:** Determine if the breach results in a "real risk of harm" to the data subjects.
- **Draft ODPC Notification:** Prepare the ODPC Data Breach Notification form, detailing:
  - The nature of the breach.
  - Categories and approximate number of data subjects affected.
  - Potential consequences.
  - Remediation measures taken.
- **Draft User Communication:** Prepare clear, non-technical emails to affected users.

### Hour 48-72: Notification
- **Notify ODPC:** Submit the breach report to the Office of the Data Protection Commissioner.
- **Notify Users:** If the breach involves a real risk of harm, email affected users with details of the breach, the steps taken, and advice on how they can protect themselves.

## 5. Post-Incident Activities
- **Post-Mortem:** Within 5 days of containment, conduct a blameless post-mortem.
- **Policy Update:** Update security protocols, logging, and this runbook based on lessons learned.
