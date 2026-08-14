# Terraform and AWS safety

- **Requirement:** Run fmt, validate, TFLint, and security scanning. Use encrypted remote locked state, OIDC, least privilege, restricted security groups, private encrypted RDS, backups, and explicit account/environment targeting. Never commit state or sensitive plans.
- **Why:** IaC errors can cross environments and expose or destroy data.
- **Enforcement:** Reusable validation CI, protected environments, human plan review, policy checks, and AWS Budgets.
- **Exceptions:** Public RDS or long-lived keys require explicit security approval and time-bounded remediation; production deploy workflows need known account/environment details.
- **Evidence:** Sanitized plan summary, scanner output, target identity, cost delta, backup/restore and rollback plan.
