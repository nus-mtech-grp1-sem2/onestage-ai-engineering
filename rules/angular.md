# Angular conventions

- **Requirement:** Follow the repository's detected Angular version, standalone/module architecture, formatter, lint, tests, accessibility, strict typing, and bundle budgets. Keep API access and state patterns consistent.
- **Why:** Parallel framework patterns increase defects and bundle/runtime cost.
- **Enforcement:** Repository-derived lint, formatter check, unit tests, production build, dependency audit, and review.
- **Exceptions:** Architecture deviation requires an ADR or explicit rationale and migration plan.
- **Evidence:** Exact detected commands, accessibility coverage, tests, and production-build output.
