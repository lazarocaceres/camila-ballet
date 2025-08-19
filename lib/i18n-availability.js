import { i18n } from '../i18n'
import { client } from '../tina/__generated__/client'

const cache = new Map()

export async function getAvailableLocalesForBase(base) {
    if (cache.has(base)) return cache.get(base)

    const { locales, defaultLocale } = i18n

    const files = import.meta.glob('/src/pages/**/*.{astro,md,mdx}', {
        eager: false,
    })
    const paths = Object.keys(files)
    const hasStatic = loc => {
        const prefix =
            loc === defaultLocale ? '/src/pages' : `/src/pages/${loc}`
        if (!base) {
            return paths.some(
                p =>
                    p === `${prefix}/index.astro` ||
                    p === `${prefix}/home.astro` ||
                    p === `${prefix}/index.md` ||
                    p === `${prefix}/index.mdx` ||
                    p === `${prefix}/home.md` ||
                    p === `${prefix}/home.mdx`,
            )
        }
        return paths.some(
            p =>
                p === `${prefix}/${base}.astro` ||
                p === `${prefix}/${base}.md` ||
                p === `${prefix}/${base}.mdx` ||
                p === `${prefix}/${base}/index.astro` ||
                p === `${prefix}/${base}/index.md` ||
                p === `${prefix}/${base}/index.mdx`,
        )
    }

    const dyn = new Map(
        locales.map(l => [l, new Set(l === defaultLocale ? [''] : [])]),
    )
    try {
        const {
            data: {
                pageConnection: { edges },
            },
        } = await client.queries.pageConnection()
        for (const {
            node: { _sys },
        } of edges) {
            const rel = _sys.relativePath || _sys.path
            const parts = rel.split('/')
            let loc = defaultLocale
            if (locales.includes(parts[0])) loc = parts.shift()
            let slug = parts.join('/').replace(/\.(mdx?|json|ya?ml)$/, '')
            if (slug === 'index' || slug === 'home') slug = ''
            dyn.get(loc)?.add(slug)
        }
    } catch {}

    const hasDynamic = loc => dyn.get(loc)?.has(base)
    const result = locales.filter(loc => hasStatic(loc) || hasDynamic(loc))

    cache.set(base, result)
    return result
}
