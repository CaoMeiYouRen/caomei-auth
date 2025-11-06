import { DataSource, type EntityTarget, type ObjectLiteral, type Repository } from 'typeorm'
import { SnakeCaseNamingStrategy } from '@/server/database/naming-strategy'
import { Account } from '@/server/entities/account'
import { Session } from '@/server/entities/session'
import { User } from '@/server/entities/user'
import { Verification } from '@/server/entities/verification'
import { TwoFactor } from '@/server/entities/two-factor'
import { OAuthAccessToken } from '@/server/entities/oauth-access-token'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { Jwks } from '@/server/entities/jwks'
import { SSOProvider } from '@/server/entities/sso-provider'

let dataSource: DataSource | null = null

const entities = [Account, Session, User, Verification, TwoFactor, OAuthApplication, OAuthAccessToken, OAuthConsent, Jwks, SSOProvider]

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
