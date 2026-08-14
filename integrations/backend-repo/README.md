# backend-repo integration proposal

The application repository was unavailable during generation, so package manager, Node/TypeScript/framework versions, and quality commands are unresolved. Inspect `package.json`, lockfile, TypeScript/lint/formatter/test/build configuration and CI; replace every `UNRESOLVED_*` input before enabling the caller.

Preview with `node scripts/sync-skills.mjs --integration=backend-repo=/absolute/path`; add `--apply` only for a clean target. `--allow-dirty` is an explicit reviewed override. Review the target diff. Managed sections preserve user-owned AGENTS/CLAUDE content; the tool never commits, pushes, or opens a PR.
