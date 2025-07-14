export interface Storage {
    upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }>
}
