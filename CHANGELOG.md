# Changelog

## Unreleased

- `angular-quality` reusable workflow: add optional `run-all-steps` input (default `false`, so behaviour is unchanged). When `true`, lint, format, test, build, and audit all run once install succeeds, and the job still fails if any step fails. Steps are now named in the run log.

## 0.1.0 - 2026-08-14

- Establish central rules, synchronized skills, integration packages, reusable validation workflows, tests, and proposed ECS-on-EC2 ADR.
