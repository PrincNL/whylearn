
#### 2025-09-17 Storage Implementation Snapshot
- JsonFileDriver voert nu per-dataset locks uit, schrijft via tmp->fsync->rename en logt elke transactie in `journal.log` met checksums voor herstel.
- `schema.json` bewaakt `schemaVersion` per dataset; `init()` maakt automatisch dagelijkse backups en houdt `lastBackupAt` bij.
- Data CLI (`data:migrate|validate|backup|export|import`) draait op gedeelde runner met pre-backup, rollback bij fouten en post-validation guard.
- Nieuwe `storage/helpers.ts` levert id-generator, dataset clones en duplicaatcontrole; Vitest suites dekken concurrente writes, CLI rondes en backupexporten.
- **Backend integration** (2025-09-17): Supabase dependencies replaced with the storage adapter. Express routes now use `requireAuth`/`requirePremium` middleware backed by session tokens in the users dataset; subscriptions, progress, gamification, and coaching APIs read/write JSON data with optimistic updates and entitlement checks.
