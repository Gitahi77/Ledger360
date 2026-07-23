# Deployment Rollback Runbook

## Purpose
To provide safe, standardized procedures for rolling back bad deployments or database migrations.

## Scope
This covers Vercel instant rollbacks (code changes) and Prisma schema rollbacks.

## Prerequisites
- Access to Vercel Dashboard.
- Familiarity with Prisma migration history.

## Procedure

### 1. Vercel Instant Rollback (Code Only)
1. Open Vercel Dashboard -> Project -> Deployments.
2. Find the last known good deployment.
3. Click More Options (three dots).
4. Click **"Instant Rollback"**.

### 2. Prisma Schema Rollbacks (Strict Rules)
**CRITICAL:** To prevent data loss, we adhere to the following rules:
- **Forward only**: Never use `prisma migrate down` in production.
- **Never modify an applied migration**: Migrations are immutable.
- **Never delete migration history**: Do not edit `prisma/migrations`.
- **Never manually edit production schema**: Avoid making manual changes to tables directly in the DB console.
- **Always create a corrective migration**: To revert a column/table, write a NEW migration that drops or re-adds it.

## Verification
- Verify the API health endpoint returns the correct rollback version SHA.
- Confirm system stability metrics post-rollback.

## Rollback
- If a Vercel rollback fails to stabilize the system, it indicates a database-level issue. Initiate the database restore procedure.

## References
- [DB_BACKUP_RESTORE.md](./DB_BACKUP_RESTORE.md)
