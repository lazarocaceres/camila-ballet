import { i18n } from 'i18n'
import { extractLanguageAndPath, slugify, removeFileExtension } from 'lib/utils'
import { heroBlockSchema } from 'tina/components/blocks/hero'
import { careerBlockSchema } from 'tina/components/blocks/career'
import { reviewBlockSchema } from 'tina/components/blocks/review'
import { presentationsBlockSchema } from 'tina/components/blocks/presentations'
import { ctaBlockSchema } from 'tina/components/blocks/cta'
import { linksBlockSchema } from 'tina/components/blocks/links'
import { articleBlockSchema } from 'tina/components/blocks/article'

export const PageCollection = {
    label: 'Páginas',
    name: 'page',
    path: 'src/content/pages',
    ui: {
        allowedActions: {
            createNestedFolder: false,
        },
        router: ({ document }) => {
            const { lang, filePath } = extractLanguageAndPath(
                document._sys.relativePath,
            )
            const name = slugify(removeFileExtension(filePath))
            const defaultLocale = i18n.defaultLocale
            const isDefaultLocale = lang === defaultLocale

            if (name === 'home') {
                return isDefaultLocale
                    ? `/?lang=${defaultLocale}`
                    : `/${lang}?lang=${lang}`
            }
            return isDefaultLocale
                ? `/${name}?lang=${defaultLocale}`
                : `/${lang}/${name}?lang=${lang}`
        },
    },
    fields: [
        {
            type: 'string',
            label: 'Título',
            name: 'title',
        },
        {
            type: 'string',
            label: 'Descripción',
            name: 'description',
            ui: {
                component: 'textarea',
            },
        },
        {
            type: 'object',
            list: true,
            name: 'blocks',
            label: 'Secciones',
            ui: {
                visualSelector: true,
            },
            templates: [
                heroBlockSchema,
                careerBlockSchema,
                reviewBlockSchema,
                presentationsBlockSchema,
                ctaBlockSchema,
                linksBlockSchema,
                articleBlockSchema,
            ],
        },
    ],
}
