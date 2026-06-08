# Changelog — `multi-store-theme-manager`

Auto-regenerated from `git log` by `/home/support/bin/changelog-regen`,
called before every push by `/home/support/bin/git-sync-all` (cron `*/15 * * * *`).

**Purpose:** traceability. If a push broke something, scan dates + short SHAs
here; then `git show <sha>` to see the diff, `git revert <sha>` to undo.

**Format:** UTC dates, newest first. Each entry: `time — subject (sha) — N files`.
Body text (if present) shown as indented sub-bullets.

---

## 2026-06-08

- **08:13 UTC** — docs(stores-infra): install/callback URLs → shopify.meshpilot.app (glitchexecutor dead) (`c191b56`) — 1 file
    Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
- **08:12 UTC** — config: repoint app URLs from dead shopify.glitchexecutor.com → shopify.meshpilot.app (`2965f98`) — 1 file
    glitchexecutor.com is NXDOMAIN; the auth-hub now serves shopify.meshpilot.app
    (nginx → :3101). Updated application_url, redirect_urls and GDPR privacy webhook
    URLs. Runtime .env SHOPIFY_APP_URL updated + service restarted (un-hung a
    week-old stuck process); OAuth install now emits shopify.meshpilot.app callbacks.
    Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>

## 2026-05-16

- **03:04 UTC** — auto-sync: 2026-05-06 04:00 UTC (`3bd6b97`) — 2 files
        M	.gitignore
        M	CHANGELOG.md

## 2026-04-30

- **00:33 UTC** — docs(infra): document Urban-family budgets + underperformer Discord watch (`bfd99b1`) — 1 file
    Adds daily ad-budget table (Urban Classics/Storico/Trendsetters $50/day,
    Classicoo $30/day) and the new automation: scheduled Discord alert to
    #urban-family-alert when any active ad crosses spend>=$20 with <4
    purchases. Alert-only, no auto-pause (HITL-gated per playbook).
    Code lives in glitch-grow-ads-agent (separate repo); cron entry on the
    agent host runs every 30 min.
    Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>

## 2026-04-27

- **06:52 UTC** — docs(infra): record Urban-family checkout providers (Fastrr vs Flexype) (`d9cbe23`) — 1 file
    Storico + Classicoo run Shiprocket Fastrr; Urban Classics + Trendsetters
    run Flexype. 2026-04-26 funnel data shows Fastrr stores convert
    ATC→Purchase 41–49% (ROAS ~16x) vs Flexype 15–26% (ROAS ~4–5x), with
    creative + LP held similar across all four stores.
    Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>

## 2026-04-19

- **00:30 UTC** — auto-sync: 2026-04-19 00:30 UTC (`d370ed0`) — 2 files
        M	SHOPIFY_STORES_INFRA.md

## 2026-04-17

- **02:26 UTC** — chore: add gitleaks pre-commit hook (`63ee30a`) — 1 file
    Blocks commits containing API keys, tokens, or other secrets.
    Install locally: pre-commit install
    Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

## 2026-04-16

- **19:30 UTC** — auto-sync: 2026-04-16 19:30 UTC (`e81b7e6`) — 2 files
        M	SHOPIFY_STORES_INFRA.md
- **08:45 UTC** — auto-sync: 2026-04-16 08:45 UTC (`e952a5c`) — 2 files
        R058	STORES.md	SHOPIFY_STORES_INFRA.md
- **08:15 UTC** — auto-sync: 2026-04-16 08:15 UTC (`fa2fd76`) — 2 files
        M	STORES.md
- **07:45 UTC** — auto-sync: 2026-04-16 07:45 UTC (`b4c04f2`) — 3 files
        M	STORES.md
        A	app/routes/auth.mokshya.$.jsx
- **07:30 UTC** — auto-sync: 2026-04-16 07:30 UTC (`c0d7538`) — 4 files
        M	STORES.md
        A	app/routes/auth.storico.$.jsx
        A	app/routes/auth.trendsetters.$.jsx
- **07:15 UTC** — auto-sync: 2026-04-16 07:15 UTC (`9197896`) — 2 files
        M	STORES.md

## 2026-04-15

- **19:31 UTC** — auto-sync: 2026-04-15 19:31 UTC (`752bcc0`) — 2 files
        M	STORES.md
- **19:26 UTC** — auto-sync: 2026-04-15 19:26 UTC (`26743b8`) — 2 files
        M	STORES.md
- **19:21 UTC** — auto-sync: 2026-04-15 19:21 UTC (`2718867`) — 2 files
        A	STORES.md
- **19:15 UTC** — auto-sync: 2026-04-15 19:15 UTC (`de8e0aa`) — 3 files
        A	app/routes/auth.ayurpet-ind.$.jsx
        A	app/routes/auth.ayurpet.$.jsx
- **05:30 UTC** — auto-sync: 2026-04-15 05:30 UTC (`87cea40`) — 2 files
        A	cli/_urban_adset_join.mjs
- **04:30 UTC** — auto-sync: 2026-04-15 04:30 UTC (`b097d79`) — 2 files
        M	cli/shops.json
- **04:15 UTC** — auto-sync: 2026-04-15 04:15 UTC (`eb0bb46`) — 2 files
        A	app/routes/auth.urban.$.jsx
- **02:21 UTC** — auto-sync: 2026-04-15 02:21 UTC (`122fb81`) — 2 files
        M	.mcp.json
- **00:16 UTC** — auto-sync: 2026-04-15 00:16 UTC (`284c8ee`) — 2 files
        M	shopify.app.toml
- **00:10 UTC** — auto-sync: 2026-04-15 00:10 UTC (`5b55a77`) — 5 files
        A	app/routes/webhooks.customers.data_request.jsx
        A	app/routes/webhooks.customers.redact.jsx
        A	app/routes/webhooks.shop.redact.jsx
        M	shopify.app.toml

## 2026-04-14

- **23:22 UTC** — docs: refresh CHANGELOG.md (`98ee725`) — 1 file
- **23:22 UTC** — docs: add auto-generated CHANGELOG.md (`e906196`) — 1 file
- **23:13 UTC** — chore: initial commit — Glitch Grow agency app (Custom distribution) (`283fd92`) — 45 files
    - Handles per-client Custom-distribution Shopify installs
    - Primary OAuth for Mokshya (client_id 75d0ca69...)
    - Secondary hand-rolled OAuth for Classico (app/routes/auth.classicoo.$.jsx)
    - Serves shopify.glitchexecutor.com on port 3101
    - Includes sh-admin CLI (cli/sh-admin.mjs) for Shopify Admin GraphQL
