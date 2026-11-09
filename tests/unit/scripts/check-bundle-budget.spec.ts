import { describe, expect, it } from 'vitest'
import { evaluateBundleBudget } from '../../../scripts/migration/check-bundle-budget.mjs'

describe('scripts/migration/check-bundle-budget', () => {
    it('passes when entry CSS growth stays within the budget', () => {
        const result = evaluateBundleBudget({ entryCss: 400_000 }, { entryCss: 420_000 })
        expect(result.passed).toBe(true)
        expect(result.growth).toBeCloseTo(0.05)
    })

    it('passes at the exact limit', () => {
        expect(evaluateBundleBudget({ entryCss: 100 }, { entryCss: 110 }).passed).toBe(true)
    })

    it('fails when entry CSS growth exceeds the budget', () => {
        const result = evaluateBundleBudget({ entryCss: 100 }, { entryCss: 111 })
        expect(result.passed).toBe(false)
        expect(result.growth).toBeCloseTo(0.11)
    })

    it('supports a custom budget', () => {
        expect(evaluateBundleBudget({ entryCss: 100 }, { entryCss: 115 }, { maxCssGrowth: 0.2 }).passed).toBe(true)
    })

    it('rejects an invalid baseline', () => {
        expect(() => evaluateBundleBudget({ entryCss: 0 }, { entryCss: 100 })).toThrow('entryCss')
    })
})
