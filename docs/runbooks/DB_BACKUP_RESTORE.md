# Database Backup and Restore Strategy

## Purpose
To outline the tiered backup strategy and restoration procedures for the Ledger360 database.

## Scope
This covers managed Point-In-Time-Recovery (PITR), managed snapshots, and manual logical backups (`pg_dump`).

## Prerequisites
- Production database credentials.
- `postgresql-client` installed (for manual scripts).
- Access to the managed database provider console.

## Procedure

### 1. Backup Hierarchy
Engineers should ALWAYS prefer the higher tiers:
1. **Primary: Managed PITR** - Continuous WAL archiving. Restores to any precise second.
2. **Secondary: Managed Daily Snapshots** - Automated full-disk snapshots.
3. **Tertiary: Encrypted `pg_dump`** - Scheduled logical backups.
4. **Emergency: Manual `pg_dump`** - Executed via `backup-db.sh`.

### 2. Provider-Specific Restores (Appendices)
**Appendix A: Neon Postgres**
- Branch section -> "Restore to point in time" -> Create branch -> Promote.

**Appendix B: Supabase**
- Database -> Backups -> PITR or Daily Backup -> Restore.

### 3. Manual / Emergency Restore Procedure
1. Execute `./src/scripts/ops/restore-db.sh <database_url> <input_file.dump>`
2. Type `YES RESTORE` to confirm.

## Verification
**Monthly Validation Routine:**
1. Restore backup to a staging database.
2. Run migrations (`npx prisma migrate deploy`).
3. Verify row counts.
4. Destroy staging database.

## Rollback
- If the restore introduces corrupted data, halt the application and revert to the snapshot taken immediately before the restore attempt.

## References
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
