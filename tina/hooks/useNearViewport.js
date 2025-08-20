import { useEffect, useState } from 'react'

export function useNearViewport(
    ref,
    { rootMargin = '1200px 0px', once = true } = {},
) {
    const [near, setNear] = useState(false)

    useEffect(() => {
        if (near) return
        const el = ref.current
        if (!el) return

        if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver(
                entries => {
                    for (const e of entries) {
                        if (e.isIntersecting) {
                            setNear(true)
                            if (once) obs.disconnect()
                            break
                        }
                    }
                },
                { rootMargin },
            )
            obs.observe(el)
            return () => obs.disconnect()
        } else {
            const idle =
                window.requestIdleCallback || (cb => setTimeout(cb, 300))
            idle(() => setNear(true))
        }
    }, [ref, near, rootMargin, once])

    return near
}
