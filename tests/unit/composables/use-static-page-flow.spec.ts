import { describe, it, expect, vi } from 'vitest'
import { useStaticPageFlow } from '@/composables/use-static-page-flow'

// Mock useRuntimeConfig
const { mockConfig } = vi.hoisted(() => ({
    mockConfig: {
        public: {
            contactEmail: 'test@example.com',
        },
    },
}))

vi.mock('#app/nuxt', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app/nuxt')>()
    return {
        ...actual,
        useRuntimeConfig: () => mockConfig,
    }
})

describe('useStaticPageFlow', () => {
    it('should return correct contact email and link', () => {
        const { contactEmail, contactEmailLink } = useStaticPageFlow()

        expect(contactEmail).toBe('test@example.com')
        expect(contactEmailLink).toBe('mailto:test@example.com')
    })
})
