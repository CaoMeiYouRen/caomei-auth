import { PhoneNumberFormat, PhoneNumberUtil, type RegionCode, type RegionCodeUnknown } from 'google-libphonenumber'

export const phoneUtil = PhoneNumberUtil.getInstance()

/**
 * 格式化手机号到 E164 格式，用于数据库存储。
 * 例如 +12024561414
 *
 * @author CaoMeiYouRen
 * @date 2025-07-12
 * @export
 * @param phoneNumber
 * @param region 手机号所属区域。如果没有区域代码，则根据手机号自动获取，默认为中国大陆地区
 */
export function formatPhoneNumber(phoneNumber: string, region: RegionCode | RegionCodeUnknown = getRegionCodeForPhoneNumber(phoneNumber)) {
    const phoneNumberObj = phoneUtil.parse(phoneNumber, region)
    return phoneUtil.format(phoneNumberObj, PhoneNumberFormat.E164)
}

/**
 * 格式化手机号到国际格式，用于展现给用户。
 * 例如 +1 202-456-1414
 *
 * @author CaoMeiYouRen
 * @date 2025-07-12
 * @export
 * @param phoneNumber
 * @param region 手机号所属区域。如果没有区域代码，则根据手机号自动获取，默认为中国大陆地区
 */
export function formatPhoneNumberInternational(phoneNumber: string, region: RegionCode | RegionCodeUnknown = getRegionCodeForPhoneNumber(phoneNumber)) {
    const phoneNumberObj = phoneUtil.parse(phoneNumber, region)
    return phoneUtil.format(phoneNumberObj, PhoneNumberFormat.INTERNATIONAL)
}

/**
 * 从手机号中获取区域代码。
 * 如果手机号中没有区域代码，则默认返回中国大陆地区代码。
 *
 * @author CaoMeiYouRen
 * @date 2025-07-13
 * @export
 * @param phoneNumber
 * @returns RegionCode
 */
export function getRegionCodeForPhoneNumber(phoneNumber: string): RegionCode | RegionCodeUnknown {
    try {
        const countryCode = phoneUtil.parse(phoneNumber).getCountryCodeOrDefault() || 86
        return phoneUtil.getRegionCodeForCountryCode(countryCode)
    } catch (error) {
        return 'CN'
    }
}

