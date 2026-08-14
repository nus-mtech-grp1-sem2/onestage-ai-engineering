# core-frontend integration proposal

The application repository was unavailable during generation, so package manager, Node/Angular versions, and quality commands are unresolved. Before installation, inspect its `package.json`, lockfile, `angular.json`, CI, lint, formatter, test, and build configuration; replace every `UNRESOLVED_*` input in the caller example.

Preview from the central repository with `node scripts/sync-skills.mjs --integration=core-frontend=/absolute/path`. Apply only to a clean target with the same command plus `--apply`; `--allow-dirty` is an explicit reviewed override. Review `git diff` in the target. The tool preserves user-owned AGENTS/CLAUDE content through marked managed sections and never commits, pushes, or opens a PR.
