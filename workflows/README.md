# Reusable workflows

Source workflows live in `.github/workflows/`. Callers must pin this repository with a reviewed full commit SHA, never a mutable branch or tag. Validation and deployment are deliberately separate; this repository defines no active deployment workflow.

Application quality workflows accept repository-derived commands. Blank commands fail deliberately rather than guessing. Tool-oriented workflows expect the named CLI to be installed by the runner image or caller preparation step.

`angular-quality` runs install, lint, format, test, build, and audit in order and stops at the first failure by default. A caller may set the optional `run-all-steps: true` input to keep going after a failed check, so one red check does not hide the others. Install must still succeed, and the job fails if any step fails: no check is skipped or made non-blocking.
