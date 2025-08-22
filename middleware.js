import { next } from '@vercel/functions'
import { i18n as I18N } from './i18n.js'

const COOKIE = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const LOCALES = new Set(I18N.locales.map(s => s.toLowerCase()))
const DEFAULT = I18N.defaultLocale.toLowerCase()

export const config = {
    matcher: [
        '/((?!api|admin(?:/|$)|_astro|assets|_image|\\.well-known|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|webp|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|txt|xml|json|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)).*)',
    ],
}

const RE_BOT =
    /(Googlebot|Google-InspectionTool|AdsBot-Google|AdsBot-Google-Mobile|AdsBot-Google-Mobile-Apps|Googlebot-Image|Googlebot-News|GoogleOther|GoogleReadAloud|Mediapartners-Google|APIs-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|YandexImages|Yandex|Applebot|SemrushBot|AhrefsBot|DotBot|MJ12bot|CCBot|PetalBot|Bytespider|Sogou|SogouSpider|Sogou web spider|SeznamBot|Qwantify|NaverBot|facebot|facebookexternalhit|FacebookBot|FacebookCatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Quora Link Preview|SkypeUriPreview|Embedly|rogerbot|SiteAuditBot|W3C_Validator|validator\.nu|Chrome-Lighthouse|Lighthouse|Page Speed|GTmetrix|Pingdom|Screaming Frog|GPTBot|ClaudeBot|PerplexityBot|YouBot|Amazonbot|HeadlessChrome|PhantomJS|curl|wget)/i
const RE_COOKIE = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)')

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
    if (!m) return ''
    let v = m[1]
    if (v.includes('%')) {
        try {
            v = decodeURIComponent(v)
        } catch {}
    }
    v = v.trim()
    if (v.startsWith('/')) v = v.slice(1)
    const dash = v.indexOf('-')
    if (dash > 0) v = v.slice(0, dash)
    return v.toLowerCase()
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

const respondRedirectUser = (status, location, cookieValue) => {
    const headers = { Location: location, 'Cache-Control': 'private, no-store' }
    if (cookieValue) headers['Set-Cookie'] = cookieValue
    return new Response(null, { status, headers })
}
const respondRedirectStatic = (status, location, cacheSeconds) => {
    const headers = {
        Location: location,
        'Cache-Control': `public, s-maxage=${cacheSeconds}, max-age=${cacheSeconds}${cacheSeconds >= 31536000 ? ', immutable' : ''}`,
    }
    return new Response(null, { status, headers })
}
const passNext = cookieValue => {
    if (cookieValue) {
        return next({
            headers: {
                'Set-Cookie': cookieValue,
                Vary: 'Accept-Language, Cookie',
            },
        })
    }
    return next({ headers: { Vary: 'Accept-Language, Cookie' } })
}

export default function middleware(request) {
    const url = new URL(request.url)
    const isHttps = url.protocol === 'https:'
    const path = clean(url.pathname)

    const ua = request.headers.get('user-agent') || ''
    const cookieHeader = request.headers.get('cookie') || ''
    const acceptLang = request.headers.get('accept-language') || ''
    const q = url.search || ''
    const h = url.hash || ''

    const isBot = RE_BOT.test(ua)
    const cookie = getCookie(cookieHeader)
    const seg = lc(seg0(path))
    const hasPrefix = LOCALES.has(seg)

    if (isBot) {
        if (hasPrefix && seg === DEFAULT) {
            const target = withoutLocale(path) + q + h
            const current = url.pathname + q + h
            if (target !== current)
                return respondRedirectStatic(308, target, 31536000)
        }
        return next()
    }

    if (hasPrefix) {
        if (seg === DEFAULT) {
            const target = withoutLocale(path) + q + h
            const current = url.pathname + q + h
            if (target !== current) {
                if (cookie !== DEFAULT)
                    return respondRedirectUser(
                        307,
                        target,
                        setCookie(DEFAULT, isHttps),
                    )
                return respondRedirectStatic(308, target, 31536000)
            }
        }
        return passNext(cookie !== seg ? setCookie(seg, isHttps) : undefined)
    }

    const best = pickBest(cookie, acceptLang)
    const targetLocale = cookie && LOCALES.has(cookie) ? cookie : best

    if (targetLocale !== DEFAULT) {
        const loc = withLocale(path, targetLocale) + q + h
        const sc =
            cookie !== targetLocale
                ? setCookie(targetLocale, isHttps)
                : undefined
        return respondRedirectUser(307, loc, sc)
    }

    return passNext()
}
