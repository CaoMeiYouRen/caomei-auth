import { PRE_REGISTERED_LOCALES, registerLocale, type CaomeiLocaleMessages } from 'caomei-ui'
import { ENABLED_LOCALES, type LocaleCode } from '@/i18n/config/locale-registry'

/**
 * 非预注册语言的文案加载器。
 *
 * caomei-ui 的 locale 子路径必须静态书写（Vite 无法解析变量形式的 exports 子路径），
 * 因此这里显式登记；新增启用语言时补一行即可。
 */
const LOCALE_LOADERS: Record<Exclude<LocaleCode, (typeof PRE_REGISTERED_LOCALES)[number]>, () => Promise<{ default: CaomeiLocaleMessages }>> = {
    'zh-TW': () => import('caomei-ui/locale/zh-tw'),
    'ja-JP': () => import('caomei-ui/locale/ja-jp'),
    'ko-KR': () => import('caomei-ui/locale/ko-kr'),
    'es-ES': () => import('caomei-ui/locale/es-es'),
    'fr-FR': () => import('caomei-ui/locale/fr-fr'),
    'de-DE': () => import('caomei-ui/locale/de-de'),
    'ru-RU': () => import('caomei-ui/locale/ru-ru'),
    'pt-BR': () => import('caomei-ui/locale/pt-br'),
}

/**
 * 为已启用但 caomei-ui 未预注册的语言按需注册内建文案。
 *
 * 必须先注册再挂载 `CaomeiConfigProvider`，否则组件内建文案会静默回退中文。
 * 未启用语言不会被加载，避免把 8 个语言包都塞进入口产物。
 */
export async function registerCaomeiLocales(
    locales: readonly { code: LocaleCode }[] = ENABLED_LOCALES,
): Promise<void> {
    await Promise.all(locales.map(async (locale) => {
        if (PRE_REGISTERED_LOCALES.includes(locale.code as (typeof PRE_REGISTERED_LOCALES)[number])) {
            return
        }
        const messages = await LOCALE_LOADERS[locale.code as keyof typeof LOCALE_LOADERS]()
        registerLocale(locale.code, messages.default)
    }))
}

export default defineNuxtPlugin(async () => {
    await registerCaomeiLocales()
})
