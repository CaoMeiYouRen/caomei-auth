import useragent from '@hyperwatch/useragent'

export function getBrowser(userAgent: string) {
    const ua = useragent.parse(userAgent)
    if (!ua) {
        return 'Unknown'
    }
    return `${ua.family} ${ua.major ?? 0}.${ua.minor ?? 0}.${ua.patch ?? 0}`
}

export function getOs(userAgent: string) {
    const ua = useragent.parse(userAgent)
    if (!ua) {
        return 'Unknown'
    }
    return `${ua.os.family} ${ua.os.major ?? 0}.${ua.os.minor ?? 0}.${ua.os.patch ?? 0}`
}

export function parseUserAgent(userAgent: string) {
    const ua = useragent.parse(userAgent)
    if (!ua) {
        return {
            browser: 'Unknown',
            os: 'Unknown',
        }
    }
    return {
        browser: `${ua.family} ${ua.major ?? 0}.${ua.minor ?? 0}.${ua.patch ?? 0}`,
        os: `${ua.os.family} ${ua.os.major ?? 0}.${ua.os.minor ?? 0}.${ua.os.patch ?? 0}`,
    }
}
