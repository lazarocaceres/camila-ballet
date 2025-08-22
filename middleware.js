import { next } from '@vercel/functions'
import { i18n as I18N } from './i18n.js'

const COOKIE = 'locale'
const COOKIE_MAX_AGE = 31536000

const LOCALES = I18N.locales.map(s => s.toLowerCase())
const LOCALE_SET = new Set(LOCALES)
const DEFAULT = I18N.defaultLocale.toLowerCase()

export const config = {
    matcher: [
        '/((?!api|admin(?:/|$)|_astro|assets|_image|\\.well-known|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|webp|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|txt|xml|json|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)).*)',
    ],
}

const RE_BOT =
    /(google|bing|duckduckbot|yandex|baidu|semrush|ahrefs|facebook|twitter|linkedin|slack|discord|telegram|validator|lighthouse|gtmetrix|pingdom|curl|wget|headless|phantom|bot)/i
const RE_COOKIE = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)', 'i')

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
    const v = m[1]
    return v.includes('%') ? decodeURIComponent(v) : v
}
const setCookie = (value, isHttps) =>
    `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${isHttps ? '; Secure' : ''}`

const pickBest = (cookieLocale, acceptHeader) => {
    const c = lc(cookieLocale)
    if (c && LOCALE_SET.has(c)) return c
    if (acceptHeader) {
        const parts = acceptHeader.split(',')
        for (let i = 0; i < parts.length; i++) {
            const s = parts[i]
            const semi = s.indexOf(';')
            const tag = lc(semi === -1 ? s.trim() : s.slice(0, semi).trim())
            if (!tag || tag === '*') continue
            if (LOCALE_SET.has(tag)) return tag
            const dash = tag.indexOf('-')
            if (dash > 0) {
                const base = tag.slice(0, dash)
                if (LOCALE_SET.has(base)) return base
            }
        }
    }
    return DEFAULT
}

const redirectUser307 = (location, cookieValue) => {
    const headers = { Location: location, 'Cache-Control': 'private, no-store' }
    if (cookieValue) headers['Set-Cookie'] = cookieValue
    return new Response(null, { status: 307, headers })
}
const redirectStatic308 = (location, seconds) =>
    new Response(null, {
        status: 308,
        headers: {
            Location: location,
            'Cache-Control': `public, s-maxage=${seconds}, max-age=${seconds}, immutable`,
        },
    })
const pass = cookieValue =>
    cookieValue ? next({ headers: { 'Set-Cookie': cookieValue } }) : next()

export default function middleware(request) {
    const url = new URL(request.url)
    const isHttps = url.protocol === 'https:'
    const path = clean(url.pathname)

    const ua = request.headers.get('user-agent') || ''
    const q = url.search || ''
    const h = url.hash || ''
    const seg = lc(seg0(path))
    const hasPrefix = LOCALE_SET.has(seg)

    if (RE_BOT.test(ua)) {
        if (hasPrefix && seg === DEFAULT) {
            const target = withoutLocale(path) + q + h
            const current = url.pathname + q + h
            if (target !== current) return redirectStatic308(target, 31536000)
        }
        return next()
    }

    const cookieHeader = request.headers.get('cookie') || ''
    const acceptLang = request.headers.get('accept-language') || ''
    const cookie = lc(getCookie(cookieHeader))

    if (hasPrefix) {
        if (seg === DEFAULT) {
            const target = withoutLocale(path) + q + h
            const current = url.pathname + q + h
            if (target !== current) {
                if (cookie !== DEFAULT)
                    return redirectUser307(target, setCookie(DEFAULT, isHttps))
                return redirectStatic308(target, 31536000)
            }
        }
        if (cookie !== seg) return pass(setCookie(seg, isHttps))
        return pass()
    }

    const best = pickBest(cookie, acceptLang)
    if (best && best !== DEFAULT) {
        const loc = withLocale(path, best) + q + h
        const sc = cookie !== best ? setCookie(best, isHttps) : undefined
        return redirectUser307(loc, sc)
    }

    return pass()
}
