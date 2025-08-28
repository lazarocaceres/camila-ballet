import { next } from '@vercel/functions'
import { i18n as I18N } from './i18n.js'

/* ──────────────────────────────────────────────────────────────────────────
 * Constants & configuration
 * ────────────────────────────────────────────────────────────────────────── */

const COOKIE = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1y
const LANG_PARAM = 'lang'
const CACHE_YEAR = 31536000

const LOCALES = new Set(I18N.locales.map(s => s.toLowerCase()))
const DEFAULT = I18N.defaultLocale.toLowerCase()

// Fail fast on inconsistent i18n config
if (!LOCALES.has(DEFAULT)) {
    throw new Error(
        `[i18n] defaultLocale "${DEFAULT}" is not included in locales: ${[...LOCALES].join(', ')}`,
    )
}

// Crawlers should never be personalized; keep output deterministic
const RE_BOT =
    /(?:Googlebot|Google-InspectionTool|AdsBot-Google|AdsBot-Google-Mobile|AdsBot-Google-Mobile-Apps|Googlebot-Image|Googlebot-News|GoogleOther|GoogleReadAloud|Mediapartners-Google|APIs-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|YandexImages|Yandex|Applebot|SemrushBot|AhrefsBot|DotBot|MJ12bot|CCBot|PetalBot|Bytespider|Sogou|SogouSpider|Sogou web spider|SeznamBot|Qwantify|NaverBot|facebot|facebookexternalhit|FacebookBot|FacebookCatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Quora Link Preview|SkypeUriPreview|Embedly|rogerbot|SiteAuditBot|W3C_Validator|validator\.nu|Chrome-Lighthouse|Lighthouse|Page Speed|GTmetrix|Pingdom|Screaming Frog|GPTBot|ClaudeBot|PerplexityBot|YouBot|Amazonbot|HeadlessChrome|PhantomJS|curl|wget)/i

// Targeted cookie extraction; avoid expensive/global parsing
const RE_COOKIE = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)')

export const config = {
    runtime: 'edge',
    matcher: [
        // Apply only to HTML-like routes; keep APIs/static out of the hot path
        '/((?!api|_astro|assets|_image|\\.well-known|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|webp|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|txt|xml|json|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)).*)',
    ],
}

/* ──────────────────────────────────────────────────────────────────────────
 * Small utilities (pure, alloc-free where it matters)
 * ────────────────────────────────────────────────────────────────────────── */

const lc = s => (typeof s === 'string' ? s.toLowerCase() : '')

/** Normalize path to single leading slash, no trailing slash. */
const cleanPath = p => {
    if (!p || p === '/') return '/'
    let a = 0,
        b = p.length - 1
    while (a <= b && p.charCodeAt(a) === 47) a++ // '/'
    while (b >= a && p.charCodeAt(b) === 47) b--
    return a > b ? '/' : '/' + p.slice(a, b + 1)
}

/** First segment (no leading slash). Requires a cleaned path. */
const firstSeg = c => {
    if (c === '/') return ''
    const n = c.indexOf('/', 1)
    return n === -1 ? c.slice(1) : c.slice(1, n)
}

const withLocale = (cleaned, locale) =>
    cleaned === '/' ? `/${locale}` : `/${locale}${cleaned}`
const withoutLocale = cleaned => {
    if (cleaned === '/') return '/'
    const n = cleaned.indexOf('/', 1)
    return n === -1 ? '/' : cleaned.slice(n)
}

const getCookie = cookieHeader => {
    if (!cookieHeader) return ''
    const m = RE_COOKIE.exec(cookieHeader)
    if (!m) return ''
    try {
        return decodeURIComponent(m[1])
    } catch {
        return ''
    }
}

const setCookie = (value, isHttps) =>
    `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${isHttps ? '; Secure' : ''}; HttpOnly`

const clearCookie = isHttps =>
    `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${isHttps ? '; Secure' : ''}; HttpOnly`

/** Parse Accept-Language; cap to 20 items to avoid header-based amplification/DoS. */
const bestFromAcceptLanguage = h => {
    if (!h) return ''
    const parts = h.replace(/_/g, '-').split(',')
    const limit = Math.min(parts.length, 20)

    let best = ''
    let bestQ = -1
    let bestPos = 1 << 30

    for (let i = 0; i < limit; i++) {
        const raw = parts[i].trim()
        if (!raw) continue

        const semi = raw.split(';')
        const lang = lc(semi[0])
        if (!lang || lang === '*') continue

        // Default q=1; clamp to [0,1]
        let q = 1
        for (let s = 1; s < semi.length; s++) {
            const p = semi[s].trim()
            if (p.startsWith('q=')) {
                const v = parseFloat(p.slice(2))
                q = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0
                break
            }
        }
        if (q === 0) continue

        // Exact match first, then base language
        if (LOCALES.has(lang)) {
            if (q > bestQ || (q === bestQ && i < bestPos)) {
                best = lang
                bestQ = q
                bestPos = i
            }
            continue
        }
        const dash = lang.indexOf('-')
        if (dash > 0) {
            const base = lang.slice(0, dash)
            if (
                LOCALES.has(base) &&
                (q > bestQ || (q === bestQ && i < bestPos))
            ) {
                best = base
                bestQ = q
                bestPos = i
            }
        }
    }
    return best
}

/** Selection order: cookie > Accept-Language > default. */
const pickBest = (cookieLocale, acceptHeader) => {
    const c = lc(cookieLocale)
    if (c && LOCALES.has(c)) return c
    return bestFromAcceptLanguage(acceptHeader || '') || DEFAULT
}

/** If user choice equals browser best, avoid persisting redundant cookie. */
const cookieForChoice = (chosen, acceptLang, isHttps) => {
    const browserBest = bestFromAcceptLanguage(acceptLang || '')
    return browserBest === chosen
        ? clearCookie(isHttps)
        : setCookie(chosen, isHttps)
}

/* Redirect helpers
 *  - 307: user-scoped (non-cacheable; may set cookie)
 *  - 308: canonical (cacheable; optionally Vary)
 */
const redirectUser = (status, location, cookieValue) => {
    const headers = { Location: location, 'Cache-Control': 'private, no-store' }
    if (cookieValue) headers['Set-Cookie'] = cookieValue
    return new Response(null, { status, headers })
}

const redirectStatic = (status, location, seconds, varyAcceptLang = false) => {
    const headers = {
        Location: location,
        'Cache-Control': `public, s-maxage=${seconds}, max-age=${seconds}${seconds >= CACHE_YEAR ? ', immutable' : ''}`,
    }
    if (varyAcceptLang) headers['Vary'] = 'Accept-Language'
    return new Response(null, { status, headers })
}

const passNext = () => next()

/* ──────────────────────────────────────────────────────────────────────────
 * Middleware
 * ────────────────────────────────────────────────────────────────────────── */

export default function middleware(request) {
    // Only redirect on idempotent methods
    const method = request.method
    if (method !== 'GET' && method !== 'HEAD') return passNext()

    const url = new URL(request.url)

    // Honor X-Forwarded-Proto (may be csv through multiple proxies)
    const xfp = request.headers.get('x-forwarded-proto')
    const proto = xfp
        ? xfp.split(',').pop()?.trim().toLowerCase() ||
          url.protocol.replace(':', '')
        : url.protocol.replace(':', '')
    const isHttps = proto === 'https'

    const path = cleanPath(url.pathname)
    const search = url.search || ''

    // Never localize /admin (prevents back-office loops)
    if (path === '/admin' || path.startsWith('/admin/')) return passNext()
    const ref = request.headers.get('referer')
    if (ref && ref.indexOf('/admin') !== -1) return passNext()

    // Pull headers once
    const ua = request.headers.get('user-agent') || ''
    const cookieHeader = request.headers.get('cookie') || ''
    const acceptLang = request.headers.get('accept-language') || ''

    const cookie = lc(getCookie(cookieHeader))
    const seg = lc(firstSeg(path))
    const hasSegLocale = LOCALES.has(seg)
    const hasCookieLocale = !!cookie && LOCALES.has(cookie)
    const isBot = RE_BOT.test(ua)

    /* Bots: no personalization; only collapse /<default> → / for canonical URLs */
    if (isBot) {
        if (hasSegLocale && seg === DEFAULT) {
            const target = withoutLocale(path) + search
            const current = url.pathname + (url.search || '')
            if (target !== current)
                return redirectStatic(308, target, CACHE_YEAR, false)
        }
        return passNext()
    }

    /* Case 1: explicit ?lang=... */
    const rawChosen = url.searchParams.get(LANG_PARAM)
    let chosen = ''
    if (rawChosen) {
        const norm = lc(rawChosen).replace(/_/g, '-')
        if (LOCALES.has(norm)) {
            chosen = norm
        } else {
            const base = norm.split('-')[0]
            if (LOCALES.has(base)) chosen = base
        }
    }
    const hasChosen = !!chosen

    if (rawChosen && !hasChosen) {
        // Invalid param → strip and canonicalize
        url.searchParams.delete(LANG_PARAM)
        return redirectStatic(308, path + (url.search || ''), CACHE_YEAR, false)
    }

    if (hasChosen) {
        url.searchParams.delete(LANG_PARAM)
        const cleanSearch = url.search || ''
        const targetPath = hasSegLocale
            ? seg === chosen
                ? path
                : chosen === DEFAULT
                  ? withoutLocale(path)
                  : withLocale(withoutLocale(path), chosen)
            : chosen === DEFAULT
              ? path
              : withLocale(path, chosen)
        const loc = targetPath + cleanSearch
        const cookieValue = cookieForChoice(chosen, acceptLang, isHttps)
        return redirectUser(307, loc, cookieValue)
    }

    /* Case 2: path already prefixed with a locale */
    if (hasSegLocale) {
        if (hasCookieLocale && cookie !== seg) {
            // Prefer user cookie (explicit choice) over path
            const targetPath =
                cookie === DEFAULT
                    ? withoutLocale(path)
                    : withLocale(withoutLocale(path), cookie)
            return redirectUser(
                307,
                targetPath + search,
                setCookie(cookie, isHttps),
            )
        }
        if (seg === DEFAULT) {
            // Collapse /<default> → /
            const target = withoutLocale(path) + search
            const current = url.pathname + (url.search || '')
            if (target !== current)
                return redirectStatic(308, target, CACHE_YEAR, false)
        }
        return passNext()
    }

    /* Case 3: no locale prefix → derive from cookie/AL/default */
    const best = pickBest(cookie, acceptLang)
    const targetLocale = hasCookieLocale ? cookie : best

    if (targetLocale !== DEFAULT) {
        const loc = withLocale(path, targetLocale) + search
        if (!hasCookieLocale) {
            // AL-based: make caches aware
            return redirectStatic(308, loc, CACHE_YEAR, true)
        }
        // Cookie-based (user state): non-cacheable
        return redirectUser(307, loc, null)
    }

    // Default locale and no cookie: serve as-is
    return passNext()
}
