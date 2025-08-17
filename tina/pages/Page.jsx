import { useTina } from 'tinacms/dist/react'
import BlocksRenderer from '../components/blocks-renderer'

export default function PageTemplate(props) {
    const {
        data: { page },
    } = useTina(props)

    return (
        <article>
            <BlocksRenderer {...page} />
        </article>
    )
}
