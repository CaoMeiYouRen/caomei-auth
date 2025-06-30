import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    root: path.resolve('./'),
    coverage: {
        clean: true,
        reportsDirectory: path.resolve('./coverage'),
    },
})
