import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { i18n } from '../i18n'

const SITE = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_HOST ||
    'http://localhost:3000'
).replace(/\/+$/, '')

export default function generateSitemap() {
    let outDir = ''
    const localeSet = new Set(i18n.locales)

    const urlFor = (locale, slug) => {
        const prefix = locale === i18n.defaultLocale ? '' : `/${locale}`
        return slug ? `${SITE}${prefix}/${slug}` : `${SITE}${prefix}`
    }

    const lastmodFor = pathname => {
        const rel =
            pathname === '/'
                ? 'index.html'
                : `${pathname.replace(/^\/|\/$/g, '')}/index.html`
        try {
            return fs.statSync(path.join(outDir, rel)).mtime.toISOString()
        } catch {
            return new Date().toISOString()
        }
    }

    return {
        name: 'generate-sitemap',
        hooks: {
            'astro:build:done': ({ pages, dir, logger }) => {
                outDir = fileURLToPath(dir)

                const bySlug = new Map()
                for (const { pathname } of pages) {
                    if (/\/(404|500)(?:\/|$)/.test(pathname)) continue
                    if (/sitemap\.xml$/i.test(pathname)) continue
                    if (/\.[a-z0-9]+$/i.test(pathname)) continue

                    const segs = pathname.split('/').filter(Boolean)
                    const hasLocale = segs[0] && localeSet.has(segs[0])
                    const locale = hasLocale ? segs[0] : i18n.defaultLocale
                    const baseSlug = (hasLocale ? segs.slice(1) : segs).join(
                        '/',
                    )

                    if (!bySlug.has(baseSlug)) bySlug.set(baseSlug, new Set())
                    bySlug.get(baseSlug).add(locale)
                }

                const alternatesLines = (
                    slug,
                    availableLocales,
                    primaryLocale,
                ) => [
                    ...availableLocales.map(
                        l =>
                            `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l, slug)}" />`,
                    ),
                    `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(primaryLocale, slug)}" />`,
                ]

                const chunks = []

                const slugsSorted = Array.from(bySlug.entries()).sort((a, b) =>
                    a[0] === ''
                        ? -1
                        : b[0] === ''
                          ? 1
                          : a[0].localeCompare(b[0]),
                )

                for (const [slug, localesAvailableSet] of slugsSorted) {
                    const available = Array.from(localesAvailableSet).sort(
                        (a, b) =>
                            a === i18n.defaultLocale
                                ? -1
                                : b === i18n.defaultLocale
                                  ? 1
                                  : a.localeCompare(b),
                    )
                    if (available.length === 0) continue

                    const primary = available.includes(i18n.defaultLocale)
                        ? i18n.defaultLocale
                        : available[0]

                    for (const loc of available) {
                        const pathname = slug
                            ? `/${loc === i18n.defaultLocale ? '' : loc + '/'}${slug}`
                            : loc === i18n.defaultLocale
                              ? '/'
                              : `/${loc}`

                        const locUrl = urlFor(loc, slug)
                        const lastmod = lastmodFor(pathname)

                        chunks.push(
                            [
                                '  <url>',
                                `    <loc>${locUrl}</loc>`,
                                `    <lastmod>${lastmod}</lastmod>`,
                                ...alternatesLines(slug, available, primary),
                                '  </url>',
                            ].join('\n'),
                        )
                    }
                }

                const xml = [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
                    ...chunks,
                    '</urlset>',
                    '',
                ].join('\n')

                fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf8')
                logger.info(`✅ sitemap.xml generated (${chunks.length} URLs)`)
            },
        },
    }
}
