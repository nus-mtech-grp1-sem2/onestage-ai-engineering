# AI-generated change governance

- **Requirement:** Treat AI output as untrusted; inspect sources, constrain permissions, review diffs, verify claims, and require humans for deployment, migrations, IAM, networking, secrets, and destructive operations.
- **Why:** Agents can hallucinate commands, dependencies, compatibility, and successful validation.
- **Enforcement:** Concise root rules, procedural skills, deterministic synchronization, CI policy, branch protection, and audit logs.
- **Exceptions:** None for human approval boundaries; low-risk automation may proceed only within pre-approved scope.
- **Evidence:** Prompt/task context where retained, review record, generated-content manifest, commands/results, and human approvals.
