# Secure coding and secrets

- **Requirement:** Validate at trust boundaries; enforce server-side authentication, authorization, least privilege, safe output encoding, redacted logs, and approved secret stores. Reject tracked `.env` except sanitized `.env.example`, credentials, tokens, keys, and generated secrets; stop without printing a suspected value.
- **Why:** Ticketing data, payment-adjacent flows, and CI credentials are high-impact targets.
- **Enforcement:** Secret scanning, dependency/SAST checks, review, runtime controls, and `.gitignore` policy.
- **Exceptions:** Only documented false positives approved by security ownership; never blanket excludes.
- **Evidence:** Threat notes, scanner output, tests for authorization/validation, and redaction verification.
