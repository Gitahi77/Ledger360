# Disaster Recovery Runbook

## Purpose
To define the standard recovery process, severity levels, and RTO/RPO objectives for Ledger360 during major outages.

## Scope
This runbook covers system-wide failures, database corruption, and cloud provider outages.

## Prerequisites
- Access to Vercel dashboard.
- Access to Database provider (e.g., Neon/Supabase).
- Incident Commander designation.

## Procedure

### 1. Incident Commander Checklist
- [ ] **Confirm outage**: Verify alerts in Vercel / Datadog / Sentry.
- [ ] **Freeze deployments**: Pause any ongoing CI/CD.
- [ ] **Notify stakeholders**: Post in incident slack channel.
- [ ] **Identify failure domain**: E.g., Database, API layer, Third-party service.
- [ ] **Decide recovery action**: Rollback vs. Restore.
- [ ] **Record timeline**: Create an incident document and log timestamps of every action.

### 2. Recovery Decision Tree
```text
Deployment failure / Bad code deployed?
    ↓
Execute Vercel Rollback (Instant)

Database corruption / Bad schema migration?
    ↓
Execute Database Restore (via PITR or Snapshot)

Cloud provider or region outage?
    ↓
Fail over (if multi-region) OR Wait for provider resolution.
```

## Verification
- Run `npm run verify:deployment` (or use `verify-deployment.ts`).
- Monitor CPU, Memory, 5xx responses, Database connections, and Latency for 30 minutes.

## Rollback
- If a restoration fails or corrupts data further, fall back to the secondary backup tier (e.g., Daily Snapshot if PITR failed).

## References
- [DB_BACKUP_RESTORE.md](./DB_BACKUP_RESTORE.md)
- [DEPLOYMENT_ROLLBACK.md](./DEPLOYMENT_ROLLBACK.md)
