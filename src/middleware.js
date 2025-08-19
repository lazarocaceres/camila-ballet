import { defineMiddleware } from 'astro:middleware'
import { i18n } from 'i18n'

const COOKIE_NAME = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const lc = s => (typeof s === 'string' ? s.toLowerCase() : '')
const cleanPath = p =>
    !p || p === '/' ? '/' : '/' + p.replace(/^\/+|\/+$/g, '')
const firstSeg = pathname =>
    cleanPath(pathname).split('/').filter(Boolean)[0] || ''

const locales = new Set((i18n.locales || []).map(lc))
const defaultLocale = lc(i18n.defaultLocale)

const withLocale = (pathname, locale) => {
    const p = cleanPath(pathname)
    return p === '/' ? `/${locale}` : `/${locale}${p}`
}
const withoutLocale = pathname => {
    const segs = cleanPath(pathname).split('/').filter(Boolean)
    return segs.length === 0 ? '/' : '/' + segs.slice(1).join('/')
}

function parseAcceptLanguage(header) {
    if (!header) return []
    return header
        .split(',')
        .map(part => {
            const [tagRaw, ...params] = part.trim().split(';')
            const tag = lc(tagRaw)
            const q = params.find(p => p.trim().startsWith('q='))
            const weight = q ? parseFloat(q.split('=')[1]) : 1
            return { tag, weight: isNaN(weight) ? 1 : weight }
        })
        .filter(({ tag }) => tag && tag !== '*')
        .sort((a, b) => b.weight - a.weight)
        .map(x => x.tag)
}

function pickBestLocale({ cookieLocale, acceptLangHeader }) {
    if (cookieLocale && locales.has(lc(cookieLocale))) return lc(cookieLocale)
    for (const tag of parseAcceptLanguage(acceptLangHeader || '')) {
        const base = lc(tag.split('-')[0])
        if (locales.has(tag)) return tag
        if (locales.has(base)) return base
    }
    return defaultLocale
}

const shouldBypass = pathname =>
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/_image') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    pathname.match(
        /\.(png|jpe?g|webp|gif|svg|ico|css|js|mjs|txt|xml|json|map|woff2?|ttf|otf|eot|webmanifest|wasm|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)$/i,
    )

const BOT_UA =
    /(Googlebot|Google-InspectionTool|AdsBot-Google|AdsBot-Google-Mobile|AdsBot-Google-Mobile-Apps|Googlebot-Image|Googlebot-News|GoogleOther|GoogleReadAloud|Mediapartners-Google|APIs-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|YandexImages|Applebot|SemrushBot|AhrefsBot|DotBot|MJ12bot|CCBot|PetalBot|Bytespider|Sogou|Sogou web spider|SeznamBot|Qwantify|NaverBot|facebot|facebookexternalhit|FacebookBot|FacebookCatalog|WhatsApp|Pinterestbot|Pinterest|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Quora Link Preview|SkypeUriPreview|Embedly|rogerbot|SiteAuditBot|W3C_Validator|validator\.nu|Chrome-Lighthouse|Lighthouse|Page Speed|GTmetrix|Pingdom|Screaming Frog|GPTBot|ClaudeBot)/i

const cookieString = ({
    name,
    value,
    url,
    httpOnly,
    sameSite = 'Lax',
    maxAge,
}) => {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/']
    if (maxAge) parts.push(`Max-Age=${maxAge}`)
    if (sameSite) parts.push(`SameSite=${sameSite}`)
    if (httpOnly) parts.push('HttpOnly')
    if (url.protocol === 'https:') parts.push('Secure')
    return parts.join('; ')
}

const redirect = (
    target,
    { setCookie } = {},
    vary = 'Accept-Language, Cookie',
    status = 307,
) => {
    const headers = new Headers({ Location: target, Vary: vary })
    if (setCookie) headers.append('Set-Cookie', setCookie)
    return new Response(null, { status, headers })
}

export const onRequest = defineMiddleware(async (ctx, next) => {
    const url = new URL(ctx.request.url)
    const pathname = cleanPath(url.pathname)
    if (shouldBypass(pathname)) return next()

    const ua = ctx.request.headers.get('user-agent') || ''
    const isBot = BOT_UA.test(ua)

    const seg = lc(firstSeg(pathname))
    const hasPrefix = locales.has(seg)
    const cookieLocale = lc(ctx.cookies.get(COOKIE_NAME)?.value || '')
    const best = pickBestLocale({
        cookieLocale,
        acceptLangHeader: ctx.request.headers.get('accept-language') || '',
    })

    if (hasPrefix) {
        if (cookieLocale !== seg) {
            const setCookie = cookieString({
                name: COOKIE_NAME,
                value: seg,
                url,
                httpOnly: false,
                sameSite: 'Lax',
                maxAge: COOKIE_MAX_AGE,
            })
            if (seg === defaultLocale) {
                const target = withoutLocale(pathname) + url.search
                if (target !== url.pathname + url.search) {
                    return redirect(
                        target,
                        { setCookie },
                        'Accept-Language, Cookie',
                        308,
                    )
                }
            }
            const res = await next()
            res.headers.append('Set-Cookie', setCookie)
            res.headers.append('Vary', 'Accept-Language, Cookie')
            return res
        }
        return next()
    }

    if (!isBot && best !== defaultLocale) {
        const target = withLocale(pathname, best) + url.search
        const setCookie = cookieString({
            name: COOKIE_NAME,
            value: best,
            url,
            httpOnly: false,
            sameSite: 'Lax',
            maxAge: COOKIE_MAX_AGE,
        })
        return redirect(target, { setCookie })
    }

    return next()
})
