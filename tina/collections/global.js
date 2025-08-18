import { extractLanguageAndPath } from 'lib/utils'

export const GlobalCollection = {
    label: 'Global',
    name: 'global',
    path: 'content/global',
    ui: {
        global: true,
        allowedActions: {
            create: false,
            delete: false,
            createNestedFolder: false,
        },
        router: ({ document }) => {
            const { lang } = extractLanguageAndPath(document._sys.relativePath)
            return `/${lang}`
        },
    },
    fields: [
        {
            type: 'string',
            label: 'Título genérico',
            name: 'genericTitle',
        },
        {
            type: 'string',
            label: 'Descripción genérica',
            name: 'genericDescription',
            ui: {
                component: 'textarea',
            },
        },
        {
            type: 'object',
            name: 'header',
            label: 'Encabezado',
            fields: [
                {
                    type: 'image',
                    label: 'Logo',
                    name: 'logo',
                },
                {
                    type: 'object',
                    list: true,
                    label: 'Navegación',
                    name: 'nav',
                    ui: {
                        itemProps: item => ({ label: item.name }),
                    },
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
            ],
        },
        {
            type: 'object',
            name: 'footer',
            label: 'Pie de página',
            fields: [
                {
                    type: 'image',
                    label: 'Logo',
                    name: 'logo',
                },
                {
                    type: 'string',
                    label: 'Aclaración',
                    name: 'advise',
                    ui: {
                        component: 'textarea',
                    },
                },
            ],
        },
        {
            type: 'string',
            label: 'Descripción visual genérica para imágenes',
            name: 'genericAlt',
            ui: {
                component: 'textarea',
            },
        },
    ],
}
