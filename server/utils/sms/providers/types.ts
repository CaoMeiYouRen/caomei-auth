export interface SmsResult {
    success: boolean
    message: string
    sid?: string
    code?: number
    // Twilio specific
    status?: string
    direction?: string
    numSegments?: string
    price?: string
    priceUnit?: string
    errorCode?: number
    errorMessage?: string
}

export interface SmsProvider {
    /**
     * 发送短信验证码
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @param expiresInMinutes 过期时间（分钟）
     * @returns 发送结果
     */
    sendOtp(phoneNumber: string, code: string, expiresInMinutes: number): Promise<SmsResult>

    /**
     * 验证手机号格式
     * @param phoneNumber 手机号码
     * @returns 是否有效
     */
    validatePhoneNumber(phoneNumber: string): boolean
}
