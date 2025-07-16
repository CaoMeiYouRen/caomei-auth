export function shortText(val?: string, head = 4, tail = 4, max = 12): string {
    if (!val) {
        return ''
    }
    if (val.length <= max) {
        return val
    }
    return `${val.slice(0, head)}...${val.slice(-tail)}`
}
