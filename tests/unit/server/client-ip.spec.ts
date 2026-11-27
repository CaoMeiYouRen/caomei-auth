import { describe, expect, it } from 'vitest'
import { MAX_IP_TEXT_LENGTH, normalizeClientIp, resolveClientIp } from '@/server/utils/client-ip'

/**
 * 阶段 17 M3.1：来源 IP 归一化边界矩阵。
 *
 * 动机：`varchar(45)` 列在 MySQL 严格模式 / PostgreSQL 下对超长与带端口值会整行拒绝，
 * SQLite 照存。这里锁住「合法值原样保留、不可归一化回落 null」的口径。
 */
describe('server/utils/client-ip', () => {
    it.each([
        ['203.0.113.10', '203.0.113.10'],
        ['  203.0.113.10  ', '203.0.113.10'],
        ['203.0.113.10:8080', '203.0.113.10'],
        ['2001:db8::1', '2001:db8::1'],
        ['[2001:db8::1]', '2001:db8::1'],
        ['[2001:db8::1]:443', '2001:db8::1'],
        ['fe80::1%eth0', 'fe80::1'],
        ['[fe80::1%eth0]:443', 'fe80::1'],
        ['::ffff:192.0.2.1', '::ffff:192.0.2.1'],
        ['203.0.113.10, 198.51.100.7', '203.0.113.10'],
        ['  , 198.51.100.7', null],
    ])('%s → %s', (input, expected) => {
        expect(normalizeClientIp(input)).toBe(expected)
    })

    it.each([
        [null, null],
        [undefined, null],
        ['', null],
        ['   ', null],
        ['unknown', null],
        ['not-an-ip', null],
        ['1.2.3.4:not-a-port', null],
        ['[2001:db8::1', null],
        ['999.1.1.1', null],
    ])('非法输入 %s 回落 null', (input, expected) => {
        expect(normalizeClientIp(input as string | null | undefined)).toBe(expected)
    })

    it('超过 45 字符的 IPv6 文本回落 null 而不是截断', () => {
        const longIp = `${'2001:db8:'.repeat(7)}1`
        expect(longIp.length).toBeGreaterThan(MAX_IP_TEXT_LENGTH)
        expect(normalizeClientIp(longIp)).toBeNull()
    })

    it('优先取 x-forwarded-for，其次回退 x-real-ip，两者都非法时为 null', () => {
        expect(resolveClientIp('203.0.113.10:80', '198.51.100.7')).toBe('203.0.113.10')
        expect(resolveClientIp(undefined, '198.51.100.7:443')).toBe('198.51.100.7')
        expect(resolveClientIp('garbage', 'also-garbage')).toBeNull()
        expect(resolveClientIp(undefined, undefined)).toBeNull()
    })
})
