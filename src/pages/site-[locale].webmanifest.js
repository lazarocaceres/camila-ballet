import { i18n } from 'i18n'
import client from 'tina/__generated__/client'

export function getStaticPaths() {
    return i18n.locales.map(locale => ({ params: { locale } }))
}

const urlFor = (locale, defaultLocale) =>
    locale === defaultLocale ? '/' : `/${locale}`

async function getGlobalForLocale(locale, defaultLocale) {
    const read = async loc => {
        try {
            const { data } = await client.queries.global({
                relativePath: `${loc}/global.md`,
            })
            return data?.global || null
        } catch {
            return null
        }
    }
    return (await read(locale)) || (await read(defaultLocale)) || {}
}

export async function GET({ params }) {
    const { locales, defaultLocale } = i18n
    const locale = locales.includes(params.locale)
        ? params.locale
        : defaultLocale

    const global = await getGlobalForLocale(locale, defaultLocale)
    const name = global.genericTitle || 'Camila Rodríguez | Ballet'
    const description =
        global.genericDescription ||
        'Bailarina de ballet clásico y contemporáneo: técnica, elegancia y pasión.'

    const manifest = {
        name,
        short_name: 'Camila Rodríguez',
        description,
        lang: locale,
        start_url: urlFor(locale, defaultLocale),
        scope: urlFor(locale, defaultLocale),
        dir: 'ltr',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffb6c1',
        orientation: 'any',
        icons: [
            {
                src: '/favicon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any maskable',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any maskable',
            },
            {
                src: '/favicon.ico',
                sizes: '64x64 32x32 24x24 16x16',
                type: 'image/x-icon',
                purpose: 'any',
            },
        ],
    }

    return new Response(JSON.stringify(manifest, null, 2), {
        headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
    })
}
