import Gallery from '../gallery'

export default function Links({ data }) {
    return <Gallery data={data} images={true} />
}

export const linksBlockSchema = {
    label: 'Enlaces',
    name: 'links',
    type: 'object',
    ui: {
        previewSrc: '/blocks/links.png',
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
                    type: 'string',
                    label: 'Destino',
                    name: 'target',
                    description:
                        'Utiliza la sintaxis "#nombreDeLaSección" para que este enlace desplace hacia una sección. nombreDeLaSección es el Identificador.',
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
            type: 'string',
            label: 'Botón',
            name: 'cta',
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
