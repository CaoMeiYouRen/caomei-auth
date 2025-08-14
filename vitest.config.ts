import path from 'path'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
    test: {
        globals: true,
        environment: 'nuxt',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
    root: path.resolve('./'),
})
