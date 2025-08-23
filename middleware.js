import { next } from '@vercel/functions'
import { i18n as I18N } from './i18n.js'

const COOKIE = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const LANG_PARAM = 'lang'

const LOCALES = new Set(I18N.locales.map(s => s.toLowerCase()))
const DEFAULT = I18N.defaultLocale.toLowerCase()

const RE_BOT =
    /(Googlebot|Google-InspectionTool|AdsBot-Google|AdsBot-Google-Mobile|AdsBot-Google-Mobile-Apps|Googlebot-Image|Googlebot-News|GoogleOther|GoogleReadAloud|Mediapartners-Google|APIs-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|YandexImages|Yandex|Applebot|SemrushBot|AhrefsBot|DotBot|MJ12bot|CCBot|PetalBot|Bytespider|Sogou|SogouSpider|Sogou web spider|SeznamBot|Qwantify|NaverBot|facebot|facebookexternalhit|FacebookBot|FacebookCatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Quora Link Preview|SkypeUriPreview|Embedly|rogerbot|SiteAuditBot|W3C_Validator|validator\.nu|Chrome-Lighthouse|Lighthouse|Page Speed|GTmetrix|Pingdom|Screaming Frog|GPTBot|ClaudeBot|PerplexityBot|YouBot|Amazonbot|HeadlessChrome|PhantomJS|curl|wget)/i
const RE_COOKIE = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)')

export const config = {
    runtime: 'edge',
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

const getCookie = cookieHeader => {
    if (!cookieHeader) return ''
    const m = RE_COOKIE.exec(cookieHeader)
    return m ? decodeURIComponent(m[1]) : ''
}

const setCookie = (value, isHttps) =>
    `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${isHttps ? '; Secure' : ''}`

const parseAL = h =>
    h
        .split(',')
        .map((raw, i) => {
            const [lang, ...params] = raw.trim().split(';')
            const q = params.reduce((acc, p) => {
                const [k, v] = p.split('=').map(s => s.trim())
                return k === 'q' ? parseFloat(v) || 0 : acc
            }, 1)
            return { lang: lc(lang), q, i }
        })
        .filter(x => x.lang && x.lang !== '*')
        .sort((a, b) => b.q - a.q || a.i - b.i)

const pickBest = (cookieLocale, acceptHeader) => {
    const c = lc(cookieLocale)
    if (c && LOCALES.has(c)) return c
    if (acceptHeader) {
        for (const { lang } of parseAL(acceptHeader)) {
            if (LOCALES.has(lang)) return lang
            const dash = lang.indexOf('-')
            if (dash > 0) {
                const base = lang.slice(0, dash)
                if (LOCALES.has(base)) return base
            }
        }
    }
    return DEFAULT
}

const respondRedirectUser = (status, location, cookieValue, vary = true) => {
    const headers = { Location: location }
    if (cookieValue) headers['Set-Cookie'] = cookieValue
    if (vary) headers['Vary'] = 'Accept-Language, Cookie'
    headers['Cache-Control'] = 'private, no-store'
    return new Response(null, { status, headers })
}

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
    const seg = lc(seg0Clean(path))
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
                : withLocaleClean(withoutLocaleClean(path), chosen)
            : chosen === DEFAULT
              ? path
              : withLocaleClean(path, chosen)

        if (targetPath !== path || cleanSearch !== originalSearch) {
            const loc = targetPath + cleanSearch + (originalHash || '')
            const sc =
                cookie !== chosen ? setCookie(chosen, isHttps) : undefined
            return respondRedirectUser(307, loc, sc, true)
        }
        if (cookie !== chosen) {
            if (!isBot) {
                const loc = path + (originalSearch || '') + (originalHash || '')
                return respondRedirectUser(
                    307,
                    loc,
                    setCookie(chosen, isHttps),
                    true,
                )
            }
            return passNext()
        }
        return passNext()
    }

    if (hasPrefix) {
        if (!isBot && cookie && LOCALES.has(cookie) && cookie !== seg) {
            const loc =
                withLocaleClean(withoutLocaleClean(path), cookie) +
                originalSearch +
                (originalHash || '')
            return respondRedirectUser(
                307,
                loc,
                setCookie(cookie, isHttps),
                true,
            )
        }

        if (seg === DEFAULT) {
            const target =
                withoutLocaleClean(path) + originalSearch + (originalHash || '')
            const current = url.pathname + url.search + (originalHash || '')
            if (target !== current) {
                return respondRedirectStatic(308, target, 31536000)
            }
        }

        if (!cookie || cookie !== seg) {
            if (!isBot) {
                const loc = path + (originalSearch || '') + (originalHash || '')
                return respondRedirectUser(
                    307,
                    loc,
                    setCookie(seg, isHttps),
                    true,
                )
            }
            return passNext()
        }
        return passNext()
    }

    const best = pickBest(cookie, acceptLang)
    const targetLocale = cookie && LOCALES.has(cookie) ? cookie : best

    if (!isBot && targetLocale !== DEFAULT) {
        const loc =
            withLocaleClean(path, targetLocale) +
            originalSearch +
            (originalHash || '')
        const sc =
            cookie !== targetLocale
                ? setCookie(targetLocale, isHttps)
                : undefined
        return respondRedirectUser(307, loc, sc, true)
    }

    return passNext()
}
