# Project Overview: Ultra-Fast Static Site with Astro, Edge-Driven i18n, and TinaCMS

## Executive Summary

This project delivers a **fully static** website built with **Astro**, served from the CDN, while language detection and routing are handled **at the edge** (Vercel Routing Middleware). Content is **business-editable** via **TinaCMS** (Git-backed). The result: **maximum performance**, predictable SEO, and a low-friction editorial workflow.

---

## Highlights

- **Performance**
    - All HTML pages are **pre-rendered static**; assets are fingerprinted and long-cached.
    - i18n is resolved **before** any HTML is served (Edge Middleware), with **no SSR** and **no extra client JS** for routing.
    - Images are optimized; intrinsic `width`/`height` set to eliminate CLS.

- **Edge i18n (deterministic & fast)**
    - Detection priority: **cookie** → `Accept-Language` → **default locale**.
    - **Sticky cookie** keeps users in their chosen language during navigation.
    - Elegant explicit switch via `?lang=xx`; the middleware sets the cookie and **strips the param** on redirect.
    - **Canonical default**: default locale is served **without** a URL prefix (configurable).
    - Crawlers are not pointlessly redirected; canonical rules remain clean.

- **Content Editing (TinaCMS)**
    - In-repo content (Markdown/MDX/YAML/JSON) with instant preview.
    - Low operational burden: no extra servers; PR-based workflow.

- **SEO & Internationalization**
    - Automatic **sitemaps** (with per-locale alternate links).
    - Automatic **`<link rel="alternate" hreflang="…">`** across locales, including **`x-default`**.
    - Automatic **web app manifests** per page/locale where needed.
    - Clean canonicals, consistent URL design, and `Vary` only when appropriate.

---

## Architecture at a Glance

```mermaid
flowchart LR
  U[User] -->|Request| MW[Edge Middleware (i18n)]
  MW -->|redirect if needed| CDN[CDN / Static Files]
  CDN -->|Static HTML + assets| U
  CMS[TinaCMS] --- Repo[(Content Repo)]
  Dev[Developers] -->|Astro build| Dist[/static dist/]
  Dist --> CDN
```

---

## Request Flow (Edge i18n)

1. **Matcher** runs only for HTML (assets/API bypass straight to CDN).
2. If URL has **`?lang=xx`**:
    - Set `locale=xx` cookie, normalize URL (add/remove prefix), **strip `?lang`**, and respond **307**.

3. If URL **has a locale prefix**:
    - If it differs from the cookie (and a cookie exists): **307** to the cookie’s locale (**sticky**).
    - If it equals the **default locale**: **308** to the **prefix-less** canonical path.
    - Otherwise, pass through to the static file.

4. If URL **has no prefix**:
    - For users (not bots): **307** to the best locale when it’s not the default.
    - For bots: serve the **default** without a prefix (avoids duplicate content).

5. Query params (except `lang`) and the hash are preserved across redirects.

---

## Automation: Manifests, Sitemaps & Alternates

- **Sitemaps** are generated automatically for all pages and locales, with proper **`<xhtml:link rel="alternate" hreflang="…">`** entries and an **`x-default`** fallback.
- **Page-level alternates** are injected automatically: each page outputs the full set of `hreflang` tags to interlink localized equivalents.
- **Web App Manifests** are generated automatically per page/locale as needed (icons, theme, language, scope), keeping configuration DRY and consistent.

---

## Performance Practices

- **LCP** targeted under \~1.5s (4G fast); **CLS** near 0; minimal TTFB thanks to Edge decisioning + CDN.
- **Images**: modern formats (WebP/AVIF), intrinsic dimensions, lazy where appropriate.
- **CSS**: critical inline; remainder deferred; no heavy runtime frameworks.
- **JS**: near-zero on most pages (only the language selector uses a tiny helper).
- **Caching**
    - HTML: CDN-controlled; middleware only varies when setting cookies/redirecting.
    - Assets: `Cache-Control: public, max-age=31536000, immutable`.

---

## Editorial Workflow (TinaCMS)

- Authors edit content visually; commits flow to the repo.
- CI builds Astro to static output; Vercel deploys to the CDN.
- Previews reflect the current locale (cookie aware) for accurate review.

---

## Operational Notes

- **Observability**: Edge logs capture redirect decisions (locale chosen, source of decision).
- **Safety**: Cookie uses `SameSite=Lax` and `Secure` on HTTPS; no `HttpOnly` to allow optional client-side updates from the language picker.
- **Flexibility**: “Sticky cookie” and “default without prefix” behaviors are feature-flag-friendly.

---

## Outcome

A site that **loads instantly**, **speaks the user’s language from the first byte**, and lets the business **edit anything** with confidence—while keeping infrastructure simple, costs low, and **SEO** / **international reach** first-class.
