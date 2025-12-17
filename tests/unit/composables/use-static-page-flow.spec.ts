import { describe, it, expect, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useStaticPageFlow } from '@/composables/use-static-page-flow'

// Mock useRuntimeConfig
const { mockConfig } = vi.hoisted(() => ({
    mockConfig: {
        public: {
            contactEmail: 'test@example.com',
        },
    },
}))

mockNuxtImport('useRuntimeConfig', () => () => mockConfig)

describe('useStaticPageFlow', () => {
    it('should return correct contact email and link', () => {
        const { contactEmail, contactEmailLink } = useStaticPageFlow()

        expect(contactEmail).toBe('test@example.com')
        expect(contactEmailLink).toBe('mailto:test@example.com')
    })
})
