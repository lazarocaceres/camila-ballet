import { defineCollection, z } from 'astro:content'
import client from 'tina/__generated__/client'

const global = defineCollection({
    loader: async () => {
        const response = await client.queries.globalConnection()

        return response.data.globalConnection.edges
            ?.filter(edge => !!edge?.node)
            .map(edge => {
                const node = edge.node

                return {
                    ...node,
                    id: node?._sys.relativePath.replace(/\.md?$/, ''),
                    tinaInfo: node?._sys,
                }
            })
    },
    schema: z.object({
        tinaInfo: z.object({
            filename: z.string(),
            basename: z.string(),
            path: z.string(),
            relativePath: z.string(),
        }),

        genericTitle: z.string().optional(),
        genericDescription: z.string().optional(),
        genericAlt: z.string().optional(),

        header: z
            .object({
                logo: z.string().optional(),
                nav: z
                    .array(
                        z.object({
                            name: z.string().optional(),
                            url: z.string().optional(),
                        }),
                    )
                    .optional(),
                secondaryCta: z
                    .object({
                        name: z.string().optional(),
                        url: z.string().optional(),
                    })
                    .optional(),
                principalCta: z
                    .object({
                        name: z.string().optional(),
                        url: z.string().optional(),
                    })
                    .optional(),
            })
            .optional(),

        footer: z
            .object({
                logo: z.string().optional(),
                advise: z.string().optional(),
            })
            .optional(),
    }),
})

const page = defineCollection({
    loader: async () => {
        const response = await client.queries.pageConnection()

        return response.data.pageConnection.edges
            ?.filter(edge => !!edge?.node)
            .map(edge => {
                const node = edge.node

                return {
                    ...node,
                    id: node?._sys.relativePath.replace(/\.md?$/, ''),
                    tinaInfo: node?._sys,
                }
            })
    },
    schema: z.object({
        tinaInfo: z.object({
            filename: z.string(),
            basename: z.string(),
            path: z.string(),
            relativePath: z.string(),
        }),

        title: z.string().optional(),
        description: z.string().optional(),

        blocks: z
            .array(
                z.object({
                    __typename: z.string(),
                }),
            )
            .nullable()
            .optional(),

        body: z.any().optional(),
    }),
})

export const collections = { global, page }
