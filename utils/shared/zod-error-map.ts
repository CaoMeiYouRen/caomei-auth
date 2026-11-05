/** 只依赖 issue.code，避免绑定 Zod 内部 issue 联合类型 */
export interface ZodIssueLike {
    code: string
}

/** 翻译函数：只要求能按 key 取到文案，前后端共用 */
export type ZodMessageTranslator = (key: string) => string

/**
 * 构造 Zod per-parse error map。
 *
 * 约束（i18n 评估 §5.7）：
 * - 不使用全局 `z.config(z.locales.xxx())`，避免 SSR 并发请求串语言；
 * - Schema 级 `message` 优先级高于本 map，M2 之前需先移除 schema 级中文消息；
 * - 返回字符串即可，Zod 4 会包装为 `{ message }`。
 */
export function createZodErrorMap(t: ZodMessageTranslator) {
    return (issue: ZodIssueLike): string => {
        switch (issue.code) {
            case 'invalid_type':
                return t('validation.type')
            case 'too_small':
                return t('validation.tooSmall')
            case 'too_big':
                return t('validation.tooBig')
            case 'invalid_format':
                return t('validation.format')
            case 'invalid_value':
                return t('validation.invalidValue')
            case 'invalid_union':
                return t('validation.invalid')
            case 'unrecognized_keys':
                return t('validation.invalid')
            default:
                return t('validation.invalid')
        }
    }
}
