import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import loggerMock from '../../mocks/logger'

vi.mock('@/utils/env', () => ({
    MACHINE_ID: 1,
}))

vi.stubGlobal('logger', loggerMock)

let SnowflakeCtor: typeof import('@/server/utils/snowflake').Snowflake

beforeAll(async () => {
    const mod = await import('@/server/utils/snowflake')
    SnowflakeCtor = mod.Snowflake
})

afterAll(() => {
    vi.unstubAllGlobals()
})

describe('server/utils/snowflake', () => {
    const fixedTimestamp = 1_730_000_000_000

    it('embeds timestamp, machine id, and sequence bits into the id', () => {
        const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedTimestamp)
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

        const generator = new SnowflakeCtor(512)
        const id = generator.generateId()
        const idBigInt = BigInt(`0x${id}`)

        expect(id).toMatch(/^[0-9a-f]+$/i)
        expect(((idBigInt >> BigInt(22)) & BigInt('0xFFFFFFFFFFFF'))).toBe(BigInt(fixedTimestamp))
        expect(((idBigInt >> BigInt(12)) & BigInt(0x3ff))).toBe(BigInt(512))
        expect(idBigInt & BigInt(0xfff)).toBe(BigInt(2047))

        dateSpy.mockRestore()
        randomSpy.mockRestore()
    })

    it('increments the sequence when multiple ids generated within the same millisecond', () => {
        const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedTimestamp)
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

        const generator = new SnowflakeCtor(25)
        const first = generator.generateId()
        const second = generator.generateId()

        const firstSeq = BigInt(`0x${first}`) & BigInt(0xfff)
        const secondSeq = BigInt(`0x${second}`) & BigInt(0xfff)

        expect(secondSeq).toBe(firstSeq + BigInt(1))

        dateSpy.mockRestore()
        randomSpy.mockRestore()
    })

    it('requests the next timestamp when the sequence overflows in the same millisecond', () => {
        const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedTimestamp)
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

        const generator = new SnowflakeCtor(7)
        ;(generator as any).sequence = 0xfff
        ;(generator as any).lastTimestamp = fixedTimestamp

        const nextTimestampSpy = vi.spyOn(generator as any, 'nextTimestamp').mockReturnValue(fixedTimestamp + 1)

        generator.generateId()

        expect(nextTimestampSpy).toHaveBeenCalledWith(fixedTimestamp)

        dateSpy.mockRestore()
        randomSpy.mockRestore()
        nextTimestampSpy.mockRestore()
    })
})
