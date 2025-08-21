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

const { SITE_URL, VERCEL_URL } = loadEnv(
    process.env.NODE_ENV || '',
    process.cwd(),
    '',
)

// https://astro.build/config
export default defineConfig({
    output: 'static',
    adapter: vercel({
        imageService: true,
        imagesConfig: {
            formats: ['image/avif', 'image/webp'],
            sizes: [
                32, 64, 96, 128, 160, 192, 256, 320, 480, 640, 960, 1280, 1600,
            ],
            remotePatterns: [
                {
                    protocol: 'https',
                    hostname: 'assets.tina.io',
                    port: '',
                },
            ],
        },
    }),
    site: SITE_URL || `https://${VERCEL_URL}`,
    integrations: [mdx(), sitemap(), react(), tinaDirective()],
    vite: {
        plugins: [tailwindcss()],
        resolve: { dedupe: ['react', 'react-dom'] },
        build: {
            target: 'es2020',
            cssCodeSplit: true,
            modulePreload: true,
            sourcemap: false,
        },
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
