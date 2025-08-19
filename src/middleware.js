import { defineMiddleware, sequence } from 'astro:middleware'
import { getRelativeLocaleUrl, parseAcceptLanguage } from 'astro:i18n'
import { redirect } from 'astro:middleware'
import { i18n } from 'i18n'

const COOKIE_NAME = 'locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function pickBestLocale({ cookieLocale, headerLocales }) {
    const supported = new Set(i18n.locales)
    if (cookieLocale && supported.has(cookieLocale)) return cookieLocale

    for (const l of headerLocales) {
        const base = l.toLowerCase().split('-')[0]
        if (supported.has(l)) return l
        if (supported.has(base)) return base
    }

    return i18n.defaultLocale
}

const localeMiddleware = defineMiddleware(async (ctx, next) => {
    const url = new URL(ctx.request.url)
    const pathname = url.pathname.replace(/\/+$/, '') || '/'

    const pathSeg = pathname.split('/').filter(Boolean)[0]
    const hasLocalePrefix = i18n.locales.includes(pathSeg)

    const cookieLocale = ctx.cookies.get(COOKIE_NAME)?.value
    const headerLocales =
        parseAcceptLanguage(ctx.request.headers.get('accept-language') ?? '') ??
        []
    const best = pickBestLocale({ cookieLocale, headerLocales })

    if (hasLocalePrefix) {
        if (cookieLocale !== pathSeg) {
            ctx.cookies.set(COOKIE_NAME, pathSeg, {
                path: '/',
                httpOnly: false,
                sameSite: 'lax',
                maxAge: COOKIE_MAX_AGE,
            })
        }

        if (pathSeg === i18n.defaultLocale) {
            const rest = pathname.split('/').slice(1).join('/')
            const target = '/' + (rest || '')
            if (target !== pathname) return redirect(ctx, target)
        }

        return next()
    }

    if (best !== i18n.defaultLocale) {
        const target = getRelativeLocaleUrl(best, pathname + url.search)

        ctx.cookies.set(COOKIE_NAME, best, {
            path: '/',
            httpOnly: false,
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
        })
        return redirect(ctx, target)
    }

    return next()
})

export const onRequest = sequence(localeMiddleware)
