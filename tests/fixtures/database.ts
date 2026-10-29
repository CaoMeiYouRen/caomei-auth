import { DataSource, type EntityTarget, type ObjectLiteral, type Repository } from 'typeorm'
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

let dataSource: DataSource | null = null

const entities = [
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
]

export const createTestDataSource = async () => {
    if (dataSource?.isInitialized) {
        return dataSource
    }

    dataSource = new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities,
        synchronize: true,
        logging: false,
        namingStrategy: new SnakeCaseNamingStrategy(),
    })

    await dataSource.initialize()
    return dataSource
}

export const getTestRepository = async <T extends ObjectLiteral>(entity: EntityTarget<T>): Promise<Repository<T>> => {
    const ds = await createTestDataSource()
    return ds.getRepository(entity)
}

export const resetTestDatabase = async () => {
    const ds = await createTestDataSource()
    const queryRunner = ds.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.query('PRAGMA foreign_keys = OFF')
    try {
        for (const entity of ds.entityMetadatas) {
            await queryRunner.query(`DELETE FROM "${entity.tableName}"`)
        }
    } finally {
        await queryRunner.query('PRAGMA foreign_keys = ON')
        await queryRunner.release()
    }
}

export const closeTestDataSource = async () => {
    if (dataSource?.isInitialized) {
        await dataSource.destroy()
    }
    dataSource = null
}
