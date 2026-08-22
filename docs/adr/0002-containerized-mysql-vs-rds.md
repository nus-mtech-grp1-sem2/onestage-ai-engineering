# ADR-0002: Run MySQL as a containerized ECS service, not RDS

- Status: proposed
- Date: 2026-08-22
- Owners: OneStage team to assign
- Review date: before any production/graded-demo cutover beyond the current MVP

## Context and decision drivers

OneStage's backend (`backend-repo`) needs a MySQL 8.x database. `docker-compose.yml` already runs MySQL as a plain container locally, and none of the 7 Node services' `.env.example` `DB_*` variables were wired into RDS-specific connection code at the time the AWS deployment was built. ADR-0001 (ECS on EC2, now superseded by a Fargate migration — see Unresolved decisions) explicitly deferred this: *"RDS remains a distinct failure and scaling domain"* and left RDS topology unresolved.

Binding constraints on this decision, all previously agreed with the project owner:

- **Budget**: ~$50/month target inclusive of load-test periods, $100/month hard ceiling.
- **Default-off compute**: the whole backend (`backend-repo/infrastructure/terraform`) is designed to scale every ECS service — including the database — to zero between work sessions, via `scripts/stop-env.sh` and a nightly `aws_scheduler_schedule` safety net (`scale_schedule.tf`), so idle time costs close to nothing.
- **Single environment**: this is a course MVP with one environment, not a multi-environment production system with independent dev/staging/prod data tiers.

Direct evidence from this AWS account, gathered while investigating unexplained Resource Explorer entries during this session: a teammate ("ruby", via CloudTrail `userIdentity`) independently provisioned a manual, undocumented RDS instance (`onestage-db`, `db.t4g.small`, 200GB `gp2`, MySQL 8.4.9, **publicly accessible**, default VPC) on 2026-08-17 for testing, stopped it on 2026-08-18, and left it running up ~200GB of billed storage with no Terraform record and no IAM/network review. This is exactly the kind of divergence an explicit, written decision is meant to prevent — it was deleted (no final snapshot, at the project owner's instruction) as part of the investigation that prompted this ADR. Its behavior en route to deletion also produced two pieces of concrete evidence used below: RDS storage bills whether or not the instance is running, and **AWS auto-restarts an RDS instance after 7 days stopped** — confirmed via the account's own `StopDBInstance` history — which is incompatible with an indefinite scale-to-zero pattern.

## Options considered

1. **Containerized MySQL on ECS (current implementation)** — `mysql:8.0` as a single Fargate task (`ecs_mysql.tf`), `desired_count = 1`, no autoscaling (stateful, deliberately excluded from `module.services`' `for_each`), persisted on an encrypted EFS file system with a POSIX access point (`efs.tf`), credentials in Secrets Manager (`secrets.tf`), reachable internally only via ECS Service Connect (`dns_name = "mysql"`) — no ALB exposure, no public IP path for data traffic. Scales to zero with every other service.
2. **Amazon RDS for MySQL** (Single-AZ, right-sized e.g. `db.t4g.micro`/`small`) — managed engine patching, automated backups, point-in-time recovery, Multi-AZ available later. Does not scale to zero: the closest analog, `StopDBInstance`, only pauses for up to 7 days before AWS force-restarts it, and storage is billed continuously regardless of stop state. Introduces a second Terraform-managed data plane (subnet group, parameter group, security group) alongside EFS/Fargate.
3. **RDS Serverless v2** — true scale-to-near-zero compute (down to 0.5 ACU, not fully off) with managed backups. Was not evaluated in depth for this ADR; flagged in Unresolved decisions below as the strongest alternative if this decision is revisited.

## Proposed decision

Keep MySQL as a single-task, non-autoscaled ECS service on Fargate, backed by EFS, as already implemented in `backend-repo/infrastructure/terraform/ecs_mysql.tf` and `efs.tf`. Do not adopt RDS for the current MVP scope.

Rationale, in order of weight against the stated decision drivers:

- **Scale-to-zero compatibility is the deciding factor.** The project's cost model depends on every service — MySQL included — going to true desired-count-zero between sessions with no time limit and no risk of an unplanned restart. RDS's `stop`/`start` model caps that at 7 days and then force-restarts regardless of the account's own automation, which directly conflicts with an environment that may sit idle for longer than that between school-project work sessions. The `onestage-db` incident is a live demonstration of this: it auto-restarts around 2026-08-25 if nothing intervenes.
- **No functional requirement currently depends on RDS-only capabilities.** No service performs point-in-time recovery, RDS-level read replicas, or engine-level failover today; local `docker-compose.yml` already models MySQL as a plain container, so the container-based data layer needs no adapter code.
- **Cost**: RDS bills fixed storage cost 24/7 regardless of stop state (visible directly in the `onestage-db` incident: 200GB provisioned, billed whether the instance was running or stopped) on top of instance-hour cost while running. The containerized approach's marginal cost is folded into the same Fargate/EFS spend already budgeted for the rest of the stack, and drops to near-zero when scaled down.
- **Operational surface stays single instead of dual.** One state model (ECS + EFS) is simpler to reason about, back up, and tear down than running ECS for the app and RDS for data side by side — relevant given this is a small team's course project, not a platform team with dedicated database operations.

## Consequences

- **No managed backups today.** EFS is durable, multi-AZ-replicated storage, but nothing currently runs `mysqldump`/binlog backups against the running MySQL container. Data loss on container/task misconfiguration (not underlying storage loss, which EFS itself protects against) is possible until a backup job exists. Tracked as a required follow-up, not covered by this ADR.
- **No automated patching.** The team owns MySQL point-version upgrades by bumping the `mysql:8.0` tag and redeploying, versus RDS's managed minor-version patching.
- **Single point of failure by design.** `desired_count = 1`, no read replica, no Multi-AZ — accepted for this MVP's scope; matches ADR-0001's framing of RDS as "a distinct failure and scaling domain" that this decision defers entirely rather than half-adopts.
- **Public network exposure risk is structurally lower than the RDS alternative would have been.** MySQL has no ALB target group, no path through CloudFront, and reaches other services only via internal Service Connect DNS — there is no path to make it internet-reachable by a single misconfigured flag, unlike RDS's `PubliclyAccessible` toggle (which is exactly how `onestage-db` ended up publicly reachable).
- **Reversal cost if load-test results warrant a change later** (see Rollout below) is non-trivial: it means introducing RDS Terraform resources, a data migration path out of the running container, and updating `DB_*` wiring in the 7 Node services — should be scoped as its own piece of work, not a quick toggle.

## Rollout, verification, and rollback

This ADR documents a decision already implemented and running (`ecs_mysql.tf`, applied and verified in this AWS account) rather than a pending rollout — status is kept `proposed` per this repo's ADR convention pending explicit team review, even though the infrastructure itself is live.

Verification already performed in this account:
- `onestage-mysql` ECS service confirmed `RUNNING`/`HEALTHY` on Fargate, EFS-mounted, reachable via Service Connect from the 7 Node services' network path (verified indirectly: `/api/<service>/health` returns 200 through the full CloudFront → ALB → Kong → Service Connect chain for all 7 services, none of which would start cleanly without their `mysql` alias resolving).
- `terraform plan` shows zero drift against this design as of this ADR's date.

Rollback path if this decision is reversed: provision RDS via new Terraform resources (subnet group scoped to `aws_subnet.public` or a future private subnet set, security group allowing 3306 from `aws_security_group.ecs_tasks` only, credentials still via the existing Secrets Manager pattern), migrate data out of the running `mysql` container (`mysqldump` over the internal Service Connect path, or an EFS-to-RDS import job), repoint the 7 Node services' `DB_*` env vars, then remove `ecs_mysql.tf`/`efs.tf`. Should be staged and load-tested before cutover, not done live against the graded environment.

## Unresolved decisions

- **A backup strategy for the containerized MySQL data is still required** — e.g., a scheduled task dumping to S3 — independent of whether this ADR's core decision holds.
- **ADR-0001 is now stale on the EC2-vs-Fargate question**: this session migrated the whole ECS platform from EC2 capacity providers to Fargate (see `backend-repo` git history, commit `079215f`) after unresolved NAT-instance networking issues. ADR-0001 still describes EC2 as the accepted direction; it should be superseded or amended separately from this ADR.
- RDS Serverless v2 (Option 3) was not fully evaluated — if a future phase needs managed backups/PITR without giving up cost elasticity, it's the more promising RDS-family option to revisit, not standard provisioned RDS.
- No process yet exists to prevent a repeat of the `onestage-db` incident (undocumented manual resource creation outside Terraform) — worth a short team norm (e.g., "experiments get a `-scratch` tag and a self-imposed deletion date") rather than tooling.

## Approval

Remain `proposed` until the team reviews this trade-off, in particular the missing-backups consequence, and either accepts it as-is or requires a backup job before acceptance.
