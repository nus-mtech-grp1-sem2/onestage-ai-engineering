# k6 performance testing

- **Requirement:** Model realistic arrival rates and journeys, define correctness/latency thresholds and abort criteria, isolate test data, and monitor all dependencies. Production testing needs explicit approval.
- **Why:** Unsafe or unrealistic load tests produce misleading capacity decisions or outages.
- **Enforcement:** Script review, smoke stage, environment capacity guardrails, CI thresholds, and result retention.
- **Exceptions:** Stress/breakpoint tests run only in isolated authorized environments.
- **Evidence:** Script/version, traffic model, thresholds, raw summary, telemetry correlation, bottleneck analysis, and capacity recommendation.
