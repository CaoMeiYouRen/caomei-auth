
/**
 *  TODO：实现通过短信发送OTP验证码
 *  发送短信验证码
 *
 * @author CaoMeiYouRen
 * @date 2025-06-26
 * @export
 * @param phoneNumber
 * @param code
 */
export async function sendPhoneOtp(phoneNumber: string, code: string) {
    console.info(`Sending OTP ${code} to phone number ${phoneNumber}`)
    throw new Error(
        '未实现短信发送功能，请切换到其他登录方式或实现短信发送功能',
    )
}
