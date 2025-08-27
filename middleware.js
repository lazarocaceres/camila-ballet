import { next } from '@vercel/functions'
import { i18n as I18N } from './i18n.js'

const COOKIE = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const LANG_PARAM = 'lang'

const LOCALES = new Set(I18N.locales.map(s => s.toLowerCase()))
const DEFAULT = I18N.defaultLocale.toLowerCase()

// Broad but intentional bot regex. Bots should never be redirected or personalized.
// This avoids SEO issues (cloaking, duplicate content).
const RE_BOT =
    /(?:Googlebot|Google-InspectionTool|AdsBot-Google|AdsBot-Google-Mobile|AdsBot-Google-Mobile-Apps|Googlebot-Image|Googlebot-News|GoogleOther|GoogleReadAloud|Mediapartners-Google|APIs-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|YandexImages|Yandex|Applebot|SemrushBot|AhrefsBot|DotBot|MJ12bot|CCBot|PetalBot|Bytespider|Sogou|SogouSpider|Sogou web spider|SeznamBot|Qwantify|NaverBot|facebot|facebookexternalhit|FacebookBot|FacebookCatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Quora Link Preview|SkypeUriPreview|Embedly|rogerbot|SiteAuditBot|W3C_Validator|validator\.nu|Chrome-Lighthouse|Lighthouse|Page Speed|GTmetrix|Pingdom|Screaming Frog|GPTBot|ClaudeBot|PerplexityBot|YouBot|Amazonbot|HeadlessChrome|PhantomJS|curl|wget)/i

const RE_COOKIE = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)')

export const config = {
    runtime: 'edge',
    // Run only on HTML-like requests. Skip assets and APIs for performance.
    matcher: [
        '/((?!api|_astro|assets|_image|\\.well-known|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|webp|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|txt|xml|json|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)).*)',
    ],
}

const lc = s => (typeof s === 'string' ? s.toLowerCase() : '')

// Normalize path: single leading slash, no trailing slash
const clean = p => {
    if (!p || p === '/') return '/'
    let a = 0,
        b = p.length - 1
    while (a <= b && p.charCodeAt(a) === 47) a++
    while (b >= a && p.charCodeAt(b) === 47) b--
    return a > b ? '/' : '/' + p.slice(a, b + 1)
}

// Extract first segment (potential locale prefix)
const seg0Clean = c => {
    if (c === '/') return ''
    const n = c.indexOf('/', 1)
    return n === -1 ? c.slice(1) : c.slice(1, n)
}

const withLocaleClean = (cleanPath, l) =>
    cleanPath === '/' ? `/${l}` : `/${l}${cleanPath}`

const withoutLocaleClean = cleanPath => {
    if (cleanPath === '/') return '/'
    const n = cleanPath.indexOf('/', 1)
    return n === -1 ? '/' : cleanPath.slice(n)
}

// Parse cookie safely, ignore malformed values
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
    `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${isHttps ? '; Secure' : ''}`

const clearCookie = isHttps =>
    `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${isHttps ? '; Secure' : ''}`

// Pick best language from Accept-Language header
const bestFromAcceptLanguage = h => {
    if (!h) return ''
    const parts = h.split(',')
    let bestLang = ''
    let bestQ = -1
    let bestIndex = Number.MAX_SAFE_INTEGER
    let i = 0

    for (let k = 0; k < parts.length; k++) {
        const raw = parts[k].trim()
        if (!raw) {
            i++
            continue
        }
        const semi = raw.split(';')
        const lang = lc(semi[0])
        if (!lang || lang === '*') {
            i++
            continue
        }

        let q = 1
        for (let s = 1; s < semi.length; s++) {
            const p = semi[s].trim()
            if (p.startsWith('q=')) {
                const v = parseFloat(p.slice(2))
                q = Number.isFinite(v) ? v : 0
                break
            }
        }

        if (LOCALES.has(lang)) {
            if (q > bestQ || (q === bestQ && i < bestIndex)) {
                bestLang = lang
                bestQ = q
                bestIndex = i
            }
        } else {
            const dash = lang.indexOf('-')
            if (dash > 0) {
                const base = lang.slice(0, dash)
                if (LOCALES.has(base)) {
                    if (q > bestQ || (q === bestQ && i < bestIndex)) {
                        bestLang = base
                        bestQ = q
                        bestIndex = i
                    }
                }
            }
        }
        i++
    }
    return bestLang
}

// Decide which locale to use, preferring cookie > Accept-Language > default
const pickBest = (cookieLocale, acceptHeader) => {
    const c = lc(cookieLocale)
    if (c && LOCALES.has(c)) return c
    const candidate = bestFromAcceptLanguage(lc(acceptHeader || ''))
    return candidate || DEFAULT
}

/**
 * Decide how to handle cookies when the user explicitly picks a language.
 * - If browser already prefers the chosen locale → clear cookie (no need to persist).
 * - Otherwise → set cookie to persist this choice across sessions.
 *
 * This ensures we only store cookies when they override browser defaults.
 */
const cookieForChoice = (chosen, acceptLang, isHttps) => {
    const browserBest = bestFromAcceptLanguage(lc(acceptLang || ''))
    if (browserBest === chosen) {
        return clearCookie(isHttps)
    }
    return setCookie(chosen, isHttps)
}

// User-bound redirect: not cacheable, personalized
const respondRedirectUser = (status, location, cookieValue, vary = true) => {
    const headers = { Location: location }
    if (cookieValue) headers['Set-Cookie'] = cookieValue
    if (vary) headers['Vary'] = 'Accept-Language, Cookie'
    headers['Cache-Control'] = 'private, no-store'
    return new Response(null, { status, headers })
}

// Static redirect: deterministic, cacheable at CDN/clients
const respondRedirectStatic = (status, location, cacheSeconds) => {
    const headers = { Location: location }
    headers['Cache-Control'] =
        `public, s-maxage=${cacheSeconds}, max-age=${cacheSeconds}${cacheSeconds >= 31536000 ? ', immutable' : ''}`
    return new Response(null, { status, headers })
}

const passNext = () => next()

export default function middleware(request) {
    const url = new URL(request.url)

    const xfProto = request.headers.get('x-forwarded-proto')
    const isHttps =
        (xfProto
            ? xfProto.split(',')[0].trim()
            : url.protocol.replace(':', '')) === 'https'

    const path = clean(url.pathname)

    // Skip locale logic for admin routes and their flows
    if (path === '/admin' || path.startsWith('/admin/')) return next()
    const ref = request.headers.get('referer')
    if (ref && ref.indexOf('/admin') !== -1) return next()

    const searchStr = url.search || ''
    const hashStr = url.hash || ''

    const ua = request.headers.get('user-agent') || ''
    const cookieHeader = request.headers.get('cookie') || ''
    const acceptLang = request.headers.get('accept-language') || ''
    const isBot = RE_BOT.test(ua)

    // Bots: bypass everything, serve canonical URLs
    if (isBot) {
        return passNext()
    }

    const cookie = lc(getCookie(cookieHeader))
    const seg = lc(seg0Clean(path))
    const hasSegLocale = LOCALES.has(seg)
    const hasCookieLocale = !!cookie && LOCALES.has(cookie)

    const rawChosen = url.searchParams.get(LANG_PARAM)
    const chosen = rawChosen ? lc(rawChosen.split('-')[0]) : ''
    const hasChosen = !!chosen && LOCALES.has(chosen)

    // --- Case 1: Explicit ?lang= ---
    if (hasChosen) {
        url.searchParams.delete(LANG_PARAM)
        const cleanSearch = url.search || ''
        const targetPath = hasSegLocale
            ? seg === chosen
                ? path
                : withLocaleClean(withoutLocaleClean(path), chosen)
            : chosen === DEFAULT
              ? path
              : withLocaleClean(path, chosen)

        const loc = targetPath + cleanSearch + hashStr
        const cookieValue = cookieForChoice(chosen, acceptLang, isHttps)
        return respondRedirectUser(307, loc, cookieValue, true)
    }

    // --- Case 2: Path has locale prefix ---
    if (hasSegLocale) {
        // If cookie exists and differs, redirect to align with cookie
        if (hasCookieLocale && cookie !== seg) {
            const loc =
                withLocaleClean(withoutLocaleClean(path), cookie) +
                searchStr +
                hashStr
            return respondRedirectUser(
                307,
                loc,
                setCookie(cookie, isHttps),
                true,
            )
        }

        // Canonicalize default locale: /es → /
        if (seg === DEFAULT) {
            const target = withoutLocaleClean(path) + searchStr + hashStr
            const current = url.pathname + (url.search || '') + hashStr
            if (target !== current) {
                return respondRedirectStatic(308, target, 31536000)
            }
        }

        // Otherwise: valid prefix, no redirect needed
        return passNext()
    }

    // --- Case 3: No prefix ---
    const best = pickBest(cookie, acceptLang)
    const targetLocale = hasCookieLocale ? cookie : best

    if (targetLocale !== DEFAULT) {
        const loc = withLocaleClean(path, targetLocale) + searchStr + hashStr

        if (!hasCookieLocale) {
            // First-time visitor: redirect is deterministic → cacheable
            return respondRedirectStatic(308, loc, 31536000)
        }

        // Cookie already exists: personalized redirect
        return respondRedirectUser(307, loc, null, true)
    }

    // Default locale and no cookie: serve directly
    return passNext()
}
