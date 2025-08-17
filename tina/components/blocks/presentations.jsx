import Gallery from '../gallery'

export default function Presentations({ data }) {
    return <Gallery data={data} />
}

export const presentationsBlockSchema = {
    label: 'Presentaciones',
    name: 'presentations',
    type: 'object',
    ui: {
        previewSrc: '/blocks/presentations.png',
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
                    label: 'URL del video en YouTube',
                    name: 'url',
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
