# Production Incident Response

## Purpose
To define the structured process for handling engineering incidents (outages, latency, infrastructure failures).

## Scope
This runbook covers system availability and performance issues. For data breaches, refer to `docs/INCIDENT_RESPONSE.md`.

## Prerequisites
- Incident Commander (IC) assignment.
- Alerting systems active (Sentry/Datadog).

## Procedure

### 1. Initial Response
1. Acknowledge the alert.
2. If SEV-1 or SEV-2, establish an incident channel (e.g. `#inc-YYYY-MM-DD-issue`).
3. Appoint an Incident Commander (IC).

### 2. Communication Template
Send this immediately to the engineering channel:
```text
[INCIDENT DECLARED]
Severity: <SEV-1/SEV-2/SEV-3>
Status: Investigating
Symptoms: <What is broken>
Impact: <Who is affected>
Incident Commander: <Name>
```

### 3. Timeline Recording
The IC must designate a scribe or self-record the timeline:
- `10:00 AM` - Alert triggered.
- `10:05 AM` - IC declared incident.
- `10:15 AM` - Executed rollback.

## Verification
### Root Cause Analysis (RCA) Template
Within 48 hours of closing a SEV-1 or SEV-2 incident, complete an RCA:
- **Incident Summary**:
- **Timeline**:
- **Root Cause (The 5 Whys)**:
- **Action Items (Preventative)**:

## Rollback
- If mitigation efforts worsen the system state, rollback the mitigation (e.g., revert hotfix branch, cancel failover).

## References
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
