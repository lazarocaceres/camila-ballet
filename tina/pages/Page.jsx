import { useLayoutEffect } from 'react'
import { useTina } from 'tinacms/dist/react'
import AOS from 'aos'
import BlocksRenderer from '../components/blocks-renderer'

export default function PageTemplate(props) {
    const {
        data: { page },
    } = useTina(props)

    useLayoutEffect(() => {
        AOS.init({
            disable: 'mobile',
            offset: 20,
            duration: 800,
            delay: 0,
            easing: 'ease-in-out-sine',
        })
    }, [])

    return (
        <article>
            <BlocksRenderer {...page} />
        </article>
    )
}
