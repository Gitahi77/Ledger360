# Database Backup and Restore Strategy

Ledger360 data is the most critical asset. We do not rely exclusively on manual shell scripts. Our backup strategy is tiered.

## 1. Backup Hierarchy

Engineers should ALWAYS prefer the higher tiers before falling back to manual scripts.

1. **Primary: Managed PITR (Point-In-Time-Recovery)**
   - Continuous WAL archiving provided by the managed database (e.g. Neon, Supabase, AWS RDS).
   - Allows restoring to any precise second.
2. **Secondary: Managed Daily Snapshots**
   - Automated full-disk snapshots taken by the cloud provider daily.
3. **Tertiary: Encrypted `pg_dump`**
   - Scheduled logical backups stored in encrypted cloud storage (S3).
4. **Emergency: Manual `pg_dump`**
   - Developer-initiated logical backup via the `backup-db.sh` script prior to manual interventions.

## 2. Backup Restoration Validation

A backup is useless unless we know it can be restored.

**Monthly Validation Routine:**
1. Create a clean, temporary staging database instance.
2. Restore the latest automated backup or snapshot into the staging instance.
3. Run Prisma migrations (`npx prisma migrate deploy`) to ensure schema parity.
4. Verify table row counts against the production snapshot time.
5. Destroy the temporary staging database.

## 3. Provider-Specific Restores (Appendices)

While the concepts are standard PostgreSQL, the exact clicks depend on the vendor.

### Appendix A: Neon Postgres
- Navigate to the **Branches** section in the Neon Console.
- Select the Production branch and choose **"Restore to point in time"**.
- Specify the timestamp just before the disaster.
- Create a new branch, verify the data, and promote it to Production.

### Appendix B: Supabase
- Navigate to Database -> Backups.
- Choose PITR or Daily Backup.
- Click "Restore". Wait for the infrastructure to restart.

### Appendix C: AWS RDS
- Use `RestoreDBInstanceToPointInTime` or select the instance in the AWS Console and choose "Restore to point in time".

## 4. Manual / Emergency Restore Procedure

If managed services fail and you must use a logical backup via `pg_restore`:

1. Ensure no applications are writing to the database.
2. Connect to the target DB using `restore-db.sh`.
3. The script requires you to explicitly type `YES RESTORE` to prevent accidental overwrites.
4. Always verify the data before repointing the application.
