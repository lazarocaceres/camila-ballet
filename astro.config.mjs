// @ts-check
import { defineConfig } from 'astro/config'
import { i18n } from './i18n'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import tinaDirective from './astro-tina-directive/register'

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
    },
    trailingSlash: 'never',
})
