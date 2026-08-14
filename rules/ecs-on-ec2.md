# ECS on EC2 and autoscaling

- **Requirement:** Run backend services on ECS EC2 with an ASG capacity provider. Service autoscaling controls tasks; managed scaling controls nodes. Use ALB requests/target for HTTP, backlog/task for workers, CPU/memory guardrails, cooldowns, warm and scheduled capacity, draining, and termination protection. Do not add competing ASG policies.
- **Why:** Flash crowds outrun reactive node provisioning and naive CPU scaling.
- **Enforcement:** Terraform review, k6 evidence, scaling alarms/dashboards, capacity bounds, waiting room, rate limiting, queueing, and Budgets alerts.
- **Exceptions:** Angular uses S3/CloudFront unless documented SSR requires ECS. Spot is optional only; critical demonstrations use On-Demand.
- **Evidence:** k6 results, task/ASG limits, thresholds, cooldown rationale, quota/cost ceiling, failure drill, and pre-scale plan.
