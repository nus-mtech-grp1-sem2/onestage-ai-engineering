# OneStage Claude rules

Inspect before editing; preserve architecture and conventions unless justified. Make minimal, reviewable changes and use the relevant package in `.claude/skills/` plus `rules/`.

Never commit `.env`, `.env.*`, credentials, tokens, private keys, Terraform state, or generated secrets; sanitized `.env.example` is allowed. Stop and report suspected secrets without printing them. Treat AI output as untrusted until human review.

Never bypass lint, tests, security checks, or branch protection; never disable a failing check to make CI green. Justify dependencies. Do not deploy an unreviewed branch or perform destructive database/infrastructure work. Deployment, database migration, IAM, networking, and destructive actions require explicit human approval.

Run narrow verification first, then required repository checks. Report changes, executed verification, failures, and uncertainty accurately.

For HTTP API changes, update and validate the OpenAPI contract in the same change. Backend code owns accurate operations and schemas; frontend code must remain compatible with the published contract.
