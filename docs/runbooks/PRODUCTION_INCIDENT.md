# Production Incident Response

This runbook defines the structured process for handling engineering incidents (outages, latency, infrastructure failures). For data breaches, refer to `docs/INCIDENT_RESPONSE.md`.

## 1. Initial Response

1. Acknowledge the alert.
2. If SEV-1 or SEV-2, establish an incident channel (e.g. `#inc-YYYY-MM-DD-issue`).
3. Appoint an Incident Commander (IC).

## 2. Communication Template

Send this template to the internal engineering channel immediately:

```text
[INCIDENT DECLARED]
Severity: <SEV-1/SEV-2/SEV-3>
Status: Investigating
Symptoms: <What is broken>
Impact: <Who is affected>
Incident Commander: <Name>
```

## 3. Severity Definitions & Escalation

- **SEV-1 (Critical)**: Production is fully down. Page all available on-call engineers. Escalate to leadership immediately.
- **SEV-2 (High)**: Core feature degraded. Page secondary on-call if primary needs assistance.
- **SEV-3 (Low)**: Minor bug or isolated issue. Handle during business hours.

## 4. Timeline Recording

The IC must designate a scribe or self-record the timeline:

- `10:00 AM` - Sentry alert triggered.
- `10:05 AM` - IC declared incident.
- `10:12 AM` - Identified bad deployment as root cause.
- `10:15 AM` - Executed Vercel Rollback.
- `10:18 AM` - Systems recovered.

## 5. Root Cause Analysis (RCA) Template

Within 48 hours of closing a SEV-1 or SEV-2 incident, complete an RCA.

- **Incident Summary**:
- **Timeline**:
- **Root Cause (The 5 Whys)**:
  1. Why?
  2. Why?
  ...
- **Action Items (Preventative)**:
  - [ ] Add metric/alert for X.
  - [ ] Add integration test for Y.
  - [ ] Update runbook Z.
