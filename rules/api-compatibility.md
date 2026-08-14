# API compatibility and versioning

- **Requirement:** Prefer additive contracts; validate all boundaries and preserve error, nullability, pagination, and idempotency semantics. Breaking changes need versioning and a consumer migration window.
- **Why:** Frontend and backend deploy independently.
- **Enforcement:** Schema/contract tests, consumer tests, compatibility review, and deprecation tracking.
- **Exceptions:** Coordinated breaking releases require explicit owner approval and rollback.
- **Evidence:** Contract diff, affected consumers, test output, timeline, and rollback plan.
