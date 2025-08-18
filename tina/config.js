import { defineConfig } from 'tinacms'
import { GlobalCollection } from './collections/global'
import { PageCollection } from './collections/page'

const branch =
    process.env.GITHUB_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.HEAD ||
    'main'

export default defineConfig({
    branch,
    clientId: process.env.PUBLIC_TINA_CLIENT_ID,
    token: process.env.TINA_TOKEN,
    build: {
        outputFolder: 'admin',
        publicFolder: 'public',
    },
    media: {
        tina: {
            mediaRoot: '',
            publicFolder: 'public',
        },
    },
    schema: {
        collections: [GlobalCollection, PageCollection],
    },
    search: {
        tina: {
            indexerToken: process.env.TINA_SEARCH_INDEXER_TOKEN || '',
            stopwordLanguages: ['eng', 'spa', 'fra'],
        },
        indexBatchSize: 100,
        maxSearchIndexFieldLength: 100,
    },
})
