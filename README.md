# 🌐 Project Overview: Ultra-Fast Static Site with Astro, Edge-Driven i18n, and TinaCMS

## 📑 Executive Summary

This project delivers a **fully static** website built with **Astro**, served from the CDN, while language detection and routing are handled **at the edge** (Vercel Routing Middleware). Content is **business-editable** via **TinaCMS** (Git-backed).  
The result: **maximum performance**, predictable SEO, and a low-friction editorial workflow.

---

## ✨ Highlights

- ⚡ **Performance**
    - All HTML pages are **pre-rendered static**; assets are fingerprinted and long-cached.
    - i18n resolved **before** HTML is served (Edge Middleware) → no SSR, no extra client JS.
    - Images optimized with intrinsic `width`/`height` → no CLS.

- 🌍 **Edge i18n (deterministic & fast)**
    - Detection priority: **cookie** → `Accept-Language` → **default locale**.
    - **Sticky cookie** preserves chosen language.
    - Explicit switch via `?lang=xx`; middleware normalizes and strips the param.
    - **Canonical default** locale served **without** URL prefix.
    - Crawlers get stable canonicals; no useless redirects.

- 📝 **Content Editing (TinaCMS)**
    - In-repo content (Markdown/MDX/YAML/JSON) with instant preview.
    - PR-based workflow, no extra infra.

- 🔎 **SEO & Internationalization**
    - Automatic sitemaps with `hreflang` alternates + `x-default`.
    - Page-level `<link rel="alternate">` injection.
    - Per-locale **web app manifests**.
    - Clean canonicals, consistent URL design.

---

## 🏗 Architecture at a Glance

```text
 [User] ⇆ [CDN / Static Files] ⇆ [Dist (/static)]
    │             ▲
    │             │
    ▼             │
[Edge Middleware (i18n)]
    │
    └─── redirects / locale resolution

[TinaCMS] ────┐
              ▼
        [Content Repo]
              ▲
              │
        [Developers] → (Astro build) → [Dist]
```

---

## 🔄 Request Flow (Edge i18n)

1. **Matcher** runs only for HTML (assets/API bypass CDN).
2. URL with `?lang=xx` → set cookie, normalize, strip param, **307**.
3. URL with locale prefix:
    - Differs from cookie → **307** to sticky cookie locale.
    - Equals default locale → **308** to prefix-less canonical.
    - Else → pass through.

4. URL without prefix:
    - Users: **307** to best locale (if not default).
    - Bots: serve default (prefix-less).

5. Preserve query params (except `lang`) + hash.

---

## ⚙️ Automation: Manifests, Sitemaps & Alternates

- 🗺 **Sitemaps**: per-locale entries with alternates + `x-default`.
- 🔗 **Hreflang tags**: auto-injected across localized equivalents.
- 📱 **Web App Manifests**: per page/locale (icons, theme, language).

---

## 🚀 Performance Practices

- LCP < \~1.5s, CLS ≈ 0, minimal TTFB.
- Images: WebP/AVIF, intrinsic dims, lazy where appropriate.
- CSS: critical inline; rest deferred.
- JS: near-zero (tiny helper for lang switcher).
- Caching:
    - HTML: CDN-controlled.
    - Assets: `Cache-Control: public, max-age=31536000, immutable`.

---

## 🖊 Editorial Workflow (TinaCMS)

- Authors edit visually → commits → repo.
- CI builds Astro → static output → deploy via Vercel.
- Previews locale-aware (cookie aware).

---

## 🔍 Operational Notes

- **Observability**: Edge logs track locale/redirect decisions.
- **Safety**: Cookies `SameSite=Lax`, `Secure` (HTTPS).
- **Flexibility**: Sticky cookie + prefix-less default are feature-flag-friendly.

---

## ✅ Outcome

A site that **loads instantly**, **speaks the user’s language from the first byte**, and lets the business **edit anything** with confidence — while keeping infra simple, costs low, and SEO/international reach first-class.
