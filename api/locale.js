import { i18n } from 'i18n'

export const config = { runtime: 'edge' }

const COOKIE = 'locale'
const MAX_AGE = 60 * 60 * 24 * 365

const locales = new Set(i18n.locales.map(s => s.toLowerCase()))
const DEF = i18n.defaultLocale.toLowerCase()

const RE_ASSET =
    /\.(png|jpe?g|webp|gif|svg|ico|css|js|mjs|txt|xml|json|map|woff2?|ttf|otf|eot|webmanifest|wasm|pdf|avif|heic|heif|mp4|webm|ogg|mp3|wav)$/i
const RE_BOT =
    /(Google|bingbot|BingPreview|DuckDuckBot|Yandex|Applebot|SemrushBot|AhrefsBot|DotBot|GPTBot|ClaudeBot|Slackbot|Discordbot|Twitterbot|LinkedInBot|WhatsApp|Facebook|Pinterest)/i

const lc = s => (typeof s === 'string' ? s.toLowerCase() : '')
const clean = p => (!p || p === '/' ? '/' : '/' + p.replace(/^\/+|\/+$/g, ''))
const firstSeg = p => clean(p).split('/').filter(Boolean)[0] || ''
const withLocale = (p, l) => (clean(p) === '/' ? `/${l}` : `/${l}${clean(p)}`)
const withoutLocale = p => {
    const segs = clean(p).split('/').filter(Boolean)
    return segs.length ? '/' + segs.slice(1).join('/') : '/'
}
const bypass = p =>
    p.startsWith('/_astro/') ||
    p.startsWith('/_image') ||
    p.startsWith('/assets/') ||
    p.startsWith('/.well-known') ||
    p.startsWith('/api') ||
    p.startsWith('/favicon') ||
    p === '/robots.txt' ||
    p.startsWith('/sitemap') ||
    RE_ASSET.test(p)

const getCookie = (cookie, name) => {
    if (!cookie) return ''
    const m = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : ''
}
const setCookie = (name, value, url) => {
    const parts = [
        `${name}=${encodeURIComponent(value)}`,
        'Path=/',
        `Max-Age=${MAX_AGE}`,
        'SameSite=Lax',
    ]
    if (url.protocol === 'https:') parts.push('Secure')
    return parts.join('; ')
}

function pickBest(cookieLocale, acceptHeader) {
    const c = lc(cookieLocale || '')
    if (c && locales.has(c)) return c
    if (acceptHeader) {
        const items = acceptHeader.split(',')
        for (let i = 0; i < items.length; i++) {
            const tag = lc(items[i].split(';')[0].trim())
            if (!tag || tag === '*') continue
            const base = lc(tag.split('-')[0])
            if (locales.has(tag)) return tag
            if (locales.has(base)) return base
        }
    }
    return DEF
}

export default async function handler(req) {
    const url = new URL(req.url)
    const path = clean(url.pathname)
    if (bypass(path)) return fetch(req)

    const ua = req.headers.get('user-agent') || ''
    const isBot = RE_BOT.test(ua)

    const seg = lc(firstSeg(path))
    const hasPrefix = locales.has(seg)
    const cookieLocale = getCookie(req.headers.get('cookie') || '', COOKIE)
    const best = pickBest(
        cookieLocale,
        req.headers.get('accept-language') || '',
    )

    if (hasPrefix) {
        if (seg === DEF) {
            const target = withoutLocale(path) + url.search
            if (target !== url.pathname + url.search) {
                return new Response(null, {
                    status: 308,
                    headers: {
                        Location: target,
                        Vary: 'Accept-Language, Cookie',
                        'Set-Cookie': setCookie(COOKIE, seg, url),
                    },
                })
            }
        }

        if (cookieLocale !== seg) {
            const res = await fetch(req)
            res.headers.append('Set-Cookie', setCookie(COOKIE, seg, url))
            res.headers.append('Vary', 'Accept-Language, Cookie')
            return res
        }
        return fetch(req)
    }

    if (!isBot && best !== DEF) {
        return new Response(null, {
            status: 307,
            headers: {
                Location: withLocale(path, best) + url.search,
                Vary: 'Accept-Language, Cookie',
                'Set-Cookie': setCookie(COOKIE, best, url),
            },
        })
    }

    return fetch(req)
}
