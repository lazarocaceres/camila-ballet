import { Suspense, useEffect, useState, lazy, memo } from 'react'
import { sanitizeSvg } from 'lib/sanitize-svg'

const PrismComp = lazy(() =>
    import('tinacms/dist/rich-text/prism').then(mod => ({
        default: mod.Prism || mod.default,
    })),
)

const safeCache = new Map()
const inflight = new Map()
const KROKI_ENDPOINT = 'https://kroki.io/mermaid/svg'

function fetchMermaidSVG(code) {
    if (safeCache.has(code)) return Promise.resolve(safeCache.get(code))
    let p = inflight.get(code)
    if (!p) {
        p = fetch(KROKI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: code,
        })
            .then(res => {
                if (!res.ok) throw new Error(`Kroki ${res.status}`)
                return res.text()
            })
            .then(raw => {
                const safe = sanitizeSvg(raw)
                if (!safe) throw new Error('Empty sanitized SVG')
                safeCache.set(code, safe)
                return safe
            })
            .finally(() => inflight.delete(code))
        inflight.set(code, p)
    }
    return p
}

function PlainCode({ value }) {
    return (
        <pre>
            <code>{value == null ? undefined : String(value)}</code>
        </pre>
    )
}

const MermaidCodeBlock = memo(function MermaidCodeBlock({ code }) {
    const [svg, setSvg] = useState(() => safeCache.get(code) || null)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        setError(null)
        const cached = safeCache.get(code)
        if (cached) {
            setSvg(cached)
            return
        }
        fetchMermaidSVG(code)
            .then(s => {
                if (!cancelled) setSvg(s)
            })
            .catch(e => {
                if (!cancelled) setError(e)
            })
        return () => {
            cancelled = true
        }
    }, [code])

    if (error) return <PlainCode value={code} />
    if (!svg) return <div className='loader' />
    return <div dangerouslySetInnerHTML={{ __html: svg }} />
})

function CodeBlockInner({ value = '', lang, ...props }) {
    const code = String(value ?? '').trim()
    const language = String(lang ?? '').toLowerCase()

    if (!code) return <PlainCode />

    if (language === 'mermaid') {
        return <MermaidCodeBlock code={code} />
    }

    return (
        <Suspense fallback={<PlainCode value={code} />}>
            <PrismComp value={code} lang={language || undefined} {...props} />
        </Suspense>
    )
}

export default function CodeBlock(props) {
    return <CodeBlockInner {...props} />
}
