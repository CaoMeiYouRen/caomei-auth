import path from 'path'
import fs from 'fs-extra'
export default defineEventHandler(async () => {
    let pkg: any = {}
    try {
        pkg = await fs.readJSON(path.resolve('./package.json'))
    } catch (e) {
        logger.error('Failed to read package.json:', e)
    }
    return {
        statusCode: 200,
        statusMessage: 'OK',
        message: 'Hello, Caomei Auth!',
        data: {
            version: pkg.version || 'unknown',
        },
    }
})
