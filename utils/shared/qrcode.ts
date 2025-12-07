import QRCode from 'qrcode'

export async function generateQRCode(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text)
    } catch (error) {
        console.error('生成二维码失败:', error)
        throw error
    }
}
