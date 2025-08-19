import { getAvailableLocalesForBase } from 'lib/i18n-availability'

export async function buildHeadMeta({
    origin,
    pathname,
    image,
    currentLocale,
    i18n,
}) {
    const ORIGIN = origin.replace(/\/+$/, '')

    const segs = pathname.split('/').filter(Boolean)
    const hasLocale = segs[0] && i18n.locales.includes(segs[0])
    const base = (hasLocale ? segs.slice(1) : segs).join('/')

    const canonicalURL = base ? `${ORIGIN}/${base}` : ORIGIN
    const absoluteImage = image.startsWith('http')
        ? image
        : `${ORIGIN}/${image.replace(/^\/+/, '')}`

    const availableLocalesRaw = await getAvailableLocalesForBase(base)
    const availableLocales =
        availableLocalesRaw && availableLocalesRaw.length
            ? availableLocalesRaw
            : [currentLocale]

    const hrefFor = loc => {
        const prefix = loc === i18n.defaultLocale ? '' : `/${loc}`
        return base ? `${ORIGIN}${prefix}/${base}` : `${ORIGIN}${prefix}`
    }

    const primaryLocale = availableLocales.includes(i18n.defaultLocale)
        ? i18n.defaultLocale
        : availableLocales[0]

    const alternates = availableLocales.map(l => ({ lang: l, url: hrefFor(l) }))
    const xDefaultUrl = hrefFor(primaryLocale)

    return {
        canonicalURL,
        absoluteImage,
        alternates,
        primaryLocale,
        xDefaultUrl,
    }
}
