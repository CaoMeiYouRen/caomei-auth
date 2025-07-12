import { PhoneNumberFormat, PhoneNumberUtil, type RegionCode } from 'google-libphonenumber'

const phoneUtil = PhoneNumberUtil.getInstance()

/**
 * 格式化手机号到 E164 格式，用于数据库存储。
 * 例如 +12024561414
 *
 * @author CaoMeiYouRen
 * @date 2025-07-12
 * @export
 * @param phoneNumber
 * @param region 手机号所属区域，默认中国大陆地区
 */
export function formatPhoneNumber(phoneNumber: string, region: RegionCode = 'CN') {
    const phoneNumberObj = phoneUtil.parse(phoneNumber, region)
    return phoneUtil.format(phoneNumberObj, PhoneNumberFormat.E164)
}

/**
 * 格式化手机号到国际格式，可读性更高。
 * 例如 +1 202-456-1414
 *
 * @author CaoMeiYouRen
 * @date 2025-07-12
 * @export
 * @param phoneNumber
 * @param region 手机号所属区域，默认中国大陆地区
 */
export function formatPhoneNumberInternational(phoneNumber: string, region: RegionCode = 'CN') {
    const phoneNumberObj = phoneUtil.parse(phoneNumber, region)
    return phoneUtil.format(phoneNumberObj, PhoneNumberFormat.INTERNATIONAL)
}
