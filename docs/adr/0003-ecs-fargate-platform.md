# ADR-0003: Move ECS compute from EC2 to Fargate

- Status: proposed
- Date: 2026-08-22
- Owners: OneStage team to assign
- Review date: before any production/graded-demo cutover beyond the current MVP
- Supersedes: ADR-0001 (Use ECS on EC2 for backend services)

## Context and decision drivers

ADR-0001 proposed ECS on EC2 with a capacity-provider-managed Auto Scaling Group, driven partly by a stated course goal: *"a learning surface that includes node and task scaling."* That design was implemented in `backend-repo/infrastructure/terraform` and deployed to this AWS account. During deployment and verification, it hit a sequence of real, evidence-backed failures — not design-on-paper concerns — that consumed a disproportionate amount of troubleshooting time relative to the MVP's schedule. This ADR documents that sequence and the resulting decision to move to Fargate, both to justify the change and as a record for the course's final report.

## What actually happened on EC2 (in order)

1. **`assign_public_ip` is Fargate-only.** ECS's `network_configuration.assign_public_ip` field is rejected by the API for the EC2 launch type (`InvalidParameterException: Assign public IP is not supported for this launch type`). Since EC2-launch-type task ENIs can't get a public IP directly, this forced a rework: private subnets for ECS hosts/tasks, plus some path to the internet for image pulls (ECR) and AWS API calls.
2. **NAT Gateway vs. NAT instance.** A managed NAT Gateway (~$43–50/month) was rejected on cost grounds against the project's $50/month target; a `t4g.nano` DIY NAT instance (~$3–4/month) was built instead (`nat.tf`).
3. **The NAT instance silently didn't work.** Its `user_data` used `iptables -t nat -A POSTROUTING ... -j MASQUERADE` to set up masquerading. Amazon Linux 2023 doesn't ship `iptables` by default (it moved to `nftables`) — the command failed with `iptables: command not found`. Because `cloud-init` doesn't hard-fail the boot on a `scripts-user` module failure, the instance came up looking healthy (passed EC2 status checks) while providing **no actual NAT function** — `ip_forward` was enabled, but with no masquerade rule, nothing behind it had real internet egress. This was root-caused via `aws ec2 get-console-output`, which showed the exact failed command in the boot log.
4. **A second EC2-specific failure layered on top: ENI trunking.** Independent of the NAT bug, ECS tasks on tiny instance types (`t3.micro`/`t3.small`) got stuck permanently in `PROVISIONING` because the account's `awsvpcTrunking` setting was disabled — small instance types support very few ENI attachments per host without it. Fixed via `aws ecs put-account-setting --name awsvpcTrunking --value enabled`, but this only takes effect for instances that register *after* the change, adding another layer to unwind.
5. **Even after fixing the NAT instance's `iptables`→`nft` bug and forcing an instance replacement, task placement still did not recover within a reasonable troubleshooting window.** New EC2 instances launched, passed basic EC2 status checks, but never registered as ECS container instances and never picked up SSM connectivity either — evidence the underlying network path was still broken in a way that wasn't diagnosable further without a working SSH/SSM path into the instance (which itself depends on the same broken NAT/agent connectivity, and the NAT instance had no IAM instance profile for SSM either). At that point, continuing to debug had an unclear time cost with no proof it would resolve, against a course-project schedule.

Each of these is a real, independently-confirmed root cause (AWS API error text, CloudWatch/console log evidence, an explicit account-setting flag) — not a chain of guesses. The pattern across all of them: the EC2 launch type's lack of native public-IP support pushed the design into NAT-instance territory, and every subsequent problem was downstream of maintaining that NAT path.

## Options considered

1. **Keep debugging the EC2 + NAT instance path.** Rejected: two independent, confirmed root causes fixed (`nft` vs `iptables`, `awsvpcTrunking`) without task placement recovering; no remaining hypothesis had direct evidence behind it, and further diagnosis was blocked by no exec/SSM access into the instances.
2. **Switch to a managed NAT Gateway, keep EC2 launch type otherwise.** Would likely have fixed the NAT-specific failure (managed NAT Gateways don't have the `iptables`/`nft` problem) but not the separate `awsvpcTrunking` issue, and reintroduces the ~$43–50/month cost this design was specifically built to avoid — a large fraction of the entire project budget for one component.
3. **Move to Fargate (chosen).** Fargate tasks support `assign_public_ip` directly — the exact capability gap that started the whole NAT detour — so the NAT instance, private subnets, and the EC2 Auto Scaling Group/capacity provider/launch template/instance IAM role are all removable outright, not just patched.
4. **EKS.** Not reconsidered; ADR-0001's rejection (disproportionate control-plane/networking/on-call complexity for this project) still applies and none of the EC2-specific failures above bear on that reasoning.

## Decision

Move ECS compute from an EC2 Auto Scaling Group capacity provider to Fargate, as implemented in `backend-repo` commit `079215f`. Every service (`modules/ecs_service/main.tf`, `ecs_mysql.tf`) now declares `launch_type = "FARGATE"` and `assign_public_ip = true` directly, running in public subnets with no NAT path at all. Removed entirely: `nat.tf`, `ecs_capacity.tf` (launch template + ASG), `autoscaling_capacity.tf` (EC2-backed capacity provider), the EC2 instance IAM role/profile, and the private subnets they existed to serve.

Two more real bugs surfaced immediately once Fargate unblocked task placement — evidence that the EC2 path had never gotten far enough to reach them, not that Fargate introduced them:

- The ECS task execution role was missing `secretsmanager:GetSecretValue` for the MySQL credentials secret (only the AWS-managed ECR/CloudWatch-Logs policy was attached). Fixed with a scoped inline policy.
- Kong's container healthcheck used `wget`, which the `kong:3.9` image doesn't ship — always failed, cycling the task roughly every 60 seconds. Switching to Kong's own `kong health` CLI check exposed a second, subtler bug: nginx's `worker_processes auto` sizes off the **host's** full CPU count, not the Fargate task's actual 0.25 vCPU cgroup quota — under 256 CPU units, Kong spawned dozens of workers, and `kong health` itself took 11 seconds against a 5-second healthcheck timeout. Fixed by pinning `KONG_NGINX_WORKER_PROCESSES=1`.

Verified end-to-end after both fixes: all 9 ECS services `RUNNING`/`HEALTHY`, and `https://<cloudfront-domain>/api/<service>/health` returns `200` through the full CloudFront → ALB → Kong → Service Connect → service chain for all 7 Node services, with `terraform plan` showing zero drift against the applied state.

## Consequences

- **The course's stated "node scaling" learning surface is gone.** ADR-0001's context explicitly wanted exposure to both task-level and node-level (ASG/capacity-provider) scaling. Fargate removes node-level scaling entirely — there is no EC2 fleet to reason about, no bin-packing, no capacity-provider managed scaling to tune. Only ECS Service Auto Scaling (task count) remains as a demonstrable scaling story going forward, via `aws_appautoscaling_target`/`aws_appautoscaling_policy` in `modules/ecs_service/main.tf`. If the course specifically grades node-level scaling, this is a real gap worth raising with the instructor rather than silently absorbing.
- **Operational surface shrinks meaningfully.** No AMI selection/patching, no ASG health/lifecycle management, no NAT instance to maintain, no `awsvpcTrunking`-style account-setting gotchas. This is a genuine simplification, not just a workaround.
- **Cost model shifts, not clearly worse for this workload.** Fargate's per-vCPU/GB-hour rate is higher than the equivalent EC2 instance-hour rate, but there's no bin-packing waste (each task gets exactly what it reserves, billed per-second) and no idle EC2 instance cost between tasks. At this project's deliberately minimal per-task sizing (256 CPU/512MiB for most services), and with the same scale-to-zero pattern (`scripts/stop-env.sh`, nightly `aws_scheduler_schedule`) still fully intact under Fargate, realized cost is plausibly similar to or better than the EC2 design ever achieved in practice — the EC2 design's NAT instance (~$3–4/month fixed) is also gone entirely, a small but real saving on top.
- **No more `awsvpcTrunking`/instance-type ENI-density tuning.** Every Fargate task gets its own ENI unconditionally; this entire class of failure is structurally impossible now, not just fixed for the current instance types.

## Rollout, verification, and rollback

This ADR documents a decision already implemented, applied, and verified live in this AWS account (see Decision section for verification evidence) — status is kept `proposed` per this repo's ADR convention pending team review, consistent with how ADR-0001 and ADR-0002 were also written up after the fact.

Rollback path if this decision is reversed: reintroduce `ecs_capacity.tf`/`autoscaling_capacity.tf`/`nat.tf` from `backend-repo` git history (commit `e2de0c5`, immediately before the Fargate migration), reintroduce private subnets in `network.tf`, and revert each service's `launch_type`/`assign_public_ip` back to the EC2-launch-type pattern. Given the failure history above, a rollback should not be attempted without first deciding whether to use a managed NAT Gateway instead of a DIY NAT instance — the `iptables`/AL2023 gap is a durable fact about the base AMI, not something that will resolve itself on retry.

## Unresolved decisions

- Whether the lost node-level-scaling learning surface needs to be addressed for course grading purposes (e.g., a small supplementary EC2-based demo unrelated to the actual deployed environment) — flagged for the team/instructor, not resolved here.
- Fargate Spot is registered as an available capacity provider (`autoscaling_capacity.tf` — now replaced by the Fargate cluster capacity-provider block) but not weighted into the default strategy for any service; worth revisiting if cost pressure increases.
- A real k6 load test (tracked separately, not yet run as of this ADR's date) is still needed to produce evidence for the task-level autoscaling thresholds (`scaling_target` values in `locals.tf`), same as ADR-0001 already required and never received before this platform change.

## Approval

Remain `proposed` until the team reviews the trade-off — particularly the lost node-scaling learning surface against the course's grading criteria — and either accepts it as-is or requests changes.
