import { defineConfig } from 'tinacms'
import { GlobalConfigCollection } from './collections/global-config'
import { PageCollection } from './collections/page'

// Your hosting provider likely exposes this as an environment variable
const branch =
    process.env.GITHUB_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.HEAD ||
    'main'

export default defineConfig({
    branch,

    // Get this from tina.io
    clientId: process.env.PUBLIC_TINA_CLIENT_ID,
    // Get this from tina.io
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
    // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
    schema: {
        collections: [PageCollection, GlobalConfigCollection],
    },
    search: {
        tina: {
            indexerToken: process.env.TINA_SEARCH_INDEXER_TOKEN || '',
            stopwordLanguages: ['eng'],
        },
        indexBatchSize: 100,
        maxSearchIndexFieldLength: 100,
    },
})
