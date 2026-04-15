/**
 * OAuth handler for the "ayurpet-ind" Shopify Custom App.
 *
 * Installs on `ayurpet.myshopify.com`.
 *
 * Path `/auth/ayurpet-ind/install?shop=<shop>.myshopify.com` starts OAuth using
 * AYURPET_IND_CLIENT_ID / AYURPET_IND_CLIENT_SECRET from .env.
 *
 * Path `/auth/ayurpet-ind/callback?code=...&shop=...` completes the flow,
 * exchanges the authorization code for an offline access token, and stores
 * it in the Prisma Session table as `offline_<shop>` — matching the shape
 * cod-confirm (and other services) read from.
 *
 * Mirror of auth.classicoo.$.jsx; duplicated per-app per the comment in that
 * file ("To add another client later, duplicate this route").
 */

import { redirect } from "react-router";
import crypto from "node:crypto";
import prisma from "../db.server";

const APP_URL = process.env.SHOPIFY_APP_URL;
const CLIENT_ID = process.env.AYURPET_IND_CLIENT_ID;
const CLIENT_SECRET = process.env.AYURPET_IND_CLIENT_SECRET;
const SCOPES = process.env.AYURPET_IND_SCOPES || "";

export const loader = async ({ request, params }) => {
  const url = new URL(request.url);
  const sub = params["*"] || "";
  const shop = url.searchParams.get("shop");

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response("Ayurpet-Ind OAuth not configured (missing env vars)", { status: 500 });
  }

  if (sub === "install") {
    if (!shop || !shop.endsWith(".myshopify.com")) {
      return new Response("Provide ?shop=<name>.myshopify.com", { status: 400 });
    }
    const nonce = crypto.randomBytes(16).toString("hex");
    const redirectUri = `${APP_URL}/auth/ayurpet-ind/callback`;
    const authorize = new URL(`https://${shop}/admin/oauth/authorize`);
    authorize.searchParams.set("client_id", CLIENT_ID);
    authorize.searchParams.set("scope", SCOPES);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("state", nonce);
    authorize.searchParams.set("grant_options[]", "");
    await prisma.session.upsert({
      where: { id: `oauth_state_${shop}` },
      create: {
        id: `oauth_state_${shop}`,
        shop,
        state: nonce,
        accessToken: "",
        isOnline: false,
      },
      update: { state: nonce },
    });
    return redirect(authorize.toString());
  }

  if (sub === "callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const hmac = url.searchParams.get("hmac");
    if (!shop || !code) {
      return new Response("Missing shop/code", { status: 400 });
    }

    if (hmac) {
      const p = new URLSearchParams(url.search);
      p.delete("hmac");
      p.sort();
      const msg = p.toString();
      const expected = crypto.createHmac("sha256", CLIENT_SECRET).update(msg).digest("hex");
      if (expected !== hmac) {
        return new Response("HMAC verification failed", { status: 401 });
      }
    }

    const stateRecord = await prisma.session.findUnique({
      where: { id: `oauth_state_${shop}` },
    });
    if (!stateRecord || stateRecord.state !== state) {
      return new Response("State mismatch", { status: 401 });
    }

    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
    });
    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return new Response(`Token exchange failed: ${tokenRes.status} ${errBody}`, { status: 500 });
    }
    const tokenJson = await tokenRes.json();

    await prisma.session.upsert({
      where: { id: `offline_${shop}` },
      create: {
        id: `offline_${shop}`,
        shop,
        state: state || "",
        isOnline: false,
        scope: tokenJson.scope,
        accessToken: tokenJson.access_token,
      },
      update: {
        state: state || "",
        scope: tokenJson.scope,
        accessToken: tokenJson.access_token,
        isOnline: false,
      },
    });

    await prisma.session.delete({ where: { id: `oauth_state_${shop}` } }).catch(() => {});

    return new Response(
      `<!doctype html><meta charset=utf-8><title>Installed</title>
       <style>body{font-family:system-ui;max-width:540px;margin:4rem auto;padding:0 1rem;line-height:1.5}</style>
       <h1>✅ Installed on ${shop}</h1>
       <p>Access token stored. The store is now connected to Glitch COD Confirm and other Glitch Grow services.</p>
       <p>Scope: <code>${tokenJson.scope}</code></p>
       <p>You can close this tab.</p>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new Response("Unknown subpath. Use /auth/ayurpet-ind/install or /auth/ayurpet-ind/callback", { status: 404 });
};
