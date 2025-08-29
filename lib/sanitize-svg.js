const RE_JS = /^javascript:/i
const RE_HTTP = /^(https?:)?\/\//i
const RE_HASH = /^#/i
const RE_DATA_IMAGE = /^data:image\//i
const RE_URL = /url\(\s*(['"]?)(.*?)\1\s*\)/gi
const RE_IMPORT = /@import[^;]*;/gi
const RE_EXPR = /expression\s*\([^)]*\)/gi
const RE_BEHAV = /behavior\s*:[^;]*;/gi
const RE_MOZB = /-moz-binding\s*:[^;]*;/gi

function sanitizeCss(css) {
    if (!css) return ''
    let s = String(css)
    s = s.replace(RE_IMPORT, '')
    s = s.replace(RE_EXPR, '')
    s = s.replace(RE_BEHAV, '')
    s = s.replace(RE_MOZB, '')
    s = s.replace(RE_URL, (_, __, u) => {
        const url = String(u || '').trim()
        if (RE_HASH.test(url)) return `url(${url})`
        if (RE_DATA_IMAGE.test(url)) return `url(${url})`
        return ''
    })
    return s.trim()
}

function isSafeHref(tag, v) {
    if (RE_JS.test(v)) return false
    if (RE_HASH.test(v)) return true
    if (tag === 'a')
        return (
            RE_HTTP.test(v) || v.startsWith('mailto:') || v.startsWith('tel:')
        )
    if (tag === 'image' || tag === 'img')
        return RE_HTTP.test(v) || RE_DATA_IMAGE.test(v)
    return false
}

export function sanitizeSvg(svgText) {
    try {
        if (typeof svgText !== 'string' || !svgText.trim()) return ''
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
        const svg = doc.documentElement
        if (!svg || svg.nodeName.toLowerCase() !== 'svg') return ''

        doc.querySelectorAll('script,iframe,object,embed,link,meta').forEach(
            el => el.remove(),
        )

        doc.querySelectorAll('style').forEach(s => {
            const cleaned = sanitizeCss(s.textContent || '')
            if (cleaned) s.textContent = cleaned
            else s.remove()
        })

        const walker = doc.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT)
        for (let node = walker.currentNode; node; node = walker.nextNode()) {
            const el = node
            const tag = el.tagName.toLowerCase()
            for (let i = el.attributes.length - 1; i >= 0; i--) {
                const { name, value } = el.attributes[i]
                const n = name.toLowerCase()
                const v = (value || '').trim()
                if (!v) {
                    el.removeAttribute(name)
                    continue
                }
                if (n.startsWith('on')) {
                    el.removeAttribute(name)
                    continue
                }
                if (n === 'style') {
                    const cleaned = sanitizeCss(v)
                    if (cleaned) el.setAttribute(name, cleaned)
                    else el.removeAttribute(name)
                    continue
                }
                const isHref =
                    n === 'href' || n === 'xlink:href' || n.endsWith(':href')
                const isSrc = n === 'src'
                if (isHref || isSrc) {
                    if (isSafeHref(tag, v)) continue
                    el.removeAttribute(name)
                    continue
                }
                if (/\burl\s*\(/i.test(v)) {
                    let safe = true
                    v.replace(RE_URL, (_, __, u) => {
                        const url = String(u || '').trim()
                        if (RE_HASH.test(url)) return
                        safe = false
                    })
                    if (!safe) el.removeAttribute(name)
                }
            }
        }

        return new XMLSerializer().serializeToString(svg)
    } catch {
        return ''
    }
}
