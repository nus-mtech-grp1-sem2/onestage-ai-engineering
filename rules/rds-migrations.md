# RDS MySQL migration safety

- **Requirement:** Use expand/migrate/contract, backward-compatible releases, bounded resumable backfills, explicit lock analysis, backups/restoration, abort criteria, and observability.
- **Why:** DDL and backfills can lock hot tables, exhaust storage, and break mixed application versions.
- **Enforcement:** Migration review, compatible disposable-database tests, protected environments, and human approval.
- **Exceptions:** Destructive or blocking changes require a maintenance plan and explicit database owner approval.
- **Evidence:** MySQL/RDS version, table size estimate, lock/lag/storage analysis, tested recovery, timings, and rollback/roll-forward plan.
