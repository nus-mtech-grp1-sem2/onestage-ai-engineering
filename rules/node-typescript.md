# Node.js and TypeScript conventions

- **Requirement:** Preserve the detected runtime/framework/module system; use strict types, validated inputs, explicit error propagation, bounded retries/timeouts, idempotency, and graceful shutdown.
- **Why:** Backend failures amplify under flash-crowd concurrency.
- **Enforcement:** Repository-derived ESLint, formatter, type-check, tests, build, audit, and runtime review.
- **Exceptions:** Any relaxed safety must be local, documented, and tested.
- **Evidence:** Exact commands, failure-path/concurrency tests, and shutdown observation.
