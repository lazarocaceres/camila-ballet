import { useEffect } from 'react'
import { useTina } from 'tinacms/dist/react'
import BlocksRenderer from '../components/blocks-renderer'

let aosPromise = null
let aosInited = false
const loadAOS = () => (aosPromise ??= import('aos'))

if (typeof window !== 'undefined') loadAOS()

export default function PageTemplate(props) {
    const {
        data: { page },
    } = useTina(props)

    useEffect(() => {
        let cancelled = false
        loadAOS()
            .then(({ default: AOS }) => {
                if (cancelled) return
                if (!aosInited) {
                    AOS.init({
                        disable: 'mobile',
                        offset: 20,
                        duration: 800,
                        delay: 0,
                        easing: 'ease-in-out-sine',
                        once: true,
                    })
                    aosInited = true
                } else {
                    AOS.refresh()
                }
            })
            .catch(err => {
                if (import.meta.env.DEV)
                    console.warn('[AOS] load/init failed:', err)
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <article>
            <BlocksRenderer {...page} />
        </article>
    )
}
