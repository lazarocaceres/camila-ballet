import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import config from 'content/config/config.json'

export async function GET(context) {
    const posts = await getCollection('page')
    return rss({
        title: config.seo.title,
        description: config.seo.description,
        site: context.site,
        items: posts.map(post => ({
            ...post.data,
            link: post.id,
        })),
    })
}
