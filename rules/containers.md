# Containers and Dockerfiles

- **Requirement:** Use explicit minimal base versions, multi-stage builds, non-root runtime, no embedded secrets, health checks, graceful shutdown, and read-only filesystems where practical. Scan images. Add multi-architecture builds only with a demonstrated need.
- **Why:** Smaller least-privilege images reduce attack surface and operational variance.
- **Enforcement:** Dockerfile review, reproducible build, vulnerability scan, runtime smoke test, and ECS task-definition controls.
- **Exceptions:** Writable paths or root require scoped justification and compensating controls.
- **Evidence:** Image digest/size, scan report, user identity, health/shutdown tests, and architecture rationale.
