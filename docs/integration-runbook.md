# Integration runbook

1. Ensure the target repository is clean and record its current package manager, runtime/framework versions, lockfile, CI, lint, formatter, type-check, unit/integration test, build, and audit commands.
2. Run the synchronizer without `--apply`; inspect the diff-oriented file list and the package under `integrations/<repo>/`.
3. Replace all unresolved caller inputs using only verified repository commands. Pin the central `uses:` reference to a reviewed full commit SHA and decide how required CLIs are supplied immutably.
4. Run with `--apply`, inspect the entire target diff, manually merge `.gitignore` recommendations, and execute target checks.
5. Submit a normal reviewed PR in the target repository. Do not deploy from the integration change.

For updates, repeat the preview/check/apply/review flow. For rollback, pin the last reviewed central commit or revert the integration PR; do not hand-edit generated skill trees.
