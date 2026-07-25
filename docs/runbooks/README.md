# Operational Runbooks

Welcome to the Ledger360 Operations Center. This directory contains the procedures required to maintain, recover, and stabilize the system in production.

## Index

- [Production Incident Response](./PRODUCTION_INCIDENT.md)
  *How to handle SEV-1 and SEV-2 engineering incidents.*

- [Disaster Recovery](./DISASTER_RECOVERY.md)
  *How to recover from system-wide failures, cloud provider outages, or severe data corruption.*

- [Database Backup and Restore](./DB_BACKUP_RESTORE.md)
  *The tiered backup strategy and procedures for executing manual emergency restores.*

- [Deployment Rollback](./DEPLOYMENT_ROLLBACK.md)
  *Procedures for instantly rolling back Vercel deployments and the strict rules governing schema rollbacks.*

## Scripts
- `npm run verify:deployment`: Runs `verify-deployment.ts` to perform a non-destructive production smoke test.
- `src/scripts/ops/backup-db.sh`: Emergency backup script.
- `src/scripts/ops/restore-db.sh`: Emergency restore script (Requires `YES RESTORE` confirmation).
