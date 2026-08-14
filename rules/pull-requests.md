# Pull requests and review

- **Requirement:** Keep one logical change per PR; describe intent, compatibility, security/operational impact, validation, rollout, and rollback. Require owners for database, IAM, networking, and deployment changes.
- **Why:** Review quality collapses when scope and evidence are ambiguous.
- **Enforcement:** Template, CODEOWNERS when adopted, CI, and branch protection.
- **Exceptions:** Mechanical changes may reduce narrative but not validation evidence.
- **Evidence:** Full command results, focused diff, approvals, and explicit unresolved risks.
