# ADR-0001: Use ECS on EC2 for backend services

- Status: proposed
- Date: 2026-08-14
- Owners: OneStage team to assign
- Review date: before infrastructure implementation

## Context and decision drivers

OneStage must support small events and abrupt ticket-sale demand on AWS. The backend needs container orchestration, ALB integration, controlled cost, predictable demonstration capacity, and a learning surface that includes node and task scaling. The Angular SPA normally needs static delivery, not a container scheduler.

## Options considered

1. **ECS with EC2 capacity providers:** Direct control of instance types, warm capacity, On-Demand/Spot mix, and separate task/node scaling. It adds AMI, patching, bin-packing, draining, and ASG operational ownership.
2. **ECS Fargate:** Reduces node operations and improves workload isolation, but changes the required platform direction and may offer less control over pre-warmed node economics and demonstrations.
3. **EKS:** Provides Kubernetes portability and ecosystem depth, but creates disproportionate control-plane, networking, security, upgrade, and on-call complexity for the project.

## Proposed decision

Deploy Node.js backend services as ECS services using the EC2 launch type. Attach an EC2 Auto Scaling Group through an ECS capacity provider with managed scaling, managed termination protection, and managed instance draining. Let ECS Service Auto Scaling adjust tasks and capacity-provider managed scaling adjust nodes; do not attach competing scaling policies directly to that ASG.

Use ALB request count per target as the primary candidate signal for synchronous HTTP services, backlog per task for workers, and CPU/memory as supporting guardrails. Configure cooldowns, warm capacity, and scheduled pre-scaling for announced on-sales. Combine scaling with waiting-room admission control, rate limiting, and queueing. Critical demonstrations use On-Demand capacity; Spot is optional for fault-tolerant development or load workers.

Host the Angular SPA through S3 and CloudFront unless a separately reviewed SSR requirement justifies ECS.

## Consequences

The team owns EC2 patching, capacity bounds, placement, quotas, draining, and cost controls. Reactive autoscaling alone is insufficient for flash crowds. k6 evidence must justify task limits, ASG limits, thresholds, cooldowns, and warm capacity. Cost ceilings and AWS Budgets alerts are required. RDS remains a distinct failure and scaling domain.

## Rollout, verification, and rollback

No live environment is created by this ADR. Before acceptance, validate quotas, failure domains, AMI maintenance, IAM/OIDC, private networking, observability, load models, estimated cost, and rollback. A later implementation must stage dev validation, failure/draining tests, k6 smoke/load tests, and an on-sale pre-scaling exercise. Rollback means reverting reviewed infrastructure through its environment-specific plan, not ad hoc state manipulation.

## Unresolved decisions

- Instance families/sizes, base and maximum capacity, target capacity, cooldowns, and warm pool strategy.
- Exact account, region, environments, DNS/TLS, RDS topology, backup objectives, and budgets.
- Waiting-room and queue technology, SLOs, k6 traffic model, AMI lifecycle, and observability stack topology.

## Approval

Remain `proposed` until frontend, backend, infrastructure, security, and operations owners review the trade-offs and evidence.
