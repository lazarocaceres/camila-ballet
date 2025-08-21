import { next } from '@vercel/functions'
import { i18n as I18N } from './i18n'

const COOKIE = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const LANG_PARAM = 'lang'

const LOCALES = new Set(I18N.locales.map(s => s.toLowerCase()))
const DEFAULT = I18N.defaultLocale.toLowerCase()

const RE_BOT =
    /(Googlebot|Google-InspectionTool|AdsBot-Google|AdsBot-Google-Mobile|AdsBot-Google-Mobile-Apps|Googlebot-Image|Googlebot-News|GoogleOther|GoogleReadAloud|Mediapartners-Google|APIs-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|YandexImages|Yandex|Applebot|SemrushBot|AhrefsBot|DotBot|MJ12bot|CCBot|PetalBot|Bytespider|Sogou|SogouSpider|Sogou web spider|SeznamBot|Qwantify|NaverBot|facebot|facebookexternalhit|FacebookBot|FacebookCatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Quora Link Preview|SkypeUriPreview|Embedly|rogerbot|SiteAuditBot|W3C_Validator|validator\.nu|Chrome-Lighthouse|Lighthouse|Page Speed|GTmetrix|Pingdom|Screaming Frog|GPTBot|ClaudeBot|PerplexityBot|YouBot|Amazonbot|HeadlessChrome|PhantomJS|curl|wget)/i
const RE_COOKIE = new RegExp('(?:^|; )' + COOKIE + '=([^;]*)')

export const config = {
    matcher: [
        '/((?!api|_astro|assets|_image|\\.well-known|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|webp|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|txt|xml|json|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)).*)',
    ],
}

const lc = s => (typeof s === 'string' ? s.toLowerCase() : '')

const clean = p => {
    if (!p || p === '/') return '/'
    let a = 0,
        b = p.length - 1
    while (a <= b && p.charCodeAt(a) === 47) a++
    while (b >= a && p.charCodeAt(b) === 47) b--
    return a > b ? '/' : '/' + p.slice(a, b + 1)
}

const seg0 = p => {
    const c = clean(p)
    if (c === '/') return ''
    const n = c.indexOf('/', 1)
    return n === -1 ? c.slice(1) : c.slice(1, n)
}

const withLocale = (p, l) => (clean(p) === '/' ? `/${l}` : `/${l}${clean(p)}`)
const withoutLocale = p => {
    const c = clean(p)
    if (c === '/') return '/'
    const n = c.indexOf('/', 1)
    return n === -1 ? '/' : c.slice(n)
}

const getCookie = cookieHeader => {
    if (!cookieHeader) return ''
    const m = RE_COOKIE.exec(cookieHeader)
    return m ? decodeURIComponent(m[1]) : ''
}

const setCookie = (value, isHttps) =>
    `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${isHttps ? '; Secure' : ''}`

const pickBest = (cookieLocale, acceptHeader) => {
    const c = lc(cookieLocale)
    if (c && LOCALES.has(c)) return c
    if (acceptHeader) {
        const parts = acceptHeader.split(',')
        for (let i = 0; i < parts.length; i++) {
            const s = parts[i]
            const semi = s.indexOf(';')
            const tag = lc(semi === -1 ? s.trim() : s.slice(0, semi).trim())
            if (!tag || tag === '*') continue
            if (LOCALES.has(tag)) return tag
            const dash = tag.indexOf('-')
            if (dash > 0) {
                const base = tag.slice(0, dash)
                if (LOCALES.has(base)) return base
            }
        }
    }
    return DEFAULT
}

const respond = (status, location, cookieValue, vary = true) => {
    const headers = {}
    if (location) headers['Location'] = location
    if (cookieValue) {
        headers['Set-Cookie'] = cookieValue
    } else {
        headers['Cache-Control'] =
            'public, s-maxage=600, max-age=600, stale-while-revalidate=30'
    }
    if (vary) headers['Vary'] = 'Accept-Language, Cookie'
    return new Response(null, { status, headers })
}

export default function middleware(request) {
    const url = new URL(request.url)
    const isHttps = url.protocol === 'https:'
    const path = clean(url.pathname)

    if (path === '/admin' || path.startsWith('/admin/')) return next()
    const ref = request.headers.get('referer')
    if (ref && ref.indexOf('/admin') !== -1) return next()

    const originalSearch = url.search
    const originalHash = url.hash

    const ua = request.headers.get('user-agent') || ''
    const cookieHeader = request.headers.get('cookie') || ''
    const acceptLang = request.headers.get('accept-language') || ''
    const isBot = RE_BOT.test(ua)

    const cookie = lc(getCookie(cookieHeader))
    const seg = lc(seg0(path))
    const hasPrefix = LOCALES.has(seg)

    const rawChosen = url.searchParams.get(LANG_PARAM)
    const chosen = rawChosen ? lc(rawChosen.split('-')[0]) : ''
    const hasChosen = !!chosen && LOCALES.has(chosen)

    if (hasChosen) {
        url.searchParams.delete(LANG_PARAM)
        const cleanSearch = url.search || ''
        const targetPath = hasPrefix
            ? seg === chosen
                ? path
                : withLocale(withoutLocale(path), chosen)
            : chosen === DEFAULT
              ? path
              : withLocale(path, chosen)

        if (targetPath !== path || cleanSearch !== originalSearch) {
            const loc = targetPath + cleanSearch + (originalHash || '')
            const sc =
                cookie !== chosen ? setCookie(chosen, isHttps) : undefined
            return respond(307, loc, sc)
        }
        if (cookie !== chosen) {
            return next({
                headers: { 'Set-Cookie': setCookie(chosen, isHttps) },
            })
        }
        return next()
    }

    const best = pickBest(cookie, acceptLang)

    if (hasPrefix) {
        if (cookie && LOCALES.has(cookie) && cookie !== seg) {
            const loc =
                withLocale(withoutLocale(path), cookie) +
                originalSearch +
                (originalHash || '')
            return respond(307, loc, setCookie(cookie, isHttps))
        }

        if (seg === DEFAULT) {
            const target =
                withoutLocale(path) + originalSearch + (originalHash || '')
            const current = url.pathname + url.search + (originalHash || '')
            if (target !== current) {
                const sc =
                    cookie !== DEFAULT ? setCookie(DEFAULT, isHttps) : undefined
                return respond(308, target, sc)
            }
        }

        if (!cookie || cookie !== seg) {
            return next({ headers: { 'Set-Cookie': setCookie(seg, isHttps) } })
        }
        return next()
    }

    const targetLocale = cookie && LOCALES.has(cookie) ? cookie : best
    if (!isBot && targetLocale !== DEFAULT) {
        const loc =
            withLocale(path, targetLocale) +
            originalSearch +
            (originalHash || '')
        const sc =
            cookie !== targetLocale
                ? setCookie(targetLocale, isHttps)
                : undefined
        return respond(307, loc, sc)
    }

    return next()
}
