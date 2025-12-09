import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateRandomString } from '@/utils/shared/random'

describe('server/utils/random', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        mathRandomSpy = vi.spyOn(Math, 'random')
    })

    afterEach(() => {
        mathRandomSpy.mockRestore()
    })

    it('produces deterministic output when Math.random is stubbed', () => {
        const sequence = [0, 0.5, 0.999, 0.25, 0.75]
        mathRandomSpy.mockImplementation(() => sequence.shift() ?? 0)

        const result = generateRandomString(5)

        expect(result).toBe('Af9Pu')
        expect(sequence.length).toBe(0)
    })

    it('returns an empty string when length is zero', () => {
        mathRandomSpy.mockReturnValue(0.42)
        expect(generateRandomString(0)).toBe('')
    })

    it('only uses allowed alphanumeric characters', () => {
        const allowed = /^[A-Za-z0-9]+$/
        mathRandomSpy.mockReturnValue(0.123456)
        const result = generateRandomString(20)
        expect(result).toHaveLength(20)
        expect(allowed.test(result)).toBe(true)
    })
})
