# Stores — Shopify installs + Meta Ads mapping

Single source of truth for which Shopify store uses which Custom App, OAuth
install/callback path, and which Meta Ads account drives its paid traffic.

**Why this file exists:** as we onboard more Glitch Grow clients, the mapping
between _store handle_ (admin.shopify.com/store/&lt;handle&gt;), _myshopify
subdomain_ (X.myshopify.com), _Custom App_ (per-client), and _Meta Ads account_
becomes impossible to hold in memory. This is the map.

**How to read:** stores are grouped into **client families** (a family shares a
merchant/owner and often an ad account). Each store has ONE row in the summary
table, then a detail section below with full credentials and install state.

**When to update:** after any install / re-install / scope change / ad-account
re-attach / domain change. This repo auto-syncs to GitHub every 15 min
(`/home/support/bin/git-sync-all` cron).

---

## Action — 2026-04-16 scope maximalism (final)

**Why this change:** we (glitchexecutor) own all 7 stores. Each scope bump forces a merchant-side Custom App admin UI edit. So we're doing it **once**, with a maximal set that covers every foreseeable ads-ops / analytics / content-tooling / HITL-write use case.

**Unified 33-scope set** now in every `*_SCOPES` env var (and top-level `SCOPES`). Confirmed accepted by Shopify Custom App admin UI across all 7 stores on 2026-04-16.

```
read_orders, write_orders, read_draft_orders, write_draft_orders, read_products,
write_products, read_inventory, write_inventory, read_customers, write_customers,
read_content, write_content, read_files, write_files, write_themes,
read_translations, write_translations, read_online_store_navigation,
write_online_store_navigation, read_locales, read_price_rules, write_price_rules,
read_discounts, write_discounts, read_marketing_events, write_marketing_events,
read_fulfillments, read_locations, read_shipping, read_reports, read_returns,
read_customer_events, write_pixels
```

Notes:
- `read_customers` + `write_customers` trigger GDPR handler obligations — already implemented (`webhooks.customers.data_request`, `webhooks.customers.redact`, `webhooks.shop.redact`).
- `read_reports` is Plus/Advanced-only — silently ignored elsewhere. Safe to request on all.
- `write_themes` enables code execution on storefront. Needed for Glitch SEO + future CAPI snippet injection.
- `read_customer_events` + `write_pixels` — required for Web Pixel / customer journey attribution.
- **Scopes tried and rejected by Shopify Custom App UI** ("Contains invalid scopes"):
  - `read_all_orders` (gated — Partner Dashboard approval needed for orders older than 60 days)
  - `read_product_listings` (sales-channel-only legacy REST scope)
  - `read_purchase_options` (Subscription-API gated)
  - `read_order_edits`, `read_markets`, `read_metaobjects`, `read_metaobject_definitions`, `read_privacy_settings`, `read_online_store_pages` — rejected by this admin-UI version even though they appear in Shopify's public docs
  - `read_shopify_payments_payouts`, `read_shopify_payments_disputes` — only valid when store has Shopify Payments enabled
- Also excluded: `read_users` / `read_gift_cards` (Plus-only), `read_script_tags` / `write_script_tags` (deprecated — use `write_pixels`), `read_customer_payment_methods` (PCI-sensitive), Function-specific scopes (`read_cart_transforms`, `read_validations`, `read_delivery_customizations` — add later only if we build Functions).

### Install / re-install URLs (ready to send to merchants)

**Urban family:**

| Store | Action | URL |
|---|---|---|
| Urban Classics | re-install (add 5 read scopes) | `https://shopify.glitchexecutor.com/auth/urban/install?shop=f51039.myshopify.com` |
| Storico | re-install (add 5 read scopes — baseline already installed) | `https://shopify.glitchexecutor.com/auth/storico/install?shop=ys4n0u-ys.myshopify.com` |
| Classicoo | re-install (add 6 scopes incl. write_orders) | `https://shopify.glitchexecutor.com/auth/classicoo/install?shop=52j1ga-hz.myshopify.com` |
| Trendsetters | fresh install | `https://shopify.glitchexecutor.com/auth/trendsetters/install?shop=acmsuy-g0.myshopify.com` |

**Ayurpet family:**

| Store | Action | URL |
|---|---|---|
| Ayurpet (India) | re-install (add 5 read scopes) | `https://shopify.glitchexecutor.com/auth/ayurpet-ind/install?shop=1ygbmd-pr.myshopify.com` |
| Ayurpet (Global) | re-install (add 5 read scopes) | `https://shopify.glitchexecutor.com/auth/ayurpet/install?shop=2684sq-mt.myshopify.com` |

**Mokshya (standalone):**

| Store | Action | URL |
|---|---|---|
| Mokshya | re-install (existing token 401s, plus 6 scopes missing) | `https://shopify.glitchexecutor.com/auth/mokshya/install?shop=5u7mdi-ap.myshopify.com` |

### What the merchant needs to do — one-time scope enablement

For each Custom App (one per store), in the **merchant's own Shopify admin**:

1. **Apps and sales channels** → **Develop apps** → open the Custom App.
2. **Configuration** tab → **Admin API integration** → **Edit**.
3. Enable **all 33 scopes** below. Paste this comma-separated string into the scope field:

```
read_orders,write_orders,read_draft_orders,write_draft_orders,read_products,write_products,read_inventory,write_inventory,read_customers,write_customers,read_content,write_content,read_files,write_files,write_themes,read_translations,write_translations,read_online_store_navigation,write_online_store_navigation,read_locales,read_price_rules,write_price_rules,read_discounts,write_discounts,read_marketing_events,write_marketing_events,read_fulfillments,read_locations,read_shipping,read_reports,read_returns,read_customer_events,write_pixels
```

**Read scopes (19):** `read_orders`, `read_draft_orders`, `read_products`, `read_inventory`, `read_customers`, `read_content`, `read_files`, `read_translations`, `read_online_store_navigation`, `read_locales`, `read_price_rules`, `read_discounts`, `read_marketing_events`, `read_fulfillments`, `read_locations`, `read_shipping`, `read_reports`, `read_returns`, `read_customer_events`

**Write scopes (14):** `write_orders`, `write_draft_orders`, `write_products`, `write_inventory`, `write_customers`, `write_content`, `write_files`, `write_themes`, `write_translations`, `write_online_store_navigation`, `write_price_rules`, `write_discounts`, `write_marketing_events`, `write_pixels`

4. **Save** the Admin API scopes.
5. **API credentials** tab → confirm **Allowed redirection URL(s)** includes our callback for this app (e.g. `https://shopify.glitchexecutor.com/auth/<app>/callback` — see per-store detail below). Add if missing, **Save**.
6. Click the install/re-install URL we send → Shopify shows a consent screen listing new scopes → click **Install/Update**. Token auto-upgrades in our DB.

**Once-and-done:** after this, no further merchant admin action needed for any future agent feature.

---

## Client families

- **Urban family** (CAD, North America merchant group): Urban Classics, Storico, Classicoo, Trendsetters
- **Ayurpet family** (INR): Ayurpet India, Ayurpet Global — share one ad account across both storefronts
- **Mokshya** (standalone)

## Summary (Shopify store → ad account)

| Family | Client / brand | Store handle | myshopify domain | Custom App | Scope status | Meta Ads account |
|---|---|---|---|---|---|---|
| Urban | Urban Classics | urban-classics-hd | `f51039.myshopify.com` | `urban` | ✅ write_orders | `act_1765937727381511` URBAN-CAD-IST |
| Urban | **Storico** | TBD | `ys4n0u-ys.myshopify.com` | `storico` | ✅ installed with baseline scopes — needs re-install for +5 read scopes | TBD |
| Urban | Classicoo | TBD | `52j1ga-hz.myshopify.com` | `classicoo` | ⚠ needs re-install for new scopes (6 missing) | `act_1231977889107681` Clasicoo-IST-CAD (?) |
| Urban | **Trendsetters** | TBD | `acmsuy-g0.myshopify.com` | `trendsetters` | ⏳ creds issued + auth route live, pending merchant install | TBD |
| Ayurpet | Ayurpet (India) | ayurpet | `1ygbmd-pr.myshopify.com` | `ayurpet-ind` | ✅ write_orders (updated 2026-04-15) | `act_654879327196107` AyurPet – Ad Acc. 1 |
| Ayurpet | Ayurpet (Global) | 2684sq-mt | `2684sq-mt.myshopify.com` | `ayurpet` | ✅ write_orders (updated 2026-04-15) | `act_654879327196107` AyurPet – Ad Acc. 1 (same — India + Global feed from one ad account) |
| Mokshya | **Mokshya** | TBD | `5u7mdi-ap.myshopify.com` | `mokshya` (shares default app creds) | ⚠ existing token 401s — needs re-install | TBD |
| Internal | Glitch SEO (test) | glitch-seo-test-1 | `glitch-seo-test-1.myshopify.com` | public app (Glitch SEO) | n/a | n/a |

**Total active client storefronts: 7** (Urban × 4 planned, Ayurpet × 2, Mokshya × 1) — 4 installed (Urban Classics, Ayurpet India, Ayurpet Global, Classicoo-partial), 1 credentials-issued (Storico), 2 not yet onboarded (Trendsetters, Mokshya).

## Reverse view (ad account → Shopify stores)

Useful when reconciling ROAS across multiple storefronts that feed from one ad spend pool.

| Meta Ads account | Name | Currency | Stores served |
|---|---|---|---|
| `act_1765937727381511` | URBAN-CAD-IST | CAD | `f51039.myshopify.com` (Urban Classics) |
| `act_654879327196107` | AyurPet – Ad Acc. 1 | INR | `1ygbmd-pr.myshopify.com` (**India storefront**) + `2684sq-mt.myshopify.com` (**Global storefront**). Single ad account routes traffic to both storefronts based on audience/geo targeting. ROAS must be reconciled across BOTH when evaluating this ad account. |
| `act_1231977889107681` | Clasicoo-IST-CAD | CAD | `52j1ga-hz.myshopify.com` (?) |
| `act_1214314967570733` | The AyurPet (Read-Only) | INR | — (read-only, reporting only; not ad delivery) |

**Legend:**
- **Family** = merchant / brand group. Shared family often shares contact owner + similar commercial terms.
- **Custom App** = the `auth.<app-name>.$.jsx` route + `<APPNAME>_CLIENT_ID` env var in the auth-hub repo (`multi-store-theme-manager`).
- **Scope status:** ✅ = has write_orders (cod-confirm Shopify tag write-back works + ads agent receives order webhooks); ⚠ = missing, must be added in the Custom App's admin panel; ⏳ = pending install / onboarding.
- `TBD` = field to fill once the store is onboarded.

---

## Connection paths (auth hub at `shopify.glitchexecutor.com`, port 3101)

All install URLs live in **`/home/support/multi-store-theme-manager/app/routes/auth.<app>.$.jsx`**. The served host is **`https://shopify.glitchexecutor.com`** (nginx → port 3101 → this repo). Each Shopify Custom App's Allowed Redirect URIs must include the callback listed below.

| App name | Install URL (give to merchant once) | OAuth callback (register in Shopify Custom App config) | Env-var prefix |
|---|---|---|---|
| `urban` | `/auth/urban/install?shop=<shop>.myshopify.com` | `/auth/urban/callback` | `URBAN_*` |
| `storico` | `/auth/storico/install?shop=<shop>.myshopify.com` | `/auth/storico/callback` | `STORICO_*` |
| `classicoo` | `/auth/classicoo/install?shop=<shop>.myshopify.com` | `/auth/classicoo/callback` | `CLASSICOO_*` |
| `trendsetters` | `/auth/trendsetters/install?shop=<shop>.myshopify.com` | `/auth/trendsetters/callback` | `TRENDSETTERS_*` |
| `ayurpet-ind` | `/auth/ayurpet-ind/install?shop=<shop>.myshopify.com` | `/auth/ayurpet-ind/callback` | `AYURPET_IND_*` |
| `ayurpet` | `/auth/ayurpet/install?shop=<shop>.myshopify.com` | `/auth/ayurpet/callback` | `AYURPET_*` |
| `mokshya` | `/auth/mokshya/install?shop=<shop>.myshopify.com` | `/auth/mokshya/callback` | `MOKSHYA_*` (alias of `SHOPIFY_API_KEY`/`SECRET`) |

All callback domains: **`https://shopify.glitchexecutor.com`** (must match exactly in Shopify's Allowed Redirection URLs).

**Adding a new Custom App / new client:**
1. Merchant creates a Shopify Custom App in their store admin, sets Allowed Redirection URL to `https://shopify.glitchexecutor.com/auth/<newname>/callback`.
2. Merchant copies the API Key (Client ID — 32-char hex) and API Secret Key (Client Secret — `shpss_...`) out of the Custom App UI.
3. Add 3 env vars to `/home/support/multi-store-theme-manager/.env`:
   ```
   NEWNAME_CLIENT_ID=...
   NEWNAME_CLIENT_SECRET=shpss_...
   NEWNAME_SCOPES=<csv of desired scopes — cod-confirm needs write_orders, others from baseline list>
   ```
4. Copy `app/routes/auth.classicoo.$.jsx` → `app/routes/auth.<newname>.$.jsx` and replace `CLASSICOO_` → `NEWNAME_` + "Classicoo" → "Newname" (3 text replacements; see the file comment in auth.classicoo.$.jsx).
5. `pnpm build && sudo systemctl restart shopify-app.service`.
6. Give merchant the install URL. They click, approve, Shopify redirects to our callback, session saved in Prisma.
7. Add a row to the Summary table above + a detail section below.

---

## Per-store details

### Urban family

#### Urban Classics — `f51039.myshopify.com`

- **Store handle:** `urban-classics-hd` (admin.shopify.com/store/urban-classics-hd)
- **Custom App:** `urban`
- **Install:** `https://shopify.glitchexecutor.com/auth/urban/install?shop=f51039.myshopify.com`
- **Installed:** 2026-03 (baseline)
- **Scopes granted:** `write_files, write_inventory, read_locales, write_online_store_navigation, write_orders, read_product_listings, write_products, write_content, write_themes, write_translations`
- **cod-confirm:** ✅ live, validated end-to-end on 2026-04-15 (Sarvam Bulbul v3 + Vobiz SIP)
- **ads agent:** ✅ 5 webhooks registered 2026-04-16 (ORDERS_CREATE / PAID / FULFILLED / CANCELLED / REFUNDS_CREATE), cod-confirm webhook preserved, 82 orders backfilled to PostHog
- **Meta Ads account:** `act_1765937727381511` — **URBAN-CAD-IST** (CAD, New York, status=3)
  - Secondary / earlier: `act_1909845012991177` "Urban-CAD-IST" (CAD, Philadelphia), `act_769104785114570` "urban global" (CAD, Lake Elsinore)

#### Storico — `ys4n0u-ys.myshopify.com`

- **Store handle:** TBD (not yet installed)
- **Custom App:** `storico`
- **Custom App credentials:** issued 2026-04-16, filed in `/home/support/multi-store-theme-manager/.env` as `STORICO_CLIENT_ID` + `STORICO_CLIENT_SECRET`
- **OAuth callback (register in Shopify Custom App):** `https://shopify.glitchexecutor.com/auth/storico/callback`
- **Install URL (send to merchant):** `https://shopify.glitchexecutor.com/auth/storico/install?shop=ys4n0u-ys.myshopify.com`
- **Auth-hub route:** ✅ `app/routes/auth.storico.$.jsx` created 2026-04-16, `shopify-app.service` restarted, route returns 302 to Shopify OAuth (verified).
- **Status:** ✅ already installed via OAuth before 2026-04-16 scope unification — offline session present in Prisma with a working `shpca_...` token and the baseline 9-scope set (no read_orders, no read_customers). Re-install via the URL above will upgrade to the full unified 15-scope baseline.
- **Next steps:**
  1. Merchant enables unified scopes in their Custom App admin UI.
  2. Merchant clicks re-install URL → fresh `offline_*` session overwrites the old one, with full scopes.
  3. `python ops/scripts/register_webhooks.py --store storico` from the ads-agent repo (registers the 5 order webhooks).
  4. `python ops/scripts/backfill_posthog.py --store storico --days 90`.
- **Meta Ads account:** TBD (family shares Meta account space with Urban / Classicoo; assignment depends on merchant's spend plan).

#### Classicoo — `52j1ga-hz.myshopify.com`

- **Store handle:** TBD
- **Custom App:** `classicoo`
- **Status:** installed (session present in Prisma), but ⚠ **no write_orders scope** → order webhooks cannot be registered (`webhookSubscriptionCreate` returns "cannot create webhook subscription with the specified topic"), and ads agent cannot track orders from this store until scopes are bumped.
- **Scope bump required:** add `read_orders, write_orders, read_customers, read_products, read_analytics, read_reports` to `CLASSICOO_SCOPES` in auth-hub `.env`, rebuild, force merchant re-consent.
- **Meta Ads account:** `act_1231977889107681` — **Clasicoo-IST-CAD** (CAD, ownership to confirm)

#### Trendsetters — `acmsuy-g0.myshopify.com`

- **Store handle:** TBD (not yet installed)
- **Custom App:** `trendsetters`
- **Custom App credentials:** issued 2026-04-16, filed in `/home/support/multi-store-theme-manager/.env` as `TRENDSETTERS_CLIENT_ID` + `TRENDSETTERS_CLIENT_SECRET`.
- **OAuth callback (register in Shopify Custom App):** `https://shopify.glitchexecutor.com/auth/trendsetters/callback`
- **Install URL (send to merchant):** `https://shopify.glitchexecutor.com/auth/trendsetters/install?shop=acmsuy-g0.myshopify.com`
- **Auth-hub route:** ✅ `app/routes/auth.trendsetters.$.jsx` created 2026-04-16, `shopify-app.service` restarted, route returns 302 to Shopify OAuth (verified).
- **Status:** ⏳ awaiting merchant to (1) configure unified scopes in their Custom App admin UI, (2) click the install URL.
- **Next steps (once installed):**
  1. `python ops/scripts/register_webhooks.py --store trendsetters` from the ads-agent repo.
  2. `python ops/scripts/backfill_posthog.py --store trendsetters --days 90`.
- **Meta Ads account:** TBD (Urban family — assignment depends on merchant's spend plan).

---

### Ayurpet family

Both storefronts share a single Meta Ads account (`act_654879327196107`). ROAS must be computed across BOTH storefronts when evaluating this ad account's performance.

#### Ayurpet (India storefront) — `1ygbmd-pr.myshopify.com`

- **Store handle:** `ayurpet` (admin.shopify.com/store/ayurpet)
- **Role:** India-market sales storefront. Traffic from India-targeted Meta ads lands here.
- **Custom App:** `ayurpet-ind`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/ayurpet-ind/install?shop=1ygbmd-pr.myshopify.com`
- **Installed:** 2026-04-15
- **Scopes granted:** full baseline incl. `write_orders` (updated 2026-04-15).
- **cod-confirm status:** not enrolled (user decision — NOT running voice-AI confirmation on Ayurpet for now).
- **ads agent:** ✅ 5 webhooks registered 2026-04-16, 137 orders backfilled to PostHog.
- **Meta Ads account:** `act_654879327196107` — **AyurPet – Ad Acc. 1** (INR, ₹7.3L lifetime spend). Also drives the Global storefront below.
  - Reporting-only alternate: `act_1214314967570733` "The AyurPet (Read-Only)" (INR, 0 spend) — not used for delivery.

#### Ayurpet (Global storefront) — `2684sq-mt.myshopify.com`

- **Store handle:** `2684sq-mt` (admin.shopify.com/store/2684sq-mt)
- **Role:** Global-market sales storefront (ex-India). Traffic from geo-targeted Meta ads for Global audiences lands here.
- **Custom App:** `ayurpet`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/ayurpet/install?shop=2684sq-mt.myshopify.com`
- **Installed:** 2026-04-15
- **Scopes granted:** full baseline incl. `write_orders` (updated 2026-04-15).
- **cod-confirm status:** not enrolled (global markets typically not COD-heavy; revisit if Global storefront starts offering COD in markets like UAE, Bangladesh, etc.).
- **ads agent:** ✅ 5 webhooks registered 2026-04-16, 119 orders backfilled to PostHog.
- **Meta Ads account:** `act_654879327196107` — **AyurPet – Ad Acc. 1** (shared with India storefront). Ad account is configured in INR even though it drives Global sales — **flag this for the ad-account diagnostic**.

---

### Mokshya (standalone)

#### Mokshya — `5u7mdi-ap.myshopify.com`

- **Store handle:** TBD
- **Custom App:** `mokshya` — **shares credentials** with the auth-hub default app (`SHOPIFY_API_KEY` = `75d0ca694c091038f5977bff53a8c326`, `SHOPIFY_API_SECRET` = `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`). For symmetry with the other slugs, `MOKSHYA_CLIENT_ID` and `MOKSHYA_CLIENT_SECRET` env vars alias those values in `/home/support/multi-store-theme-manager/.env`.
- **OAuth callback (register in Shopify Custom App):** `https://shopify.glitchexecutor.com/auth/mokshya/callback`
- **Install URL (send to merchant):** `https://shopify.glitchexecutor.com/auth/mokshya/install?shop=5u7mdi-ap.myshopify.com`
- **Auth-hub route:** ✅ `app/routes/auth.mokshya.$.jsx` created 2026-04-16, `shopify-app.service` restarted, route returns 302 to Shopify OAuth (verified).
- **Status:** ⚠ existing `offline_5u7mdi-ap.myshopify.com` session has a token that Shopify rejects with 401 (`Invalid API key or access token`). Root cause unclear — likely revoked when Custom App config was edited in merchant admin at some point. Merchant needs to re-install once unified scopes are enabled.
- **Next steps:**
  1. Merchant enables the unified scope set in their Custom App admin UI.
  2. Merchant clicks the install URL; fresh `offline_*` session lands in Prisma with working token.
  3. `python ops/scripts/register_webhooks.py --store mokshya` from the ads-agent repo.
  4. `python ops/scripts/backfill_posthog.py --store mokshya --days 90`.
- **Brand context:** Western-seeker targeting, spiritual/Hinduism-adjacent (not Indian diaspora — see `project_mokshya_positioning` memory).
- **Meta Ads account:** TBD (standalone — not shared with Urban or Ayurpet families).

---

### Internal / test

- `glitch-seo-test-1.myshopify.com` — internal test store for the Glitch SEO public app, no ad account, no client-store role. Kept in Summary for completeness but does not count toward the 7 client storefronts.

---

## Cross-repo map

| Service | Lives at | Reads from Session table | Purpose |
|---|---|---|---|
| auth hub | `/home/support/multi-store-theme-manager/` (port 3101, `shopify-app.service`) | writes on install | All `/auth/<app>/*` OAuth endpoints. Writes `offline_<shop>` sessions. |
| glitch-grow public app | `/home/support/glitch-grow-public/` (port 3102, `shopify-app-public.service`) | reads offline sessions | Glitch SEO + future Glitch Grow public features. |
| cod-confirm | `/home/support/glitch-cod-confirm/` (port 3104, `cod-confirm.service`) | reads offline sessions | LiveKit + Sarvam Bulbul v3 voice AI for COD order confirmation. |
| cod-confirm agent | `/home/support/glitch-cod-confirm/src/livekit-agent.js` (port 8081, `cod-confirm-agent.service`) | via sibling call | LiveKit worker that runs the agent session for each PSTN call. |
| **ads agent** | `/home/support/glitch-grow-ads-agent/` (port 3110, `glitch-ads-bot.service`, domain `insights.glitchexecutor.com`) | reads sessions (asyncpg RO) | Webhook receiver → PostHog; future LangGraph insights + Meta Ads write-actions via Telegram. |
| meta ads MCP | `meta-ads-mcp.service` | — | MCP server exposing Meta Ads (read/write) to internal tools. Ad-account IDs above resolve via this. |

All six services share the same Postgres at `127.0.0.1:5432/shopify_app` (table `Session`).

---

## Change log for this file

- **2026-04-15** — initial version. Ayurpet primary + secondary stores installed and enrolled. Urban Classics baseline documented. Meta Ads cross-reference populated from `get_ad_accounts` snapshot.
- **2026-04-15 (later)** — user confirmed: both Ayurpet Shopify stores (`1ygbmd-pr` + `2684sq-mt`) share a single Meta Ads account (`act_654879327196107`). Added reverse-view table so ROAS reconciliation is obvious at a glance. `2684sq-mt` role within the Ayurpet brand still TBD.
- **2026-04-16** — Glitch Grow Ads Agent (`/home/support/glitch-grow-ads-agent`) deployed at `insights.glitchexecutor.com`. 15 Shopify webhooks registered across Urban + both Ayurpets; 338 orders backfilled to PostHog (Urban 82 / Ayurpet India 137 / Ayurpet Global 119). `cod-confirm` webhook on Urban preserved (script never touches other services' hooks).
- **2026-04-16 (restructure)** — introduced **client family** grouping: Urban family (Urban Classics, Storico, Classicoo, Trendsetters), Ayurpet family (India + Global), Mokshya standalone. Added **Storico** (`ys4n0u-ys.myshopify.com`, Custom App `storico`, creds issued 2026-04-16). Added **Trendsetters** and **Mokshya** as onboarding placeholders. Removed `5u7mdi-ap.myshopify.com` (dead session, not a real storefront). Total active client storefronts: 7 — 4 installed, 1 credentials-issued, 2 not yet onboarded.
- **2026-04-16 (scope unification)** — all `*_SCOPES` env vars in auth hub bumped to unified 15-scope analytics-ready baseline (read_orders, write_orders, read_customers, read_products, write_products, read_product_listings, read_analytics, read_reports, write_content, write_files, write_themes, write_translations, write_inventory, read_locales, write_online_store_navigation). Added **Trendsetters** creds (`acmsuy-g0.myshopify.com`, Custom App `trendsetters`). Created `auth.storico.$.jsx` and `auth.trendsetters.$.jsx` routes. Rebuilt + restarted `shopify-app.service`, both new routes verified live. All 4 already-installed stores (Urban Classics, Classicoo, Ayurpet India, Ayurpet Global) need merchant re-install after they enable the new scopes in their Custom App admin UI — install URLs listed at the top of this doc. Also updated ads-agent `.env` `SHOPIFY_WEBHOOK_SECRETS` to include storico + trendsetters HMAC secrets, and ads-agent `src/ads_agent/config.py` to register all 6 stores.
- **2026-04-16 (Mokshya correction)** — corrected `5u7mdi-ap.myshopify.com` identity: it is **Mokshya**, not a dead Classicoo secondary. Uses the auth-hub default app credentials (`SHOPIFY_API_KEY/SECRET`). Created `auth.mokshya.$.jsx` route + `MOKSHYA_*` env var aliases. Rebuilt + restarted auth hub, install URL verified. Store count reaches **7 client storefronts confirmed**. Existing token 401s (likely revoked when Custom App was last edited) — merchant re-install required via `https://shopify.glitchexecutor.com/auth/mokshya/install?shop=5u7mdi-ap.myshopify.com`.
- **2026-04-16 (maximal scope set — final)** — replaced the 15-scope unified baseline with a **41-scope maximal set** covering all foreseeable ads-ops / analytics / content-tooling / HITL-write use cases. Initially tried 44 but Shopify's Custom App UI rejected `read_all_orders` (gated — Partner Dashboard approval), `read_product_listings` (sales-channel legacy REST scope), and `read_purchase_options` (Subscription-API gated). Dropped those three; remaining 41 all validated via live install URL. Key additions vs. previous 15-scope baseline: `read_returns`, `read_fulfillments`, `read_customer_events`, `read_draft_orders` / `write_draft_orders`, `read_order_edits`, `read_marketing_events` / `write_marketing_events`, `read_discounts` / `write_discounts`, `read_price_rules` / `write_price_rules`, `read_markets`, `read_metaobjects` / `read_metaobject_definitions`, `read_shipping`, `read_shopify_payments_payouts` / `_disputes`, `read_privacy_settings`, `read_online_store_pages`, `write_customers`, `write_pixels`. Updated all 8 `*_SCOPES` vars (including top-level `SCOPES`). Rebuilt + restarted auth hub, verified 41-scope OAuth URL for `urban`. This is intended to be the LAST scope change we ask merchants to approve — future agent features will use the already-granted scope set.
