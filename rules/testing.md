# Testing strategy

- **Requirement:** Run the narrowest deterministic test first, then repository-required unit, integration, build, security, and relevant performance checks. Test failure paths and boundaries.
- **Why:** Layered feedback is fast while retaining release confidence.
- **Enforcement:** Required CI jobs and branch protection; no skipped/focused tests in committed code.
- **Exceptions:** Unavailable environments must be reported, risk-assessed, and assigned follow-up ownership.
- **Evidence:** Commands actually executed, exit status, failures, skipped checks, and artifacts.
