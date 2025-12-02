export const getDeviceIcon = (device: any) => {
    if (!device) {
        return 'mdi mdi-help-circle'
    }

    if (device.isMobile) {
        return 'mdi mdi-cellphone'
    }
    if (device.isTablet) {
        return 'mdi mdi-tablet'
    }
    if (device.isDesktop) {
        return 'mdi mdi-desktop-classic'
    }
    return 'mdi mdi-devices'
}

export const formatDevice = (device: any) => {
    if (!device) {
        return '未知设备'
    }

    const parts: string[] = []
    if (device.browser) {
        parts.push(device.browser)
    }
    if (device.os) {
        parts.push(device.os)
    }

    return parts.join(' / ') || '未知设备'
}
