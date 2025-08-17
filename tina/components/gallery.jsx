import { useState } from 'react'
import { tinaField } from 'tinacms/dist/react'
import Indicator from './indicator'
import Media from './media'
import { extractYouTubeID } from 'lib/utils'

export default function Gallery({ data, images = false }) {
    const manyElements = data.elements?.length > 3
    const [showAll, setShowAll] = useState(!manyElements)
    const items = showAll ? data.elements : data.elements.slice(0, 3)

    return (
        <section
            id={data.id}
            className={`pt-18 lg:pt-28 ${showAll ? 'pb-32 lg:pb-40' : 'pb-18 lg:pb-28'}`}
        >
            <div className='container text-center space-y-20'>
                <div data-aos='fade-up' className='max-w-4xl mx-auto space-y-3'>
                    <span
                        className='block font-bold'
                        data-tina-field={tinaField(data, 'overline')}
                    >
                        {data.overline}
                    </span>
                    <h2
                        className='font-playfair-display text-5xl lg:text-6xl'
                        data-tina-field={tinaField(data, 'title')}
                    >
                        {data.title}
                    </h2>
                    <p
                        className='mt-8'
                        data-tina-field={tinaField(data, 'description')}
                    >
                        {data.description}
                    </p>
                </div>
                <div className='grid gap-12 grid-cols-1 lg:grid-cols-3'>
                    {items?.map((element, i) => (
                        <div
                            key={i}
                            data-aos='fade-up'
                            data-aos-delay={i * 100}
                        >
                            {images ? (
                                <Media
                                    target={element.target}
                                    image={element.image?.src || '/default.jpg'}
                                    alt={
                                        element.image?.alt || 'Camila Rodríguez'
                                    }
                                    title={element.title}
                                    tina={element}
                                >
                                    <p
                                        data-tina-field={tinaField(
                                            element,
                                            'description',
                                        )}
                                    >
                                        {element.description}
                                    </p>
                                </Media>
                            ) : (
                                <Media
                                    videoId={extractYouTubeID(element.url)}
                                    title={element.title}
                                    tina={element}
                                >
                                    <p
                                        data-tina-field={tinaField(
                                            element,
                                            'description',
                                        )}
                                    >
                                        {element.description}
                                    </p>
                                </Media>
                            )}
                        </div>
                    ))}
                </div>
                {!showAll && (
                    <div
                        data-aos='fade-up'
                        className='pt-7 flex gap-4 justify-center items-center'
                    >
                        <button
                            type='button'
                            className='secondary-button'
                            onClick={() => setShowAll(v => !v)}
                            data-tina-field={tinaField(data, 'cta')}
                        >
                            <Indicator>{data.cta}</Indicator>
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
