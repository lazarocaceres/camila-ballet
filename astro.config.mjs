// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import { i18n } from './i18n'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import tinaDirective from './astro-tina-directive/register'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
    integrations: [mdx(), sitemap(), react(), tinaDirective()],
    site: process.env.SITE_URL || `https://${process.env.VERCEL_URL}`,
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
    vite: {
        plugins: [tailwindcss()],
    },
})
