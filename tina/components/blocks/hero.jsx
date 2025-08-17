import { tinaField } from 'tinacms/dist/react'
import SmartLink from '../smart-link'

export default function Hero({ data }) {
    return (
        <section
            id={data.id}
            className='bg-background py-18 lg:py-28 overflow-hidden'
        >
            <div className='container space-y-12 lg:space-y-24'>
                <div className='flex flex-col lg:flex-row gap-10 lg:gap-12 justify-between'>
                    <h1
                        data-aos='fade-right'
                        className='font-playfair-display text-6xl lg:text-8xl max-w-[12ch]'
                        data-tina-field={tinaField(data, 'title')}
                    >
                        {data.title}
                    </h1>
                    <div
                        data-aos='fade-left'
                        className='lg:pt-4 space-y-8 max-w-2xl'
                    >
                        <p data-tina-field={tinaField(data, 'description')}>
                            {data.description}
                        </p>
                        <div className='flex gap-4 items-center'>
                            <SmartLink
                                href={data.principalCta?.url}
                                className='primary-button'
                                data-tina-field={tinaField(
                                    data,
                                    'principalCta',
                                )}
                            >
                                {data.principalCta?.name}
                            </SmartLink>
                            <SmartLink
                                href={data.secondaryCta?.url}
                                className='secondary-button'
                                data-tina-field={tinaField(
                                    data,
                                    'secondaryCta',
                                )}
                            >
                                {data.secondaryCta?.name}
                            </SmartLink>
                        </div>
                    </div>
                </div>
                <div
                    data-aos='fade-up'
                    className='relative w-full aspect-[3/2]'
                >
                    <img
                        src={data.image?.src}
                        alt={data.image?.alt}
                        className='w-full rounded-2xl'
                        data-tina-field={tinaField(data, 'image')}
                    />
                </div>
            </div>
        </section>
    )
}

export const heroBlockSchema = {
    label: 'Principal',
    name: 'hero',
    type: 'object',
    ui: {
        previewSrc: '/blocks/hero.png',
    },
    fields: [
        {
            label: 'Título',
            name: 'title',
            type: 'string',
        },
        {
            label: 'Descripción',
            name: 'description',
            type: 'string',
            ui: {
                component: 'textarea',
            },
        },
        {
            type: 'object',
            label: 'Botón principal',
            name: 'principalCta',
            fields: [
                {
                    type: 'string',
                    label: 'Nombre',
                    name: 'name',
                },
                {
                    type: 'string',
                    label: 'Destino',
                    name: 'url',
                    description:
                        'Utiliza la sintaxis "#nombreDeLaSección" para que este enlace desplace hacia una sección. nombreDeLaSección es el Identificador.',
                },
            ],
        },
        {
            type: 'object',
            label: 'Botón secundario',
            name: 'secondaryCta',
            fields: [
                {
                    type: 'string',
                    label: 'Nombre',
                    name: 'name',
                },
                {
                    type: 'string',
                    label: 'Destino',
                    name: 'url',
                    description:
                        'Utiliza la sintaxis "#nombreDeLaSección" para que este enlace desplace hacia una sección. nombreDeLaSección es el Identificador.',
                },
            ],
        },
        {
            type: 'object',
            label: 'Portada',
            name: 'image',
            fields: [
                {
                    name: 'src',
                    label: 'Imagen',
                    type: 'image',
                },
                {
                    name: 'alt',
                    label: 'Descripción visual',
                    type: 'string',
                },
            ],
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
