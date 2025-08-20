import { useEffect, useState } from 'react'

let loaded = false
let promise = null

function loadLiteYouTube() {
    if (loaded) return Promise.resolve()
    if (!promise) {
        promise = Promise.all([
            import('lite-youtube-embed/src/lite-yt-embed.js'),
            import('lite-youtube-embed/src/lite-yt-embed.css'),
        ])
            .then(() => {
                loaded = true
            })
            .catch(err => {
                promise = null
                if (import.meta.env.DEV)
                    console.warn('[useLiteYouTube] load failed', err)
            })
    }
    return promise || Promise.resolve()
}

export function useLiteYouTube(shouldLoad) {
    const [ready, setReady] = useState(loaded)

    useEffect(() => {
        if (!shouldLoad || loaded) {
            setReady(loaded)
            return
        }
        let cancelled = false
        loadLiteYouTube().then(() => {
            if (!cancelled) setReady(true)
        })
        return () => {
            cancelled = true
        }
    }, [shouldLoad])

    return ready
}
