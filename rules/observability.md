# Observability and alerting

- **Requirement:** Instrument service objectives and failure modes with bounded-cardinality metrics, redacted structured logs, traces, actionable alerts, dashboards, ownership, and runbooks.
- **Why:** Autoscaling and incident response require trustworthy symptom and saturation signals.
- **Enforcement:** Prometheus rule validation/tests, review of metric names/labels, alert routing, and release readiness.
- **Exceptions:** Temporary instrumentation must have expiry and cardinality/cost bounds.
- **Evidence:** Rule validation, alert exercise, dashboard links, sample redacted telemetry, and owner/runbook.
