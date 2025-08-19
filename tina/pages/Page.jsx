import { useEffect } from 'react'
import { useTina } from 'tinacms/dist/react'
import BlocksRenderer from '../components/blocks-renderer'

export default function PageTemplate(props) {
    const {
        data: { page },
    } = useTina(props)

    useEffect(() => {
        ;(async () => {
            const { default: AOS } = await import('aos')
            AOS.init({
                disable: 'mobile',
                offset: 20,
                duration: 800,
                delay: 0,
                easing: 'ease-in-out-sine',
            })
        })()
    }, [])

    return (
        <article>
            <BlocksRenderer {...page} />
        </article>
    )
}
