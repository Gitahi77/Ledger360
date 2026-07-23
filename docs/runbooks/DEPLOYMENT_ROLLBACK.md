# Deployment Rollback Runbook

This guide covers rolling back bad deployments. Fast rollbacks minimize mean time to recovery (MTTR).

## 1. Expected Rollback Times

- **Vercel Rollback**: ~30 seconds
- **Database Restore (PITR)**: 5–15 minutes
- **Database Restore (Snapshot)**: 15–60 minutes
- **Database Restore (Manual)**: 30–90 minutes

## 2. Vercel Instant Rollback (Code Only)

If the deployment introduced a bug but DID NOT run destructive database migrations:

1. Open the Vercel Dashboard -> Project -> Deployments.
2. Find the last known good deployment.
3. Click the three dots (More Options).
4. Click **"Instant Rollback"**.
5. Traffic will immediately route to the older deployment.

## 3. Prisma Schema Rollbacks (Strict Rules)

**CRITICAL:** We adhere to the following strict rules regarding database schemas to prevent data loss.

- **Forward only**: Never use `prisma migrate down` or attempt to revert migrations in production.
- **Never modify an applied migration**: Once a migration is pushed to production, it is immutable.
- **Never delete migration history**: The `prisma/migrations` folder must reflect reality.
- **Never manually edit production schema**: Avoid making manual changes to tables directly in the DB console.
- **Always create a corrective migration**: To revert a column or table, write a NEW migration that drops or re-adds it.

If a migration severely breaks production and data is lost:
1. You MUST restore from a PITR backup to the point immediately before the migration.
2. Re-point the application to the restored database instance.
