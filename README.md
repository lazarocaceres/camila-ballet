# 🌐 Project Overview: Ultra-Fast Static Site with Astro, Edge-Driven i18n, and TinaCMS

## 📑 Executive Summary

Fully static **Astro** site served from the CDN. Language is resolved **at the edge** (Vercel middleware) before content is delivered. Content is Git-backed via **TinaCMS**. Outcome: **instant loads**, predictable SEO, minimal ops.

---

## ✨ Highlights

- **Performance**
    - All pages pre-rendered; assets fingerprinted and long-cached.
    - Language resolved at the edge → no SSR and **zero client-side JS** for i18n.
    - Images with intrinsic dimensions → zero CLS.
    - **All CSS is inline;** this is intentional given the small number of pages and the tiny CSS footprint.

- **Deterministic i18n**
    - Selection order: **`?lang=` (xx or xx-YY) → cookie → `Accept-Language` (q-aware) → default**.
    - `?lang=` normalized to base (`xx`) and lowercased; param is stripped.
    - **Sticky cookie** for humans via 307; bots aren’t forced just to set cookies.
    - **Default locale has no URL prefix**; `/default/...` is **308** to the canonical prefix-less path (long-cache).
    - Admin area (`/admin` or coming from it) bypasses i18n logic.

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

- **Safety**
    - Locale cookie is `SameSite=Lax`, `Secure` on HTTPS, **not** `HttpOnly` by design.

- **Unknown/invalid inputs**
    - Malformed cookies are ignored; unknown locales fall back to default.

- **Integrity**
    - Query preserved (except a **valid** `lang`); hash preserved.

---

## 🔄 Redirect Decision Matrix

| Path has prefix          | `?lang=` present     | Cookie locale                                  | User-Agent     | Action                                                                 |
| ------------------------ | -------------------- | ---------------------------------------------- | -------------- | ---------------------------------------------------------------------- |
| any                      | valid (`xx`/`xx-YY`) | any                                            | human          | Normalize `xx`, set cookie if needed, **307** to clean URL (no `lang`) |
| any                      | valid                | any                                            | bot            | Strip `lang` if path changes; **no forced cookie set**                 |
| **yes** (`/xx/...`)      | —                    | differs from cookie                            | human          | **307** to cookie’s `/cookie-xx/...`                                   |
| **yes** (`/default/...`) | —                    | any                                            | any            | **308** to prefix-less canonical                                       |
| **yes** (`/xx/...`)      | —                    | same or none                                   | any            | Pass through                                                           |
| **no**                   | —                    | cookie or Accept-Language suggests non-default | human          | **307** to `/{xx}{path}`                                               |
| **no**                   | —                    | —                                              | bot or default | Serve prefix-less                                                      |

> All user-bound redirects use `Cache-Control: private, no-store` and `Vary: Accept-Language, Cookie`. Canonical 308s are cacheable (`s-maxage=31536000, max-age=31536000, immutable`).

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
- To **add a locale**: (1) add to `i18n.js`, (2) create localized content & manifests, (3) wire `hreflang` alternates & sitemap entries.

---

## 🔎 SEO & Alternates

- Sitemaps list each localized URL with its `hreflang` alternates and an `x-default` pointing to the default-locale canonical — **generated automatically**.
- Each page includes `<link rel="alternate" hreflang="...">`, including `x-default` — **generated automatically**.
- Canonical tags are handled automatically by the build; no manual steps required.

---

## 🚀 Caching

- **HTML:** controlled by CDN; canonical 308s are **heavily cacheable**.
- **Assets:** `Cache-Control: public, max-age=31536000, immutable`.

---

## 🖥 Observability (recommended setup)

Intended logging at the edge: `{ path, seg, cookie, accept, chosen, isBot, action, status, target }`.
Actions: `pass`, `redirect307`, `redirect308`.
Dashboards: **set up** dashboards to monitor redirect rates by path/locale and the bot/human split.

---

## 🖊 Editorial Workflow (TinaCMS)

- Visual edit → commit → CI → deploy. Previews honor the locale cookie.
- The administration area resides under `/admin`; the middleware explicitly **bypasses** it (and requests/referrers originating from it) to ensure editors can select any locale within TinaCMS and preview the content in that language without i18n redirection interference.

---

## 🧭 Non-Goals / Trade-offs

- No runtime SSR for content (keeps infra simple and fast).
- Cookie is readable client-side for UX (by design); if this becomes a concern, gate reads per page.

---

## ✅ Outcome

A site that **loads instantly**, selects the **right language deterministically**, and keeps SEO canonical and clean—while staying simple to edit and cheap to operate.
