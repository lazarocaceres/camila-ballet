import { tinaField } from 'tinacms/dist/react'
import InfoCard from '../info-card'
import Indicator from '../indicator'
import SmartLink from '../smart-link'

export default function Career({ data }) {
    return (
        <section id={data.id} className='bg-background py-18 lg:py-28'>
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
                <div className='grid gap-20 grid-cols-1 lg:grid-cols-3'>
                    {data.elements?.map((element, i) => (
                        <InfoCard
                            key={i}
                            data-aos='fade-up'
                            data-aos-delay={i * 100}
                            icon={element.icon?.src}
                            alt={element.icon?.alt}
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
                        </InfoCard>
                    ))}
                </div>
                <div
                    data-aos='fade-up'
                    className='pt-7 flex gap-4 justify-center items-center'
                >
                    <SmartLink
                        href={data.principalCta?.url}
                        className='secondary-button'
                        data-tina-field={tinaField(data, 'principalCta')}
                    >
                        {data.principalCta?.name}
                    </SmartLink>
                    <SmartLink
                        href={data.secondaryCta?.url}
                        data-tina-field={tinaField(data, 'secondaryCta')}
                    >
                        <Indicator>{data.secondaryCta?.name}</Indicator>
                    </SmartLink>
                </div>
            </div>
        </section>
    )
}

export const careerBlockSchema = {
    label: 'Trayectoria',
    name: 'career',
    type: 'object',
    ui: {
        previewSrc: '/blocks/career.png',
    },
    fields: [
        {
            label: 'Antetítulo',
            name: 'overline',
            type: 'string',
        },
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
            label: 'Elementos',
            name: 'elements',
            type: 'object',
            list: true,
            ui: {
                itemProps: item => ({ label: item.title }),
            },
            fields: [
                {
                    type: 'object',
                    label: 'Icono',
                    name: 'icon',
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
            label: 'Identificador',
            name: 'id',
            type: 'string',
            description:
                'Nombre único en toda la página para esta sección. Este nombre se utiliza en enlaces para desplazarse hacia esta sección.',
        },
    ],
}
