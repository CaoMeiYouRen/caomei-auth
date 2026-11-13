import { ref } from 'vue'
import { ssoProviderFormSchema } from '@/utils/shared/schemas'
import type { AdminSsoProviderDetail } from '@/types/admin'

/** 属性映射表单 */
export interface MappingFormData {
    email: string
    emailVerified: string
    name: string
    firstName: string
    lastName: string
    image: string
}

/** OIDC 配置表单 */
export interface OidcFormData {
    clientId: string
    clientSecret: string
    discoveryEndpoint: string
    authorizationEndpoint: string
    tokenEndpoint: string
    userInfoEndpoint: string
    jwksEndpoint: string
    scopes: string[]
    pkce: boolean
}

/** SAML 配置表单 */
export interface SamlFormData {
    entryPoint: string
    certificate: string
    signingKey: string
    attributeConsumingServiceIndex: number
}

/** `POST` / `PUT /api/admin/sso/providers` 请求体 */
export interface SsoProviderPayload {
    type: 'oidc' | 'saml'
    providerId: string
    name: string
    description: string
    issuer: string
    domain: string
    organizationId?: string
    enabled: boolean
    oidcConfig?: {
        clientId: string
        clientSecret: string
        discoveryEndpoint?: string
        authorizationEndpoint?: string
        tokenEndpoint?: string
        userInfoEndpoint?: string
        jwksEndpoint?: string
        scopes: string[]
        pkce: boolean
        mapping: Pick<MappingFormData, 'email' | 'emailVerified' | 'name' | 'image'>
    }
    samlConfig?: {
        entryPoint: string
        certificate: string
        signingKey?: string
        attributeConsumingServiceIndex: number
        mapping: Pick<MappingFormData, 'email' | 'name' | 'firstName' | 'lastName'>
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 服务端以 JSON 字符串返回配置；同时容忍已解析对象，解析失败按「无配置」处理 */
function parseConfig(value: unknown): Record<string, unknown> | null {
    if (!value) {
        return null
    }
    if (typeof value === 'string') {
        try {
            const parsed: unknown = JSON.parse(value)
            return isRecord(parsed) ? parsed : null
        } catch (error: unknown) {
            /* 配置损坏时回落到默认值，但要留下排障线索（迁移前同样打印解析失败） */
            console.warn('Failed to parse SSO provider config, falling back to defaults:', error)
            return null
        }
    }
    return isRecord(value) ? value : null
}

function readString(source: Record<string, unknown> | null, key: string): string {
    const value = source?.[key]
    return typeof value === 'string' ? value : ''
}

function readStringArray(source: Record<string, unknown> | null, key: string): string[] {
    const value = source?.[key]
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function readNumber(source: Record<string, unknown> | null, key: string, fallback: number): number {
    const value = source?.[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readBoolean(source: Record<string, unknown> | null, key: string, fallback: boolean): boolean {
    const value = source?.[key]
    return typeof value === 'boolean' ? value : fallback
}

/**
 * SSO 提供商表单状态与请求体组装。
 *
 * 从 `create-provider-dialog` 拆出（见 docs/design/governance/2026-11-10-phase4-registration.md M8 记录）：
 * 表单初值、详情回填与 schema 校验共 3 处使用同一份
 * 字段口径，留在组件内会把对话框推到 `max-lines` 阈值以上；配置解析统一按 `unknown` 收窄，避免 `any`。
 */
export function useSsoProviderForm() {
    const formData = ref({
        type: 'oidc' as 'oidc' | 'saml',
        providerId: '',
        name: '',
        description: '',
        issuer: '',
        domain: '',
        organizationId: '',
        enabled: true,
    })

    const oidcFormData = ref<OidcFormData>({
        clientId: '',
        clientSecret: '',
        discoveryEndpoint: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userInfoEndpoint: '',
        jwksEndpoint: '',
        scopes: ['openid', 'profile', 'email'],
        pkce: true,
    })

    const samlFormData = ref<SamlFormData>({
        entryPoint: '',
        certificate: '',
        signingKey: '',
        attributeConsumingServiceIndex: 0,
    })

    const mappingFormData = ref<MappingFormData>({
        email: 'email',
        emailVerified: 'email_verified',
        name: '',
        firstName: '',
        lastName: '',
        image: 'picture',
    })

    function resetForm() {
        formData.value = {
            type: 'oidc',
            providerId: '',
            name: '',
            description: '',
            issuer: '',
            domain: '',
            organizationId: '',
            enabled: true,
        }

        oidcFormData.value = {
            clientId: '',
            clientSecret: '',
            discoveryEndpoint: '',
            authorizationEndpoint: '',
            tokenEndpoint: '',
            userInfoEndpoint: '',
            jwksEndpoint: '',
            scopes: ['openid', 'profile', 'email'],
            pkce: true,
        }

        samlFormData.value = {
            entryPoint: '',
            certificate: '',
            signingKey: '',
            attributeConsumingServiceIndex: 0,
        }

        mappingFormData.value = {
            email: 'email',
            emailVerified: 'email_verified',
            name: '',
            firstName: '',
            lastName: '',
            image: 'picture',
        }
    }

    /** 从详情响应回填表单；未返回的字段回落到默认值，语义与迁移前一致 */
    function applyProviderDetail(provider: AdminSsoProviderDetail) {
        formData.value = {
            type: provider.type || 'oidc',
            providerId: provider.providerId || '',
            name: provider.name || '',
            description: provider.description || '',
            issuer: provider.issuer || '',
            domain: provider.domain || '',
            organizationId: provider.organizationId || '',
            enabled: provider.enabled !== false,
        }

        if (provider.type === 'saml') {
            const samlConfig = parseConfig(provider.samlConfig)
            const mapping = parseConfig(samlConfig?.mapping)

            samlFormData.value = {
                entryPoint: readString(samlConfig, 'entryPoint'),
                certificate: readString(samlConfig, 'certificate'),
                signingKey: readString(samlConfig, 'signingKey'),
                attributeConsumingServiceIndex: readNumber(samlConfig, 'attributeConsumingServiceIndex', 0),
            }

            if (mapping) {
                mappingFormData.value = {
                    email: readString(mapping, 'email') || 'email',
                    emailVerified: '',
                    name: readString(mapping, 'name') || 'displayName',
                    firstName: readString(mapping, 'firstName') || 'givenName',
                    lastName: readString(mapping, 'lastName') || 'surname',
                    image: '',
                }
            }
            return
        }

        const oidcConfig = parseConfig(provider.oidcConfig)
        const mapping = parseConfig(oidcConfig?.mapping)
        const scopes = readStringArray(oidcConfig, 'scopes')
        const fallbackScopes = provider.scopes ? provider.scopes.split(' ') : ['openid', 'profile', 'email']

        oidcFormData.value = {
            clientId: readString(oidcConfig, 'clientId') || provider.clientId || '',
            clientSecret: readString(oidcConfig, 'clientSecret') || provider.clientSecret || '',
            discoveryEndpoint: readString(oidcConfig, 'discoveryEndpoint') || provider.metadataUrl || '',
            authorizationEndpoint: readString(oidcConfig, 'authorizationEndpoint'),
            tokenEndpoint: readString(oidcConfig, 'tokenEndpoint'),
            userInfoEndpoint: readString(oidcConfig, 'userInfoEndpoint'),
            jwksEndpoint: readString(oidcConfig, 'jwksEndpoint'),
            scopes: scopes.length > 0 ? scopes : fallbackScopes,
            pkce: readBoolean(oidcConfig, 'pkce', true),
        }

        if (mapping) {
            mappingFormData.value = {
                email: readString(mapping, 'email') || 'email',
                emailVerified: readString(mapping, 'emailVerified') || 'email_verified',
                name: readString(mapping, 'name') || 'name',
                firstName: '',
                lastName: '',
                image: readString(mapping, 'image') || 'picture',
            }
        }
    }

    /** 组装请求体：可选字段的空字符串按「未提供」处理，避免下发 `key=` */
    function buildPayload(): SsoProviderPayload {
        const payload: SsoProviderPayload = {
            type: formData.value.type,
            providerId: formData.value.providerId,
            name: formData.value.name,
            description: formData.value.description,
            issuer: formData.value.issuer,
            domain: formData.value.domain,
            organizationId: formData.value.organizationId || undefined,
            enabled: formData.value.enabled,
        }

        if (formData.value.type === 'oidc') {
            payload.oidcConfig = {
                clientId: oidcFormData.value.clientId,
                clientSecret: oidcFormData.value.clientSecret,
                discoveryEndpoint: oidcFormData.value.discoveryEndpoint || undefined,
                authorizationEndpoint: oidcFormData.value.authorizationEndpoint || undefined,
                tokenEndpoint: oidcFormData.value.tokenEndpoint || undefined,
                userInfoEndpoint: oidcFormData.value.userInfoEndpoint || undefined,
                jwksEndpoint: oidcFormData.value.jwksEndpoint || undefined,
                scopes: oidcFormData.value.scopes,
                pkce: oidcFormData.value.pkce,
                mapping: {
                    email: mappingFormData.value.email || 'email',
                    emailVerified: mappingFormData.value.emailVerified || 'email_verified',
                    name: mappingFormData.value.name || 'name',
                    image: mappingFormData.value.image || 'picture',
                },
            }
            return payload
        }

        payload.samlConfig = {
            entryPoint: samlFormData.value.entryPoint,
            certificate: samlFormData.value.certificate,
            signingKey: samlFormData.value.signingKey || undefined,
            attributeConsumingServiceIndex: samlFormData.value.attributeConsumingServiceIndex,
            mapping: {
                email: mappingFormData.value.email || 'email',
                name: mappingFormData.value.name || 'displayName',
                firstName: mappingFormData.value.firstName || 'givenName',
                lastName: mappingFormData.value.lastName || 'surname',
            },
        }

        return payload
    }

    /** 用共享 schema 校验即将提交的请求体（空字符串与缺省等价，见 `ssoProviderFormSchema`） */
    function validateForm(): string[] {
        const result = ssoProviderFormSchema.safeParse(buildPayload())
        if (result.success) {
            return []
        }
        return result.error.issues.map((issue) => issue.message)
    }

    return {
        formData,
        oidcFormData,
        samlFormData,
        mappingFormData,
        resetForm,
        applyProviderDetail,
        buildPayload,
        validateForm,
    }
}
