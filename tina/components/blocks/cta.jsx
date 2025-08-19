import { tinaField } from 'tinacms/dist/react'
import SmartLink from '../smart-link'

export default function Cta({ data }) {
    return (
        <div className='bg-secondary-background text-white'>
            <section className='pt-30'>
                <div className='container pb-30'>
                    <div
                        data-aos='zoom-in'
                        className='flex flex-col lg:flex-row gap-4 justify-center items-center bg-[#4C3639] rounded-2xl overflow-hidden'
                    >
                        <div className='p-10 lg:p-14 space-y-7 flex-1 text-md sm:text-base'>
                            <h2
                                className='font-playfair-display text-balance sm:text-wrap text-4.5xl sm:text-5xl lg:text-6xl'
                                data-tina-field={tinaField(data, 'title')}
                            >
                                {data.title}
                            </h2>
                            <p data-tina-field={tinaField(data, 'description')}>
                                {data.description}
                            </p>
                            <div className='flex gap-4 items-center'>
                                <SmartLink
                                    href={data.principalCta?.url}
                                    className='primary-button text-black'
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
                        <div className='relative w-full lg:max-w-[700px] aspect-[3/2] self-stretch'>
                            <img
                                src={data.image?.src}
                                alt={data.image?.alt}
                                loading='lazy'
                                decoding='async'
                                className='w-full h-full object-cover'
                                data-tina-field={tinaField(data, 'image')}
                            />
                        </div>
                    </div>
                </div>
            </section>
            <hr className='border-neutral-200/5' />
            <section id={data.id} className='pt-20 container'>
                <div className='flex flex-col lg:flex-row gap-5 justify-between'>
                    <div>
                        <span
                            className='text-lg font-black'
                            data-tina-field={tinaField(data, 'ctaTitle')}
                        >
                            {data.ctaTitle}
                        </span>
                        <p data-tina-field={tinaField(data, 'ctaDescription')}>
                            {data.ctaDescription}
                        </p>
                    </div>
                    <div className='space-y-2'>
                        {data.elements?.map((element, i) => (
                            <div key={i} data-tina-field={tinaField(element)}>
                                <span
                                    className='block font-bold'
                                    data-tina-field={tinaField(
                                        element,
                                        'method',
                                    )}
                                >
                                    {element.method}
                                </span>
                                <SmartLink
                                    href={element.url}
                                    className='block w-fit underline'
                                    data-tina-field={tinaField(element, 'url')}
                                >
                                    {element.label || element.url}
                                </SmartLink>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export const ctaBlockSchema = {
    label: 'Llamada a la acción',
    name: 'cta',
    type: 'object',
    ui: {
        previewSrc: '/blocks/cta.png',
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
            label: 'Imagen',
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
            label: 'Llamada a la acción',
            name: 'ctaTitle',
            type: 'string',
        },
        {
            label: 'Descripción de la llamada a la acción',
            name: 'ctaDescription',
            type: 'string',
            ui: {
                component: 'textarea',
            },
        },
        {
            label: 'Elementos',
            name: 'elements',
            type: 'object',
            list: true,
            ui: {
                itemProps: item => ({ label: item.method }),
            },
            fields: [
                {
                    label: 'Medio',
                    name: 'method',
                    type: 'string',
                },
                {
                    label: 'Nombre',
                    name: 'label',
                    type: 'string',
                    description:
                        'Si se deja vacío se utilizará el enlace como nombre visible.',
                },
                {
                    label: 'URL',
                    name: 'url',
                    description:
                        'Utiliza la sintaxis "#nombreDeLaSección" para que este enlace desplace hacia una sección. nombreDeLaSección es el Identificador.',
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
