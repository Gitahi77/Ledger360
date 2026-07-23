# Disaster Recovery Runbook

## 1. Disaster Severity Levels

When declaring an incident, assess the severity based on the following:

- **SEV-1 (Critical)**: Production is fully unavailable or significant data corruption has occurred. (e.g. database dropped, region offline).
- **SEV-2 (High)**: Major feature unavailable, but core system functional. (e.g. cron jobs failing, emails not sending).
- **SEV-3 (Low)**: Partial degradation or latency issues affecting some users.

## 2. Recovery Objectives

Ledger360 operates with the following targets:

| Metric | Recommendation                        |
| ------ | ------------------------------------- |
| **RTO (Recovery Time)** | ≤ 2 hours                             |
| **RPO (Recovery Point)**| ≤ 15 minutes with PITR, otherwise 24h |

**Current Capability**
- **Without PITR**: RPO = Last daily backup (24 hours max data loss).
- **With PITR**: RPO = < 15 minutes.
- **Target RTO**: 2 hours (restoration, deployment, and verification).

## 3. Incident Commander Checklist

When acting as Incident Commander (IC), follow this strict checklist:

- [ ] **Confirm outage**: Verify alerts in Vercel / Datadog / Sentry.
- [ ] **Freeze deployments**: Pause any ongoing CI/CD to prevent further state mutation.
- [ ] **Notify stakeholders**: Post in incident slack channel / notify the team.
- [ ] **Identify failure domain**: E.g. Database, API layer, Third-party service.
- [ ] **Decide recovery action**: 
  - Rollback vs. Restore?
- [ ] **Record timeline**: Create an incident document and log timestamps of every action.

## 4. Recovery Decision Tree

Use this tree to decide on the immediate operational response:

```text
Deployment failure / Bad code deployed?
    ↓
Execute Vercel Rollback (Instant)


Database corruption / Bad schema migration?
    ↓
Execute Database Restore (via PITR or Snapshot)
Do NOT attempt to run Prisma "migrate down".


Cloud provider or region outage?
    ↓
Fail over (if multi-region) OR Wait for provider resolution.


Third-party API failure (e.g., Upstash / Neon / Vercel)?
    ↓
Update status page and wait for upstream provider to resolve.
```

## 5. Post-Recovery Monitoring

Do not immediately close the incident. Monitor the following for 30 minutes after mitigation:

- [ ] CPU / Memory usage
- [ ] Error rate & 5xx responses
- [ ] Database active connections
- [ ] Queue depth (if applicable)
- [ ] API Latency

If metrics remain stable for 30 minutes, you may declare the incident mitigated and begin the postmortem.
