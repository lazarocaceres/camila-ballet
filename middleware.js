import { next } from '@vercel/functions'
import { i18n as I18N } from './i18n'

const COOKIE = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const LANG_PARAM = 'lang'

const LOCALES = new Set(I18N.locales.map(s => s.toLowerCase()))
const DEFAULT = I18N.defaultLocale.toLowerCase()

const RE_BOT =
    /(Googlebot|Google-InspectionTool|AdsBot-Google|AdsBot-Google-Mobile|AdsBot-Google-Mobile-Apps|Googlebot-Image|Googlebot-News|GoogleOther|GoogleReadAloud|Mediapartners-Google|APIs-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|YandexImages|Yandex|Applebot|SemrushBot|AhrefsBot|DotBot|MJ12bot|CCBot|PetalBot|Bytespider|Sogou|SogouSpider|Sogou web spider|SeznamBot|Qwantify|NaverBot|facebot|facebookexternalhit|FacebookBot|FacebookCatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Quora Link Preview|SkypeUriPreview|Embedly|rogerbot|SiteAuditBot|W3C_Validator|validator\.nu|Chrome-Lighthouse|Lighthouse|Page Speed|GTmetrix|Pingdom|Screaming Frog|GPTBot|ClaudeBot|PerplexityBot|YouBot|Amazonbot|HeadlessChrome|PhantomJS|curl|wget)/i

export const config = {
    matcher: [
        '/((?!admin|api|_astro|assets|_image|\\.well-known|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|webp|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|txt|xml|json|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)).*)',
    ],
}

const lc = s => (typeof s === 'string' ? s.toLowerCase() : '')
const clean = p => (!p || p === '/' ? '/' : '/' + p.replace(/^\/+|\/+$/g, ''))
const seg0 = p => clean(p).split('/').filter(Boolean)[0] || ''
const withLocale = (p, l) => (clean(p) === '/' ? `/${l}` : `/${l}${clean(p)}`)
const withoutLocale = p => {
    const parts = clean(p).split('/').filter(Boolean)
    return parts.length ? '/' + parts.slice(1).join('/') : '/'
}
const getCookie = (cookie, name) => {
    if (!cookie) return ''
    const m = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : ''
}
const setCookie = (name, value, url) => {
    const v = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
    return url.protocol === 'https:' ? v + '; Secure' : v
}
const pickBest = (cookieLocale, acceptHeader) => {
    const c = lc(cookieLocale || '')
    if (c && LOCALES.has(c)) return c
    if (acceptHeader) {
        const parts = acceptHeader.split(',')
        for (let i = 0; i < parts.length; i++) {
            const tag = lc(parts[i].split(';')[0].trim())
            if (!tag || tag === '*') continue
            const base = lc(tag.split('-')[0])
            if (LOCALES.has(tag)) return tag
            if (LOCALES.has(base)) return base
        }
    }
    return DEFAULT
}

export default function middleware(request) {
    const original = new URL(request.url)
    const url = new URL(request.url)
    const path = clean(url.pathname)
    const originalSearch = original.search
    const originalHash = original.hash

    const ua = request.headers.get('user-agent') || ''
    const cookieHeader = request.headers.get('cookie') || ''
    const acceptLang = request.headers.get('accept-language') || ''
    const isBot = RE_BOT.test(ua)

    const cookie = lc(getCookie(cookieHeader, COOKIE))
    const seg = lc(seg0(path))
    const hasPrefix = LOCALES.has(seg)

    const chosen = lc(url.searchParams.get(LANG_PARAM))
    const hasChosen = chosen && LOCALES.has(chosen)
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
            return new Response(null, {
                status: 307,
                headers: {
                    Location: targetPath + cleanSearch + (originalHash || ''),
                    'Set-Cookie':
                        cookie !== chosen
                            ? setCookie(COOKIE, chosen, url)
                            : undefined,
                    Vary: 'Accept-Language, Cookie',
                },
            })
        }

        if (cookie !== chosen) {
            return next({
                headers: { 'Set-Cookie': setCookie(COOKIE, chosen, url) },
            })
        }
        return next()
    }

    const best = pickBest(cookie, acceptLang)
    if (hasPrefix) {
        if (cookie && LOCALES.has(cookie) && cookie !== seg) {
            return new Response(null, {
                status: 307,
                headers: {
                    Location:
                        withLocale(withoutLocale(path), cookie) +
                        originalSearch +
                        (originalHash || ''),
                    'Set-Cookie': setCookie(COOKIE, cookie, url),
                    Vary: 'Accept-Language, Cookie',
                },
            })
        }

        if (seg === DEFAULT) {
            const target =
                withoutLocale(path) + originalSearch + (originalHash || '')
            if (
                target !==
                original.pathname + original.search + (originalHash || '')
            ) {
                return new Response(null, {
                    status: 308,
                    headers: {
                        Location: target,
                        'Set-Cookie':
                            cookie !== DEFAULT
                                ? setCookie(COOKIE, DEFAULT, url)
                                : undefined,
                        Vary: 'Accept-Language, Cookie',
                    },
                })
            }
        }

        if (!cookie || cookie !== seg) {
            return next({
                headers: { 'Set-Cookie': setCookie(COOKIE, seg, url) },
            })
        }
        return next()
    }

    const targetLocale = cookie && LOCALES.has(cookie) ? cookie : best
    if (!isBot && targetLocale !== DEFAULT) {
        return new Response(null, {
            status: 307,
            headers: {
                Location:
                    withLocale(path, targetLocale) +
                    originalSearch +
                    (originalHash || ''),
                'Set-Cookie':
                    cookie !== targetLocale
                        ? setCookie(COOKIE, targetLocale, url)
                        : undefined,
                Vary: 'Accept-Language, Cookie',
            },
        })
    }

    return next()
}
