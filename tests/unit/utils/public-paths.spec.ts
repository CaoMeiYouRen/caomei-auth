import { describe, it, expect } from 'vitest'
import { publicPaths } from '@/utils/shared/public-paths'

describe('utils/public-paths', () => {
    it('contains key anonymous access paths', () => {
        expect(publicPaths).toEqual(expect.arrayContaining([
            '/login',
            '/register',
            '/privacy',
            '/terms',
        ]))
    })

    it('does not include API auth endpoints by default', () => {
        publicPaths.forEach((path) => {
            expect(path.startsWith('/api/auth')).toBe(false)
        })
    })
})
