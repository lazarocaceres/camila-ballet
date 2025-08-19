// @ts-check
import { loadEnv } from 'vite'
import { defineConfig, fontProviders } from 'astro/config'
import vercel from '@astrojs/vercel'
import { i18n } from './i18n'
import mdx from '@astrojs/mdx'
import sitemap from './lib/sitemap'
import react from '@astrojs/react'
import tinaDirective from './astro-tina-directive/register'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

const { SITE_URL, VERCEL_URL } = loadEnv(
    process.env.NODE_ENV || '',
    process.cwd(),
    '',
)

// https://astro.build/config
export default defineConfig({
    output: 'static',
    adapter: vercel({
        edgeMiddleware: true,
    }),
    site: SITE_URL || `https://${VERCEL_URL}`,
    integrations: [mdx(), sitemap(), react(), tinaDirective()],
    vite: {
        plugins: [
            tailwindcss(),
            ViteImageOptimizer({
                includePublic: true,
                exclude: [
                    '**/favicons/**',
                    '**/favicon.ico',
                    '**/favicon.svg',
                    '**/apple-icon.png',
                ],
                logStats: true,

                svg: {
                    multipass: true,
                    plugins: [
                        {
                            name: 'preset-default',
                            params: {
                                overrides: {
                                    cleanupNumericValues: false,
                                    convertPathData: false,
                                },
                            },
                        },
                        'sortAttrs',
                        {
                            name: 'addAttributesToSVGElement',
                            params: {
                                attributes: [
                                    { xmlns: 'http://www.w3.org/2000/svg' },
                                ],
                            },
                        },
                    ],
                },
                png: {
                    compressionLevel: 9,
                    palette: true,
                    quality: 90,
                },
                jpeg: {
                    quality: 83,
                    progressive: true,
                    mozjpeg: true,
                    chromaSubsampling: '4:2:0',
                },
                webp: {
                    quality: 82,
                    effort: 6,
                    smartSubsample: true,
                    alphaQuality: 95,
                },
                avif: {
                    quality: 56,
                    effort: 8,
                    chromaSubsampling: '4:2:0',
                },
                gif: {},
                cache: true,
            }),
        ],
    },
    i18n,
    prefetch: {
        prefetchAll: true,
    },
    experimental: {
        clientPrerender: true,
        fonts: [
            {
                provider: fontProviders.google(),
                name: 'Playfair Display',
                cssVariable: '--playfair-display',
                subsets: ['latin'],
            },
            {
                name: 'Inter',
                cssVariable: '--inter',
                provider: fontProviders.google(),
                weights: [300, 500, 700],
                subsets: ['latin'],
            },
        ],
    },
    trailingSlash: 'never',
})
