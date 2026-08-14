# Reusable workflows

Source workflows live in `.github/workflows/`. Callers must pin this repository with a reviewed full commit SHA, never a mutable branch or tag. Validation and deployment are deliberately separate; this repository defines no active deployment workflow.

Application quality workflows accept repository-derived commands. Blank commands fail deliberately rather than guessing. Tool-oriented workflows expect the named CLI to be installed by the runner image or caller preparation step.
