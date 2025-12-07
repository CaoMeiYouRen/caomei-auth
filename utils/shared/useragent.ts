import { UAParser } from 'ua-parser-js'

export function getBrowser(userAgent: string) {
    const parser = new UAParser(userAgent)
    const browser = parser.getBrowser()

    if (!browser.name) {
        return 'Unknown'
    }

    const version = browser.version || '0.0.0'
    return `${browser.name} ${version}`
}

export function getOs(userAgent: string) {
    const parser = new UAParser(userAgent)
    const os = parser.getOS()

    if (!os.name) {
        return 'Unknown'
    }

    const version = os.version || '0.0.0'
    return `${os.name} ${version}`
}

export function parseUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent)
    const browser = parser.getBrowser()
    const os = parser.getOS()

    const browserName = browser.name || 'Unknown'
    const browserVersion = browser.version || '0.0.0'
    const osName = os.name || 'Unknown'
    const osVersion = os.version || '0.0.0'

    return {
        browser: `${browserName} ${browserVersion}`,
        os: `${osName} ${osVersion}`,
    }
}
