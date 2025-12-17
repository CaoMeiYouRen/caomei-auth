/**
 * 生成安全的随机数 (0-1)
 */
export function secureRandom(): number {
    if (typeof globalThis?.crypto?.getRandomValues === 'function') {
        const array = new Uint32Array(1)
        globalThis.crypto.getRandomValues(array)
        return (array[0] || 0) / (0xFFFFFFFF + 1)
    }
    // Fallback for environments without crypto (should be rare in modern Node/Browsers)
    return Math.random()
}

export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(secureRandom() * characters.length)
        result += characters[randomIndex]
    }
    return result
}
