# Shopify Stores Infra — canonical reference

> **Single source of truth** for the Glitch Grow Shopify fleet: store domain ↔ Custom App ↔ OAuth install path ↔ Meta Ads account mapping. Any Shopify-adjacent workflow (cod-confirm, ads agent, glitch-grow-public, meta-ads-mcp, future services) reads this file first.

**Canonical home:** `multi-store-theme-manager/SHOPIFY_STORES_INFRA.md` (auto-synced to GitHub every 15 min via `/home/support/bin/git-sync-all`).

## What this file maps

1:1:1:N relationship between, for each client storefront:
- **Shopify store handle** — `admin.shopify.com/store/<handle>` slug
- **myshopify subdomain** — `<random>.myshopify.com`, the canonical identifier
- **Custom App slug** — the `auth.<slug>.$.jsx` route + `<SLUG>_CLIENT_ID/_SECRET/_SCOPES` env vars
- **Meta Ads account(s)** — usually one per currency; some clients have multiple accounts across agencies

**How to read:** stores are grouped into **client families** (a family shares a merchant/owner and often an ad account across storefronts/currencies). Each store has one row in the Summary table and a detailed block below with credentials, install state, and ad-account mappings.

**When to update:** after any install, re-install, scope change, ad-account attach/detach, domain change, or merchant handover.

**Who consumes this:**
- `auth-hub` (`multi-store-theme-manager`) — `<SLUG>_*` env vars + `auth.<slug>.$.jsx` routes must match entries here
- `cod-confirm` — shop → custom-app mapping for session token lookup
- `glitch-grow-ads-agent` — `src/ads_agent/config.py` STORES tuple + `SHOPIFY_WEBHOOK_SECRETS` map mirror this file
- `meta-ads-mcp` — ad-account IDs here resolve to MCP queries
- Future agents / tooling — treat this doc as authoritative, not the memory pointers

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

Source: live Meta ad-accounts snapshot via `meta-ads-mcp get_ad_accounts`, 2026-04-16.

| Family | Client / brand | Store handle | myshopify domain | Custom App | Scope status | Primary Meta Ads account |
|---|---|---|---|---|---|---|
| Urban | Urban Classics | urban-classics-hd | `f51039.myshopify.com` | `urban` | ✅ full 33 scopes | `act_1765937727381511` URBAN-CAD-IST (CAD, $3.7K spent) |
| Urban | **Storico** | TBD | `ys4n0u-ys.myshopify.com` | `storico` | ✅ full 33 scopes | `act_1072546905038329` Storico-New-CAD-IST (CAD, $2.6K spent) |
| Urban | Classicoo | TBD | `52j1ga-hz.myshopify.com` | `classicoo` | ✅ full 33 scopes | `act_1231977889107681` Clasicoo-IST-CAD (CAD, $54 spent) |
| Urban | **Trendsetters** | TBD | `acmsuy-g0.myshopify.com` | `trendsetters` | ✅ full 33 scopes | `act_1445770643706149` Trendsetter-IST-CAD (CAD, $717 spent) |
| Ayurpet | Ayurpet (India) | ayurpet | `1ygbmd-pr.myshopify.com` | `ayurpet-ind` | ✅ full 33 scopes | `act_654879327196107` AyurPet – Ad Acc. 1 (INR, ₹7.3L spent) |
| Ayurpet | Ayurpet (Global) | 2684sq-mt | `2684sq-mt.myshopify.com` | `ayurpet` | ✅ full 33 scopes | `act_654879327196107` AyurPet – Ad Acc. 1 (shared with India) |
| Mokshya | **Mokshya** | TBD | `5u7mdi-ap.myshopify.com` | `mokshya` (alias of default app) | ✅ full 33 scopes | `act_507013211846013` MOKSHYA-CAD-EST (CAD, $2.2K) + `act_30237311672580998` Mokshya-INR-IST (INR, ₹1.8K) |
| Internal | Glitch SEO (test) | glitch-seo-test-1 | `glitch-seo-test-1.myshopify.com` | public app (Glitch SEO) | n/a | n/a |

**Total active client storefronts: 7** — all 7 installed, all 7 fully scoped as of 2026-04-16. 35 Shopify webhooks live (5 topics × 7 stores → `https://insights.glitchexecutor.com/shopify/webhook/<shop>`).

## Reverse view (ad account → Shopify stores)

Useful when reconciling ROAS across multiple storefronts that feed from one ad-spend pool.

| Meta Ads account | Name | Currency | Spend (lifetime) | Stores served |
|---|---|---|---|---|
| `act_1765937727381511` | URBAN-CAD-IST | CAD | $3,711.45 | `f51039.myshopify.com` (Urban Classics) — primary |
| `act_1909845012991177` | Urban-CAD-IST | CAD | $1,156.14 | `f51039.myshopify.com` (Urban Classics) — secondary |
| `act_769104785114570` | urban global | CAD | $142.26 | `f51039.myshopify.com` (Urban Classics) — older, Lake Elsinore |
| `act_1072546905038329` | Storico-New-CAD-IST | CAD | $2,597.57 | `ys4n0u-ys.myshopify.com` (Storico) — primary |
| `act_1134191618602887` | STORICO-IST-CAD | CAD | $1,675.03 | `ys4n0u-ys.myshopify.com` (Storico) — secondary |
| `act_755235000581939` | Storico-New-CAD | CAD | $555.93 | `ys4n0u-ys.myshopify.com` (Storico) — Venice |
| `act_3446595268850626` | Storico-CAD-IST | CAD | $122.09 | `ys4n0u-ys.myshopify.com` (Storico) — Olympia, status=disabled |
| `act_639776792472184` | STORICO-IST-CAD | CAD | $0 | `ys4n0u-ys.myshopify.com` (Storico) — status=disabled |
| `act_1506176744351423` | Storico-CAD-IST | CAD | $0 | `ys4n0u-ys.myshopify.com` (Storico) — Buffalo, unused |
| `act_1231977889107681` | Clasicoo-IST-CAD | CAD | $53.81 | `52j1ga-hz.myshopify.com` (Classicoo) |
| `act_1445770643706149` | Trendsetter-IST-CAD | CAD | $717.20 | `acmsuy-g0.myshopify.com` (Trendsetters) |
| `act_654879327196107` | AyurPet – Ad Acc. 1 | INR | ₹730,138.31 | `1ygbmd-pr.myshopify.com` (India) + `2684sq-mt.myshopify.com` (Global) — **single account serves both**. ROAS must be reconciled across BOTH storefronts. |
| `act_1214314967570733` | The AyurPet (Read-Only) | INR | ₹0 | `1ygbmd-pr` + `2684sq-mt` — reporting-only, not ad delivery |
| `act_507013211846013` | MOKSHYA-CAD-EST | CAD | $2,179.61 | `5u7mdi-ap.myshopify.com` (Mokshya) — CAD delivery |
| `act_30237311672580998` | Mokshya – INR – IST | INR | ₹1,843.84 | `5u7mdi-ap.myshopify.com` (Mokshya) — INR delivery |

**Notes:**
- Urban, Storico, and Mokshya each have **multiple ad accounts** across agencies/timezones. The Summary table lists the highest-spend primary; the Reverse view is the full map. Any ROAS reconciliation must sum spend across all accounts for a given store.
- Ayurpet + Mokshya follow the same pattern (one brand, multiple currency-specific ad accounts). Agent reconciliation logic should group by `brand`, not `ad_account`, when computing true ROAS.

**Legend:**
- **Family** = merchant / brand group. Shared family often shares contact owner + similar commercial terms.
- **Custom App** = the `auth.<app-name>.$.jsx` route + `<APPNAME>_CLIENT_ID` env var in the auth-hub repo (`multi-store-theme-manager`).
- **Scope status:** ✅ full 33 scopes = the unified 2026-04-16 baseline is granted and active. Webhooks registered, backfill complete.
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
- **Installed:** 2026-03 (baseline), re-installed 2026-04-16 with full 33-scope set.
- **Scopes granted:** full unified 33-scope set.
- **cod-confirm:** ✅ live, validated end-to-end on 2026-04-15 (Sarvam Bulbul v3 + Vobiz SIP)
- **ads agent:** ✅ 5 webhooks registered (`ORDERS_CREATE`, `_PAID`, `_FULFILLED`, `_CANCELLED`, `REFUNDS_CREATE`), cod-confirm webhook preserved; 441 unique orders in PostHog (90-day window, 82 paid, CAD $446K paid revenue, 72% email coverage).
- **Meta Ads accounts:**
  - **Primary:** `act_1765937727381511` — URBAN-CAD-IST (CAD, $3,711.45 spent, New York, status=3 delimited)
  - Secondary: `act_1909845012991177` — Urban-CAD-IST (CAD, $1,156.14 spent, Philadelphia, status=1 active)
  - Legacy: `act_769104785114570` — urban global (CAD, $142.26 spent, Lake Elsinore, status=2)

#### Storico — `ys4n0u-ys.myshopify.com`

- **Store handle:** TBD
- **Custom App:** `storico`
- **Custom App credentials:** issued 2026-04-16, filed in `.env` as `STORICO_CLIENT_ID` + `STORICO_CLIENT_SECRET`.
- **OAuth callback:** `https://shopify.glitchexecutor.com/auth/storico/callback`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/storico/install?shop=ys4n0u-ys.myshopify.com`
- **Auth-hub route:** ✅ `app/routes/auth.storico.$.jsx` created 2026-04-16, verified live.
- **Installed:** pre-2026-04-16 with baseline; re-installed 2026-04-16 with full 33-scope set.
- **Scopes granted:** full unified 33-scope set.
- **ads agent:** ✅ 5 webhooks registered; 311 unique orders in PostHog (90-day, 109 paid, $697K paid revenue, 52% email, 11% UTM coverage).
- **Meta Ads accounts (multiple — reconcile ROAS across all):**
  - **Primary:** `act_1072546905038329` — Storico-New-CAD-IST (CAD, $2,597.57 spent, Philadelphia)
  - Secondary: `act_1134191618602887` — STORICO-IST-CAD (CAD, $1,675.03 spent, Clovis)
  - Also live: `act_755235000581939` Storico-New-CAD ($555), `act_3446595268850626` Storico-CAD-IST ($122, disabled), `act_639776792472184` STORICO-IST-CAD ($0, disabled), `act_1506176744351423` Storico-CAD-IST ($0, unused)

#### Classicoo — `52j1ga-hz.myshopify.com`

- **Store handle:** TBD
- **Custom App:** `classicoo`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/classicoo/install?shop=52j1ga-hz.myshopify.com`
- **Installed:** pre-2026-04-16 with baseline; re-installed 2026-04-16 with full 33-scope set.
- **Scopes granted:** full unified 33-scope set.
- **ads agent:** ✅ 5 webhooks registered 2026-04-16; 22 unique orders in PostHog (all `PENDING`/`VOIDED` — 0 paid in last 90 days — likely COD-heavy or test-mode store).
- **Meta Ads account:** `act_1231977889107681` — **Clasicoo-IST-CAD** (CAD, $53.81 spent, Anchorage, status=1 active)

#### Trendsetters — `acmsuy-g0.myshopify.com`

- **Store handle:** TBD
- **Custom App:** `trendsetters`
- **Custom App credentials:** issued 2026-04-16, filed in `.env` as `TRENDSETTERS_CLIENT_ID` + `TRENDSETTERS_CLIENT_SECRET`.
- **OAuth callback:** `https://shopify.glitchexecutor.com/auth/trendsetters/callback`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/trendsetters/install?shop=acmsuy-g0.myshopify.com`
- **Auth-hub route:** ✅ `app/routes/auth.trendsetters.$.jsx` created 2026-04-16, verified live.
- **Installed:** 2026-04-16 (fresh install with full 33-scope set).
- **Scopes granted:** full unified 33-scope set.
- **ads agent:** ✅ 5 webhooks registered 2026-04-16; 302 unique orders in PostHog (90-day, 65 paid, 251K paid revenue, 82% email coverage).
- **Meta Ads account:** `act_1445770643706149` — **Trendsetter-IST-CAD** (CAD, $717.20 spent, Los Angeles, status=1 active)

---

### Ayurpet family

Both storefronts share a single Meta Ads account (`act_654879327196107`). ROAS must be computed across BOTH storefronts when evaluating this ad account's performance.

#### Ayurpet (India storefront) — `1ygbmd-pr.myshopify.com`

- **Store handle:** `ayurpet` (admin.shopify.com/store/ayurpet)
- **Role:** India-market sales storefront. Traffic from India-targeted Meta ads lands here.
- **Custom App:** `ayurpet-ind`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/ayurpet-ind/install?shop=1ygbmd-pr.myshopify.com`
- **Installed:** 2026-04-15; re-installed 2026-04-16 with full 33-scope set.
- **Scopes granted:** full unified 33-scope set.
- **cod-confirm status:** not enrolled (user decision — NOT running voice-AI confirmation on Ayurpet for now).
- **ads agent:** ✅ 5 webhooks registered; 172 unique orders in PostHog (90-day, 138 paid, ₹430K paid revenue, 31% email coverage).
- **Meta Ads account:** `act_654879327196107` — **AyurPet – Ad Acc. 1** (INR, ₹730,138.31 lifetime spent). Also drives the Global storefront below.
  - Reporting-only alternate: `act_1214314967570733` "The AyurPet (Read-Only)" (INR, 0 spend) — not used for delivery.

#### Ayurpet (Global storefront) — `2684sq-mt.myshopify.com`

- **Store handle:** `2684sq-mt` (admin.shopify.com/store/2684sq-mt)
- **Role:** Global-market sales storefront (ex-India). Traffic from geo-targeted Meta ads for Global audiences lands here.
- **Custom App:** `ayurpet`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/ayurpet/install?shop=2684sq-mt.myshopify.com`
- **Installed:** 2026-04-15; re-installed 2026-04-16 with full 33-scope set.
- **Scopes granted:** full unified 33-scope set.
- **cod-confirm status:** not enrolled (global markets typically not COD-heavy; revisit if Global storefront starts offering COD in markets like UAE, Bangladesh, etc.).
- **ads agent:** ✅ 5 webhooks registered; 122 unique orders in PostHog (90-day, 119 paid, 17K paid revenue, 33% email, **50% UTM coverage** — best across all 7 stores).
- **Meta Ads account:** `act_654879327196107` — **AyurPet – Ad Acc. 1** (shared with India storefront). Ad account is configured in INR even though it drives Global sales — **flag for ad-account diagnostic**: revenue from this storefront is multi-currency (USD for most Global orders) but spend attribution flows through an INR ad account. Reconciliation must convert currencies before computing true ROAS.

---

### Mokshya (standalone)

#### Mokshya — `5u7mdi-ap.myshopify.com`

- **Store handle:** TBD
- **Custom App:** `mokshya` — **shares credentials** with the auth-hub default app (`SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET`). For symmetry with the other slugs, `MOKSHYA_CLIENT_ID` and `MOKSHYA_CLIENT_SECRET` env vars alias those values in the auth-hub `.env`.
- **OAuth callback:** `https://shopify.glitchexecutor.com/auth/mokshya/callback`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/mokshya/install?shop=5u7mdi-ap.myshopify.com`
- **Auth-hub route:** ✅ `app/routes/auth.mokshya.$.jsx` created 2026-04-16, verified live.
- **Installed:** re-installed 2026-04-16 with full 33-scope set (previous token was revoked).
- **Scopes granted:** full unified 33-scope set.
- **ads agent:** ✅ 5 webhooks registered; 1 unique order in PostHog (90-day window — low-volume store).
- **Brand context:** Western-seeker targeting, spiritual/Hinduism-adjacent (not Indian diaspora — see `project_mokshya_positioning` memory).
- **Meta Ads accounts (multiple — reconcile across currencies like Ayurpet):**
  - **CAD delivery:** `act_507013211846013` — MOKSHYA-CAD-EST (CAD, $2,179.61 spent, status=3)
  - **INR delivery:** `act_30237311672580998` — Mokshya – INR – IST (INR, ₹1,843.84 spent, Delhi, status=3)

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
- **2026-04-16 (maximal scope set — final)** — replaced the 15-scope unified baseline with a **33-scope maximal set** covering all foreseeable ads-ops / analytics / content-tooling / HITL-write use cases. Iteratively trimmed from 44 → 41 → 33 as Shopify Custom App UI rejected newer scope names. Key additions vs. previous 15-scope baseline: `read_returns`, `read_fulfillments`, `read_customer_events`, `read_draft_orders` / `write_draft_orders`, `read_marketing_events` / `write_marketing_events`, `read_discounts` / `write_discounts`, `read_price_rules` / `write_price_rules`, `read_locations`, `read_shipping`, `write_customers`, `write_pixels`. Updated all 8 `*_SCOPES` vars. All 7 merchants enabled scopes in their Custom App admin UIs and re-installed. All 7 storefronts now running full 33-scope set. This is the LAST scope change — future agent features use the already-granted set.
- **2026-04-16 (post-enablement verification)** — ran live `read_customers` + `customerJourneySummary` queries across all 7 storefronts: all returned customer emails and UTM attribution (where populated). 35 Shopify webhooks total (5 topics × 7 stores) firing to `insights.glitchexecutor.com`. Backfilled 1,371 order events into PostHog (all lifecycle states, not just paid) with order-native `createdAt` as event timestamp, customer IDs for person-stitching, UTM params flattened as `utm_source/medium/campaign/content/term`, and line-item JSON.
- **2026-04-16 (doc rename + Meta account refresh)** — renamed `STORES.md` → `SHOPIFY_STORES_INFRA.md` (canonical doc across all Shopify-adjacent workflows — cod-confirm, ads agent, meta-ads-mcp, future services). Live Meta ad-account snapshot pulled via `meta-ads-mcp get_ad_accounts`, Summary + Reverse-view tables updated: Trendsetters → `act_1445770643706149`; Storico → `act_1072546905038329` primary (+ 5 secondary accounts); Mokshya → `act_507013211846013` CAD + `act_30237311672580998` INR (dual-currency like Ayurpet). All account spend figures refreshed.
