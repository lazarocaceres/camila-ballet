import { defineMiddleware } from 'astro:middleware'
import { i18n } from 'i18n'

const COOKIE_NAME = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const lc = s => (typeof s === 'string' ? s.toLowerCase() : '')
const cleanPath = p => {
    if (!p || p === '/') return '/'
    return '/' + p.replace(/^\/+|\/+$/g, '')
}
const firstSeg = pathname =>
    cleanPath(pathname).split('/').filter(Boolean)[0] || ''

const locales = new Set((i18n.locales || []).map(lc))
const defaultLocale = lc(i18n.defaultLocale)

const withLocale = (pathname, locale) => {
    const p = cleanPath(pathname)
    if (p === '/') return `/${locale}`
    return `/${locale}${p}`
}

const withoutLocale = pathname => {
    const segs = cleanPath(pathname).split('/').filter(Boolean)
    if (segs.length === 0) return '/'
    return '/' + segs.slice(1).join('/')
}

function parseAcceptLanguage(header) {
    if (!header) return []
    return header
        .split(',')
        .map(part => {
            const [tag, ...params] = part.trim().split(';')
            const q = params.find(p => p.trim().startsWith('q='))
            const weight = q ? parseFloat(q.split('=')[1]) : 1
            return { tag: lc(tag), weight: isNaN(weight) ? 1 : weight }
        })
        .sort((a, b) => b.weight - a.weight)
        .map(x => x.tag)
}

function pickBestLocale({ cookieLocale, acceptLangHeader }) {
    if (cookieLocale && locales.has(lc(cookieLocale))) return lc(cookieLocale)

    for (const tag of parseAcceptLanguage(acceptLangHeader)) {
        const base = lc(tag.split('-')[0])
        if (locales.has(tag)) return tag
        if (locales.has(base)) return base
    }

    return defaultLocale
}

const shouldBypass = pathname => {
    return (
        pathname.startsWith('/_astro/') ||
        pathname.startsWith('/assets/') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/robots.txt') ||
        pathname.startsWith('/sitemap') ||
        pathname.match(
            /\.(png|jpe?g|webp|gif|svg|ico|css|js|mjs|txt|xml|json|map)$/i,
        )
    )
}

export const onRequest = defineMiddleware(async (ctx, next) => {
    const url = new URL(ctx.request.url)
    const pathname = cleanPath(url.pathname)

    if (shouldBypass(pathname)) {
        return next()
    }

    const seg = lc(firstSeg(pathname))
    const hasPrefix = locales.has(seg)
    const cookieLocale = lc(ctx.cookies.get(COOKIE_NAME)?.value || '')
    const best = pickBestLocale({
        cookieLocale,
        acceptLangHeader: ctx.request.headers.get('accept-language') || '',
    })

    if (hasPrefix) {
        if (cookieLocale !== seg) {
            ctx.cookies.set(COOKIE_NAME, seg, {
                path: '/',
                httpOnly: false,
                sameSite: 'lax',
                maxAge: COOKIE_MAX_AGE,
            })
        }

        if (seg === defaultLocale) {
            const target = withoutLocale(pathname) + url.search
            if (target !== url.pathname + url.search) {
                return Response.redirect(new URL(target, url), 308)
            }
        }

        return next()
    }

    if (best !== defaultLocale) {
        const target = withLocale(pathname, best) + url.search

        ctx.cookies.set(COOKIE_NAME, best, {
            path: '/',
            httpOnly: false,
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
        })
        return Response.redirect(new URL(target, url), 307)
    }

    return next()
})
