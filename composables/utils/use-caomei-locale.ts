import { computed } from 'vue'
import type { CaomeiLocale } from 'caomei-ui'
import { DEFAULT_LOCALE, type LocaleCode, matchDetectedLocale } from '@/i18n/config/locale-registry'

/**
 * 项目 locale → caomei-ui 内建文案 locale 的映射。
 *
 * `CaomeiConfigProvider` 依据该值切换组件内建文案（Select 空态、Paginator、
 * DataTable 空态、Toast / Confirm 默认按钮等）。caomei-ui 1.2.0 起根包预注册
 * `zh-CN` / `en-US`（见 `PRE_REGISTERED_LOCALES`），与 Locale Registry 一一对应。
 *
 * 入参先经 `matchDetectedLocale` 归一到 Registry code（复用 `en` / `zh-Hans` 等
 * better-auth 边界别名），未识别时回退默认语言。
 *
 * 新增语言时必须同步两件事，否则英文 / 新语言界面会静默回退到中文文案：
 * 1. 在此登记映射（`Record<LocaleCode, CaomeiLocale>` 会在类型检查期强制补齐），
 *    并由 `tests/unit/composables/use-caomei-locale.spec.ts` 校验映射值已预注册；
 * 2. 若该语言不在 `PRE_REGISTERED_LOCALES` 内，需在 provider 挂载前
 *    `import('caomei-ui/locale/<code>')` + `registerLocale()`。
 */
const CAOMEI_LOCALE_MAP: Record<LocaleCode, CaomeiLocale> = {
    'zh-CN': 'zh-CN',
    'en-US': 'en-US',
    'zh-TW': 'zh-TW',
    'ja-JP': 'ja-JP',
    'ko-KR': 'ko-KR',
    'es-ES': 'es-ES',
    'fr-FR': 'fr-FR',
    'de-DE': 'de-DE',
    'ru-RU': 'ru-RU',
    'pt-BR': 'pt-BR',
}

/**
 * 把任意来源的 locale 归一化为 caomei-ui 可识别的 locale；无法识别时回退默认语言。
 *
 * 归一化沿用 Registry 的 better-auth 边界口径：`en` → `en-US`、`zh-Hans` → `zh-CN`、
 * `zh-Hant` → `zh-TW`、`ja` → `ja-JP` 等；停用语言与未识别输入回退默认语言。
 */
export function toCaomeiLocale(code?: string | null): CaomeiLocale {
    return CAOMEI_LOCALE_MAP[matchDetectedLocale(code) ?? DEFAULT_LOCALE]
}

/**
 * 组件库内建文案的语言，跟随应用当前 locale。
 *
 * 由 `app.vue` 传给 `<CaomeiConfigProvider :locale>`，使组件内建文案与页面文案同步切换。
 */
export function useCaomeiLocale() {
    const { locale } = useI18n()

    return computed(() => toCaomeiLocale(locale.value))
}
