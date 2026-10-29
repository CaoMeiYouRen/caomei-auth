import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DataSource } from 'typeorm'
import { betterAuth } from 'better-auth'
import { getAuthTables } from 'better-auth/db'
import { oauthProvider } from '@better-auth/oauth-provider'
import { jwt } from 'better-auth/plugins'
import { typeormAdapter } from '@/server/database/typeorm-adapter'
import { SnakeCaseNamingStrategy } from '@/server/database/naming-strategy'
import { Account } from '@/server/entities/account'
import { Session } from '@/server/entities/session'
import { User } from '@/server/entities/user'
import { Verification } from '@/server/entities/verification'
import { TwoFactor } from '@/server/entities/two-factor'
import { OAuthAccessToken } from '@/server/entities/oauth-access-token'
import { OAuthClient } from '@/server/entities/oauth-client'
import { OAuthClientAssertion } from '@/server/entities/oauth-client-assertion'
import { OAuthClientResource } from '@/server/entities/oauth-client-resource'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { OAuthRefreshToken } from '@/server/entities/oauth-refresh-token'
import { OAuthResource } from '@/server/entities/oauth-resource'
import { Jwks } from '@/server/entities/jwks'
import { SSOProvider } from '@/server/entities/sso-provider'

/**
 * 回归测试：better-auth 1.7 的 oauth-provider 模型必须都能被 TypeORM 适配器解析到实体。
 *
 * 适配器按 `modelName` 与实体名 / 表名（忽略大小写）匹配，缺少任一实体都会在运行时报错，
 * 而类型检查无法发现。这里用内存 SQLite 建表，同时验证实体定义本身可用。
 */
describe('better-auth oauth 模型与 TypeORM 实体映射', () => {
    let dataSource: DataSource

    beforeAll(async () => {
        dataSource = new DataSource({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [
                Account,
                Session,
                User,
                Verification,
                TwoFactor,
                OAuthClient,
                OAuthClientResource,
                OAuthResource,
                OAuthAccessToken,
                OAuthRefreshToken,
                OAuthConsent,
                OAuthClientAssertion,
                Jwks,
                SSOProvider,
            ],
            synchronize: true,
            logging: false,
            namingStrategy: new SnakeCaseNamingStrategy(),
        })
        await dataSource.initialize()
    })

    afterAll(async () => {
        await dataSource?.destroy()
    })

    it('每个 auth 表都能匹配到已注册实体', async () => {
        const tables = getAuthTables({
            plugins: [oauthProvider({ loginPage: '/login', consentPage: '/consent' })],
        })

        const missing: string[] = []
        for (const [model, table] of Object.entries(tables)) {
            const modelName = String((table as { modelName?: string }).modelName ?? model)
            const entity = dataSource.entityMetadatas.find(
                (item) => item.name.toLowerCase() === modelName.toLowerCase()
                    || item.tableName.toLowerCase() === modelName.toLowerCase(),
            )
            if (!entity) {
                missing.push(model)
            }
        }

        expect(missing).toEqual([])
    })

    it('oauth_client 表包含 1.7 新增的必需字段', async () => {
        const metadata = dataSource.entityMetadatas.find((item) => item.name === 'OAuthClient')

        expect(metadata).toBeDefined()
        const columns = metadata!.columns.map((column) => column.propertyName)
        expect(columns).toEqual(expect.arrayContaining([
            'clientId',
            'clientSecret',
            'redirectUris',
            'scopes',
            'grantTypes',
            'responseTypes',
            'applicationType',
            'tokenEndpointAuthMethod',
        ]))
    })

    it('TypeORM 适配器能读写 oauthClient 的数组与 JSON 字段', async () => {
        const auth = betterAuth({
            baseURL: 'http://localhost:3000',
            secret: 'test-secret-test-secret-test-secret-1234',
            database: typeormAdapter(dataSource),
            plugins: [
                jwt({
                    jwt: { issuer: 'http://localhost:3000' },
                    jwks: { keyPairConfig: { alg: 'EdDSA', crv: 'Ed25519' } },
                }),
                oauthProvider({ loginPage: '/login', consentPage: '/consent' }),
            ],
        })
        const context = await auth.$context

        await context.adapter.create({
            model: 'oauthClient',
            data: {
                clientId: 'smoke-client',
                name: 'Smoke Client',
                redirectUris: ['https://example.com/cb', 'https://example.com/cb2'],
                scopes: ['openid', 'profile'],
                grantTypes: ['authorization_code'],
                responseTypes: ['code'],
                metadata: { owner: 'smoke' },
            },
            forceAllowId: true,
        })

        const found = await context.adapter.findOne<{
            clientId: string
            redirectUris: string[]
            scopes: string[]
            metadata: Record<string, unknown>
        }>({
            model: 'oauthClient',
            where: [{ field: 'clientId', value: 'smoke-client' }],
        })

        expect(found).toMatchObject({
            clientId: 'smoke-client',
            redirectUris: ['https://example.com/cb', 'https://example.com/cb2'],
            scopes: ['openid', 'profile'],
            metadata: { owner: 'smoke' },
        })
    })
})
