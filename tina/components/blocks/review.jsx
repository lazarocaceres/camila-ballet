import { tinaField } from 'tinacms/dist/react'
import Star from 'icons/star'

export default function Review({ data }) {
    return (
        <section id={data.id} className='py-18 lg:py-28 container'>
            <div data-aos='fade-up' className='max-w-4xl mx-auto space-y-8'>
                <div className='flex justify-center items-center'>
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                </div>
                <span
                    className='block font-playfair-display text-2xl text-center'
                    data-tina-field={tinaField(data, 'review')}
                >
                    {data.review}
                </span>
                <div className='flex flex-col lg:flex-row text-center lg:text-left gap-5 justify-center items-center'>
                    <div>
                        <img
                            src={data.authorPicture?.src}
                            alt={data.authorPicture?.alt}
                            loading='lazy'
                            decoding='async'
                            className='w-full max-w-[60px] rounded-full'
                            data-tina-field={tinaField(data, 'authorPicture')}
                        />
                    </div>
                    <div className='space-y-2'>
                        <span
                            className='font-bold'
                            data-tina-field={tinaField(data, 'author')}
                        >
                            {data.author}
                        </span>
                        <p
                            data-tina-field={tinaField(
                                data,
                                'authorOccupation',
                            )}
                        >
                            {data.authorOccupation}
                        </p>
                    </div>
                    <div className='hidden lg:block w-0.5 self-stretch bg-neutral-200/50' />
                    <div>
                        <img
                            src={data.authorCompanyPicture?.src}
                            alt={data.authorCompanyPicture?.alt}
                            loading='lazy'
                            decoding='async'
                            className='w-full max-w-[180px]'
                            data-tina-field={tinaField(
                                data,
                                'authorCompanyPicture',
                            )}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export const reviewBlockSchema = {
    label: 'Valoración',
    name: 'review',
    type: 'object',
    ui: {
        previewSrc: '/blocks/review.png',
    },
    fields: [
        {
            label: 'Valoración',
            name: 'review',
            type: 'string',
            ui: {
                component: 'textarea',
            },
        },
        {
            type: 'object',
            label: 'Foto del autor',
            name: 'authorPicture',
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
            label: 'Nombre del autor',
            name: 'author',
            type: 'string',
        },
        {
            label: 'Ocupación del autor',
            name: 'authorOccupation',
            type: 'string',
        },
        {
            type: 'object',
            label: 'Logo de la corporación del autor',
            name: 'authorCompanyPicture',
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
