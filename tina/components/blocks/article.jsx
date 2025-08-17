import { tinaField } from 'tinacms/dist/react'
import { TinaMarkdown } from 'tinacms/dist/rich-text'
import SmartLink from '../smart-link'
import MermaidElement from '../mermaid-element'
import { Prism } from 'tinacms/dist/rich-text/prism'

export default function Article({ data }) {
    return (
        <div id={data.id} className='container py-28'>
            <article
                className='prose lg:prose-xl prose-neutral max-w-full prose-img:rounded-2xl prose-headings:font-playfair-display prose-headings:font-normal prose-h1:text-6xl prose-h1:lg:text-8xl prose-h2:text-5xl prose-h2:lg:text-6xl prose-h3:text-3xl prose-h3:lg:text-4xl prose-h4:text-2xl prose-h4:lg:text-3xl prose-h5:text-xl prose-h5:lg:text-2xl prose-h6:text-lg prose-h6:lg:text-xl'
                data-tina-field={tinaField(data, 'body')}
            >
                <TinaMarkdown
                    content={data.body}
                    components={{
                        a: ({ children, href, url, title, ...rest }) => {
                            const link = href || url
                            return (
                                <SmartLink href={link} title={title} {...rest}>
                                    {children}
                                </SmartLink>
                            )
                        },
                        code_block: ({ value, lang, ...props }) => {
                            if (lang === 'mermaid') {
                                return <MermaidElement value={value.trim()} />
                            }

                            return (
                                <Prism value={value} lang={lang} {...props} />
                            )
                        },
                    }}
                />
            </article>
        </div>
    )
}

export const articleBlockSchema = {
    label: 'Artículo',
    name: 'article',
    type: 'object',
    ui: {
        previewSrc: '/blocks/article.png',
    },
    fields: [
        {
            label: 'Contenido',
            name: 'body',
            type: 'rich-text',
            isBody: true,
        },
        {
            label: 'Identificador',
            name: 'id',
            type: 'string',
            description:
                'Nombre único en toda la página para esta sección. Este nombre se utiliza en enlaces para desplazarse hacia esta sección.',
        },
    ],
}
