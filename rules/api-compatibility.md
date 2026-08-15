# API compatibility and versioning

- **Requirement:** Prefer additive contracts; validate all boundaries and preserve error, nullability, pagination, and idempotency semantics. Treat the validated OpenAPI 3.x document as the canonical HTTP contract and update it in the same change as backend or frontend contract usage. Breaking changes need versioning and a consumer migration window.
- **Why:** Frontend and backend deploy independently.
- **Enforcement:** OpenAPI validation and diff checks, schema/contract tests, consumer tests, compatibility review, and deprecation tracking.
- **Exceptions:** Coordinated breaking releases require explicit owner approval and rollback.
- **Evidence:** OpenAPI diff, validator output, affected consumers, test output, timeline, and rollback plan.
