import { useEffect, useState } from 'react'

const resultCache = new Map()
const probeCache = new Map()

async function probeMaxres(videoId, timeoutMs = 1200) {
    if (resultCache.has(videoId)) return resultCache.get(videoId)
    if (probeCache.has(videoId)) return probeCache.get(videoId)

    const p = (async () => {
        try {
            const controller = new AbortController()
            const to = setTimeout(() => controller.abort(), timeoutMs)
            const r = await fetch(
                `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                { method: 'HEAD', signal: controller.signal },
            )
            clearTimeout(to)
            const q = r.ok ? 'maxresdefault' : 'sddefault'
            resultCache.set(videoId, q)
            return q
        } catch {
            resultCache.set(videoId, 'sddefault')
            return 'sddefault'
        } finally {
            probeCache.delete(videoId)
        }
    })()

    probeCache.set(videoId, p)
    return p
}

export function usePosterQuality(videoId, enabled = true) {
    const cached = videoId ? resultCache.get(videoId) : null
    const [state, setState] = useState(
        cached
            ? { ready: true, quality: cached }
            : { ready: false, quality: null },
    )

    useEffect(() => {
        if (!enabled || !videoId) return
        const existing = resultCache.get(videoId)
        if (existing) {
            setState({ ready: true, quality: existing })
            return
        }
        let cancelled = false
        probeMaxres(videoId).then(q => {
            if (!cancelled) setState({ ready: true, quality: q })
        })
        return () => {
            cancelled = true
        }
    }, [videoId, enabled])

    return state
}
