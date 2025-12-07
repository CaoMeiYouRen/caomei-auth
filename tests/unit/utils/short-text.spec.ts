import { describe, it, expect } from 'vitest'
import { shortText } from '@/utils/shared/short-text'

describe('utils/short-text', () => {
    it('returns empty string when value missing', () => {
        expect(shortText()).toBe('')
        expect(shortText(undefined, 2, 2, 4)).toBe('')
    })

    it('returns original when length within max', () => {
        expect(shortText('abc', 2, 2, 5)).toBe('abc')
    })

    it('truncates to head tail when exceeds max', () => {
        expect(shortText('abcdefghijkl', 2, 3, 8)).toBe('ab...jkl')
    })
})
