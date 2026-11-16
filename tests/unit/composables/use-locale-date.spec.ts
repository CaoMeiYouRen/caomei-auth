import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useLocaleDate } from '@/composables/use-locale-date'

describe('useLocaleDate', () => {
    it('短格式按指定语言输出（表格列）', () => {
        const { formatDateTimeShort } = useLocaleDate(ref('en-US'))
        const date = new Date('2026-06-15T12:15:00')

        expect(formatDateTimeShort(date)).toMatch(/6\/15\/26/u)
        expect(formatDateTimeShort(date)).toMatch(/PM|AM/u)
    })

    it('全精度格式保留秒（详情）', () => {
        const { formatDateTimeFull } = useLocaleDate(ref('zh-CN'))
        const date = new Date('2026-06-15T12:15:30')

        expect(formatDateTimeFull(date)).toContain('12:15:30')
    })

    it('按指定时区输出', () => {
        const { formatDateTimeShort } = useLocaleDate(ref('en-US'), ref('America/New_York'))
        const date = new Date('2026-06-15T16:15:00Z')

        /* UTC 16:15 → 纽约 12:15 */
        expect(formatDateTimeShort(date)).toMatch(/12:15/u)
    })

    it('空值返回占位符', () => {
        const { formatDateTimeFull, formatDateTimeShort } = useLocaleDate(ref('zh-CN'))

        expect(formatDateTimeFull(null)).toBe('-')
        expect(formatDateTimeShort(undefined)).toBe('-')
    })

    it('切换语言后输出随语言变化', () => {
        const locale = ref('zh-CN')
        const { formatDateTimeShort } = useLocaleDate(locale)
        const date = new Date('2026-06-15T12:15:00')
        const zh = formatDateTimeShort(date)

        locale.value = 'en-US'

        expect(formatDateTimeShort(date)).not.toBe(zh)
    })
})
