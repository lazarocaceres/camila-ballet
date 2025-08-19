const robotsTxt = `
User-agent: *
Disallow: /admin/
Allow: /

Sitemap: ${new URL('sitemap.xml', import.meta.env.SITE_URL).href}
`.trim()

export const GET = () => {
    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    })
}
