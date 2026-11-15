import { describe, expect, it } from 'vitest'
import { formatDevice, getDeviceIcon } from '@/utils/web/device'

describe('formatDevice', () => {
    it('joins browser and os', () => {
        expect(formatDevice({ browser: 'Chrome', os: 'Windows' })).toBe('Chrome / Windows')
    })

    it('returns an empty string when nothing is known', () => {
        /* 兜底文案由调用方本地化，工具层不再返回中文 */
        expect(formatDevice(null)).toBe('')
        expect(formatDevice({})).toBe('')
    })

    it('picks an icon per device class', () => {
        expect(getDeviceIcon(null)).toBe('mdi mdi-help-circle')
        expect(getDeviceIcon({ isMobile: true })).toBe('mdi mdi-cellphone')
        expect(getDeviceIcon({ isTablet: true })).toBe('mdi mdi-tablet')
        expect(getDeviceIcon({ isDesktop: true })).toBe('mdi mdi-desktop-classic')
        expect(getDeviceIcon({})).toBe('mdi mdi-devices')
    })
})
