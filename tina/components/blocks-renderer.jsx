import { tinaField } from 'tinacms/dist/react'
import Hero from './blocks/hero'
import Career from './blocks/career'
import Review from './blocks/review'
import Presentations from './blocks/presentations'
import Cta from './blocks/cta'
import Links from './blocks/links'
import Article from './blocks/article'

const COMPONENTS = {
    PageBlocksHero: Hero,
    PageBlocksCareer: Career,
    PageBlocksReview: Review,
    PageBlocksPresentations: Presentations,
    PageBlocksCta: Cta,
    PageBlocksLinks: Links,
    PageBlocksArticle: Article,
}

export default function BlocksRenderer({ blocks = [] }) {
    return blocks?.map((block, index) => {
        const Component = COMPONENTS[block.__typename]
        if (!Component) return null

        return (
            <div key={index} data-tina-field={tinaField(block)}>
                <Component data={block} />
            </div>
        )
    })
}
