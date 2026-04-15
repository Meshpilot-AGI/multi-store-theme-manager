# Stores — Shopify installs + Meta Ads mapping

Single source of truth for which Shopify store uses which Custom App, OAuth
install/callback path, and which Meta Ads account drives its paid traffic.

**Why this file exists:** as we onboard more Glitch Grow clients, the mapping
between _store handle_ (admin.shopify.com/store/&lt;handle&gt;), _myshopify
subdomain_ (X.myshopify.com), _Custom App_ (per-client), and _Meta Ads account_
becomes impossible to hold in memory. This is the map.

**How to read:** each store has ONE row in the summary table, then a detail
section below with full credentials and install state.

**When to update:** after any install / re-install / scope change / ad-account
re-attach / domain change. This repo auto-syncs to GitHub every 15 min
(`/home/support/bin/git-sync-all` cron).

---

## Summary (Shopify store → ad account)

| Client / brand | Store handle | myshopify domain | Custom App | Scope status | Meta Ads account |
|---|---|---|---|---|---|
| Urban Classics | urban-classics-hd | `f51039.myshopify.com` | `urban` | ✅ write_orders | `act_1765937727381511` URBAN-CAD-IST |
| **Ayurpet (India)** | ayurpet | `1ygbmd-pr.myshopify.com` | `ayurpet-ind` | ✅ write_orders (updated 2026-04-15) | `act_654879327196107` AyurPet – Ad Acc. 1 |
| **Ayurpet (Global)** | 2684sq-mt | `2684sq-mt.myshopify.com` | `ayurpet` | ✅ write_orders (updated 2026-04-15) | `act_654879327196107` AyurPet – Ad Acc. 1 (same — India + Global feed from one ad account) |
| Classicoo (?) | — | `52j1ga-hz.myshopify.com` | `classicoo` | no write_orders | `act_1231977889107681` Clasicoo-IST-CAD (?) |
| Classicoo (?) | — | `5u7mdi-ap.myshopify.com` | `classicoo` | no write_orders | TBD |
| Internal | glitch-seo-test-1 | `glitch-seo-test-1.myshopify.com` | public app (Glitch SEO) | n/a | n/a |

## Reverse view (ad account → Shopify stores)

Useful when reconciling ROAS across multiple storefronts that feed from one ad spend pool.

| Meta Ads account | Name | Currency | Stores served |
|---|---|---|---|
| `act_1765937727381511` | URBAN-CAD-IST | CAD | `f51039.myshopify.com` (Urban Classics) |
| `act_654879327196107` | AyurPet – Ad Acc. 1 | INR | `1ygbmd-pr.myshopify.com` (**India storefront**) + `2684sq-mt.myshopify.com` (**Global storefront**). Single ad account routes traffic to both storefronts based on audience/geo targeting. ROAS must be reconciled across BOTH when evaluating this ad account. |
| `act_1231977889107681` | Clasicoo-IST-CAD | CAD | `52j1ga-hz.myshopify.com` (?) |
| `act_1214314967570733` | The AyurPet (Read-Only) | INR | — (read-only, reporting only; not ad delivery) |

**Legend:**
- **Custom App** = the `auth.<app-name>.$.jsx` route + `<APPNAME>_CLIENT_ID` env var in the auth-hub repo (`multi-store-theme-manager`).
- **Scope status:** ✅ = has write_orders (cod-confirm Shopify tag write-back works); ⚠ = missing, must be added in the Custom App's admin panel before cod-confirm can tag orders.
- `(?)` = needs user confirmation.

---

## Connection paths (auth hub at `shopify.glitchexecutor.com`, port 3101)

All install URLs live in **`/home/support/multi-store-theme-manager/app/routes/auth.<app>.$.jsx`**. The served host is **`https://shopify.glitchexecutor.com`** (nginx → port 3101 → this repo). Each Shopify Custom App's Allowed Redirect URIs must include the callback listed below.

| App name | Install URL (give to merchant once) | OAuth callback (register in Shopify Custom App config) | Env-var prefix |
|---|---|---|---|
| `urban` | `/auth/urban/install?shop=<shop>.myshopify.com` | `/auth/urban/callback` | `URBAN_*` |
| `classicoo` | `/auth/classicoo/install?shop=<shop>.myshopify.com` | `/auth/classicoo/callback` | `CLASSICOO_*` |
| `ayurpet-ind` | `/auth/ayurpet-ind/install?shop=<shop>.myshopify.com` | `/auth/ayurpet-ind/callback` | `AYURPET_IND_*` |
| `ayurpet` | `/auth/ayurpet/install?shop=<shop>.myshopify.com` | `/auth/ayurpet/callback` | `AYURPET_*` |

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

### Urban Classics — `f51039.myshopify.com`

- **Store handle:** `urban-classics-hd` (admin.shopify.com/store/urban-classics-hd)
- **Custom App:** `urban`
- **Install:** `https://shopify.glitchexecutor.com/auth/urban/install?shop=f51039.myshopify.com`
- **Installed:** 2026-03 (baseline)
- **Scopes granted:** `write_files, write_inventory, read_locales, write_online_store_navigation, write_orders, read_product_listings, write_products, write_content, write_themes, write_translations`
- **cod-confirm:** ✅ live, validated end-to-end on 2026-04-15 (Sarvam Bulbul v3 + Vobiz SIP)
- **Meta Ads account:** `act_1765937727381511` — **URBAN-CAD-IST** (CAD, New York, status=3)
  - Secondary / earlier: `act_1909845012991177` "Urban-CAD-IST" (CAD, Philadelphia), `act_769104785114570` "urban global" (CAD, Lake Elsinore)

### Ayurpet (India storefront) — `1ygbmd-pr.myshopify.com`

- **Store handle:** `ayurpet` (admin.shopify.com/store/ayurpet)
- **Role:** India-market sales storefront. Traffic from India-targeted Meta ads lands here.
- **Custom App:** `ayurpet-ind`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/ayurpet-ind/install?shop=1ygbmd-pr.myshopify.com`
- **Installed:** 2026-04-15
- **Scopes granted:** full baseline incl. `write_orders` (updated 2026-04-15).
- **cod-confirm status:** not enrolled (user decision — NOT running voice-AI confirmation on Ayurpet for now).
- **Meta Ads account:** `act_654879327196107` — **AyurPet – Ad Acc. 1** (INR, ₹7.3L lifetime spend). Also drives the Global storefront below.
  - Reporting-only alternate: `act_1214314967570733` "The AyurPet (Read-Only)" (INR, 0 spend) — not used for delivery.

### Ayurpet (Global storefront) — `2684sq-mt.myshopify.com`

- **Store handle:** `2684sq-mt` (admin.shopify.com/store/2684sq-mt)
- **Role:** Global-market sales storefront (ex-India). Traffic from geo-targeted Meta ads for Global audiences lands here.
- **Custom App:** `ayurpet`
- **Install URL:** `https://shopify.glitchexecutor.com/auth/ayurpet/install?shop=2684sq-mt.myshopify.com`
- **Installed:** 2026-04-15
- **Scopes granted:** full baseline incl. `write_orders` (updated 2026-04-15).
- **cod-confirm status:** not enrolled (global markets typically not COD-heavy; revisit if Global storefront starts offering COD in markets like UAE, Bangladesh, etc.).
- **Meta Ads account:** `act_654879327196107` — **AyurPet – Ad Acc. 1** (shared with India storefront). Ad account is configured in INR even though it drives Global sales — **flag this for the ad-account diagnostic below**.

### Classicoo & older stores

The following stores are installed but not yet fully documented. Please fill in as we verify:

- `52j1ga-hz.myshopify.com` — Classicoo (?) — Meta Ads `act_1231977889107681` Clasicoo-IST-CAD (?)
- `5u7mdi-ap.myshopify.com` — Classicoo secondary (?) — Meta Ads TBD
- `glitch-seo-test-1.myshopify.com` — internal test store, no ad account

---

## Cross-repo map

| Service | Lives at | Reads from Session table | Purpose |
|---|---|---|---|
| auth hub | `/home/support/multi-store-theme-manager/` (port 3101, `shopify-app.service`) | writes on install | All `/auth/<app>/*` OAuth endpoints. Writes `offline_<shop>` sessions. |
| glitch-grow public app | `/home/support/glitch-grow-public/` (port 3102, `shopify-app-public.service`) | reads offline sessions | Glitch SEO + future Glitch Grow public features. |
| cod-confirm | `/home/support/glitch-cod-confirm/` (port 3104, `cod-confirm.service`) | reads offline sessions | LiveKit + Sarvam Bulbul v3 voice AI for COD order confirmation. |
| cod-confirm agent | `/home/support/glitch-cod-confirm/src/livekit-agent.js` (port 8081, `cod-confirm-agent.service`) | via sibling call | LiveKit worker that runs the agent session for each PSTN call. |
| meta ads MCP | `meta-ads-mcp.service` | — | MCP server exposing Meta Ads (read/write) to internal tools. Ad-account IDs above resolve via this. |

All five services share the same Postgres at `127.0.0.1:5432/shopify_app` (table `Session`).

---

## Change log for this file

- **2026-04-15** — initial version. Ayurpet primary + secondary stores installed and enrolled. Urban Classics baseline documented. Meta Ads cross-reference populated from `get_ad_accounts` snapshot.
- **2026-04-15 (later)** — user confirmed: both Ayurpet Shopify stores (`1ygbmd-pr` + `2684sq-mt`) share a single Meta Ads account (`act_654879327196107`). Added reverse-view table so ROAS reconciliation is obvious at a glance. `2684sq-mt` role within the Ayurpet brand still TBD.
