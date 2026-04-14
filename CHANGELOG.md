# Changelog — `multi-store-theme-manager`

Auto-regenerated from `git log` by `/home/support/bin/changelog-regen`,
called before every push by `/home/support/bin/git-sync-all` (cron `*/15 * * * *`).

**Purpose:** traceability. If a push broke something, scan dates + short SHAs
here; then `git show <sha>` to see the diff, `git revert <sha>` to undo.

**Format:** UTC dates, newest first. Each entry: `time — subject (sha) — N files`.
Body text (if present) shown as indented sub-bullets.

---

## 2026-04-14

- **23:13 UTC** — chore: initial commit — Glitch Grow agency app (Custom distribution) (`283fd92`) — 45 files
    - Handles per-client Custom-distribution Shopify installs
    - Primary OAuth for Mokshya (client_id 75d0ca69...)
    - Secondary hand-rolled OAuth for Classico (app/routes/auth.classicoo.$.jsx)
    - Serves shopify.glitchexecutor.com on port 3101
    - Includes sh-admin CLI (cli/sh-admin.mjs) for Shopify Admin GraphQL
