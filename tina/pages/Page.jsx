import { useLayoutEffect } from 'react'
import { useTina } from 'tinacms/dist/react'
import BlocksRenderer from '../components/blocks-renderer'
import AOS from 'aos'

let aosInited = false

export default function PageTemplate(props) {
    const {
        data: { page },
    } = useTina(props)

    useLayoutEffect(() => {
        if (!aosInited) {
            AOS.init({
                disable: 'mobile',
                offset: 20,
                duration: 800,
                delay: 0,
                easing: 'ease-in-out-sine',
            })
            aosInited = true
        } else {
            AOS.refresh()
        }
    }, [])

    return (
        <article>
            <BlocksRenderer {...page} />
        </article>
    )
}
