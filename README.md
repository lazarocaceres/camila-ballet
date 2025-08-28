# 🌐 Project Overview: Ultra-Fast Static Site with Astro, Edge-Driven i18n, and TinaCMS

## 📑 Executive Summary

Fully static **Astro** site served from the CDN. Language is resolved **at the edge** (Vercel middleware) before content is delivered. Content is Git-backed via **TinaCMS**. Outcome: **instant loads**, predictable SEO, minimal ops.

---

## ✨ Highlights

- **Performance**
    - All pages **pre-rendered**; assets fingerprinted and long-cached.
    - Language resolved at the edge → no SSR and **zero client-side JS** for i18n.
    - Images with intrinsic dimensions → **zero CLS**.
    - All CSS is inline; this is intentional given the small number of pages and the tiny CSS footprint.
    - Paths are normalized (single leading slash, no trailing slash).

- **Deterministic i18n**
    - Selection order: **`?lang=` (xx or xx-YY) → cookie → `Accept-Language` (q-aware, tie-broken by order) → default**.

    - `?lang=` normalized to base (`xx`) and lowercased; param is stripped.
      If `?lang` is invalid/unknown, it is **stripped with a cacheable 308**.

    - **Cookie is only set when user choice differs from browser preference**.
      If the browser already prefers that locale, cookie is cleared.

    - Bots are not personalized.
        - Canonicalization applies (308 from default-locale prefix).
        - `?lang` (valid or invalid) is never normalized for bots — param passes through unchanged.

    - **Default locale has no URL prefix**; `/default/...` is **308** to the canonical prefix-less path (long-cache).

    - Admin area (`/admin` paths or requests with `/admin` as referer) bypasses i18n logic.

- **SEO-ready (automatic)**
    - Sitemaps include `hreflang` alternates plus `x-default` — **generated automatically**.
    - Page-level `<link rel="alternate">` per locale; clean canonicals — **generated automatically**.
    - Per-locale web app manifests — **generated automatically**.

- **Editorial simplicity**
    - Authors edit in TinaCMS → commits → CI build → CDN deploy.
    - Previews are locale-aware (cookie-aware).

---

## ✅ Guarantees & Constraints

- **Canonical URLs**
    - Default locale: **no prefix**.
    - Non-default locales: `/xx/...` prefixed.
    - Requests to `/default/...` → **308** to prefix-less canonical (cacheable for a year, immutable).

- **Bots vs. Humans**
    - Bots get canonical content without user-bound redirects; humans may get 307s for locale alignment.
    - Bots are not redirected on `?lang`; only the default-locale prefix is canonicalized.

- **Safety**
    - Locale cookie is `SameSite=Lax`, `Secure` on HTTPS, and `HttpOnly` (not readable from client JS).
    - Cookie is deliberately omitted if redundant (user choice = browser best).

- **Unknown/invalid inputs**
    - Malformed cookies are ignored; unknown locales fall back to default.
    - Invalid `?lang` params are stripped with a **308**.

- **Integrity**
    - Query preserved (except a **valid** `lang`); hash preserved.

---

## 🔄 Redirect Decision Matrix

| Path has prefix          | `?lang=` present     | Cookie locale       | Browser preference | Actor | Action                                                                                    |
| ------------------------ | -------------------- | ------------------- | ------------------ | ----- | ----------------------------------------------------------------------------------------- |
| any                      | valid (`xx`/`xx-YY`) | any                 | any                | human | Normalize `xx`; set cookie only if browser differs; clear otherwise; **307** to clean URL |
| any                      | invalid              | any                 | any                | human | Strip `?lang` and **308** to clean URL (cacheable)                                        |
| any                      | valid                | any                 | any                | bot   | Pass through (no normalization); **no cookie**                                            |
| **yes** (`/xx/...`)      | —                    | differs from prefix | —                  | human | **307** to cookie’s `/cookie-xx/...`                                                      |
| **yes** (`/default/...`) | —                    | any                 | —                  | any   | **308** to prefix-less canonical (cacheable)                                              |
| **yes** (`/xx/...`)      | —                    | same or none        | —                  | any   | Pass through                                                                              |
| **no**                   | —                    | none                | non-default        | human | **308** to `/{xx}{path}` (cacheable, depends only on Accept-Language, order tie-break)    |
| **no**                   | —                    | cookie present      | —                  | human | **307** to `/{cookie}{path}` (user-bound, not cacheable)                                  |
| **no**                   | —                    | —                   | default            | any   | Serve prefix-less                                                                         |

> All user-bound redirects use `Cache-Control: private, no-store`.
> **Accept-Language**-based **308**: `Cache-Control: public, s-maxage=31536000, max-age=31536000, immutable` **and** `Vary: Accept-Language`.
> **Canonical** **308** (`/<default>/...` → `/...`): `Cache-Control: public, s-maxage=31536000, max-age=31536000, immutable`.

---

## ⚙️ Configuration

- `i18n.js`

    ```js
    export const i18n = {
        locales: ['es', 'en', 'fr'],
        defaultLocale: 'es',
    }
    ```

- Middleware imports `I18N`, lowercases once, and validates against a `Set` for O(1) checks.

- To **add a locale**: (1) add to `i18n.js`, (2) create localized content.

---

## 🔎 SEO & Alternates

- Sitemaps list each localized URL with its `hreflang` alternates and an `x-default` pointing to the default-locale canonical — **generated automatically**.
- Each page includes `<link rel="alternate" hreflang="...">`, including `x-default` — **generated automatically**.
- Canonical tags are handled automatically by the build; no manual steps required.

---

## 🚀 Caching

- **HTML:** controlled by CDN.
    - User-bound 307s are `private, no-store`.
    - Canonical 308s and Accept-Language-based 308s are **heavily cacheable** (`s-maxage=31536000, max-age=31536000, immutable`).
    - Accept-Language-based 308s always include `Vary: Accept-Language`.

- **Assets:** `Cache-Control: public, max-age=31536000, immutable`.

---

## 🖥 Observability (recommended setup)

Intended logging at the edge: `{ path, seg, cookie, accept, chosen, isBot, action, status, target }`.
Actions: `pass`, `redirect307`, `redirect308`.
Dashboards: monitor redirect rates by path/locale and the bot/human split.

---

## 🖊 Editorial Workflow (TinaCMS)

- Visual edit → commit → CI → deploy. Previews honor the locale cookie.
- The administration area resides under `/admin`; middleware bypasses it (by path or referer) so editors can select any locale in TinaCMS and preview content without interference.

---

## 🧭 Non-Goals / Trade-offs

- No runtime SSR for content (keeps infra simple and fast).
- Cookie is set with `HttpOnly` for security (not accessible from client JS).
- Cookie deliberately not persisted when redundant with browser preference.

---

## ✅ Outcome

A site that **loads instantly**, selects the **right language deterministically**, and keeps SEO canonical and clean—while staying simple to edit and cheap to operate.
