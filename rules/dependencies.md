# Dependency management

- **Requirement:** Use the established package manager and lockfile; justify new dependencies, pin reproducibly, review licenses/provenance, and remove unused packages.
- **Why:** Dependencies expand supply-chain, maintenance, size, and cold-start risk.
- **Enforcement:** Frozen/clean install, lockfile consistency, vulnerability audit, update automation, and review.
- **Exceptions:** Accepted vulnerability risk requires owner, expiry, compensating controls, and tracking.
- **Evidence:** Rationale, lockfile diff, audit output, license check, and bundle/image impact.
