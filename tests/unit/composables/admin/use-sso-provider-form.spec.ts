import { describe, it, expect } from 'vitest'
import { useSsoProviderForm } from '@/composables/admin/use-sso-provider-form'
import type { AdminSsoProviderDetail } from '@/types/admin'

function createProvider(overrides: Partial<AdminSsoProviderDetail> = {}): AdminSsoProviderDetail {
    return {
        id: 'provider-1',
        providerId: 'corp-sso',
        name: '企业 SSO',
        description: '',
        domain: 'example.com',
        issuer: 'https://idp.example.com',
        type: 'oidc',
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        ...overrides,
    }
}

describe('useSsoProviderForm', () => {
    it('初始化默认值', () => {
        const { formData, oidcFormData, samlFormData, mappingFormData } = useSsoProviderForm()

        expect(formData.value).toMatchObject({ type: 'oidc', enabled: true, providerId: '' })
        expect(oidcFormData.value.scopes).toEqual(['openid', 'profile', 'email'])
        expect(oidcFormData.value.pkce).toBe(true)
        expect(samlFormData.value.attributeConsumingServiceIndex).toBe(0)
        expect(mappingFormData.value).toMatchObject({ email: 'email', emailVerified: 'email_verified', image: 'picture' })
    })

    it('回填 OIDC 详情（JSON 字符串配置）', () => {
        const { formData, oidcFormData, mappingFormData, applyProviderDetail } = useSsoProviderForm()

        applyProviderDetail(createProvider({
            organizationId: 'org-1',
            oidcConfig: JSON.stringify({
                clientId: 'client-1',
                clientSecret: '***',
                discoveryEndpoint: 'https://idp.example.com/.well-known/openid-configuration',
                scopes: ['openid', 'email'],
                pkce: false,
                mapping: { email: 'mail', emailVerified: 'verified', name: 'display', image: 'avatar' },
            }),
        }))

        expect(formData.value).toMatchObject({ providerId: 'corp-sso', organizationId: 'org-1', type: 'oidc' })
        expect(oidcFormData.value).toMatchObject({
            clientId: 'client-1',
            clientSecret: '***',
            discoveryEndpoint: 'https://idp.example.com/.well-known/openid-configuration',
            scopes: ['openid', 'email'],
            pkce: false,
        })
        expect(mappingFormData.value).toEqual({
            email: 'mail',
            emailVerified: 'verified',
            name: 'display',
            firstName: '',
            lastName: '',
            image: 'avatar',
        })
    })

    it('回填 SAML 详情（含已解析对象配置）', () => {
        const { formData, samlFormData, mappingFormData, applyProviderDetail } = useSsoProviderForm()

        applyProviderDetail(createProvider({
            type: 'saml',
            samlConfig: {
                entryPoint: 'https://idp.example.com/sso',
                certificate: '-----BEGIN CERTIFICATE-----',
                signingKey: '***',
                attributeConsumingServiceIndex: 3,
                mapping: { email: 'mail', name: 'displayName', firstName: 'givenName', lastName: 'surname' },
            },
        }))

        expect(formData.value.type).toBe('saml')
        expect(samlFormData.value).toMatchObject({
            entryPoint: 'https://idp.example.com/sso',
            signingKey: '***',
            attributeConsumingServiceIndex: 3,
        })
        expect(mappingFormData.value).toMatchObject({
            email: 'mail',
            name: 'displayName',
            firstName: 'givenName',
            lastName: 'surname',
        })
    })

    it('配置解析失败时回落到默认值', () => {
        const { oidcFormData, applyProviderDetail } = useSsoProviderForm()

        applyProviderDetail(createProvider({ oidcConfig: '{not-json', scopes: 'openid profile' }))

        expect(oidcFormData.value).toMatchObject({ clientId: '', scopes: ['openid', 'profile'], pkce: true })
    })

    it('buildPayload 省略空的可选字段', () => {
        const { formData, oidcFormData, buildPayload } = useSsoProviderForm()

        formData.value.providerId = 'corp-sso'
        formData.value.issuer = 'https://idp.example.com'
        formData.value.domain = 'example.com'
        oidcFormData.value.clientId = 'client-1'
        oidcFormData.value.clientSecret = 'secret'

        const payload = buildPayload()

        expect(payload.organizationId).toBeUndefined()
        expect(payload.oidcConfig).toMatchObject({ clientId: 'client-1', clientSecret: 'secret' })
        /* 空字符串转 `undefined`：JSON 序列化时不下发该键 */
        expect(payload.oidcConfig?.discoveryEndpoint).toBeUndefined()
        expect(JSON.stringify(payload.oidcConfig)).not.toContain('discoveryEndpoint')
        expect(payload.samlConfig).toBeUndefined()
    })

    it('buildPayload 只在对应协议下携带配置', () => {
        const { formData, samlFormData, buildPayload } = useSsoProviderForm()

        formData.value.type = 'saml'
        samlFormData.value.entryPoint = 'https://idp.example.com/sso'
        samlFormData.value.certificate = 'cert'

        const payload = buildPayload()

        expect(payload.oidcConfig).toBeUndefined()
        expect(payload.samlConfig).toMatchObject({
            entryPoint: 'https://idp.example.com/sso',
            certificate: 'cert',
            attributeConsumingServiceIndex: 0,
        })
    })

    it('validateForm 返回共享 schema 的错误信息', () => {
        const { validateForm } = useSsoProviderForm()

        const errors = validateForm()

        expect(errors.length).toBeGreaterThan(0)
        expect(errors).toContain('validation.providerIdRequired')
    })

    it('validateForm 在必填项齐全时通过', () => {
        const { formData, oidcFormData, validateForm } = useSsoProviderForm()

        formData.value.providerId = 'corp-sso'
        formData.value.issuer = 'https://idp.example.com'
        formData.value.domain = 'example.com'
        oidcFormData.value.clientId = 'client-1'
        oidcFormData.value.clientSecret = 'secret'

        expect(validateForm()).toEqual([])
    })

    it('resetForm 恢复默认值', () => {
        const { formData, oidcFormData, samlFormData, mappingFormData, resetForm } = useSsoProviderForm()

        formData.value.providerId = 'corp-sso'
        formData.value.type = 'saml'
        oidcFormData.value.clientId = 'client-1'
        samlFormData.value.certificate = 'cert'
        mappingFormData.value.email = 'mail'

        resetForm()

        expect(formData.value).toMatchObject({ providerId: '', type: 'oidc' })
        expect(oidcFormData.value.clientId).toBe('')
        expect(samlFormData.value.certificate).toBe('')
        expect(mappingFormData.value.email).toBe('email')
    })
})
