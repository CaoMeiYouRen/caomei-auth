import { fileTypeFromBuffer } from 'file-type'

/**
 * 获取文件类型
 * @param buffer 文件buffer
 * @returns 文件类型
 */
export const getFileType = async (buffer: Buffer) => {
    const fileType = await fileTypeFromBuffer(buffer)
    return fileType?.mime
}

/**
 * 根据content-type获取文件后缀名。
 * 后缀名包含点号，例如 .jpg
 * @param contentType content-type
 * @returns 文件后缀名
 */
export function getFileExtension(contentType: string | null): string | undefined {
    if (!contentType) {
        throw new Error('Content-Type is required')
    }

    const mimeTypeMap: { [key: string]: string } = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/bmp': '.bmp',
        'image/tiff': '.tiff',
        'image/svg+xml': '.svg',
    }

    return mimeTypeMap[contentType]
}
