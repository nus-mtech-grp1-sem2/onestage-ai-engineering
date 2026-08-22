# Git workflow and commits

- **Requirement:** Use short-lived branches and Conventional Commits. Never commit or push directly to the `main` branch in `core-frontend` or `backend-repo`; all changes must be submitted through a pull request. Use signed/protected workflows where configured, and make no direct changes to any protected branch.
- **Why:** Reviewable history enables audit and rollback.
- **Enforcement:** Branch protection, conventional PR-title CI, required checks, and review.
- **Exceptions:** Documented emergency process with retrospective; never bypass audit history.
- **Evidence:** Linked issue/ADR, check results, approvals, and rollback reference.
